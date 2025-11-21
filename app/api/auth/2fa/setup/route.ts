import { createSecureApiHandler, securityConfigs, createSuccessResponse, createErrorResponse } from '@/lib/api-security'
import { PasswordSecurity } from '@/lib/password-security'

const handle2FASetup = createSecureApiHandler(async (request, context) => {
  try {
    if (!context.user) {
      return createErrorResponse('Authentication required', 401)
    }

    const setup = await PasswordSecurity.setupTwoFactor(context.user.id, 'RedAid')
    
    return createSuccessResponse({
      secret: setup.secret,
      qrCodeUrl: setup.qrCodeUrl,
      backupCodes: setup.backupCodes
    })
  } catch (error) {
    console.error('2FA setup error:', error)
    return createErrorResponse('Failed to setup two-factor authentication', 500)
  }
}, securityConfigs.authenticated)

export const POST = handle2FASetup