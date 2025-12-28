// Admin session verification API
// Verifies Firebase token and checks admin role, sets session cookie

import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminToken } from '@/lib/admin-auth'

export async function POST(request: NextRequest) {
    try {
        const authHeader = request.headers.get('authorization')

        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json(
                { error: 'No authorization token provided' },
                { status: 401 }
            )
        }

        const token = authHeader.substring(7)
        const result = await verifyAdminToken(token)

        if (!result.success || !result.user) {
            return NextResponse.json(
                { error: result.error || 'Not authorized as admin' },
                { status: 403 }
            )
        }

        // Create session cookie for middleware (Base64 encoded JSON)
        const sessionData = {
            userId: result.user.id,
            role: result.user.role
        }
        const cookieValue = btoa(JSON.stringify(sessionData))

        // Create response with admin user info
        const response = NextResponse.json({
            success: true,
            user: {
                id: result.user.id,
                email: result.user.email,
                name: result.user.name,
                role: result.user.role
            }
        })

        // Set the admin session cookie
        response.cookies.set('admin_session', cookieValue, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 24 * 60 * 60, // 24 hours
            path: '/'
        })

        return response
    } catch (error: any) {
        console.error('Admin session verification error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

// GET method to check current session
export async function GET(request: NextRequest) {
    return POST(request)
}

// DELETE method to clear session (logout)
export async function DELETE() {
    const response = NextResponse.json({ success: true, message: 'Logged out' })
    response.cookies.delete('admin_session')
    return response
}
