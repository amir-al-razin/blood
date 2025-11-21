import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { rateLimiters, getRateLimitHeaders } from './lib/rate-limiter'
import { securityLogger, getRequestInfo } from './lib/security-logger'
import { validateOrigin } from './lib/csrf-protection'

// Security configuration
const ALLOWED_ORIGINS = [
  process.env.NEXTAUTH_URL || 'http://localhost:3000',
  'https://redaid.vercel.app', // Production domain
  'https://www.redaid.org' // Custom domain if any
].filter(Boolean)

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const { ipAddress, userAgent } = getRequestInfo(request)
  
  // Security headers for all responses
  const response = NextResponse.next()
  
  // Add security headers
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
  
  // Content Security Policy
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://vercel.live",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https: blob:",
    "connect-src 'self' https://api.cloudinary.com https://res.cloudinary.com",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'"
  ].join('; ')
  
  response.headers.set('Content-Security-Policy', csp)

  // Rate limiting for different endpoint types
  let rateLimitResult
  
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

  // Get the token from the request
  const token = await getToken({ 
    req: request, 
    secret: process.env.NEXTAUTH_SECRET 
  })

  // Protect admin routes
  if (pathname.startsWith('/dashboard') || pathname.startsWith('/(dashboard)')) {
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    // Check role-based access
    const userRole = token.role as string
    const userId = token.sub as string
    
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
    // Public API routes (for form submissions)
    const publicRoutes = ['/api/donors', '/api/requests', '/api/health']
    const isPublicRoute = publicRoutes.some(route => 
      pathname.startsWith(route) && request.method === 'POST'
    )

    if (!isPublicRoute && !token) {
      await securityLogger.logUnauthorizedAccess(pathname, undefined, ipAddress)
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Log API access for authenticated routes
    if (token) {
      const userId = token.sub as string
      await securityLogger.logEvent({
        type: 'SUSPICIOUS_ACTIVITY',
        severity: 'LOW',
        description: `API access: ${request.method} ${pathname}`,
        userId,
        ipAddress,
        userAgent,
        metadata: { method: request.method, pathname }
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