import bcrypt from 'bcryptjs'
import { auth } from './auth'
import { db } from './db'
import { PasswordSecurity } from './password-security'
import { securityLogger } from './security-logger'

// Enhanced password utilities with security features
export const passwordUtils = {
  async hash(password: string): Promise<string> {
    return await PasswordSecurity.hashPassword(password)
  },

  async verify(password: string, hashedPassword: string): Promise<boolean> {
    return await PasswordSecurity.verifyPassword(password, hashedPassword)
  },

  validate(password: string, userInfo?: { name?: string; email?: string; phone?: string }) {
    return PasswordSecurity.validatePassword(password, userInfo)
  },

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    return await PasswordSecurity.changePassword(userId, currentPassword, newPassword)
  },

  async isExpired(userId: string): Promise<boolean> {
    return await PasswordSecurity.isPasswordExpired(userId)
  },

  generateSecure(length: number = 16): string {
    return PasswordSecurity.generateSecurePassword(length)
  }
}

// Enhanced session utilities with security logging
export const sessionUtils = {
  async getCurrentUser() {
    const session = await auth()
    
    if (!session?.user?.id) {
      return null
    }

    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        phone: true,
        isActive: true,
        isLocked: true,
        lockedUntil: true,
        twoFactorEnabled: true,
        passwordChangedAt: true
      }
    })

    // Check if account is locked
    if (user && await PasswordSecurity.isAccountLocked(user.id)) {
      await securityLogger.logEvent({
        type: 'UNAUTHORIZED_ACCESS',
        severity: 'HIGH',
        description: 'Attempt to access with locked account',
        userId: user.id,
        metadata: { lockedUntil: user.lockedUntil }
      })
      return null
    }

    return user
  },

  async requireAuth() {
    const user = await this.getCurrentUser()
    
    if (!user) {
      throw new Error('Authentication required')
    }

    if (!user.isActive) {
      await securityLogger.logEvent({
        type: 'UNAUTHORIZED_ACCESS',
        severity: 'MEDIUM',
        description: 'Attempt to access with inactive account',
        userId: user.id
      })
      throw new Error('Account is inactive')
    }

    return user
  },

  async requireRole(allowedRoles: string[]) {
    const user = await this.requireAuth()
    
    if (!allowedRoles.includes(user.role)) {
      await securityLogger.logUnauthorizedAccess(
        `Role-based access denied. Required: ${allowedRoles.join(', ')}, User has: ${user.role}`,
        user.id
      )
      throw new Error('Insufficient permissions')
    }

    return user
  },

  async require2FA(userId: string) {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { twoFactorEnabled: true }
    })

    if (!user?.twoFactorEnabled) {
      throw new Error('Two-factor authentication required')
    }

    return true
  }
}

// Role checking utilities
export const roleUtils = {
  canManageUsers(role: string): boolean {
    return role === 'SUPER_ADMIN'
  },

  canManageDonors(role: string): boolean {
    return ['SUPER_ADMIN', 'STAFF'].includes(role)
  },

  canManageRequests(role: string): boolean {
    return ['SUPER_ADMIN', 'STAFF'].includes(role)
  },

  canViewAnalytics(role: string): boolean {
    return ['SUPER_ADMIN', 'STAFF', 'VIEWER'].includes(role)
  },

  canSendNotifications(role: string): boolean {
    return ['SUPER_ADMIN', 'STAFF'].includes(role)
  }
}

// Enhanced user management utilities with security features
export const userUtils = {
  async createUser(data: {
    email: string
    password: string
    name: string
    role: 'SUPER_ADMIN' | 'STAFF' | 'VIEWER'
    phone?: string
  }) {
    // Validate password strength
    const validation = passwordUtils.validate(data.password, {
      name: data.name,
      email: data.email,
      phone: data.phone
    })

    if (!validation.isValid) {
      throw new Error(`Password validation failed: ${validation.errors.join(', ')}`)
    }

    const hashedPassword = await passwordUtils.hash(data.password)
    
    const user = await db.user.create({
      data: {
        ...data,
        password: hashedPassword,
        passwordChangedAt: new Date()
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        phone: true,
        isActive: true,
        createdAt: true
      }
    })

    // Log user creation
    await securityLogger.logEvent({
      type: 'SUSPICIOUS_ACTIVITY',
      severity: 'MEDIUM',
      description: `New user created: ${data.email} with role ${data.role}`,
      metadata: { 
        newUserId: user.id,
        email: data.email,
        role: data.role
      }
    })

    return user
  },

  async updatePassword(userId: string, newPassword: string, adminId?: string) {
    // Get user info for validation
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { name: true, email: true, phone: true }
    })

    if (!user) {
      throw new Error('User not found')
    }

    // Validate new password
    const validation = passwordUtils.validate(newPassword, user)
    if (!validation.isValid) {
      throw new Error(`Password validation failed: ${validation.errors.join(', ')}`)
    }

    const hashedPassword = await passwordUtils.hash(newPassword)
    
    const updatedUser = await db.user.update({
      where: { id: userId },
      data: { 
        password: hashedPassword,
        passwordChangedAt: new Date(),
        // Reset lockout if password is changed by admin
        ...(adminId && { isLocked: false, lockedUntil: null })
      },
      select: {
        id: true,
        email: true,
        name: true
      }
    })

    // Log password change
    await securityLogger.logEvent({
      type: 'SUSPICIOUS_ACTIVITY',
      severity: 'MEDIUM',
      description: adminId ? 'Password reset by admin' : 'Password changed by user',
      userId: adminId || userId,
      metadata: { 
        targetUserId: userId,
        isAdminReset: !!adminId
      }
    })

    return updatedUser
  },

  async deactivateUser(userId: string, adminId: string) {
    const user = await db.user.update({
      where: { id: userId },
      data: { isActive: false }
    })

    // Log user deactivation
    await securityLogger.logEvent({
      type: 'SUSPICIOUS_ACTIVITY',
      severity: 'MEDIUM',
      description: 'User account deactivated',
      userId: adminId,
      metadata: { deactivatedUserId: userId }
    })

    return user
  },

  async setup2FA(userId: string) {
    return await PasswordSecurity.setupTwoFactor(userId, 'RedAid')
  },

  async verify2FA(userId: string, token: string) {
    return await PasswordSecurity.verifyAndEnable2FA(userId, token)
  },

  async disable2FA(userId: string, password: string) {
    return await PasswordSecurity.disable2FA(userId, password)
  },

  async unlockAccount(userId: string, adminId: string) {
    await PasswordSecurity.unlockAccount(userId, adminId)
  }
}