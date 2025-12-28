// Update Donation Date API
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyIdToken } from '@/lib/firebase-admin'
import { z } from 'zod'

const updateDonationSchema = z.object({
    lastDonation: z.string().refine((date) => {
        const donationDate = new Date(date)
        return donationDate <= new Date()
    }, 'Donation date cannot be in the future')
})

// PUT /api/member/donor/update-donation - Update last donation date
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

        // Find member with donor
        const member = await db.member.findUnique({
            where: { firebaseUid: verified.uid },
            include: { donor: true }
        })

        if (!member) {
            return NextResponse.json(
                { error: 'Member not found' },
                { status: 404 }
            )
        }

        if (!member.donor) {
            return NextResponse.json(
                { error: 'You are not registered as a donor' },
                { status: 400 }
            )
        }

        // Parse and validate
        const body = await request.json()
        const validationResult = updateDonationSchema.safeParse(body)

        if (!validationResult.success) {
            return NextResponse.json(
                { error: 'Validation failed', details: validationResult.error.issues },
                { status: 400 }
            )
        }

        const { lastDonation } = validationResult.data
        const donationDate = new Date(lastDonation)

        // Update donor record
        const updatedDonor = await db.donor.update({
            where: { id: member.donor.id },
            data: {
                lastDonation: donationDate,
                donationCount: {
                    increment: 1
                }
            }
        })

        // Calculate new eligibility
        const requiredDays = updatedDonor.gender === 'MALE' ? 90 : 120
        const daysSinceDonation = Math.floor(
            (Date.now() - donationDate.getTime()) / (1000 * 60 * 60 * 24)
        )
        const daysRemaining = Math.max(0, requiredDays - daysSinceDonation)

        return NextResponse.json({
            success: true,
            donor: {
                lastDonation: updatedDonor.lastDonation,
                donationCount: updatedDonor.donationCount
            },
            eligibility: {
                canDonate: daysSinceDonation >= requiredDays,
                daysSinceDonation,
                daysRemaining,
                requiredDays,
                nextEligibleDate: daysRemaining > 0
                    ? new Date(Date.now() + daysRemaining * 24 * 60 * 60 * 1000).toISOString()
                    : null
            }
        })
    } catch (error) {
        console.error('Error updating donation date:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
