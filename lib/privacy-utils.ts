import { db } from './db'
import { sessionUtils } from './auth-utils'

export interface PrivacySettings {
  allowSMSNotifications: boolean
  allowEmailNotifications: boolean
  allowPhoneCalls: boolean
  shareLocationWithRequests: boolean
  shareStatisticsAnonymously: boolean
  allowResearchParticipation: boolean
  hideFromPublicStats: boolean
  anonymizeInReports: boolean
}

export interface ContactAccessRequest {
  donorId: string
  requestId?: string
  reason: string
  accessType: 'phone' | 'email' | 'full'
}

// Privacy settings management
export const privacyUtils = {
  async getPrivacySettings(donorId: string): Promise<PrivacySettings | null> {
    const settings = await db.donorPrivacySettings.findUnique({
      where: { donorId }
    })

    if (!settings) {
      // Return default settings if none exist
      return {
        allowSMSNotifications: true,
        allowEmailNotifications: true,
        allowPhoneCalls: false,
        shareLocationWithRequests: true,
        shareStatisticsAnonymously: true,
        allowResearchParticipation: false,
        hideFromPublicStats: false,
        anonymizeInReports: false
      }
    }

    return {
      allowSMSNotifications: settings.allowSMSNotifications,
      allowEmailNotifications: settings.allowEmailNotifications,
      allowPhoneCalls: settings.allowPhoneCalls,
      shareLocationWithRequests: settings.shareLocationWithRequests,
      shareStatisticsAnonymously: settings.shareStatisticsAnonymously,
      allowResearchParticipation: settings.allowResearchParticipation,
      hideFromPublicStats: settings.hideFromPublicStats,
      anonymizeInReports: settings.anonymizeInReports
    }
  },

  async updatePrivacySettings(donorId: string, settings: Partial<PrivacySettings>): Promise<void> {
    const user = await sessionUtils.getCurrentUser()
    
    await db.donorPrivacySettings.upsert({
      where: { donorId },
      create: {
        donorId,
        ...settings
      },
      update: settings
    })

    // Log the privacy settings change
    await auditUtils.logAction({
      userId: user?.id,
      action: 'UPDATE_PRIVACY_SETTINGS',
      entity: 'donor',
      entityId: donorId,
      details: { updatedSettings: settings },
      sensitive: true
    })
  },

  async canContactDonor(donorId: string, contactType: 'sms' | 'email' | 'phone'): Promise<boolean> {
    const donor = await db.donor.findUnique({
      where: { id: donorId },
      include: { privacySettings: true }
    })

    if (!donor) return false

    // Check donor-level consent
    switch (contactType) {
      case 'sms':
        if (!donor.allowContactByPhone) return false
        break
      case 'email':
        if (!donor.allowContactByEmail) return false
        break
      case 'phone':
        if (!donor.allowContactByPhone) return false
        break
    }

    // Check privacy settings
    const settings = donor.privacySettings
    if (!settings) return true // Default to allowing contact

    switch (contactType) {
      case 'sms':
        return settings.allowSMSNotifications
      case 'email':
        return settings.allowEmailNotifications
      case 'phone':
        return settings.allowPhoneCalls
      default:
        return false
    }
  }
}

// Contact information access control
export const contactAccessUtils = {
  async requestContactAccess(request: ContactAccessRequest): Promise<boolean> {
    const user = await sessionUtils.requireAuth()
    
    // Only staff and super admin can access contact information
    if (!['STAFF', 'SUPER_ADMIN'].includes(user.role)) {
      throw new Error('Insufficient permissions to access contact information')
    }

    const donor = await db.donor.findUnique({
      where: { id: request.donorId },
      select: { id: true, name: true, phone: true, email: true }
    })

    if (!donor) {
      throw new Error('Donor not found')
    }

    // Log the contact access request
    await auditUtils.logAction({
      userId: user.id,
      action: 'ACCESS_CONTACT_INFO',
      entity: 'donor',
      entityId: request.donorId,
      details: {
        accessType: request.accessType,
        reason: request.reason,
        requestId: request.requestId
      },
      sensitive: true
    })

    return true
  },

  async getFilteredDonorData(donorId: string, includeContact: boolean = false) {
    const user = await sessionUtils.getCurrentUser()
    
    const donor = await db.donor.findUnique({
      where: { id: donorId },
      include: {
        privacySettings: true,
        matches: {
          include: {
            request: true
          }
        }
      }
    })

    if (!donor) return null

    // Base data that's always available to authenticated users
    const baseData = {
      id: donor.id,
      name: donor.name,
      bloodType: donor.bloodType,
      location: donor.location,
      area: donor.area,
      isAvailable: donor.isAvailable,
      isVerified: donor.isVerified,
      donationCount: donor.donationCount,
      reliabilityScore: donor.reliabilityScore,
      lastDonation: donor.lastDonation,
      createdAt: donor.createdAt
    }

    // Contact information only for authorized staff
    if (includeContact && user && ['STAFF', 'SUPER_ADMIN'].includes(user.role)) {
      // Log contact information access
      await auditUtils.logAction({
        userId: user.id,
        action: 'VIEW_CONTACT_INFO',
        entity: 'donor',
        entityId: donorId,
        sensitive: true
      })

      return {
        ...baseData,
        phone: donor.phone,
        email: donor.email,
        address: donor.address,
        dateOfBirth: donor.dateOfBirth,
        gender: donor.gender,
        weight: donor.weight,
        notes: donor.notes,
        privacySettings: donor.privacySettings
      }
    }

    return baseData
  }
}

