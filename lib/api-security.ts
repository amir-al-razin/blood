import { NextRequest, NextResponse } from 'next/server'
import { ZodSchema } from 'zod'

export interface ApiSecurityOptions {
  validateInput?: ZodSchema
  sanitizeInput?: boolean
  logAccess?: boolean
}

export interface ApiContext {
  sanitizedInput?: any
  originalInput?: any
}

export type ApiHandler = (
  request: NextRequest,
  context: ApiContext
) => Promise<NextResponse>

/**
 * Simple API route wrapper with input validation
 */
export function withApiSecurity(
  handler: ApiHandler,
  options: ApiSecurityOptions = {}
) {
  const {
    validateInput,
    sanitizeInput = true,
    logAccess = false
  } = options

  return async (request: NextRequest): Promise<NextResponse> => {
    const pathname = request.nextUrl.pathname

    try {
      const context: ApiContext = {}

      // Input validation and sanitization for POST/PUT/PATCH
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
                return NextResponse.json(
                  {
                    error: 'Validation failed',
                    details: validationResult.error.errors
                  },
                  { status: 400 }
                )
              }
              context.sanitizedInput = validationResult.data
            } else {
              context.sanitizedInput = body
            }
          }
        } catch (error) {
          return NextResponse.json(
            { error: 'Invalid JSON payload' },
            { status: 400 }
          )
        }
      }

      // Access logging
      if (logAccess) {
        console.log(`API access: ${request.method} ${pathname}`)
      }

      // Execute the actual handler
      return await handler(request, context)

    } catch (error) {
      console.error('API Security Error:', error)
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    }
  }
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