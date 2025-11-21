import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { ZodSchema } from 'zod'
import { withRateLimit } from './rate-limiter'
import { securityLogger, getRequestInfo } from './security-logger'
import { InputSanitizer, sanitizeObject } from './input-sanitizer'
import { withCSRFProtection } from './csrf-protection'
import { sessionUtils } from './auth-utils'

export interface ApiSecurityOptions {
  requireAuth?: boolean
  requiredRoles?: string[]
  rateLimitType?: 'api' | 'auth' | 'forms' | 'uploads' | 'passwordReset' | 'sensitive'
  validateInput?: ZodSchema
  sanitizeInput?: boolean
  requireCSRF?: boolean
  logAccess?: boolean
  require2FA?: boolean
}

export interface ApiContext {
  user?: any
  ipAddress?: string
  userAgent?: string
  sanitizedInput?: any
  originalInput?: any
}

export type ApiHandler = (
  request: NextRequest,
  context: ApiContext
) => Promise<NextResponse>

/**
 * Secure API route wrapper with comprehensive security features
 */
export function withApiSecurity(
  handler: ApiHandler,
  options: ApiSecurityOptions = {}
) {
  const {
    requireAuth = false,
    requiredRoles = [],
    rateLimitType = 'api',
    validateInput,
    sanitizeInput = true,
    requireCSRF = false,
    logAccess = true,
    require2FA = false
  } = options

  return async (request: NextRequest): Promise<NextResponse> => {
    const { ipAddress, userAgent } = getRequestInfo(request)
    const pathname = request.nextUrl.pathname
    
    try {
      // Apply rate limiting
      const rateLimitedHandler = withRateLimit(
        async (req: NextRequest) => {
          // Apply CSRF protection if required
          if (requireCSRF) {
            return await withCSRFProtection(req, async () => {
              return await executeSecureHandler(req)
            })
          }
          
          return await executeSecureHandler(req)
        },
        rateLimitType
      )

      return await rateLimitedHandler(request)

    } catch (error) {
      console.error('API Security Error:', error)
      
      await securityLogger.logEvent({
        type: 'SUSPICIOUS_ACTIVITY',
        severity: 'HIGH',
        description: `API security error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        ipAddress,
        userAgent,
        metadata: { pathname, error: String(error) }
      })

      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    }

    async function executeSecureHandler(req: NextRequest): Promise<NextResponse> {
      const context: ApiContext = { ipAddress, userAgent }

      // Authentication check
      if (requireAuth) {
        const token = await getToken({ 
          req: request, 
          secret: process.env.NEXTAUTH_SECRET 
        })

        if (!token) {
          await securityLogger.logUnauthorizedAccess(pathname, undefined, ipAddress)
          return NextResponse.json(
            { error: 'Authentication required' },
            { status: 401 }
          )
        }

        // Get full user details
        try {
          context.user = await sessionUtils.getCurrentUser()
          
          if (!context.user) {
            await securityLogger.logUnauthorizedAccess(pathname, token.sub, ipAddress)
            return NextResponse.json(
              { error: 'Invalid session' },
              { status: 401 }
            )
          }

          // Role-based access control
          if (requiredRoles.length > 0 && !requiredRoles.includes(context.user.role)) {
            await securityLogger.logUnauthorizedAccess(
              `${pathname} (required roles: ${requiredRoles.join(', ')})`,
              context.user.id,
              ipAddress
            )
            return NextResponse.json(
              { error: 'Insufficient permissions' },
              { status: 403 }
            )
          }

          // 2FA check for sensitive operations
          if (require2FA && context.user.twoFactorEnabled) {
            const twoFactorToken = request.headers.get('x-2fa-token')
            if (!twoFactorToken) {
              return NextResponse.json(
                { error: 'Two-factor authentication required' },
                { status: 403 }
              )
            }

            // This would be validated in the specific handler
            // as it requires the actual token verification
          }

        } catch (error) {
          console.error('Session validation error:', error)
          return NextResponse.json(
            { error: 'Session validation failed' },
            { status: 401 }
          )
        }
      }

      // Input validation and sanitization
      if (['POST', 'PUT', 'PATCH'].includes(request.method)) {
        try {
          const contentType = request.headers.get('content-type') || ''
          
          if (contentType.includes('application/json')) {
            const body = await request.json()
            context.originalInput = body

            // Input validation with Zod schema
            if (validateInput) {
              const validationResult = validateInput.safeParse(body)
              if (!validationResult.success) {
                await securityLogger.logMaliciousInput(
                  'validation_failure',
                  JSON.stringify(validationResult.error.errors),
                  ipAddress,
                  context.user?.id
                )
                
                return NextResponse.json(
                  { 
                    error: 'Validation failed',
                    details: validationResult.error.errors
                  },
                  { status: 400 }
                )
              }
              context.sanitizedInput = validationResult.data
            }

            // Input sanitization
            if (sanitizeInput && typeof body === 'object') {
              const sanitizer = new InputSanitizer({
                detectMalicious: true,
                logSuspicious: true,
                ipAddress,
                userId: context.user?.id
              })

              const sanitizationResult = await sanitizeObject(body, {
                detectMalicious: true,
                logSuspicious: true,
                ipAddress,
                userId: context.user?.id
              })

              context.sanitizedInput = sanitizationResult.sanitized

              // Log if threats were detected
              if (Object.keys(sanitizationResult.threats).length > 0) {
                await securityLogger.logMaliciousInput(
                  'input_sanitization',
                  JSON.stringify(sanitizationResult.threats),
                  ipAddress,
                  context.user?.id
                )
              }
            }
          }
        } catch (error) {
          await securityLogger.logMaliciousInput(
            'json_parsing_error',
            String(error),
            ipAddress,
            context.user?.id
          )
          
          return NextResponse.json(
            { error: 'Invalid JSON payload' },
            { status: 400 }
          )
        }
      }

      // Access logging
      if (logAccess) {
        await securityLogger.logEvent({
          type: 'SUSPICIOUS_ACTIVITY',
          severity: 'LOW',
          description: `API access: ${request.method} ${pathname}`,
          userId: context.user?.id,
          ipAddress,
          userAgent,
          metadata: {
            method: request.method,
            pathname,
            hasAuth: !!context.user,
            role: context.user?.role
          }
        })
      }

      // Execute the actual handler
      return await handler(request, context)
    }
  }
}

/**
 * Predefined security configurations for common use cases
 */
export const securityConfigs = {
  // Public endpoints (no auth required)
  public: {
    requireAuth: false,
    rateLimitType: 'forms' as const,
    sanitizeInput: true,
    logAccess: true
  },

  // Authenticated endpoints
  authenticated: {
    requireAuth: true,
    rateLimitType: 'api' as const,
    sanitizeInput: true,
    requireCSRF: true,
    logAccess: true
  },

  // Admin-only endpoints
  adminOnly: {
    requireAuth: true,
    requiredRoles: ['SUPER_ADMIN'],
    rateLimitType: 'sensitive' as const,
    sanitizeInput: true,
    requireCSRF: true,
    logAccess: true
  },

  // Staff endpoints
  staffOnly: {
    requireAuth: true,
    requiredRoles: ['SUPER_ADMIN', 'STAFF'],
    rateLimitType: 'api' as const,
    sanitizeInput: true,
    requireCSRF: true,
    logAccess: true
  },

  // Sensitive operations (require 2FA)
  sensitive: {
    requireAuth: true,
    requiredRoles: ['SUPER_ADMIN', 'STAFF'],
    rateLimitType: 'sensitive' as const,
    sanitizeInput: true,
    requireCSRF: true,
    require2FA: true,
    logAccess: true
  },

  // File upload endpoints
  upload: {
    requireAuth: true,
    rateLimitType: 'uploads' as const,
    sanitizeInput: false, // Files handled separately
    requireCSRF: true,
    logAccess: true
  },

  // Authentication endpoints
  auth: {
    requireAuth: false,
    rateLimitType: 'auth' as const,
    sanitizeInput: true,
    logAccess: true
  }
}

/**
 * Helper function to create API handlers with predefined security configs
 */
export function createSecureApiHandler(
  handler: ApiHandler,
  configName: keyof typeof securityConfigs,
  additionalOptions: Partial<ApiSecurityOptions> = {}
) {
  const config = { ...securityConfigs[configName], ...additionalOptions }
  return withApiSecurity(handler, config)
}

/**
 * Error response helper
 */
export function createErrorResponse(
  message: string,
  status: number = 400,
  details?: any
): NextResponse {
  return NextResponse.json(
    {
      error: message,
      ...(details && { details })
    },
    { status }
  )
}

/**
 * Success response helper
 */
export function createSuccessResponse(
  data: any,
  status: number = 200
): NextResponse {
  return NextResponse.json(data, { status })
}

/**
 * Validate file upload security
 */
export async function validateFileUpload(
  file: File,
  allowedTypes: string[] = ['image/jpeg', 'image/png', 'application/pdf'],
  maxSize: number = 5 * 1024 * 1024 // 5MB
): Promise<{ isValid: boolean; error?: string }> {
  // Check file size
  if (file.size > maxSize) {
    return {
      isValid: false,
      error: `File size exceeds maximum allowed size of ${maxSize} bytes`
    }
  }

  // Check file type
  if (!allowedTypes.includes(file.type)) {
    return {
      isValid: false,
      error: `File type ${file.type} is not allowed`
    }
  }

  // Check file extension
  const extension = file.name.split('.').pop()?.toLowerCase()
  const allowedExtensions = allowedTypes.map(type => {
    switch (type) {
      case 'image/jpeg': return 'jpg'
      case 'image/png': return 'png'
      case 'application/pdf': return 'pdf'
      default: return ''
    }
  }).filter(Boolean)

  if (!extension || !allowedExtensions.includes(extension)) {
    return {
      isValid: false,
      error: `File extension .${extension} is not allowed`
    }
  }

  return { isValid: true }
}