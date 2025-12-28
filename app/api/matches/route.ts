import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { matchUtils, auditUtils } from '@/lib/db-utils'
import { auth } from '@/lib/auth-utils'

const createMatchSchema = z.object({
  donorId: z.string().min(1),
  requestId: z.string().min(1),
  notes: z.string().optional()
})

const updateMatchSchema = z.object({
  status: z.enum(['PENDING', 'CONTACTED', 'ACCEPTED', 'REJECTED', 'COMPLETED', 'CANCELLED']),
  notes: z.string().optional()
})

export async function POST(request: NextRequest) {
  try {
    // Handle build-time or missing database gracefully
    if (!process.env.DATABASE_URL || process.env.NEXT_PHASE === 'phase-production-build') {
      return NextResponse.json(
        { error: 'Database not available' },
        { status: 503 }
      )
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
    const validatedData = createMatchSchema.parse(body)

    // Check if donor exists and is available
    const donor = await db.donor.findUnique({
      where: { id: validatedData.donorId },
      select: {
        id: true,
        name: true,
        bloodType: true,
        isAvailable: true,
        isVerified: true,
        lastDonation: true,
        gender: true,
        area: true
      }
    })

    if (!donor) {
      return NextResponse.json(
        { error: 'Donor not found' },
        { status: 404 }
      )
    }

    if (!donor.isAvailable) {
      return NextResponse.json(
        { error: 'Donor is not available' },
        { status: 400 }
      )
    }

    if (!donor.isVerified) {
      return NextResponse.json(
        { error: 'Donor is not verified' },
        { status: 400 }
      )
    }

    // Check if request exists and is pending
    const bloodRequest = await db.request.findUnique({
      where: { id: validatedData.requestId },
      select: {
        id: true,
        referenceId: true,
        bloodType: true,
        status: true,
        urgencyLevel: true,
        unitsRequired: true,
        location: true,
        matches: {
          where: {
            status: { in: ['PENDING', 'CONTACTED', 'ACCEPTED'] }
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

    if (bloodRequest.status !== 'PENDING' && bloodRequest.status !== 'IN_PROGRESS') {
      return NextResponse.json(
        { error: 'Blood request is not available for matching' },
        { status: 400 }
      )
    }

    // Check blood type compatibility
    if (donor.bloodType !== bloodRequest.bloodType) {
      // TODO: Implement blood compatibility logic (e.g., O- can donate to all)
      return NextResponse.json(
        { error: 'Blood type incompatible' },
        { status: 400 }
      )
    }

    // Check if donor is already matched to this request
    const existingMatch = await db.match.findFirst({
      where: {
        donorId: validatedData.donorId,
        requestId: validatedData.requestId,
        status: { in: ['PENDING', 'CONTACTED', 'ACCEPTED'] }
      }
    })

    if (existingMatch) {
      return NextResponse.json(
        { error: 'Donor is already matched to this request' },
        { status: 400 }
      )
    }

    // Check donor eligibility based on last donation
    if (donor.lastDonation) {
      const daysSinceLastDonation = Math.floor(
        (new Date().getTime() - donor.lastDonation.getTime()) / (1000 * 60 * 60 * 24)
      )
      const requiredGap = donor.gender === 'MALE' ? 90 : 120

      if (daysSinceLastDonation < requiredGap) {
        const nextEligibleDate = new Date(donor.lastDonation.getTime() + requiredGap * 24 * 60 * 60 * 1000)
        return NextResponse.json(
          {
            error: 'Donor is not eligible yet',
            nextEligibleDate: nextEligibleDate.toISOString()
          },
          { status: 400 }
        )
      }
    }

    // Create the match
    const newMatch = await matchUtils.createMatch(
      validatedData.donorId,
      validatedData.requestId,
      session.user.id
    )

    // Update request status to IN_PROGRESS if it was PENDING
    if (bloodRequest.status === 'PENDING') {
      await db.request.update({
        where: { id: validatedData.requestId },
        data: { status: 'IN_PROGRESS' }
      })
    }

    // Log the action
    await auditUtils.logAction(
      session.user.id,
      'CREATE_MATCH',
      'match',
      newMatch.id,
      {
        donorName: donor.name,
        requestRef: bloodRequest.referenceId,
        notes: validatedData.notes
      }
    )

    return NextResponse.json({
      success: true,
      match: newMatch,
      message: 'Match created successfully'
    })

  } catch (error) {
    console.error('Error creating match:', error)

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
      { error: 'Failed to create match' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    // Handle build-time or missing database gracefully
    if (!process.env.DATABASE_URL || process.env.NEXT_PHASE === 'phase-production-build') {
      return NextResponse.json({
        matches: [],
        pagination: {
          page: 1,
          limit: 10,
          total: 0,
          pages: 0
        }
      })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const status = searchParams.get('status')
    const bloodType = searchParams.get('bloodType')
    const search = searchParams.get('search')

    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {}
    if (status) where.status = status
    if (bloodType) {
      where.OR = [
        { donor: { bloodType } },
        { request: { bloodType } }
      ]
    }
    if (search) {
      where.OR = [
        { donor: { name: { contains: search, mode: 'insensitive' } } },
        { request: { referenceId: { contains: search, mode: 'insensitive' } } },
        { request: { hospital: { contains: search, mode: 'insensitive' } } }
      ]
    }

    // Get matches with pagination
    const [matches, total] = await Promise.all([
      db.match.findMany({
        where,
        skip,
        take: limit,
        orderBy: [
          { createdAt: 'desc' }
        ],
        include: {
          donor: {
            select: {
              id: true,
              name: true,
              phone: true,
              bloodType: true,
              area: true,
              isVerified: true,
              reliabilityScore: true
            }
          },
          request: {
            select: {
              id: true,
              referenceId: true,
              requesterName: true,
              bloodType: true,
              urgencyLevel: true,
              unitsRequired: true,
              hospital: true,
              location: true
            }
          },
          createdByUser: {
            select: {
              name: true
            }
          }
        }
      }),
      db.match.count({ where })
    ])

    return NextResponse.json({
      matches,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })

  } catch (error) {
    console.error('Error fetching matches:', error)
    return NextResponse.json({
      matches: [],
      pagination: {
        page: 1,
        limit: 10,
        total: 0,
        pages: 0
      }
    })
  }
}