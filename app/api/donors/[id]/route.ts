import { NextRequest, NextResponse } from 'next/server'
import { contactAccessUtils, auditUtils } from '@/lib/privacy-utils'
import { sessionUtils } from '@/lib/auth-utils'
import { db } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await sessionUtils.getCurrentUser()
    const { searchParams } = new URL(request.url)
    const includeContact = searchParams.get('includeContact') === 'true'

    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Get donor data with appropriate privacy filtering
    const donorData = await contactAccessUtils.getFilteredDonorData(
      params.id,
      includeContact && ['STAFF', 'SUPER_ADMIN'].includes(user.role)
    )

    if (!donorData) {
      return NextResponse.json(
        { error: 'Donor not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      donor: donorData
    })

  } catch (error) {
    console.error('Error fetching donor:', error)

    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to fetch donor' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await sessionUtils.requireRole(['STAFF', 'SUPER_ADMIN'])
    const body = await request.json()

    // Get current donor data for comparison
    const currentDonor = await contactAccessUtils.getFilteredDonorData(params.id, true)
    if (!currentDonor) {
      return NextResponse.json(
        { error: 'Donor not found' },
        { status: 404 }
      )
    }

    // Update donor (excluding sensitive fields that require special handling)
    const { phone, email, ...updateData } = body
    
    const updatedDonor = await db.donor.update({
      where: { id: params.id },
      data: updateData
    })

    // Log the update
    await auditUtils.logAction({
      userId: user.id,
      action: 'UPDATE_DONOR',
      entity: 'donor',
      entityId: params.id,
      details: { 
        updatedFields: Object.keys(updateData),
        changes: updateData
      },
      ipAddress: request.ip,
      userAgent: request.headers.get('user-agent') || undefined,
      sensitive: false
    })

    return NextResponse.json({
      success: true,
      donor: updatedDonor
    })

  } catch (error) {
    console.error('Error updating donor:', error)

    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to update donor' },
      { status: 500 }
    )
  }
}