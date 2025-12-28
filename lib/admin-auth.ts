// Admin Authentication Utilities (Firebase-based)
// Handles admin login, token verification, and role checking

import { verifyIdToken } from './firebase-admin'
import { db } from './db'
import { Role } from '@prisma/client'

export interface AdminUser {
    id: string
    email: string
    name: string
    role: Role
    firebaseUid: string
}

export interface AdminAuthResult {
    success: boolean
    user?: AdminUser
    error?: string
}

/**
 * Verify Firebase token and check if user is an admin
 * Returns admin user data if valid, null otherwise
 */
export async function verifyAdminToken(token: string): Promise<AdminAuthResult> {
    try {
        // Verify Firebase token
        const firebaseResult = await verifyIdToken(token)

        if (!firebaseResult.success || !firebaseResult.uid) {
            return { success: false, error: 'Invalid token' }
        }

        // Ensure database connection
        await db.$connect()

        // Look up admin user by Firebase UID
        const user = await db.user.findFirst({
            where: {
                firebaseUid: firebaseResult.uid,
                isActive: true
            }
        })

        if (!user) {
            // Try to find by email as fallback (for migration)
            const userByEmail = await db.user.findFirst({
                where: {
                    email: firebaseResult.email,
                    isActive: true
                }
            })

            if (userByEmail) {
                // Link Firebase UID to existing admin account
                await db.user.update({
                    where: { id: userByEmail.id },
                    data: { firebaseUid: firebaseResult.uid }
                })

                return {
                    success: true,
                    user: {
                        id: userByEmail.id,
                        email: userByEmail.email,
                        name: userByEmail.name,
                        role: userByEmail.role,
                        firebaseUid: firebaseResult.uid
                    }
                }
            }

            return { success: false, error: 'User is not an admin' }
        }

        return {
            success: true,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                firebaseUid: user.firebaseUid!
            }
        }
    } catch (error: any) {
        console.error('Admin token verification error:', error)
        return { success: false, error: error.message || 'Authentication failed' }
    }
}

/**
 * Check if user has required admin role
 */
export function hasAdminRole(user: AdminUser, requiredRoles?: Role[]): boolean {
    if (!requiredRoles || requiredRoles.length === 0) {
        // Any admin role is sufficient
        return ['SUPER_ADMIN', 'STAFF', 'VIEWER'].includes(user.role)
    }
    return requiredRoles.includes(user.role)
}

/**
 * Extract Bearer token from Authorization header
 */
export function extractBearerToken(authHeader: string | null): string | null {
    if (!authHeader?.startsWith('Bearer ')) {
        return null
    }
    return authHeader.substring(7)
}

/**
 * Middleware helper - verify admin from request headers
 */
export async function getAdminFromRequest(request: Request): Promise<AdminAuthResult> {
    const authHeader = request.headers.get('authorization')
    const token = extractBearerToken(authHeader)

    if (!token) {
        return { success: false, error: 'No authorization token provided' }
    }

    return verifyAdminToken(token)
}

/**
 * Get admin user by Firebase UID
 */
export async function getAdminByFirebaseUid(uid: string): Promise<AdminUser | null> {
    try {
        const user = await db.user.findFirst({
            where: {
                firebaseUid: uid,
                isActive: true
            }
        })

        if (!user) return null

        return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            firebaseUid: user.firebaseUid!
        }
    } catch (error) {
        console.error('Error getting admin by UID:', error)
        return null
    }
}
