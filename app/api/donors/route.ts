import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { donorUtils } from '@/lib/db-utils'

const createDonorSchema = z.object({
  name: z.string().min(2),
  phone: z.string().regex(/^(\+880|880|0)?1[3-9]\d{8}$/),
  email: z.string().email().optional().nullable(),
  bloodType: z.enum(['A_POSITIVE', 'A_NEGATIVE', 'B_POSITIVE', 'B_NEGATIVE', 'AB_POSITIVE', 'AB_NEGATIVE', 'O_POSITIVE', 'O_NEGATIVE']),
  location: z.string().min(1),
  area: z.string().min(2),
  address: z.string().optional().nullable(),
  dateOfBirth: z.string().transform((str) => new Date(str)),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']),
  weight: z.number().min(50).max(200),
  lastDonation: z.string().transform((str) => str ? new Date(str) : null).optional().nullable(),
  hasHealthConditions: z.boolean(),
  healthConditions: z.string().optional().nullable(),
  medications: z.string().optional().nullable(),
  isAvailable: z.boolean().default(true),
  privacyConsent: z.boolean().refine((val) => val === true),
  termsConsent: z.boolean().refine((val) => val === true)
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

    const body = await request.json()

    // Validate the data
    const validatedData = createDonorSchema.parse(body)

    // Check if phone number already exists
    let existingDonor
    try {
      existingDonor = await db.donor.findUnique({
        where: { phone: validatedData.phone }
      })
    } catch (dbError) {
      console.error('Database connection error:', dbError)
      return NextResponse.json(
        { error: 'Database not available' },
        { status: 503 }
      )
    }

    if (existingDonor) {
      return NextResponse.json(
        { error: 'A donor with this phone number already exists' },
        { status: 400 }
      )
    }

    // Check eligibility based on last donation
    if (validatedData.lastDonation) {
      const daysSinceLastDonation = Math.floor(
        (new Date().getTime() - validatedData.lastDonation.getTime()) / (1000 * 60 * 60 * 24)
      )

      const requiredGap = validatedData.gender === 'MALE' ? 90 : 120

      if (daysSinceLastDonation < requiredGap) {
        return NextResponse.json(
          {
            error: 'You are not eligible to donate yet',
            nextEligibleDate: new Date(validatedData.lastDonation.getTime() + requiredGap * 24 * 60 * 60 * 1000)
          },
          { status: 400 }
        )
      }
    }

    // Create the donor
    let newDonor
    try {
      newDonor = await db.donor.create({
        data: {
          name: validatedData.name,
          phone: validatedData.phone,
          email: validatedData.email,
          bloodType: validatedData.bloodType,
          location: validatedData.location,
          area: validatedData.area,
          address: validatedData.address,
          dateOfBirth: validatedData.dateOfBirth,
          gender: validatedData.gender,
          weight: validatedData.weight,
          lastDonation: validatedData.lastDonation,
          isAvailable: validatedData.isAvailable,
          isVerified: false, // Requires admin verification
          notes: validatedData.hasHealthConditions
            ? `Health conditions: ${validatedData.healthConditions || 'Not specified'}. Medications: ${validatedData.medications || 'None specified'}.`
            : null
        }
      })
    } catch (dbError) {
      console.error('Database creation error:', dbError)
      return NextResponse.json(
        { error: 'Database not available' },
        { status: 503 }
      )
    }

    // TODO: Send notification to admin team about new donor registration
    // TODO: Send welcome SMS/email to donor

    return NextResponse.json({
      success: true,
      donorId: newDonor.id,
      message: 'Donor registration submitted successfully'
    })

  } catch (error) {
    console.error('Error creating donor:', error)

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

    // Handle database connection errors during build
    if (error instanceof Error && (
      error.message?.includes('connect') ||
      error.message?.includes('ECONNREFUSED') ||
      error.message?.includes('database') ||
      error.message?.includes('prisma')
    )) {
      return NextResponse.json(
        { error: 'Database not available' },
        { status: 503 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to register donor' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    // Handle build-time or missing database gracefully
    if (!process.env.DATABASE_URL || process.env.NEXT_PHASE === 'phase-production-build') {
      return NextResponse.json({
        donors: [],
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
    const bloodType = searchParams.get('bloodType')
    const location = searchParams.get('location')
    const area = searchParams.get('area')
    const isAvailable = searchParams.get('isAvailable')
    const isVerified = searchParams.get('isVerified')

    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {}
    if (bloodType) where.bloodType = bloodType
    if (location) where.location = location
    if (area) where.area = { contains: area, mode: 'insensitive' }
    if (isAvailable !== null) where.isAvailable = isAvailable === 'true'
    if (isVerified !== null) where.isVerified = isVerified === 'true'

    // Get donors with pagination
    let donors, total
    try {
      [donors, total] = await Promise.all([
        db.donor.findMany({
          where,
          skip,
          take: limit,
          orderBy: [
            { isVerified: 'desc' },
            { reliabilityScore: 'desc' },
            { createdAt: 'desc' }
          ],
          select: {
            id: true,
            name: true,
            bloodType: true,
            location: true,
            area: true,
            isAvailable: true,
            isVerified: true,
            donationCount: true,
            reliabilityScore: true,
            lastDonation: true,
            createdAt: true,
            // Don't include sensitive information like phone/email in list view
          }
        }),
        db.donor.count({ where })
      ])
    } catch (dbError) {
      console.error('Database query error:', dbError)
      return NextResponse.json({
        donors: [],
        pagination: {
          page: 1,
          limit: 10,
          total: 0,
          pages: 0
        }
      })
    }

    return NextResponse.json({
      donors,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })

  } catch (error) {
    console.error('Error fetching donors:', error)

    // Return empty data for build-time or database connection issues
    return NextResponse.json({
      donors: [],
      pagination: {
        page: 1,
        limit: 10,
        total: 0,
        pages: 0
      }
    })
  }
}