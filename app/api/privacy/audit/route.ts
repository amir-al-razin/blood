import { NextRequest, NextResponse } from 'next/server'
import { auditUtils } from '@/lib/privacy-utils'
import { sessionUtils } from '@/lib/auth-utils'

export async function GET(request: NextRequest) {
  try {
    const user = await sessionUtils.requireAuth()
    const { searchParams } = new URL(request.url)
    
    const entityType = searchParams.get('entityType')
    const entityId = searchParams.get('entityId')
    const sensitiveOnly = searchParams.get('sensitiveOnly') === 'true'
    const limit = parseInt(searchParams.get('limit') || '50')

    if (!entityType || !entityId) {
      return NextResponse.json(
        { error: 'Entity type and ID are required' },
        { status: 400 }
      )
    }

    // Only allow staff/admin to view audit logs
    if (!['STAFF', 'SUPER_ADMIN'].includes(user.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    let auditTrail
    if (sensitiveOnly && entityType === 'donor') {
      // Only super admin can view sensitive data access logs
      if (user.role !== 'SUPER_ADMIN') {
        return NextResponse.json(
          { error: 'Super admin access required for sensitive audit logs' },
          { status: 403 }
        )
      }
      auditTrail = await auditUtils.getSensitiveDataAccess(entityId, limit)
    } else {
      auditTrail = await auditUtils.getAuditTrail(entityType, entityId, limit)
    }

    // Log the audit trail access
    await auditUtils.logAction({
      userId: user.id,
      action: 'VIEW_AUDIT_TRAIL',
      entity: entityType,
      entityId: entityId,
      details: { sensitiveOnly, limit },
      ipAddress: request.ip,
      userAgent: request.headers.get('user-agent') || undefined,
      sensitive: sensitiveOnly
    })

    return NextResponse.json({
      auditTrail,
      total: auditTrail.length
    })

  } catch (error) {
    console.error('Error fetching audit trail:', error)

    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to fetch audit trail' },
      { status: 500 }
    )
  }
}