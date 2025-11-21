import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { privacyUtils, auditUtils } from '@/lib/privacy-utils'
import { sessionUtils } from '@/lib/auth-utils'

const updatePrivacySettingsSchema = z.object({
  donorId: z.string(),
  settings: z.object({
    allowSMSNotifications: z.boolean().optional(),
    allowEmailNotifications: z.boolean().optional(),
    allowPhoneCalls: z.boolean().optional(),
    shareLocationWithRequests: z.boolean().optional(),
    shareStatisticsAnonymously: z.boolean().optional(),
    allowResearchParticipation: z.boolean().optional(),
    hideFromPublicStats: z.boolean().optional(),
    anonymizeInReports: z.boolean().optional()
  })
})

export async function GET(request: NextRequest) {
  try {
    const user = await sessionUtils.requireAuth()
    const { searchParams } = new URL(request.url)
    const donorId = searchParams.get('donorId')

    if (!donorId) {
      return NextResponse.json(
        { error: 'Donor ID is required' },
        { status: 400 }
      )
    }

    // Only allow staff/admin to view privacy settings
    if (!['STAFF', 'SUPER_ADMIN'].includes(user.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    const settings = await privacyUtils.getPrivacySettings(donorId)

    // Log the access
    await auditUtils.logAction({
      userId: user.id,
      action: 'VIEW_PRIVACY_SETTINGS',
      entity: 'donor',
      entityId: donorId,
      ipAddress: request.ip,
      userAgent: request.headers.get('user-agent') || undefined,
      sensitive: true
    })

    return NextResponse.json({ settings })

  } catch (error) {
    console.error('Error fetching privacy settings:', error)
    
    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to fetch privacy settings' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await sessionUtils.requireAuth()
    const body = await request.json()

    // Validate the data
    const validatedData = updatePrivacySettingsSchema.parse(body)

    // Only allow staff/admin to update privacy settings
    if (!['STAFF', 'SUPER_ADMIN'].includes(user.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    await privacyUtils.updatePrivacySettings(
      validatedData.donorId,
      validatedData.settings
    )

    // Log the update
    await auditUtils.logAction({
      userId: user.id,
      action: 'UPDATE_PRIVACY_SETTINGS',
      entity: 'donor',
      entityId: validatedData.donorId,
      details: { updatedSettings: validatedData.settings },
      ipAddress: request.ip,
      userAgent: request.headers.get('user-agent') || undefined,
      sensitive: true
    })

    return NextResponse.json({
      success: true,
      message: 'Privacy settings updated successfully'
    })

  } catch (error) {
    console.error('Error updating privacy settings:', error)

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

    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to update privacy settings' },
      { status: 500 }
    )
  }
}