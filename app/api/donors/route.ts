import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { donorUtils } from '@/lib/db-utils'
import { contactAccessUtils, auditUtils, consentUtils } from '@/lib/privacy-utils'
import { createSecureApiHandler, securityConfigs, createSuccessResponse, createErrorResponse } from '@/lib/api-security'
import { donorRegistrationSchema, queryParamsSchema } from '@/lib/validation-schemas'
import { sessionUtils } from '@/lib/auth-utils'

// POST handler for donor registration (public endpoint)
const handleDonorRegistration = createSecureApiHandler(async (request, context) => {
  try {
    // Handle build-time or missing database gracefully
    if (!process.env.DATABASE_URL || process.env.NEXT_PHASE === 'phase-production-build') {
      return createErrorResponse('Database not available', 503)
    }

    // Use sanitized input from security middleware
    const validatedData = context.sanitizedInput

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
      return createErrorResponse('A donor with this phone number already exists', 400)
    }

    // Check eligibility based on last donation
    if (validatedData.lastDonation) {
      const daysSinceLastDonation = Math.floor(
        (new Date().getTime() - validatedData.lastDonation.getTime()) / (1000 * 60 * 60 * 24)
      )

      const requiredGap = validatedData.gender === 'MALE' ? 90 : 120

      if (daysSinceLastDonation < requiredGap) {
        return createErrorResponse('You are not eligible to donate yet', 400, {
          nextEligibleDate: new Date(validatedData.lastDonation.getTime() + requiredGap * 24 * 60 * 60 * 1000)
        })
      }
    }

    // Create the donor with privacy settings
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
          allowContactByPhone: validatedData.allowContactByPhone,
          allowContactByEmail: validatedData.allowContactByEmail,
          allowDataSharing: validatedData.allowDataSharing,
          privacyConsent: validatedData.privacyConsent,
          consentDate: new Date(),
          notes: validatedData.hasHealthConditions
            ? `Health conditions: ${validatedData.healthConditions || 'Not specified'}. Medications: ${validatedData.medications || 'None specified'}.`
            : null
        }
      })

      // Log consent
      await consentUtils.logConsent({
        donorId: newDonor.id,
        consentType: 'privacy',
        granted: validatedData.privacyConsent,
        version: '1.0',
        ipAddress: context.ipAddress,
        userAgent: context.userAgent
      })

      await consentUtils.logConsent({
        donorId: newDonor.id,
        consentType: 'terms',
        granted: validatedData.termsConsent,
        version: '1.0',
        ipAddress: context.ipAddress,
        userAgent: context.userAgent
      })

    } catch (dbError) {
      console.error('Database creation error:', dbError)
      return createErrorResponse('Database not available', 503)
    }

    // TODO: Send notification to admin team about new donor registration
    // TODO: Send welcome SMS/email to donor

    return createSuccessResponse({
      success: true,
      donorId: newDonor.id,
      message: 'Donor registration submitted successfully'
    }, 201)

  } catch (error) {
    console.error('Error creating donor:', error)

    // Handle database connection errors during build
    if (error instanceof Error && (
      error.message?.includes('connect') ||
      error.message?.includes('ECONNREFUSED') ||
      error.message?.includes('database') ||
      error.message?.includes('prisma')
    )) {
      return createErrorResponse('Database not available', 503)
    }

    return createErrorResponse('Failed to register donor', 500)
  }
}, {
  ...securityConfigs.public,
  validateInput: donorRegistrationSchema,
  rateLimitType: 'forms'
})

// GET handler for donor listing (authenticated endpoint)
const handleDonorListing = createSecureApiHandler(async (request, context) => {
  try {
    // Handle build-time or missing database gracefully
    if (!process.env.DATABASE_URL || process.env.NEXT_PHASE === 'phase-production-build') {
      return createSuccessResponse({
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
    
    // Validate query parameters
    const queryValidation = queryParamsSchema.safeParse({
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
      bloodType: searchParams.get('bloodType'),
      location: searchParams.get('location')
    })

    if (!queryValidation.success) {
      return createErrorResponse('Invalid query parameters', 400, queryValidation.error.errors)
    }

    const { page = 1, limit = 10, bloodType, location } = queryValidation.data
    const area = searchParams.get('area')
    const isAvailable = searchParams.get('isAvailable')
    const isVerified = searchParams.get('isVerified')
    const includeContact = searchParams.get('includeContact') === 'true'

    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {}
    if (bloodType) where.bloodType = bloodType
    if (location) where.location = location
    if (area) where.area = { contains: area, mode: 'insensitive' }
    if (isAvailable !== null) where.isAvailable = isAvailable === 'true'
    if (isVerified !== null) where.isVerified = isVerified === 'true'

    // Exclude donors who requested deletion
    where.deletionRequestedAt = null

    // Get current user for access control
    const user = await sessionUtils.getCurrentUser()

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
            // Include contact info only for authorized users
            ...(includeContact && user && ['STAFF', 'SUPER_ADMIN'].includes(user.role) ? {
              phone: true,
              email: true,
              address: true,
              dateOfBirth: true,
              gender: true,
              weight: true,
              notes: true,
              allowContactByPhone: true,
              allowContactByEmail: true,
              allowDataSharing: true
            } : {})
          }
        }),
        db.donor.count({ where })
      ])

      // Log contact information access if requested
      if (includeContact && context.user && ['STAFF', 'SUPER_ADMIN'].includes(context.user.role)) {
        await auditUtils.logAction({
          userId: context.user.id,
          action: 'BULK_VIEW_CONTACT_INFO',
          entity: 'donor',
          entityId: 'bulk',
          details: { 
            donorCount: donors.length,
            filters: { bloodType, location, area, isAvailable, isVerified }
          },
          ipAddress: context.ipAddress,
          userAgent: context.userAgent,
          sensitive: true
        })
      }

    } catch (dbError) {
      console.error('Database query error:', dbError)
      return createSuccessResponse({
        donors: [],
        pagination: {
          page: 1,
          limit: 10,
          total: 0,
          pages: 0
        }
      })
    }

    return createSuccessResponse({
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
    return createSuccessResponse({
      donors: [],
      pagination: {
        page: 1,
        limit: 10,
        total: 0,
        pages: 0
      }
    })
  }
}, {
  ...securityConfigs.staffOnly,
  validateInput: queryParamsSchema
})

// Export the handlers
export const POST = handleDonorRegistration
export const GET = handleDonorListing