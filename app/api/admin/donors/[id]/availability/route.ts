// Admin Donor Availability API
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

// PATCH /api/admin/donors/[id]/availability - Toggle donor availability
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: donorId } = await params

        // Check admin authentication from cookie
        const admin = getAdminFromCookie(request)

        if (!admin) {
            return NextResponse.json(
                { error: 'Authentication required' },
                { status: 401 }
            )
        }

        // Check role
        if (!['SUPER_ADMIN', 'STAFF'].includes(admin.role)) {
            return NextResponse.json(
                { error: 'Insufficient permissions' },
                { status: 403 }
            )
        }

        const body = await request.json()
        const { isAvailable } = body

        // Find donor
        const donor = await db.donor.findUnique({
            where: { id: donorId }
        })

        if (!donor) {
            return NextResponse.json(
                { error: 'Donor not found' },
                { status: 404 }
            )
        }

        // Update availability
        const updatedDonor = await db.donor.update({
            where: { id: donorId },
            data: { isAvailable }
        })

        return NextResponse.json({
            success: true,
            donor: {
                id: updatedDonor.id,
                name: updatedDonor.name,
                isAvailable: updatedDonor.isAvailable
            }
        })
    } catch (error) {
        console.error('Error updating donor availability:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
