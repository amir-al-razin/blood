// Admin Request Status API
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Helper to get admin from cookie
function getAdminFromCookie(request: NextRequest): { userId: string; role: string } | null {
    const adminSessionCookie = request.cookies.get('admin_session')
    if (!adminSessionCookie?.value) return null

    try {
        const decoded = atob(adminSessionCookie.value)
        return JSON.parse(decoded)
    } catch {
        return null
    }
}

// PATCH /api/admin/requests/[id]/status - Update request status
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: requestId } = await params

        // Check admin authentication
        const admin = getAdminFromCookie(request)

        if (!admin) {
            return NextResponse.json(
                { error: 'Authentication required' },
                { status: 401 }
            )
        }

        if (!['SUPER_ADMIN', 'STAFF'].includes(admin.role)) {
            return NextResponse.json(
                { error: 'Insufficient permissions' },
                { status: 403 }
            )
        }

        const body = await request.json()
        const { status } = body

        // Validate status
        const validStatuses = ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']
        if (!validStatuses.includes(status)) {
            return NextResponse.json(
                { error: 'Invalid status' },
                { status: 400 }
            )
        }

        // Find request
        const existingRequest = await db.request.findUnique({
            where: { id: requestId }
        })

        if (!existingRequest) {
            return NextResponse.json(
                { error: 'Request not found' },
                { status: 404 }
            )
        }

        // Update status
        const updatedRequest = await db.request.update({
            where: { id: requestId },
            data: { status }
        })

        return NextResponse.json({
            success: true,
            request: {
                id: updatedRequest.id,
                referenceId: updatedRequest.referenceId,
                status: updatedRequest.status
            }
        })
    } catch (error) {
        console.error('Error updating request status:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
