// Server-side admin auth utilities
// Cookie-based authentication for Firebase admin system

import { cookies } from 'next/headers'
import { db } from './db'
import { Role } from '@prisma/client'

export interface AdminSession {
  user: {
    id: string
    name: string
    email: string
    role: Role
  }
}

/**
 * Get admin session from cookie (for use in Server Components)
 * Replaces the old NextAuth `auth()` function
 */
export async function getAdminSession(): Promise<AdminSession | null> {
  const cookieStore = await cookies()
  const adminSessionCookie = cookieStore.get('admin_session')

  if (!adminSessionCookie?.value) {
    return null
  }

  try {
    // Decode base64 cookie value
    const decoded = atob(adminSessionCookie.value)
    const { userId } = JSON.parse(decoded)

    // Look up user in database to get full details
    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true
      }
    })

    if (!user) return null

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    }
  } catch (error) {
    console.error('Error reading admin session:', error)
    return null
  }
}

/**
 * Alias for getAdminSession for backward compatibility
 * Use this in place of the old `auth()` function
 */
export async function auth(): Promise<AdminSession | null> {
  return getAdminSession()
}

/**
 * Helper to get admin from cookie in API routes
 * Reads cookie value directly (not using next/headers)
 */
export function getAdminFromCookieValue(cookieValue: string | undefined): { userId: string; role: string } | null {
  if (!cookieValue) return null

  try {
    const decoded = atob(cookieValue)
    return JSON.parse(decoded)
  } catch {
    return null
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

// Session utilities for backward compatibility
// Used by API routes that need to check authentication and roles
export const sessionUtils = {
  async getCurrentUser() {
    const session = await getAdminSession()

    if (!session?.user) {
      return null
    }

    return session.user
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