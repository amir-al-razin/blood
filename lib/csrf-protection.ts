import { NextRequest } from 'next/server'
import { randomBytes, createHash } from 'crypto'
import { securityLogger } from './security-logger'
import { getRequestInfo } from './security-logger'

// CSRF token configuration
const CSRF_TOKEN_LENGTH = 32
const CSRF_TOKEN_EXPIRY = 60 * 60 * 1000 // 1 hour
const CSRF_HEADER_NAME = 'x-csrf-token'
const CSRF_COOKIE_NAME = 'csrf-token'

// In-memory store for CSRF tokens (in production, use Redis)
const csrfTokenStore = new Map<string, { token: string; expires: number }>()

export interface CSRFTokenData {
  token: string
  expires: number
}

/**
 * Generate a CSRF token
 */
export function generateCSRFToken(): string {
  return randomBytes(CSRF_TOKEN_LENGTH).toString('hex')
}

/**
 * Create CSRF token hash for storage
 */
export function hashCSRFToken(token: string, secret: string): string {
  return createHash('sha256').update(token + secret).digest('hex')
}

/**
 * Generate and store CSRF token for session
 */
export function createCSRFToken(sessionId: string): CSRFTokenData {
  const token = generateCSRFToken()
  const expires = Date.now() + CSRF_TOKEN_EXPIRY
  
  // Store token with session ID
  csrfTokenStore.set(sessionId, { token, expires })
  
  // Clean up expired tokens
  cleanupExpiredTokens()
  
  return { token, expires }
}

/**
 * Validate CSRF token
 */
export function validateCSRFToken(
  sessionId: string, 
  providedToken: string
): boolean {
  const storedData = csrfTokenStore.get(sessionId)
  
  if (!storedData) {
    return false
  }
  
  // Check if token is expired
  if (Date.now() > storedData.expires) {
    csrfTokenStore.delete(sessionId)
    return false
  }
  
  // Compare tokens using constant-time comparison
  return constantTimeCompare(storedData.token, providedToken)
}

/**
 * Constant-time string comparison to prevent timing attacks
 */
function constantTimeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false
  }
  
  let result = 0
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }
  
  return result === 0
}

/**
 * Clean up expired CSRF tokens
 */
function cleanupExpiredTokens(): void {
  const now = Date.now()
  for (const [sessionId, data] of csrfTokenStore.entries()) {
    if (now > data.expires) {
      csrfTokenStore.delete(sessionId)
    }
  }
}

/**
 * Extract CSRF token from request
 */
export function extractCSRFToken(request: NextRequest): string | null {
  // Try header first
  const headerToken = request.headers.get(CSRF_HEADER_NAME)
  if (headerToken) {
    return headerToken
  }
  
  // Try form data for POST requests
  if (request.method === 'POST') {
    const contentType = request.headers.get('content-type') || ''
    if (contentType.includes('application/x-www-form-urlencoded')) {
      // This would need to be handled in the API route after parsing form data
      return null
    }
  }
  
  return null
}

/**
 * Get session ID from request (using NextAuth session or custom implementation)
 */
export function getSessionId(request: NextRequest): string | null {
  // Try to get session token from cookies
  const sessionToken = request.cookies.get('next-auth.session-token')?.value ||
                      request.cookies.get('__Secure-next-auth.session-token')?.value
  
  if (sessionToken) {
    return createHash('sha256').update(sessionToken).digest('hex').substring(0, 16)
  }
  
  // Fallback to IP + User Agent hash for anonymous sessions
  const { ipAddress, userAgent } = getRequestInfo(request)
  if (ipAddress && userAgent) {
    return createHash('sha256').update(ipAddress + userAgent).digest('hex').substring(0, 16)
  }
  
  return null
}

/**
 * CSRF protection middleware
 */
