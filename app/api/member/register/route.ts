// Member Registration API
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyIdToken } from '@/lib/firebase-admin'
import { z } from 'zod'

const registerSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    phone: z.string().regex(/^(\+880|880|0)?1[3-9]\d{8}$/, 'Please enter a valid Bangladeshi phone number'),
    image: z.string().optional()
})

// POST /api/member/register - Register new member after Firebase auth
export async function POST(request: NextRequest) {
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

        if (!verified.success || !verified.uid || !verified.email) {
            return NextResponse.json(
                { error: 'Invalid token' },
                { status: 401 }
            )
        }

        // Parse and validate request body
        const body = await request.json()
        const validationResult = registerSchema.safeParse(body)

        if (!validationResult.success) {
            return NextResponse.json(
                { error: 'Validation failed', details: validationResult.error.issues },
                { status: 400 }
            )
        }

        const { name, phone, image } = validationResult.data

        // Check if member already exists with this Firebase UID
        const existingMember = await db.member.findUnique({
            where: { firebaseUid: verified.uid }
        })

        if (existingMember) {
            return NextResponse.json(
                { error: 'Account already exists' },
                { status: 400 }
            )
        }

        // Check if phone number is already in use
        const existingPhone = await db.member.findUnique({
            where: { phone }
        })

        if (existingPhone) {
            return NextResponse.json(
                { error: 'Phone number already registered' },
                { status: 400 }
            )
        }

        // Check if email is already in use
        const existingEmail = await db.member.findUnique({
            where: { email: verified.email }
        })

        if (existingEmail) {
            return NextResponse.json(
                { error: 'Email already registered' },
                { status: 400 }
            )
        }

        // Create new member
        const member = await db.member.create({
            data: {
                firebaseUid: verified.uid,
                email: verified.email,
                name,
                phone,
                image: image || null,
                isEmailVerified: true, // Firebase verified the email
                lastLoginAt: new Date()
            }
        })

        return NextResponse.json({
            success: true,
            member: {
                id: member.id,
                email: member.email,
                name: member.name,
                phone: member.phone,
                isPhoneVerified: member.isPhoneVerified
            }
        }, { status: 201 })
    } catch (error) {
        console.error('Error registering member:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
