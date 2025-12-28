import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { verifyIdToken } from '@/lib/firebase-admin'

const bloodRequestSchema = z.object({
    requesterName: z.string().min(2),
    requesterPhone: z.string().regex(/^(\+880|880|0)?1[3-9]\d{8}$/),
    requesterEmail: z.string().email().optional().or(z.literal('')),
    bloodType: z.enum(['A_POSITIVE', 'A_NEGATIVE', 'B_POSITIVE', 'B_NEGATIVE', 'AB_POSITIVE', 'AB_NEGATIVE', 'O_POSITIVE', 'O_NEGATIVE']),
    location: z.string().min(1),
    hospital: z.string().min(2),
    urgencyLevel: z.enum(['CRITICAL', 'URGENT', 'NORMAL']),
    unitsRequired: z.string().transform(Number).pipe(z.number().min(1).max(10)),
    notes: z.string().optional(),
    memberId: z.string().min(1)
})

export async function POST(request: NextRequest) {
    try {
        // Verify authentication
        const authHeader = request.headers.get('authorization')
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json(
                { error: 'Authentication required' },
                { status: 401 }
            )
        }

        const token = authHeader.substring(7)
        const result = await verifyIdToken(token)

        if (!result.success || !result.uid) {
            return NextResponse.json(
                { error: 'Invalid or expired token' },
                { status: 401 }
            )
        }

        // Get member from Firebase UID
        const member = await db.member.findUnique({
            where: { firebaseUid: result.uid }
        })

        if (!member) {
            return NextResponse.json(
                { error: 'Member not found. Please complete registration first.' },
                { status: 404 }
            )
        }

        // Handle FormData
        const contentType = request.headers.get('content-type')
        let data: any
        let prescriptionFile: File | null = null

        if (contentType?.includes('multipart/form-data')) {
            const formData = await request.formData()

            data = {
                requesterName: formData.get('requesterName') as string,
                requesterPhone: formData.get('requesterPhone') as string,
                requesterEmail: formData.get('requesterEmail') as string,
                bloodType: formData.get('bloodType') as string,
                location: formData.get('location') as string,
                hospital: formData.get('hospital') as string,
                urgencyLevel: formData.get('urgencyLevel') as string,
                unitsRequired: formData.get('unitsRequired') as string,
                notes: formData.get('notes') as string,
                memberId: member.id // Use verified member ID
            }

            prescriptionFile = formData.get('prescription') as File | null
        } else {
            data = await request.json()
            data.memberId = member.id // Use verified member ID
        }

        // Validate the data
        const validatedData = bloodRequestSchema.parse(data)

        // Verify the memberId matches the authenticated user
        if (validatedData.memberId !== member.id) {
            return NextResponse.json(
                { error: 'Member ID mismatch' },
                { status: 403 }
            )
        }

        // Handle file upload
        let prescriptionUrl: string | undefined
        if (prescriptionFile && prescriptionFile.size > 0) {
            prescriptionUrl = `uploads/prescriptions/${Date.now()}-${prescriptionFile.name}`
            console.log('File to upload:', prescriptionFile.name, prescriptionFile.size)
        }

        // Create the request in database with member link
        const newRequest = await db.request.create({
            data: {
                requesterName: validatedData.requesterName,
                requesterPhone: validatedData.requesterPhone,
                requesterEmail: validatedData.requesterEmail || null,
                bloodType: validatedData.bloodType,
                location: validatedData.location,
                hospital: validatedData.hospital,
                urgencyLevel: validatedData.urgencyLevel,
                unitsRequired: validatedData.unitsRequired,
                notes: validatedData.notes || null,
                prescriptionUrl,
                memberId: member.id, // Link to authenticated member
                status: 'PENDING'
            }
        })

        // TODO: Send notification to admin team about new request
        // TODO: Start automatic donor matching process

        return NextResponse.json({
            success: true,
            referenceId: newRequest.referenceId,
            message: 'Blood request submitted successfully'
        })

    } catch (error) {
        console.error('Error creating blood request:', error)

        if (error instanceof z.ZodError) {
            return NextResponse.json(
                {
                    error: 'Validation failed',
                    details: error.issues.map(issue => ({
                        path: issue.path.join('.'),
                        message: issue.message
                    }))
                },
                { status: 400 }
            )
        }

        return NextResponse.json(
            {
                error: 'Failed to submit blood request',
                message: error instanceof Error ? error.message : 'Unknown error occurred'
            },
            { status: 500 }
        )
    }
}

// GET endpoint to fetch the authenticated member's requests
export async function GET(request: NextRequest) {
    try {
        // Verify authentication
        const authHeader = request.headers.get('authorization')
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json(
                { error: 'Authentication required' },
                { status: 401 }
            )
        }

        const token = authHeader.substring(7)
        const result = await verifyIdToken(token)

        if (!result.success || !result.uid) {
            return NextResponse.json(
                { error: 'Invalid or expired token' },
                { status: 401 }
            )
        }

        // Get member from Firebase UID
        const member = await db.member.findUnique({
            where: { firebaseUid: result.uid }
        })

        if (!member) {
            return NextResponse.json(
                { error: 'Member not found' },
                { status: 404 }
            )
        }

        // Fetch member's requests
        const requests = await db.request.findMany({
            where: { memberId: member.id },
            orderBy: { createdAt: 'desc' },
            include: {
                matches: {
                    select: {
                        id: true,
                        status: true,
                        donor: {
                            select: {
                                name: true,
                                bloodType: true,
                                area: true
                            }
                        }
                    }
                }
            }
        })

        return NextResponse.json({
            requests,
            total: requests.length
        })

    } catch (error) {
        console.error('Error fetching member requests:', error)
        return NextResponse.json(
            { error: 'Failed to fetch requests' },
            { status: 500 }
        )
    }
}
