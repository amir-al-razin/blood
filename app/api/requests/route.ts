import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { requestUtils } from '@/lib/db-utils'

const createRequestSchema = z.object({
  requesterName: z.string().min(2),
  requesterPhone: z.string().regex(/^(\+880|880|0)?1[3-9]\d{8}$/),
  requesterEmail: z.string().email().optional().or(z.literal('')),
  bloodType: z.enum(['A_POSITIVE', 'A_NEGATIVE', 'B_POSITIVE', 'B_NEGATIVE', 'AB_POSITIVE', 'AB_NEGATIVE', 'O_POSITIVE', 'O_NEGATIVE']),
  location: z.string().min(1),
  hospital: z.string().min(2),
  urgencyLevel: z.enum(['CRITICAL', 'URGENT', 'NORMAL']),
  unitsRequired: z.string().transform(Number).pipe(z.number().min(1).max(10)),
  notes: z.string().optional()
})

export async function POST(request: NextRequest) {
  try {
    // Handle build-time or missing database gracefully
    if (!process.env.DATABASE_URL) {
      return NextResponse.json(
        { error: 'Database not available' },
        { status: 503 }
      )
    }

    // Check database connection first
    await db.$connect()
    
    const contentType = request.headers.get('content-type')
    let data: any
    let prescriptionFile: File | null = null

    if (contentType?.includes('multipart/form-data')) {
      // Handle FormData (with file upload)
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
        notes: formData.get('notes') as string
      }
      
      prescriptionFile = formData.get('prescription') as File | null
    } else {
      // Handle JSON data
      data = await request.json()
    }

    // Validate the data
    const validatedData = createRequestSchema.parse(data)

    // Handle file upload (prescription)
    let prescriptionUrl: string | undefined

    if (prescriptionFile && prescriptionFile.size > 0) {
      // In a real implementation, you would upload to Cloudinary or similar service
      // For now, we'll just store the filename
      prescriptionUrl = `uploads/prescriptions/${Date.now()}-${prescriptionFile.name}`
      
      // TODO: Implement actual file upload to Cloudinary
      console.log('File to upload:', prescriptionFile.name, prescriptionFile.size)
    }

    // Create the request in database
    const newRequest = await requestUtils.createRequest({
      ...validatedData,
      requesterEmail: validatedData.requesterEmail || undefined,
      notes: validatedData.notes || undefined,
      prescriptionUrl
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
      console.error('Validation errors:', error.errors)
      return NextResponse.json(
        { 
          error: 'Validation failed', 
          details: error.errors,
          message: 'Please check your form data and try again'
        },
        { status: 400 }
      )
    }

    // Database connection errors
    if (error instanceof Error && error.message.includes('connect')) {
      console.error('Database connection error:', error.message)
      return NextResponse.json(
        { error: 'Database connection failed', message: 'Please try again later' },
        { status: 503 }
      )
    }

    // Generic error
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to submit blood request',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    )
  } finally {
    try {
      await db.$disconnect()
    } catch (disconnectError) {
      console.error('Error disconnecting from database:', disconnectError)
    }
  }
}

export async function GET(request: NextRequest) {
  try {
    // Handle build-time or missing database gracefully
    if (!process.env.DATABASE_URL) {
      return NextResponse.json({
        requests: [],
        pagination: {
          page: 1,
          limit: 10,
          total: 0,
          pages: 0
        }
      })
    }

    // Check database connection first
    await db.$connect()
    
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const status = searchParams.get('status')
    const bloodType = searchParams.get('bloodType')
    const location = searchParams.get('location')
    const urgency = searchParams.get('urgency')

    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {}
    if (status) where.status = status
    if (bloodType) where.bloodType = bloodType
    if (location) where.location = location
    if (urgency) where.urgencyLevel = urgency

    // Get requests with pagination
    const [requests, total] = await Promise.all([
      db.request.findMany({
        where,
        skip,
        take: limit,
        orderBy: [
          { urgencyLevel: 'asc' }, // Critical first
          { createdAt: 'desc' }
        ],
        include: {
          matches: {
            include: {
              donor: {
                select: {
                  id: true,
                  name: true,
                  bloodType: true,
                  area: true,
                  isVerified: true
                }
              }
            }
          }
        }
      }),
      db.request.count({ where })
    ])

    return NextResponse.json({
      requests,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })

  } catch (error) {
    console.error('Error fetching requests:', error)
    return NextResponse.json(
      { error: 'Failed to fetch requests' },
      { status: 500 }
    )
  } finally {
    await db.$disconnect()
  }
}