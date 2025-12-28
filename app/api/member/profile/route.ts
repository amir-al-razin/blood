// Member Profile API - GET current member, PUT update profile
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyIdToken } from '@/lib/firebase-admin'

// GET /api/member/profile - Get current member's profile
export async function GET(request: NextRequest) {
    try {
        // Get Firebase token from Authorization header
        const authHeader = request.headers.get('authorization')
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json(
                { error: 'No authorization token provided' },
                { status: 401 }
            )
        }

        const token = authHeader.split('Bearer ')[1]
        const verified = await verifyIdToken(token)

        if (!verified.success || !verified.uid) {
            return NextResponse.json(
                { error: 'Invalid token' },
                { status: 401 }
            )
        }

        // Find member by Firebase UID
        const member = await db.member.findUnique({
            where: { firebaseUid: verified.uid },
            include: {
                donor: {
                    select: {
                        id: true,
                        isVerified: true,
                        verifiedAt: true,
                        bloodType: true,
                        lastDonation: true,
                        donationCount: true,
                        isAvailable: true,
                        gender: true,
                        weight: true,
                        location: true,
                        area: true
                    }
                },
                requests: {
                    take: 5,
                    orderBy: { createdAt: 'desc' },
                    select: {
                        id: true,
                        referenceId: true,
                        bloodType: true,
                        status: true,
                        createdAt: true
                    }
                }
            }
        })

        if (!member) {
            return NextResponse.json(
                { error: 'Member not found' },
                { status: 404 }
            )
        }

        // Calculate blood eligibility if member is a donor
        let eligibility = null
        if (member.donor) {
            const lastDonation = member.donor.lastDonation
            const gender = member.donor.gender
            const requiredDays = gender === 'MALE' ? 90 : 120

            if (lastDonation) {
                const daysSinceDonation = Math.floor(
                    (Date.now() - new Date(lastDonation).getTime()) / (1000 * 60 * 60 * 24)
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
                // Never donated before
                eligibility = {
                    canDonate: true,
                    daysSinceDonation: null,
                    daysRemaining: 0,
                    requiredDays,
                    nextEligibleDate: null
                }
            }
        }

        return NextResponse.json({
            member: {
                ...member,
                eligibility
            }
        })
    } catch (error) {
        console.error('Error fetching member profile:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

// PUT /api/member/profile - Update member profile
export async function PUT(request: NextRequest) {
    try {
        const authHeader = request.headers.get('authorization')
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json(
                { error: 'No authorization token provided' },
                { status: 401 }
            )
        }

        const token = authHeader.split('Bearer ')[1]
        const verified = await verifyIdToken(token)

        if (!verified.success || !verified.uid) {
            return NextResponse.json(
                { error: 'Invalid token' },
                { status: 401 }
            )
        }

        const body = await request.json()
        const { name, phone, image } = body

        // Find and update member
        const member = await db.member.findUnique({
            where: { firebaseUid: verified.uid }
        })

        if (!member) {
            return NextResponse.json(
                { error: 'Member not found' },
                { status: 404 }
            )
        }

        // Check if phone is being changed and if it's already in use
        if (phone && phone !== member.phone) {
            const existingPhone = await db.member.findUnique({
                where: { phone }
            })
            if (existingPhone) {
                return NextResponse.json(
                    { error: 'Phone number already in use' },
                    { status: 400 }
                )
            }
        }

        const updatedMember = await db.member.update({
            where: { id: member.id },
            data: {
                ...(name && { name }),
                ...(phone && { phone, isPhoneVerified: false }), // Reset verification if phone changes
                ...(image && { image }),
                lastLoginAt: new Date()
            },
            include: {
                donor: true
            }
        })

        return NextResponse.json({
            success: true,
            member: updatedMember
        })
    } catch (error) {
        console.error('Error updating member profile:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
