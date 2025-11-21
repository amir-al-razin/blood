import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { dataDeletionUtils, auditUtils } from '@/lib/privacy-utils'
import { sessionUtils } from '@/lib/auth-utils'

const deletionRequestSchema = z.object({
  donorId: z.string(),
  reason: z.string().min(10, 'Reason must be at least 10 characters')
})

const executeDeletionSchema = z.object({
  donorId: z.string(),
  reason: z.string().min(10, 'Reason must be at least 10 characters'),
  confirmDeletion: z.boolean().refine(val => val === true, 'Deletion must be confirmed')
})

export async function GET(request: NextRequest) {
  try {
    const user = await sessionUtils.requireRole(['SUPER_ADMIN'])

    const deletionRequests = await dataDeletionUtils.getDeletionRequests()

    return NextResponse.json({
      deletionRequests,
      total: deletionRequests.length
    })

  } catch (error) {
    console.error('Error fetching deletion requests:', error)

    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to fetch deletion requests' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await sessionUtils.requireRole(['SUPER_ADMIN'])
    const body = await request.json()

    // Validate the data
    const validatedData = deletionRequestSchema.parse(body)

    await dataDeletionUtils.requestDonorDeletion(
      validatedData.donorId,
      validatedData.reason
    )

    return NextResponse.json({
      success: true,
      message: 'Data deletion request created successfully'
    })

  } catch (error) {
    console.error('Error creating deletion request:', error)

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

    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to create deletion request' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await sessionUtils.requireRole(['SUPER_ADMIN'])
    const body = await request.json()

    // Validate the data
    const validatedData = executeDeletionSchema.parse(body)

    await dataDeletionUtils.executeDonorDeletion(
      validatedData.donorId,
      validatedData.reason
    )

    return NextResponse.json({
      success: true,
      message: 'Data deletion executed successfully'
    })

  } catch (error) {
    console.error('Error executing deletion:', error)

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

    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to execute deletion' },
      { status: 500 }
    )
  }
}