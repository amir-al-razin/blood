import { createSecureApiHandler, securityConfigs, createSuccessResponse, createErrorResponse } from '@/lib/api-security'
import { securityLogger } from '@/lib/security-logger'

const handleGetSecurityAlerts = createSecureApiHandler(async (request, context) => {
  try {
    const alerts = await securityLogger.getActiveAlerts()
    return createSuccessResponse({ alerts })
  } catch (error) {
    console.error('Failed to fetch security alerts:', error)
    return createErrorResponse('Failed to fetch security alerts', 500)
  }
}, securityConfigs.adminOnly)

export const GET = handleGetSecurityAlerts