// Firebase Authentication Utilities (Client-side)
import {
    signInWithPopup,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    User,
    UserCredential,
    sendPasswordResetEmail,
    updateProfile,
} from 'firebase/auth'
import { auth, googleProvider } from './firebase'

export type AuthUser = User

// Sign in with Google
export async function signInWithGoogle(): Promise<{ success: boolean; user?: User; error?: string }> {
    try {
        const result: UserCredential = await signInWithPopup(auth, googleProvider)
        return { success: true, user: result.user }
    } catch (error: any) {
        console.error('Google sign-in error:', error)
        return { success: false, error: error.message || 'Failed to sign in with Google' }
    }
}

// Sign in with email and password
export async function signInWithEmail(
    email: string,
    password: string
): Promise<{ success: boolean; user?: User; error?: string }> {
    try {
        const result = await signInWithEmailAndPassword(auth, email, password)
        return { success: true, user: result.user }
    } catch (error: any) {
        console.error('Email sign-in error:', error)
        let errorMessage = 'Failed to sign in'
        if (error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found') {
            errorMessage = 'Invalid email or password'
        } else if (error.code === 'auth/too-many-requests') {
            errorMessage = 'Too many failed attempts. Please try again later.'
        }
        return { success: false, error: errorMessage }
    }
}

// Create account with email and password
export async function signUpWithEmail(
    email: string,
    password: string,
    displayName?: string
): Promise<{ success: boolean; user?: User; error?: string }> {
    try {
        const result = await createUserWithEmailAndPassword(auth, email, password)

        // Update display name if provided
        if (displayName && result.user) {
            await updateProfile(result.user, { displayName })
        }

        return { success: true, user: result.user }
    } catch (error: any) {
        console.error('Sign-up error:', error)
        let errorMessage = 'Failed to create account'
        if (error.code === 'auth/email-already-in-use') {
            errorMessage = 'An account with this email already exists'
        } else if (error.code === 'auth/weak-password') {
            errorMessage = 'Password is too weak. Please use a stronger password.'
        } else if (error.code === 'auth/invalid-email') {
            errorMessage = 'Invalid email address'
        }
        return { success: false, error: errorMessage }
    }
}

// Sign out
export async function signOutUser(): Promise<{ success: boolean; error?: string }> {
    try {
        await signOut(auth)
        return { success: true }
    } catch (error: any) {
        console.error('Sign-out error:', error)
        return { success: false, error: error.message || 'Failed to sign out' }
    }
}

// Get current user
export function getCurrentUser(): User | null {
    return auth.currentUser
}

// Get ID token for API requests
export async function getIdToken(): Promise<string | null> {
    const user = auth.currentUser
    if (!user) return null

    try {
        const token = await user.getIdToken()
        return token
    } catch (error) {
        console.error('Error getting ID token:', error)
        return null
    }
}

// Subscribe to auth state changes
export function onAuthChange(callback: (user: User | null) => void): () => void {
    return onAuthStateChanged(auth, callback)
}

// Send password reset email
export async function sendPasswordReset(email: string): Promise<{ success: boolean; error?: string }> {
    try {
        await sendPasswordResetEmail(auth, email)
        return { success: true }
    } catch (error: any) {
        console.error('Password reset error:', error)
        return { success: false, error: error.message || 'Failed to send reset email' }
    }
}

// Update user profile
export async function updateUserProfile(
    displayName?: string,
    photoURL?: string
): Promise<{ success: boolean; error?: string }> {
    const user = auth.currentUser
    if (!user) return { success: false, error: 'No user logged in' }

    try {
        await updateProfile(user, { displayName, photoURL })
        return { success: true }
    } catch (error: any) {
        console.error('Profile update error:', error)
        return { success: false, error: error.message || 'Failed to update profile' }
    }
}
