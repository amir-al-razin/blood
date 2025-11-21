import { createSecureApiHandler, securityConfigs, createSuccessResponse, createErrorResponse } from '@/lib/api-security'
import { PasswordSecurity } from '@/lib/password-security'
import { z } from 'zod'

const disableSchema = z.object({
  password: z.string().min(1, 'Password is required')
})

const handle2FADisable = createSecureApiHandler(async (request, context) => {
  try {
    if (!context.user) {
      return createErrorResponse('Authentication required', 401)
    }

    const { password } = context.sanitizedInput

    const success = await PasswordSecurity.disable2FA(context.user.id, password)
    
    if (!success) {
      return createErrorResponse('Invalid password', 400)
    }

    return createSuccessResponse({
      success: true,
      message: 'Two-factor authentication disabled successfully'
    })
  } catch (error) {
    console.error('2FA disable error:', error)
    
    if (error instanceof Error && error.message === 'Invalid password') {
      return createErrorResponse('Invalid password', 400)
    }
    
    return createErrorResponse('Failed to disable two-factor authentication', 500)
  }
}, {
  ...securityConfigs.authenticated,
  validateInput: disableSchema
})

export const POST = handle2FADisable