export async function withCSRFProtection(
  request: NextRequest,
  handler: () => Promise<Response>
): Promise<Response> {
  // Skip CSRF protection for GET, HEAD, OPTIONS requests
  if (['GET', 'HEAD', 'OPTIONS'].includes(request.method)) {
    return handler()
  }
  
  // Skip for API routes that don't need CSRF protection (like webhooks)
  const pathname = request.nextUrl.pathname
  const skipCSRFPaths = [
    '/api/auth/',
    '/api/webhooks/',
    '/api/health'
  ]
  
  if (skipCSRFPaths.some(path => pathname.startsWith(path))) {
    return handler()
  }
  
  const sessionId = getSessionId(request)
  if (!sessionId) {
    await securityLogger.logCSRFAttempt(
      pathname,
      getRequestInfo(request).ipAddress,
      getRequestInfo(request).userAgent
    )
    
    return new Response(
      JSON.stringify({ error: 'Invalid session' }),
      { 
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
  
  const csrfToken = extractCSRFToken(request)
  if (!csrfToken) {
    await securityLogger.logCSRFAttempt(
      pathname,
      getRequestInfo(request).ipAddress,
      getRequestInfo(request).userAgent
    )
    
    return new Response(
      JSON.stringify({ error: 'CSRF token missing' }),
      { 
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
  
  if (!validateCSRFToken(sessionId, csrfToken)) {
    await securityLogger.logCSRFAttempt(
      pathname,
      getRequestInfo(request).ipAddress,
      getRequestInfo(request).userAgent
    )
    
    return new Response(
      JSON.stringify({ error: 'Invalid CSRF token' }),
      { 
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
  
  return handler()
}

/**
 * Generate CSRF token for client-side use
 */
export function generateCSRFTokenForClient(request: NextRequest): {
  token: string
  expires: number
} | null {
  const sessionId = getSessionId(request)
  if (!sessionId) {
    return null
  }
  
  return createCSRFToken(sessionId)
}

/**
 * CSRF token response headers
 */
export function getCSRFHeaders(token: string, expires: number): Record<string, string> {
  return {
    'X-CSRF-Token': token,
    'Set-Cookie': `${CSRF_COOKIE_NAME}=${token}; HttpOnly; Secure; SameSite=Strict; Max-Age=${Math.floor((expires - Date.now()) / 1000)}`
  }
}

/**
 * Validate origin header for additional CSRF protection
 */
export function validateOrigin(request: NextRequest, allowedOrigins: string[]): boolean {
  const origin = request.headers.get('origin')
  const referer = request.headers.get('referer')
  
  // For same-origin requests, origin might be null
  if (!origin && !referer) {
    return false
  }
  
  const requestOrigin = origin || (referer ? new URL(referer).origin : null)
  
  if (!requestOrigin) {
    return false
  }
  
  return allowedOrigins.includes(requestOrigin)
}

/**
 * Double submit cookie pattern validation
 */
export function validateDoubleSubmitCookie(request: NextRequest): boolean {
  const cookieToken = request.cookies.get(CSRF_COOKIE_NAME)?.value
  const headerToken = request.headers.get(CSRF_HEADER_NAME)
  
  if (!cookieToken || !headerToken) {
    return false
  }
  
  return constantTimeCompare(cookieToken, headerToken)
}

/**
 * Enhanced CSRF protection with multiple validation methods
 */
export async function enhancedCSRFProtection(
  request: NextRequest,
  allowedOrigins: string[],
  handler: () => Promise<Response>
): Promise<Response> {
  // Skip for safe methods
  if (['GET', 'HEAD', 'OPTIONS'].includes(request.method)) {
    return handler()
  }
  
  const pathname = request.nextUrl.pathname
  const { ipAddress, userAgent } = getRequestInfo(request)
  
  // Validate origin
  if (!validateOrigin(request, allowedOrigins)) {
    await securityLogger.logCSRFAttempt(pathname, ipAddress, userAgent)
    return new Response(
      JSON.stringify({ error: 'Invalid origin' }),
      { status: 403, headers: { 'Content-Type': 'application/json' } }
    )
  }
  
  // Validate double submit cookie
  if (!validateDoubleSubmitCookie(request)) {
    await securityLogger.logCSRFAttempt(pathname, ipAddress, userAgent)
    return new Response(
      JSON.stringify({ error: 'CSRF validation failed' }),
      { status: 403, headers: { 'Content-Type': 'application/json' } }
    )
  }
  
  return handler()
}