// Admin Donor Eligibility Overview API
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

// GET /api/admin/donors/eligibility - Get all donors with eligibility status
export async function GET(request: NextRequest) {
    try {
        const admin = getAdminFromCookie(request)

        if (!admin) {
            return NextResponse.json(
                { error: 'Authentication required' },
                { status: 401 }
            )
        }

        if (!['SUPER_ADMIN', 'STAFF', 'VIEWER'].includes(admin.role)) {
            return NextResponse.json(
                { error: 'Access denied' },
                { status: 403 }
            )
        }

        // Get query params
        const { searchParams } = new URL(request.url)
        const filter = searchParams.get('filter') || 'all' // all, eligible, ineligible
        const verified = searchParams.get('verified') // true, false, or null for all

        // Fetch donors
        const donors = await db.donor.findMany({
            where: {
                ...(verified === 'true' ? { isVerified: true } : {}),
                ...(verified === 'false' ? { isVerified: false } : {})
            },
            select: {
                id: true,
                name: true,
                phone: true,
                bloodType: true,
                location: true,
                gender: true,
                lastDonation: true,
                donationCount: true,
                isVerified: true,
                verifiedAt: true,
                isAvailable: true,
                createdAt: true,
                member: {
                    select: {
                        id: true,
                        email: true,
                        isPhoneVerified: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        })

        // Calculate eligibility for each donor
        const donorsWithEligibility = donors.map(donor => {
            const requiredDays = donor.gender === 'MALE' ? 90 : 120
            let eligibility

            if (donor.lastDonation) {
                const daysSinceDonation = Math.floor(
                    (Date.now() - new Date(donor.lastDonation).getTime()) / (1000 * 60 * 60 * 24)
                )
                const daysRemaining = Math.max(0, requiredDays - daysSinceDonation)

                eligibility = {
                    canDonate: daysSinceDonation >= requiredDays,
                    daysSinceDonation,
                    daysRemaining,
                    requiredDays,
                    nextEligibleDate: daysRemaining > 0
                        ? new Date(Date.now() + daysRemaining * 24 * 60 * 60 * 1000).toISOString()
                        : null
                }
            } else {
                eligibility = {
                    canDonate: true,
                    daysSinceDonation: null,
                    daysRemaining: 0,
                    requiredDays,
                    nextEligibleDate: null
                }
            }

            return { ...donor, eligibility }
        })

        // Apply eligibility filter
        let filteredDonors = donorsWithEligibility
        if (filter === 'eligible') {
            filteredDonors = donorsWithEligibility.filter(d => d.eligibility.canDonate)
        } else if (filter === 'ineligible') {
            filteredDonors = donorsWithEligibility.filter(d => !d.eligibility.canDonate)
        }

        // Sort by days remaining (ineligible donors first, closest to becoming eligible)
        if (filter === 'ineligible' || filter === 'all') {
            filteredDonors.sort((a, b) => {
                if (a.eligibility.canDonate && !b.eligibility.canDonate) return 1
                if (!a.eligibility.canDonate && b.eligibility.canDonate) return -1
                return a.eligibility.daysRemaining - b.eligibility.daysRemaining
            })
        }

        // Summary stats
        const stats = {
            total: donors.length,
            eligible: donorsWithEligibility.filter(d => d.eligibility.canDonate).length,
            ineligible: donorsWithEligibility.filter(d => !d.eligibility.canDonate).length,
            verified: donors.filter(d => d.isVerified).length,
            unverified: donors.filter(d => !d.isVerified).length
        }

        return NextResponse.json({
            donors: filteredDonors,
            stats
        })
    } catch (error) {
        console.error('Error fetching donor eligibility:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
