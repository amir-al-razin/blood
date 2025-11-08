import { db } from './db'
import { BloodType, UrgencyLevel, RequestStatus, MatchStatus } from '@prisma/client'

// Donor utilities
export const donorUtils = {
  async findEligibleDonors(bloodType: BloodType, area?: string) {
    const eligibilityDate = new Date()
    eligibilityDate.setDate(eligibilityDate.getDate() - 90) // 90 days for males, 120 for females

    return await db.donor.findMany({
      where: {
        bloodType,
        isAvailable: true,
        isVerified: true,
        ...(area && { area }),
        OR: [
          { lastDonation: null },
          { lastDonation: { lt: eligibilityDate } }
        ]
      },
      orderBy: [
        { reliabilityScore: 'desc' },
        { donationCount: 'desc' },
        { createdAt: 'asc' }
      ]
    })
  },

  async updateDonationHistory(donorId: string) {
    return await db.donor.update({
      where: { id: donorId },
      data: {
        lastDonation: new Date(),
        donationCount: { increment: 1 },
        reliabilityScore: { increment: 0.1 }
      }
    })
  },

  async calculateEligibilityDate(donor: { gender: string, lastDonation: Date | null }) {
    if (!donor.lastDonation) return new Date()
    
    const eligibilityGap = donor.gender === 'MALE' ? 90 : 120
    const eligibilityDate = new Date(donor.lastDonation)
    eligibilityDate.setDate(eligibilityDate.getDate() + eligibilityGap)
    
    return eligibilityDate
  }
}

// Request utilities
export const requestUtils = {
  async createRequest(data: {
    requesterName: string
    requesterPhone: string
    requesterEmail?: string
    bloodType: BloodType
    location: string
    hospital: string
    urgencyLevel: UrgencyLevel
    unitsRequired: number
    notes?: string
    prescriptionUrl?: string
  }) {
    return await db.request.create({
      data: {
        ...data,
        referenceId: `REQ-${Date.now()}-${Math.random().toString(36).substring(2, 11).toUpperCase()}`
      }
    })
  },

  async updateStatus(requestId: string, status: RequestStatus) {
    const updateData: any = { status }
    
    if (status === 'COMPLETED') {
      updateData.completedAt = new Date()
    } else if (status === 'CANCELLED') {
      updateData.cancelledAt = new Date()
    }

    return await db.request.update({
      where: { id: requestId },
      data: updateData
    })
  }
}

// Match utilities
export const matchUtils = {
  async createMatch(donorId: string, requestId: string, createdBy: string) {
    return await db.match.create({
      data: {
        donorId,
        requestId,
        createdBy,
        status: 'PENDING'
      },
      include: {
        donor: true,
        request: true
      }
    })
  },

  async updateMatchStatus(matchId: string, status: MatchStatus, notes?: string) {
    const updateData: any = { status }
    
    if (notes) updateData.notes = notes
    
    switch (status) {
      case 'CONTACTED':
        updateData.contactedAt = new Date()
        break
      case 'ACCEPTED':
        updateData.acceptedAt = new Date()
        break
      case 'REJECTED':
        updateData.rejectedAt = new Date()
        break
      case 'COMPLETED':
        updateData.completedAt = new Date()
        break
    }

    return await db.match.update({
      where: { id: matchId },
      data: updateData,
      include: {
        donor: true,
        request: true
      }
    })
  }
}

// Audit logging utility
export const auditUtils = {
  async logAction(
    userId: string,
    action: string,
    entity: string,
    entityId: string,
    details?: any,
    ipAddress?: string
  ) {
    return await db.auditLog.create({
      data: {
        userId,
        action,
        entity,
        entityId,
        details,
        ipAddress
      }
    })
  }
}

// Database health check
export const healthCheck = {
  async checkConnection() {
    try {
      await db.$queryRaw`SELECT 1`
      return { status: 'healthy', timestamp: new Date() }
    } catch (error) {
      return { 
        status: 'unhealthy', 
        error: error instanceof Error ? error.message : 'Unknown error', 
        timestamp: new Date() 
      }
    }
  }
}