import { NextRequest, NextResponse } from 'next/server'

// I18n configuration
const LOCALES = ['en', 'bn']
const DEFAULT_LOCALE = 'en'

function getLocaleFromRequest(request: NextRequest): string {
  const langParam = request.nextUrl.searchParams.get('lang')
  if (langParam && LOCALES.includes(langParam)) {
    return langParam
  }

  const localeCookie = request.cookies.get('NEXT_LOCALE')?.value
  if (localeCookie && LOCALES.includes(localeCookie)) {
    return localeCookie
  }

  return DEFAULT_LOCALE
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Get and set locale
  const locale = getLocaleFromRequest(request)

  // Create response with security headers
  const response = NextResponse.next()

  // Set locale
  response.headers.set('x-locale', locale)
  response.cookies.set('NEXT_LOCALE', locale, { maxAge: 31536000 })

  // Security headers
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('Cross-Origin-Opener-Policy', 'same-origin-allow-popups')

  // Get admin session from cookie
  const adminSessionCookie = request.cookies.get('admin_session')
  let adminSession: { userId: string; role: string } | null = null

  if (adminSessionCookie?.value) {
    try {
      const decoded = atob(adminSessionCookie.value)
      adminSession = JSON.parse(decoded)
    } catch {
      adminSession = null
    }
  }

  // Protect dashboard routes
  if (pathname.startsWith('/dashboard')) {
    if (!adminSession) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    const userRole = adminSession.role

    // Super admin can access everything
    if (userRole === 'SUPER_ADMIN') {
      return response
    }

    // Staff can access most features except user management
    if (userRole === 'STAFF') {
      if (pathname.startsWith('/dashboard/users')) {
        return NextResponse.redirect(new URL('/dashboard', request.url))
      }
      return response
    }

    // Viewer has read-only access
    if (userRole === 'VIEWER') {
      if (request.method !== 'GET') {
        return NextResponse.redirect(new URL('/dashboard', request.url))
      }
      return response
    }

    // No valid role
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Protect admin API routes
  if (pathname.startsWith('/api/admin/')) {
    // Allow session verification endpoint
    if (pathname === '/api/admin/verify-session') {
      return response
    }

    if (!adminSession) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }
  }

  return response
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/api/admin/:path*'
  ]
}