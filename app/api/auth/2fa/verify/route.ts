import { createSecureApiHandler, securityConfigs, createSuccessResponse, createErrorResponse } from '@/lib/api-security'
import { PasswordSecurity } from '@/lib/password-security'
import { z } from 'zod'

const verifySchema = z.object({
  token: z.string().length(6, 'Token must be 6 digits')
})

const handle2FAVerify = createSecureApiHandler(async (request, context) => {
  try {
    if (!context.user) {
      return createErrorResponse('Authentication required', 401)
    }

    const { token } = context.sanitizedInput

    const isValid = await PasswordSecurity.verifyAndEnable2FA(context.user.id, token)
    
    if (!isValid) {
      return createErrorResponse('Invalid verification code', 400)
    }

    return createSuccessResponse({
      success: true,
      message: 'Two-factor authentication enabled successfully'
    })
  } catch (error) {
    console.error('2FA verification error:', error)
    return createErrorResponse('Failed to verify two-factor authentication', 500)
  }
}, {
  ...securityConfigs.authenticated,
  validateInput: verifySchema
})

export const POST = handle2FAVerify