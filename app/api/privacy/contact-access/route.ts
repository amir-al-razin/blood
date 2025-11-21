import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { contactAccessUtils, auditUtils } from '@/lib/privacy-utils'
import { sessionUtils } from '@/lib/auth-utils'

const contactAccessSchema = z.object({
  donorId: z.string(),
  requestId: z.string().optional(),
  reason: z.string().min(10, 'Reason must be at least 10 characters'),
  accessType: z.enum(['phone', 'email', 'full'])
})

export async function POST(request: NextRequest) {
  try {
    const user = await sessionUtils.requireAuth()
    const body = await request.json()

    // Validate the data
    const validatedData = contactAccessSchema.parse(body)

    // Only allow staff/admin to request contact access
    if (!['STAFF', 'SUPER_ADMIN'].includes(user.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions to access contact information' },
        { status: 403 }
      )
    }

    // Request access (this logs the access attempt)
    await contactAccessUtils.requestContactAccess({
      donorId: validatedData.donorId,
      requestId: validatedData.requestId,
      reason: validatedData.reason,
      accessType: validatedData.accessType
    })

    // Get the filtered donor data with contact information
    const donorData = await contactAccessUtils.getFilteredDonorData(
      validatedData.donorId,
      true // Include contact information
    )

    if (!donorData) {
      return NextResponse.json(
        { error: 'Donor not found' },
        { status: 404 }
      )
    }

    // Filter the response based on access type
    let responseData = donorData
    if (validatedData.accessType === 'phone') {
      responseData = {
        ...donorData,
        email: undefined,
        address: undefined
      }
    } else if (validatedData.accessType === 'email') {
      responseData = {
        ...donorData,
        phone: undefined,
        address: undefined
      }
    }

    return NextResponse.json({
      success: true,
      donor: responseData,
      accessGranted: true,
      accessType: validatedData.accessType
    })

  } catch (error) {
    console.error('Error requesting contact access:', error)

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

    if (error instanceof Error) {
      if (error.message === 'Authentication required') {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        )
      }
      
      if (error.message.includes('Insufficient permissions')) {
        return NextResponse.json(
          { error: error.message },
          { status: 403 }
        )
      }
    }

    return NextResponse.json(
      { error: 'Failed to access contact information' },
      { status: 500 }
    )
  }
}