import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { auth } from '@/lib/auth'
import { 
  calculateLocationDistance, 
  bloodCompatibility, 
  isBloodTypeCompatible 
} from '@/lib/distance-utils'

const findDonorsSchema = z.object({
  requestId: z.string().min(1),
  maxDistance: z.number().optional().default(50), // km
  limit: z.number().optional().default(20)
})

export async function POST(request: NextRequest) {
  try {
    // Handle build-time or missing database gracefully
    if (!process.env.DATABASE_URL || process.env.NEXT_PHASE === 'phase-production-build') {
      return NextResponse.json({
        donors: [],
        request: null
      })
    }

    // Check authentication
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validatedData = findDonorsSchema.parse(body)

    // Get the blood request
    const bloodRequest = await db.request.findUnique({
      where: { id: validatedData.requestId },
      select: {
        id: true,
        referenceId: true,
        bloodType: true,
        location: true,
        urgencyLevel: true,
        unitsRequired: true,
        hospital: true,
        matches: {
          where: {
            status: { in: ['PENDING', 'CONTACTED', 'ACCEPTED'] }
          },
          select: {
            donorId: true
          }
        }
      }
    })

    if (!bloodRequest) {
      return NextResponse.json(
        { error: 'Blood request not found' },
        { status: 404 }
      )
    }

    // Get compatible blood types
    const compatibleBloodTypes = bloodCompatibility[bloodRequest.bloodType] || [bloodRequest.bloodType]

    // Get already matched donor IDs
    const matchedDonorIds = bloodRequest.matches.map(match => match.donorId)

    // Find eligible donors
    const eligibilityDate = new Date()
    eligibilityDate.setDate(eligibilityDate.getDate() - 90) // Conservative 90 days

    const donors = await db.donor.findMany({
      where: {
        bloodType: { in: compatibleBloodTypes },
        isAvailable: true,
        isVerified: true,
        id: { notIn: matchedDonorIds }, // Exclude already matched donors
        OR: [
          { lastDonation: null },
          { lastDonation: { lt: eligibilityDate } }
        ]
      },
      select: {
        id: true,
        name: true,
        bloodType: true,
        area: true,
        location: true,
        reliabilityScore: true,
        donationCount: true,
        lastDonation: true,
        gender: true,
        createdAt: true
      },
      orderBy: [
        { reliabilityScore: 'desc' },
        { donationCount: 'desc' },
        { createdAt: 'asc' }
      ],
      take: validatedData.limit * 2 // Get more to filter by distance
    })

    // Calculate distances and filter
    const donorsWithDistance = donors.map(donor => {
      const distance = calculateLocationDistance(donor.area, bloodRequest.location)
      
      // Calculate more precise eligibility
      let isEligible = true
      let nextEligibleDate = null
      
      if (donor.lastDonation) {
        const daysSinceLastDonation = Math.floor(
          (new Date().getTime() - donor.lastDonation.getTime()) / (1000 * 60 * 60 * 24)
        )
        const requiredGap = donor.gender === 'MALE' ? 90 : 120
        
        if (daysSinceLastDonation < requiredGap) {
          isEligible = false
          nextEligibleDate = new Date(donor.lastDonation.getTime() + requiredGap * 24 * 60 * 60 * 1000)
        }
      }

      return {
        ...donor,
        distance,
        isEligible,
        nextEligibleDate,
        compatibilityScore: calculateCompatibilityScore(donor, bloodRequest)
      }
    })

    // Filter by distance and sort by compatibility
    const filteredDonors = donorsWithDistance
      .filter(donor => donor.distance <= validatedData.maxDistance)
      .sort((a, b) => {
        // Prioritize eligible donors
        if (a.isEligible && !b.isEligible) return -1
        if (!a.isEligible && b.isEligible) return 1
        
        // Then by compatibility score
        if (a.compatibilityScore !== b.compatibilityScore) {
          return b.compatibilityScore - a.compatibilityScore
        }
        
        // Then by distance
        return a.distance - b.distance
      })
      .slice(0, validatedData.limit)

    return NextResponse.json({
      donors: filteredDonors,
      request: {
        id: bloodRequest.id,
        referenceId: bloodRequest.referenceId,
        bloodType: bloodRequest.bloodType,
        location: bloodRequest.location,
        urgencyLevel: bloodRequest.urgencyLevel,
        unitsRequired: bloodRequest.unitsRequired,
        hospital: bloodRequest.hospital,
        matchedCount: matchedDonorIds.length
      }
    })

  } catch (error) {
    console.error('Error finding donors:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: error.issues.map(issue => ({
            path: issue.path.join('.'),
            message: issue.message
          }))
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to find donors' },
      { status: 500 }
    )
  }
}

function calculateCompatibilityScore(donor: any, request: any): number {
  let score = 0

  // Blood type exact match bonus
  if (donor.bloodType === request.bloodType) {
    score += 10
  }

  // Reliability score (0-10 scale)
  score += donor.reliabilityScore

  // Experience bonus (donation count)
  score += Math.min(donor.donationCount * 0.5, 5)

  // Urgency bonus for recent donors (if critical)
  if (request.urgencyLevel === 'CRITICAL' && donor.lastDonation) {
    const daysSinceLastDonation = Math.floor(
      (new Date().getTime() - donor.lastDonation.getTime()) / (1000 * 60 * 60 * 24)
    )
    if (daysSinceLastDonation > 120) {
      score += 3 // Bonus for experienced donors in critical cases
    }
  }

  return score
}