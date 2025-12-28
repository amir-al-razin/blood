// Member Donor Application API
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyIdToken } from '@/lib/firebase-admin'
import { z } from 'zod'

const donorApplicationSchema = z.object({
    bloodType: z.enum(['A_POSITIVE', 'A_NEGATIVE', 'B_POSITIVE', 'B_NEGATIVE', 'AB_POSITIVE', 'AB_NEGATIVE', 'O_POSITIVE', 'O_NEGATIVE']),
    location: z.string().min(1, 'Location is required'),
    area: z.string().min(2, 'Area is required'),
    address: z.string().optional(),
    dateOfBirth: z.string().refine((date) => {
        const birthDate = new Date(date)
        const today = new Date()
        const age = today.getFullYear() - birthDate.getFullYear()
        return age >= 18 && age <= 65
    }, 'You must be between 18 and 65 years old'),
    gender: z.enum(['MALE', 'FEMALE', 'OTHER']),
    weight: z.number().min(50, 'Weight must be at least 50 kg').max(200, 'Please enter a valid weight'),
    lastDonation: z.string().optional().nullable(),
    isAvailable: z.boolean().default(true),
    allowContactByPhone: z.boolean().default(true),
    allowContactByEmail: z.boolean().default(true),
    allowDataSharing: z.boolean().default(false)
})

// POST /api/member/donor/apply - Apply to become a donor
export async function POST(request: NextRequest) {
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

        // Find member
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

        // Check if already a donor
        if (member.donor) {
            return NextResponse.json(
                { error: 'You are already registered as a donor' },
                { status: 400 }
            )
        }

        // Parse and validate request body
        const body = await request.json()
        const validationResult = donorApplicationSchema.safeParse(body)

        if (!validationResult.success) {
            return NextResponse.json(
                { error: 'Validation failed', details: validationResult.error.issues },
                { status: 400 }
            )
        }

        const data = validationResult.data

        // Check if phone is already registered as donor (legacy donors)
        const existingDonor = await db.donor.findUnique({
            where: { phone: member.phone }
        })

        if (existingDonor) {
            // Link existing donor to member
            const linkedDonor = await db.donor.update({
                where: { id: existingDonor.id },
                data: { memberId: member.id }
            })

            return NextResponse.json({
                success: true,
                donor: linkedDonor,
                message: 'Your existing donor profile has been linked to your account'
            })
        }

        // Create new donor linked to member
        const donor = await db.donor.create({
            data: {
                memberId: member.id,
                name: member.name,
                phone: member.phone,
                email: member.email,
                bloodType: data.bloodType,
                location: data.location,
                area: data.area,
                address: data.address || null,
                dateOfBirth: new Date(data.dateOfBirth),
                gender: data.gender,
                weight: data.weight,
                lastDonation: data.lastDonation ? new Date(data.lastDonation) : null,
                isAvailable: data.isAvailable,
                isVerified: false, // Will be verified by admin
                allowContactByPhone: data.allowContactByPhone,
                allowContactByEmail: data.allowContactByEmail,
                allowDataSharing: data.allowDataSharing,
                privacyConsent: true,
                consentDate: new Date()
            }
        })

        return NextResponse.json({
            success: true,
            donor: {
                id: donor.id,
                bloodType: donor.bloodType,
                isVerified: donor.isVerified,
                isAvailable: donor.isAvailable
            },
            message: 'Donor application submitted successfully. Admin will verify your profile.'
        }, { status: 201 })
    } catch (error) {
        console.error('Error applying as donor:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

// GET /api/member/donor/apply - Get donor application status
export async function GET(request: NextRequest) {
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

        const member = await db.member.findUnique({
            where: { firebaseUid: verified.uid },
            include: {
                donor: {
                    select: {
                        id: true,
                        bloodType: true,
                        isVerified: true,
                        verifiedAt: true,
                        isAvailable: true,
                        lastDonation: true,
                        donationCount: true,
                        gender: true
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

        return NextResponse.json({
            isDonor: !!member.donor,
            donor: member.donor
        })
    } catch (error) {
        console.error('Error fetching donor status:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
