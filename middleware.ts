import { NextRequest, NextResponse } from 'next/server'
import { rateLimiters, getRateLimitHeaders } from './lib/rate-limiter'
import { securityLogger, getRequestInfo } from './lib/security-logger'
import { validateOrigin } from './lib/csrf-protection'

// I18n configuration
const LOCALES = ['en', 'bn']
const DEFAULT_LOCALE = 'en'

// Security configuration
const ALLOWED_ORIGINS = [
  process.env.NEXTAUTH_URL || 'http://localhost:3000',
  'https://redaid.vercel.app', // Production domain
  'https://www.redaid.org' // Custom domain if any
].filter(Boolean)

function getLocaleFromRequest(request: NextRequest): string {
  // Check URL query parameter: ?lang=bn
  const langParam = request.nextUrl.searchParams.get('lang')
  if (langParam && LOCALES.includes(langParam)) {
    return langParam
  }

  // Check localStorage via cookie (set by client)
  const localeCookie = request.cookies.get('NEXT_LOCALE')?.value
  if (localeCookie && LOCALES.includes(localeCookie)) {
    return localeCookie
  }

  // Default to English
  return DEFAULT_LOCALE
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const { ipAddress, userAgent } = getRequestInfo(request)

  // Get and set locale
  const locale = getLocaleFromRequest(request)

  // Security headers for all responses
  const response = NextResponse.next()

  // Set locale in response headers and cookie
  response.headers.set('x-locale', locale)
  response.cookies.set('NEXT_LOCALE', locale, { maxAge: 31536000 }) // 1 year

  // Add security headers
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
  // Allow Firebase popup auth - use 'same-origin-allow-popups' for Google OAuth
  response.headers.set('Cross-Origin-Opener-Policy', 'same-origin-allow-popups')

  // Content Security Policy
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://vercel.live https://apis.google.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https: blob:",
    "connect-src 'self' https://api.cloudinary.com https://res.cloudinary.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://*.firebaseapp.com",
    "frame-src 'self' https://*.firebaseapp.com https://accounts.google.com",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'"
  ].join('; ')

  response.headers.set('Content-Security-Policy', csp)

  // Rate limiting for different endpoint types
  // Skip rate limiting in development if disabled
  const skipRateLimit = process.env.DISABLE_RATE_LIMIT === 'true' || process.env.NODE_ENV === 'development'
  let rateLimitResult

  if (!skipRateLimit) {
    if (pathname.startsWith('/api/auth/')) {
      rateLimitResult = rateLimiters.auth(request)
    } else if (pathname.startsWith('/api/') && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method)) {
      if (pathname.includes('/upload') || request.headers.get('content-type')?.includes('multipart/form-data')) {
        rateLimitResult = rateLimiters.uploads(request)
      } else if (pathname.includes('/password') || pathname.includes('/reset')) {
        rateLimitResult = rateLimiters.passwordReset(request)
      } else if (pathname.includes('/sensitive') || pathname.includes('/admin')) {
        rateLimitResult = rateLimiters.sensitive(request)
      } else {
        rateLimitResult = rateLimiters.forms(request)
      }
    } else if (pathname.startsWith('/api/')) {
      rateLimitResult = rateLimiters.api(request)
    }
  }

  // Handle rate limiting
  if (rateLimitResult && !rateLimitResult.success) {
    await securityLogger.logRateLimitExceeded(pathname, ipAddress)

    const headers = getRateLimitHeaders(rateLimitResult)
    return new Response(
      JSON.stringify({
        error: 'Rate limit exceeded',
        message: rateLimitResult.message,
        retryAfter: Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000)
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          ...headers
        }
      }
    )
  }

  // Add rate limit headers to response
  if (rateLimitResult) {
    const headers = getRateLimitHeaders(rateLimitResult)
    Object.entries(headers).forEach(([key, value]) => {
      response.headers.set(key, value)
    })
  }

  // Origin validation for state-changing requests
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method)) {
    if (!validateOrigin(request, ALLOWED_ORIGINS)) {
      await securityLogger.logEvent({
        type: 'CSRF_ATTACK',
        severity: 'CRITICAL',
        description: `Invalid origin for ${request.method} request to ${pathname}`,
        ipAddress,
        userAgent,
        metadata: {
          origin: request.headers.get('origin'),
          referer: request.headers.get('referer'),
          method: request.method,
          pathname
        }
      })

      return new Response(
        JSON.stringify({ error: 'Invalid origin' }),
        {
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }
  }

  // Get admin session from cookie (set by login flow)
  // We use cookies because middleware runs in Edge Runtime and can't use Firebase Admin SDK
  const adminSessionCookie = request.cookies.get('admin_session')
  let adminSession: { userId: string; role: string } | null = null

  if (adminSessionCookie?.value) {
    try {
      // Decode base64 cookie value
      const decoded = atob(adminSessionCookie.value)
      adminSession = JSON.parse(decoded)
    } catch {
      // Invalid cookie, will be treated as not logged in
      adminSession = null
    }
  }

  // Protect admin routes
  if (pathname.startsWith('/dashboard') || pathname.startsWith('/(dashboard)')) {
    if (!adminSession) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    // Check role-based access
    const userRole = adminSession.role
    const userId = adminSession.userId

    // Log access attempt
    await securityLogger.logEvent({
      type: 'SUSPICIOUS_ACTIVITY',
      severity: 'LOW',
      description: `Dashboard access by ${userRole}`,
      userId,
      ipAddress,
      userAgent,
      metadata: { pathname, role: userRole }
    })

    // Super admin can access everything
    if (userRole === 'SUPER_ADMIN') {
      return response
    }

    // Staff can access most dashboard features
    if (userRole === 'STAFF') {
      // Restrict access to user management for staff
      if (pathname.startsWith('/dashboard/users')) {
        await securityLogger.logUnauthorizedAccess(pathname, userId, ipAddress)
        return NextResponse.redirect(new URL('/dashboard', request.url))
      }
      return response
    }

    // Viewer has read-only access
    if (userRole === 'VIEWER') {
      // Only allow GET requests for viewers
      if (request.method !== 'GET') {
        await securityLogger.logUnauthorizedAccess(`${request.method} ${pathname}`, userId, ipAddress)
        return NextResponse.redirect(new URL('/dashboard', request.url))
      }
      return response
    }

    // No valid role, redirect to login
    await securityLogger.logUnauthorizedAccess(pathname, userId, ipAddress)
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Protect API routes
  if (pathname.startsWith('/api/') && !pathname.startsWith('/api/auth/')) {
    // Public API routes (only read operations and auth-related)
    // Note: /api/requests POST and /api/donors POST now require auth (use /api/member/request-blood)
    const publicRoutes = [
      '/api/health',
      '/api/member/register',
      '/api/member/profile',
      '/api/debug',
      '/api/admin/verify-session'
    ]
    // GET-only public routes (for public stats display)
    const publicGetRoutes = ['/api/donors', '/api/requests']

    const isPublicRoute = publicRoutes.some(route =>
      pathname.startsWith(route) && ['GET', 'POST', 'PUT', 'DELETE'].includes(request.method)
    )
    const isPublicGetRoute = publicGetRoutes.some(route =>
      pathname.startsWith(route) && request.method === 'GET'
    )

    // Check for admin session (cookie) or member auth (Firebase token in header)
    const hasAuth = adminSession || request.headers.get('authorization')?.startsWith('Bearer ')

    if (!isPublicRoute && !isPublicGetRoute && !hasAuth) {
      await securityLogger.logUnauthorizedAccess(pathname, undefined, ipAddress)
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Log API access for admin routes
    if (adminSession && pathname.startsWith('/api/admin/')) {
      await securityLogger.logEvent({
        type: 'SUSPICIOUS_ACTIVITY',
        severity: 'LOW',
        description: `Admin API access: ${request.method} ${pathname}`,
        userId: adminSession.userId,
        ipAddress,
        userAgent,
        metadata: { method: request.method, pathname, role: adminSession.role }
      })
    }
  }

  return response
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/api/:path*'
  ]
}