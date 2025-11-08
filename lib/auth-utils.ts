import bcrypt from 'bcryptjs'
import { auth } from './auth'
import { db } from './db'

// Password utilities
export const passwordUtils = {
  async hash(password: string): Promise<string> {
    return await bcrypt.hash(password, 12)
  },

  async verify(password: string, hashedPassword: string): Promise<boolean> {
    return await bcrypt.compare(password, hashedPassword)
  },

  validate(password: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = []
    
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long')
    }
    
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter')
    }
    
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter')
    }
    
    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number')
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }
}

// Session utilities
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
        isActive: true
      }
    })

    return user
  },

  async requireAuth() {
    const user = await this.getCurrentUser()
    
    if (!user) {
      throw new Error('Authentication required')
    }

    return user
  },

  async requireRole(allowedRoles: string[]) {
    const user = await this.requireAuth()
    
    if (!allowedRoles.includes(user.role)) {
      throw new Error('Insufficient permissions')
    }

    return user
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

// User management utilities
export const userUtils = {
  async createUser(data: {
    email: string
    password: string
    name: string
    role: 'SUPER_ADMIN' | 'STAFF' | 'VIEWER'
    phone?: string
  }) {
    const hashedPassword = await passwordUtils.hash(data.password)
    
    return await db.user.create({
      data: {
        ...data,
        password: hashedPassword
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
  },

  async updatePassword(userId: string, newPassword: string) {
    const hashedPassword = await passwordUtils.hash(newPassword)
    
    return await db.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
      select: {
        id: true,
        email: true,
        name: true
      }
    })
  },

  async deactivateUser(userId: string) {
    return await db.user.update({
      where: { id: userId },
      data: { isActive: false }
    })
  }
}