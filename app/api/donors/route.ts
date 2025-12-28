import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// POST handler for donor registration
export async function POST(request: NextRequest) {
  try {
    // Handle build-time or missing database gracefully
    if (!process.env.DATABASE_URL || process.env.NEXT_PHASE === 'phase-production-build') {
      return NextResponse.json({ error: 'Database not available' }, { status: 503 })
    }

    const body = await request.json()
    const {
      name, phone, email, bloodType, location, area, address,
      dateOfBirth, gender, weight, lastDonation, isAvailable,
      allowContactByPhone, allowContactByEmail, allowDataSharing,
      privacyConsent, hasHealthConditions, healthConditions, medications
    } = body

    // Validate required fields
    if (!name || !phone || !bloodType || !location || !area || !dateOfBirth || !gender) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Check if phone number already exists
    const existingDonor = await db.donor.findUnique({
      where: { phone }
    })

    if (existingDonor) {
      return NextResponse.json(
        { error: 'A donor with this phone number already exists' },
        { status: 400 }
      )
    }

    // Create the donor
    const newDonor = await db.donor.create({
      data: {
        name,
        phone,
        email,
        bloodType,
        location,
        area,
        address,
        dateOfBirth: new Date(dateOfBirth),
        gender,
        weight,
        lastDonation: lastDonation ? new Date(lastDonation) : null,
        isAvailable: isAvailable ?? true,
        isVerified: false,
        allowContactByPhone: allowContactByPhone ?? true,
        allowContactByEmail: allowContactByEmail ?? true,
        allowDataSharing: allowDataSharing ?? false,
        privacyConsent: privacyConsent ?? true,
        consentDate: new Date(),
        notes: hasHealthConditions
          ? `Health conditions: ${healthConditions || 'Not specified'}. Medications: ${medications || 'None specified'}.`
          : null
      }
    })

    return NextResponse.json({
      success: true,
      donorId: newDonor.id,
      message: 'Donor registration submitted successfully'
    }, { status: 201 })

  } catch (error) {
    console.error('Error creating donor:', error)
    return NextResponse.json(
      { error: 'Failed to register donor' },
      { status: 500 }
    )
  }
}

// GET handler for donor listing
export async function GET(request: NextRequest) {
  try {
    // Handle build-time gracefully
    if (!process.env.DATABASE_URL || process.env.NEXT_PHASE === 'phase-production-build') {
      return NextResponse.json({
        donors: [],
        pagination: { page: 1, limit: 10, total: 0, pages: 0 }
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
    const where: any = { deletionRequestedAt: null }
    if (bloodType) where.bloodType = bloodType
    if (location) where.location = location
    if (area) where.area = { contains: area, mode: 'insensitive' }
    if (isAvailable !== null) where.isAvailable = isAvailable === 'true'
    if (isVerified !== null) where.isVerified = isVerified === 'true'

    const [donors, total] = await Promise.all([
      db.donor.findMany({
        where,
        skip,
        take: limit,
        orderBy: [
          { isVerified: 'desc' },
          { reliabilityScore: 'desc' },
          { createdAt: 'desc' }
        ]
      }),
      db.donor.count({ where })
    ])

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
    return NextResponse.json({
      donors: [],
      pagination: { page: 1, limit: 10, total: 0, pages: 0 }
    })
  }
}