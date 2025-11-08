import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
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
    
    // Super admin can access everything
    if (userRole === 'SUPER_ADMIN') {
      return NextResponse.next()
    }

    // Staff can access most dashboard features
    if (userRole === 'STAFF') {
      // Restrict access to user management for staff
      if (pathname.startsWith('/dashboard/users')) {
        return NextResponse.redirect(new URL('/dashboard', request.url))
      }
      return NextResponse.next()
    }

    // Viewer has read-only access
    if (userRole === 'VIEWER') {
      // Only allow GET requests for viewers
      if (request.method !== 'GET') {
        return NextResponse.redirect(new URL('/dashboard', request.url))
      }
      return NextResponse.next()
    }

    // No valid role, redirect to login
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Protect API routes
  if (pathname.startsWith('/api/') && !pathname.startsWith('/api/auth/')) {
    // Public API routes (for form submissions)
    const publicRoutes = ['/api/donors', '/api/requests']
    const isPublicRoute = publicRoutes.some(route => 
      pathname.startsWith(route) && request.method === 'POST'
    )

    if (!isPublicRoute && !token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/api/:path*'
  ]
}