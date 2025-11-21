import { createSecureApiHandler, securityConfigs, createSuccessResponse, createErrorResponse } from '@/lib/api-security'
import { securityLogger } from '@/lib/security-logger'

const handleGetSecurityEvents = createSecureApiHandler(async (request, context) => {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const type = searchParams.get('type')
    const severity = searchParams.get('severity')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    const filters: any = {}
    if (type) filters.type = type
    if (severity) filters.severity = severity
    if (startDate) filters.startDate = new Date(startDate)
    if (endDate) filters.endDate = new Date(endDate)

    const events = await securityLogger.getEvents({
      ...filters,
      limit
    })

    return createSuccessResponse({ events })
  } catch (error) {
    console.error('Failed to fetch security events:', error)
    return createErrorResponse('Failed to fetch security events', 500)
  }
}, securityConfigs.adminOnly)

export const GET = handleGetSecurityEvents