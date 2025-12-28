// Debug endpoint to test Firebase Admin SDK
import { NextResponse } from 'next/server'
import { getAdminAuth } from '@/lib/firebase-admin'

export async function GET() {
    try {
        // Test Firebase Admin initialization
        const auth = getAdminAuth()

        // Check if we have valid credentials
        const projectId = process.env.FIREBASE_PROJECT_ID
        const clientEmail = process.env.FIREBASE_CLIENT_EMAIL
        const privateKeyRaw = process.env.FIREBASE_PRIVATE_KEY
        const privateKeyProcessed = privateKeyRaw?.replace(/\\n/g, '\n')

        // Log some debug info (redacted for security)
        const debugInfo = {
            hasProjectId: !!projectId,
            projectId: projectId,
            hasClientEmail: !!clientEmail,
            clientEmailPrefix: clientEmail?.split('@')[0]?.slice(0, 10) + '...',
            hasPrivateKey: !!privateKeyRaw,
            privateKeyStart: privateKeyProcessed?.slice(0, 50),
            privateKeyEnd: privateKeyProcessed?.slice(-50),
            privateKeyLength: privateKeyRaw?.length,
            authInitialized: !!auth,
            nodeEnv: process.env.NODE_ENV
        }

        return NextResponse.json({
            status: 'Firebase Admin SDK test',
            debug: debugInfo
        })
    } catch (error: any) {
        return NextResponse.json({
            error: 'Firebase Admin initialization failed',
            message: error.message,
            code: error.code
        }, { status: 500 })
    }
}
