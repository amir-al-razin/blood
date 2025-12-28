// Admin Donor Verification API
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { hasAdminRole, AdminUser } from '@/lib/admin-auth'

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

// POST /api/admin/donors/[id]/verify - Verify a donor
export async function POST(
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

        if (donor.isVerified) {
            return NextResponse.json(
                { error: 'Donor is already verified' },
                { status: 400 }
            )
        }

        // Verify donor
        const verifiedDonor = await db.donor.update({
            where: { id: donorId },
            data: {
                isVerified: true,
                verifiedAt: new Date(),
                verifiedBy: admin.userId
            }
        })

        // If donor has member, update phone verification
        if (verifiedDonor.memberId) {
            await db.member.update({
                where: { id: verifiedDonor.memberId },
                data: { isPhoneVerified: true }
            })
        }

        // Create audit log
        await db.auditLog.create({
            data: {
                userId: admin.userId,
                action: 'VERIFY_DONOR',
                entity: 'donor',
                entityId: donorId,
                details: {
                    donorName: verifiedDonor.name,
                    donorPhone: verifiedDonor.phone,
                    bloodType: verifiedDonor.bloodType
                }
            }
        })

        return NextResponse.json({
            success: true,
            donor: {
                id: verifiedDonor.id,
                name: verifiedDonor.name,
                isVerified: verifiedDonor.isVerified,
                verifiedAt: verifiedDonor.verifiedAt
            }
        })
    } catch (error) {
        console.error('Error verifying donor:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

// DELETE /api/admin/donors/[id]/verify - Revoke verification
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: donorId } = await params

        const admin = getAdminFromCookie(request)

        if (!admin || admin.role !== 'SUPER_ADMIN') {
            return NextResponse.json(
                { error: 'Super admin access required' },
                { status: 403 }
            )
        }

        const donor = await db.donor.findUnique({
            where: { id: donorId }
        })

        if (!donor || !donor.isVerified) {
            return NextResponse.json(
                { error: 'Donor not found or not verified' },
                { status: 404 }
            )
        }

        const unverifiedDonor = await db.donor.update({
            where: { id: donorId },
            data: {
                isVerified: false,
                verifiedAt: null,
                verifiedBy: null
            }
        })

        // Create audit log
        await db.auditLog.create({
            data: {
                userId: admin.userId,
                action: 'REVOKE_DONOR_VERIFICATION',
                entity: 'donor',
                entityId: donorId,
                details: {
                    donorName: unverifiedDonor.name,
                    reason: 'Admin revoked verification'
                }
            }
        })

        return NextResponse.json({
            success: true,
            message: 'Verification revoked'
        })
    } catch (error) {
        console.error('Error revoking verification:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
