'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'
import { signInWithGoogle } from '@/lib/firebase-auth'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

interface GoogleSignInButtonProps {
    onSuccess?: () => void
    onNeedsRegistration?: (userData: { email: string; name: string; photoURL: string | null }) => void
    redirectTo?: string
    className?: string
    variant?: 'default' | 'outline'
}

export function GoogleSignInButton({
    onSuccess,
    onNeedsRegistration,
    redirectTo = '/member/dashboard',
    className = '',
    variant = 'outline'
}: GoogleSignInButtonProps) {
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    const handleGoogleSignIn = async () => {
        setLoading(true)

        try {
            const result = await signInWithGoogle()

            if (!result.success || !result.user) {
                toast.error(result.error || 'Failed to sign in with Google')
                return
            }

            // Check if user exists in our database
            const token = await result.user.getIdToken()
            const response = await fetch('/api/member/profile', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })

            if (response.ok) {
                // User exists, redirect to dashboard
                toast.success('Signed in successfully!')
                onSuccess?.()
                router.push(redirectTo)
            } else if (response.status === 404 || response.status === 401) {
                // User needs to complete registration (404 = not in DB, 401 = middleware block for new user)
                if (onNeedsRegistration) {
                    onNeedsRegistration({
                        email: result.user.email || '',
                        name: result.user.displayName || '',
                        photoURL: result.user.photoURL
                    })
                } else {
                    // Redirect to registration with pre-filled data
                    const params = new URLSearchParams({
                        email: result.user.email || '',
                        name: result.user.displayName || '',
                        photo: result.user.photoURL || ''
                    })
                    toast.info('Please complete your registration')
                    router.push(`/member/register?${params.toString()}`)
                }
            } else {
                toast.error('Failed to verify account')
            }
        } catch (error) {
            console.error('Google sign-in error:', error)
            toast.error('Failed to sign in with Google')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Button
            type="button"
            variant={variant}
            onClick={handleGoogleSignIn}
            disabled={loading}
            className={`w-full flex items-center justify-center gap-3 ${className}`}
        >
            {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                    <path
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        fill="#4285F4"
                    />
                    <path
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        fill="#34A853"
                    />
                    <path
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        fill="#FBBC05"
                    />
                    <path
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        fill="#EA4335"
                    />
                </svg>
            )}
            {loading ? 'Signing in...' : 'Continue with Google'}
        </Button>
    )
}
