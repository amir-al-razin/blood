import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { matchUtils, auditUtils } from '@/lib/db-utils'
import { auth } from '@/lib/auth'

const updateMatchSchema = z.object({
  status: z.enum(['PENDING', 'CONTACTED', 'ACCEPTED', 'REJECTED', 'COMPLETED', 'CANCELLED']),
  notes: z.string().optional()
})

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Handle build-time or missing database gracefully
    if (!process.env.DATABASE_URL || process.env.NEXT_PHASE === 'phase-production-build') {
      return NextResponse.json(
        { error: 'Database not available' },
        { status: 503 }
      )
    }

    const match = await db.match.findUnique({
      where: { id: params.id },
      include: {
        donor: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
            bloodType: true,
            area: true,
            address: true,
            isVerified: true,
            reliabilityScore: true,
            donationCount: true,
            lastDonation: true
          }
        },
        request: {
          select: {
            id: true,
            referenceId: true,
            requesterName: true,
            requesterPhone: true,
            requesterEmail: true,
            bloodType: true,
            urgencyLevel: true,
            unitsRequired: true,
            hospital: true,
            location: true,
            notes: true,
            prescriptionUrl: true,
            createdAt: true
          }
        },
        createdByUser: {
          select: {
            name: true,
            email: true
          }
        }
      }
    })

    if (!match) {
      return NextResponse.json(
        { error: 'Match not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ match })

  } catch (error) {
    console.error('Error fetching match:', error)
    return NextResponse.json(
      { error: 'Failed to fetch match' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Handle build-time or missing database gracefully
    if (!process.env.DATABASE_URL || process.env.NEXT_PHASE === 'phase-production-build') {
      return NextResponse.json(
        { error: 'Database not available' },
        { status: 503 }
      )
    }

    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validatedData = updateMatchSchema.parse(body)

    // Check if match exists
    const existingMatch = await db.match.findUnique({
      where: { id: params.id },
      include: {
        donor: { select: { name: true } },
        request: { select: { referenceId: true } }
      }
    })

    if (!existingMatch) {
      return NextResponse.json(
        { error: 'Match not found' },
        { status: 404 }
      )
    }

    // Validate status transition
    const validTransitions: Record<string, string[]> = {
      'PENDING': ['CONTACTED', 'CANCELLED'],
      'CONTACTED': ['ACCEPTED', 'REJECTED', 'CANCELLED'],
      'ACCEPTED': ['COMPLETED', 'CANCELLED'],
      'REJECTED': [],
      'COMPLETED': [],
      'CANCELLED': []
    }

    if (!validTransitions[existingMatch.status]?.includes(validatedData.status)) {
      return NextResponse.json(
        { 
          error: `Cannot change status from ${existingMatch.status} to ${validatedData.status}` 
        },
        { status: 400 }
      )
    }

    // Update the match
    const updatedMatch = await matchUtils.updateMatchStatus(
      params.id,
      validatedData.status as any,
      validatedData.notes
    )

    // Handle completion logic
    if (validatedData.status === 'COMPLETED') {
      // Update donor's donation history
      await db.donor.update({
        where: { id: updatedMatch.donorId },
        data: {
          lastDonation: new Date(),
          donationCount: { increment: 1 },
          reliabilityScore: { increment: 0.1 }
        }
      })

      // Check if request is fully satisfied
      const requestMatches = await db.match.findMany({
        where: {
          requestId: updatedMatch.requestId,
          status: { in: ['COMPLETED', 'ACCEPTED'] }
        }
      })

      const completedUnits = requestMatches.filter(m => m.status === 'COMPLETED').length
      const totalRequiredUnits = updatedMatch.request.unitsRequired

      if (completedUnits >= totalRequiredUnits) {
        await db.request.update({
          where: { id: updatedMatch.requestId },
          data: { 
            status: 'COMPLETED',
            completedAt: new Date()
          }
        })
      }
    }

    // Log the action
    await auditUtils.logAction(
      session.user.id,
      'UPDATE_MATCH_STATUS',
      'match',
      params.id,
      {
        oldStatus: existingMatch.status,
        newStatus: validatedData.status,
        donorName: existingMatch.donor.name,
        requestRef: existingMatch.request.referenceId,
        notes: validatedData.notes
      }
    )

    return NextResponse.json({
      success: true,
      match: updatedMatch,
      message: `Match status updated to ${validatedData.status}`
    })

  } catch (error) {
    console.error('Error updating match:', error)

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
      { error: 'Failed to update match' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Handle build-time or missing database gracefully
    if (!process.env.DATABASE_URL || process.env.NEXT_PHASE === 'phase-production-build') {
      return NextResponse.json(
        { error: 'Database not available' },
        { status: 503 }
      )
    }

    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Check if match exists and can be deleted
    const existingMatch = await db.match.findUnique({
      where: { id: params.id },
      include: {
        donor: { select: { name: true } },
        request: { select: { referenceId: true } }
      }
    })

    if (!existingMatch) {
      return NextResponse.json(
        { error: 'Match not found' },
        { status: 404 }
      )
    }

    // Only allow deletion of PENDING or CANCELLED matches
    if (!['PENDING', 'CANCELLED'].includes(existingMatch.status)) {
      return NextResponse.json(
        { error: 'Cannot delete match in current status' },
        { status: 400 }
      )
    }

    // Delete the match
    await db.match.delete({
      where: { id: params.id }
    })

    // Log the action
    await auditUtils.logAction(
      session.user.id,
      'DELETE_MATCH',
      'match',
      params.id,
      {
        donorName: existingMatch.donor.name,
        requestRef: existingMatch.request.referenceId,
        status: existingMatch.status
      }
    )

    return NextResponse.json({
      success: true,
      message: 'Match deleted successfully'
    })

  } catch (error) {
    console.error('Error deleting match:', error)
    return NextResponse.json(
      { error: 'Failed to delete match' },
      { status: 500 }
    )
  }
}