// Firebase Admin SDK Configuration (Server-side only)
import { initializeApp, getApps, cert, App } from 'firebase-admin/app'
import { getAuth, Auth } from 'firebase-admin/auth'

let app: App
let adminAuth: Auth

function initializeFirebaseAdmin() {
    if (getApps().length === 0) {
        // Check if we have the required environment variables
        const projectId = process.env.FIREBASE_PROJECT_ID
        const clientEmail = process.env.FIREBASE_CLIENT_EMAIL
        const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')

        if (!projectId || !clientEmail || !privateKey) {
            console.warn('Firebase Admin SDK: Missing environment variables. Some features may not work.')
            // Initialize without credentials for development
            app = initializeApp({
                projectId: projectId || 'demo-project',
            })
        } else {
            app = initializeApp({
                credential: cert({
                    projectId,
                    clientEmail,
                    privateKey,
                }),
            })
        }
    } else {
        app = getApps()[0]
    }

    adminAuth = getAuth(app)
    return { app, adminAuth }
}

// Lazy initialization
const getAdminAuth = (): Auth => {
    if (!adminAuth) {
        initializeFirebaseAdmin()
    }
    return adminAuth
}

const getAdminApp = (): App => {
    if (!app) {
        initializeFirebaseAdmin()
    }
    return app
}

export { getAdminAuth, getAdminApp }

// Verify Firebase ID token (used in API routes)
export async function verifyIdToken(token: string) {
    try {
        const auth = getAdminAuth()
        const decodedToken = await auth.verifyIdToken(token)
        return { success: true, uid: decodedToken.uid, email: decodedToken.email }
    } catch (error: any) {
        console.error('Error verifying Firebase token:', {
            code: error?.code,
            message: error?.message,
            tokenPreview: token ? `${token.substring(0, 50)}...` : 'no token'
        })
        return { success: false, error: error?.message || 'Invalid token' }
    }
}

// Get user by UID
export async function getUserByUid(uid: string) {
    try {
        const auth = getAdminAuth()
        const user = await auth.getUser(uid)
        return user
    } catch (error) {
        console.error('Error getting user by UID:', error)
        return null
    }
}

// Create custom token for user
export async function createCustomToken(uid: string, claims?: object) {
    try {
        const auth = getAdminAuth()
        const token = await auth.createCustomToken(uid, claims)
        return token
    } catch (error) {
        console.error('Error creating custom token:', error)
        return null
    }
}