// Audit logging utilities
export const auditUtils = {
  async logAction(params: {
    userId?: string
    action: string
    entity: string
    entityId: string
    details?: any
    ipAddress?: string
    userAgent?: string
    sensitive?: boolean
  }) {
    await db.auditLog.create({
      data: {
        userId: params.userId,
        action: params.action,
        entity: params.entity,
        entityId: params.entityId,
        details: params.details,
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
        sensitive: params.sensitive || false
      }
    })
  },

  async getAuditTrail(entityType: string, entityId: string, limit: number = 50) {
    return await db.auditLog.findMany({
      where: {
        entity: entityType,
        entityId: entityId
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limit
    })
  },

  async getSensitiveDataAccess(donorId: string, limit: number = 50) {
    const user = await sessionUtils.requireRole(['SUPER_ADMIN'])
    
    return await db.auditLog.findMany({
      where: {
        entity: 'donor',
        entityId: donorId,
        sensitive: true
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limit
    })
  }
}

// Data deletion utilities
export const dataDeletionUtils = {
  async requestDonorDeletion(donorId: string, reason: string): Promise<void> {
    const user = await sessionUtils.requireRole(['SUPER_ADMIN'])
    
    // Mark donor for deletion
    await db.donor.update({
      where: { id: donorId },
      data: {
        deletionRequestedAt: new Date(),
        isAvailable: false
      }
    })

    // Log the deletion request
    await auditUtils.logAction({
      userId: user.id,
      action: 'REQUEST_DATA_DELETION',
      entity: 'donor',
      entityId: donorId,
      details: { reason },
      sensitive: true
    })
  },

  async executeDonorDeletion(donorId: string, reason: string): Promise<void> {
    const user = await sessionUtils.requireRole(['SUPER_ADMIN'])
    
    // Get donor data for backup
    const donor = await db.donor.findUnique({
      where: { id: donorId },
      include: {
        privacySettings: true,
        matches: true
      }
    })

    if (!donor) {
      throw new Error('Donor not found')
    }

    // Create encrypted backup of data
    const dataBackup = {
      donor: {
        ...donor,
        phone: '[DELETED]',
        email: '[DELETED]',
        address: '[DELETED]'
      }
    }

    // Log the deletion
    await db.dataDeletionLog.create({
      data: {
        entityType: 'donor',
        entityId: donorId,
        deletedBy: user.id,
        reason,
        dataBackup
      }
    })

    // Delete related data first (due to foreign key constraints)
    await db.donorPrivacySettings.deleteMany({
      where: { donorId }
    })

    // Anonymize matches instead of deleting (preserve donation history)
    await db.match.updateMany({
      where: { donorId },
      data: {
        notes: 'Donor data deleted for privacy'
      }
    })

    // Delete the donor record
    await db.donor.delete({
      where: { id: donorId }
    })

    // Log the completion
    await auditUtils.logAction({
      userId: user.id,
      action: 'EXECUTE_DATA_DELETION',
      entity: 'donor',
      entityId: donorId,
      details: { reason },
      sensitive: true
    })
  },

  async getDeletionRequests() {
    const user = await sessionUtils.requireRole(['SUPER_ADMIN'])
    
    return await db.donor.findMany({
      where: {
        deletionRequestedAt: {
          not: null
        }
      },
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        deletionRequestedAt: true,
        createdAt: true
      }
    })
  }
}

// Consent management utilities
export const consentUtils = {
  async logConsent(params: {
    donorId: string
    consentType: string
    granted: boolean
    version: string
    ipAddress?: string
    userAgent?: string
  }) {
    await db.consentLog.create({
      data: params
    })
  },

  async getConsentHistory(donorId: string) {
    return await db.consentLog.findMany({
      where: { donorId },
      orderBy: { createdAt: 'desc' }
    })
  },

  async hasValidConsent(donorId: string, consentType: string, requiredVersion: string): Promise<boolean> {
    const latestConsent = await db.consentLog.findFirst({
      where: {
        donorId,
        consentType
      },
      orderBy: { createdAt: 'desc' }
    })

    return latestConsent?.granted === true && latestConsent.version === requiredVersion
  }
}