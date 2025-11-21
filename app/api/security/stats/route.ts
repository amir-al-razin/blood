import { createSecureApiHandler, securityConfigs, createSuccessResponse, createErrorResponse } from '@/lib/api-security'
import { db } from '@/lib/db'

const handleGetSecurityStats = createSecureApiHandler(async (request, context) => {
  try {
    const now = new Date()
    const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    const [
      totalEvents,
      criticalAlerts,
      failedLogins,
      blockedRequests,
      activeUsers
    ] = await Promise.all([
      // Total security events in last 24 hours
      db.securityEvent.count({
        where: {
          timestamp: { gte: last24Hours }
        }
      }),
      
      // Critical unresolved alerts
      db.securityAlert.count({
        where: {
          severity: 'CRITICAL',
          isResolved: false
        }
      }),
      
      // Failed login attempts in last 24 hours
      db.loginAttempt.count({
        where: {
          success: false,
          timestamp: { gte: last24Hours }
        }
      }),
      
      // Rate limited requests in last 24 hours
      db.rateLimitLog.count({
        where: {
          blocked: true,
          createdAt: { gte: last24Hours }
        }
      }),
      
      // Active users in last 7 days
      db.user.count({
        where: {
          isActive: true,
          lastLoginAt: { gte: last7Days }
        }
      })
    ])

    return createSuccessResponse({
      totalEvents,
      criticalAlerts,
      failedLogins,
      blockedRequests,
      activeUsers
    })
  } catch (error) {
    console.error('Failed to fetch security stats:', error)
    return createErrorResponse('Failed to fetch security stats', 500)
  }
}, securityConfigs.adminOnly)

export const GET = handleGetSecurityStats