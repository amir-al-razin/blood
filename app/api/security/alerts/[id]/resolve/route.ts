import { createSecureApiHandler, securityConfigs, createSuccessResponse, createErrorResponse } from '@/lib/api-security'
import { securityLogger } from '@/lib/security-logger'

const handleResolveAlert = createSecureApiHandler(async (request, context) => {
  try {
    const alertId = context.params?.id as string
    
    if (!alertId) {
      return createErrorResponse('Alert ID is required', 400)
    }

    await securityLogger.resolveAlert(alertId, context.user!.id)
    
    return createSuccessResponse({ 
      success: true, 
      message: 'Alert resolved successfully' 
    })
  } catch (error) {
    console.error('Failed to resolve security alert:', error)
    return createErrorResponse('Failed to resolve alert', 500)
  }
}, securityConfigs.adminOnly)

export const POST = handleResolveAlert