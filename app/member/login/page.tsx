'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { GoogleSignInButton } from '@/components/auth/google-sign-in-button'
import { AuthForm } from '@/components/auth/auth-form'
import { EmergencyHotline } from '@/components/ui/emergency-hotline'
import { toast } from 'sonner'
import { Heart, Droplets, UserPlus, AlertCircle } from 'lucide-react'

// Intent configurations for contextual messaging
const intentConfig = {
    'request-blood': {
        icon: Droplets,
        title: 'Request Blood',
        description: 'Sign in to submit a blood request. We need your contact details to match you with donors and keep you updated.',
        redirectTo: '/member/request-blood',
        color: 'text-red-600',
        bgColor: 'bg-red-50',
    },
    'become-donor': {
        icon: UserPlus,
        title: 'Become a Donor',
        description: 'Sign in to register as a blood donor. Your account helps us verify your identity and track your donation history.',
        redirectTo: '/member/donor/apply',
        color: 'text-pink-600',
        bgColor: 'bg-pink-50',
    },
}

function LoginForm() {
    const router = useRouter()
    const searchParams = useSearchParams()

    // Get intent and redirect params
    const intent = searchParams.get('intent') as keyof typeof intentConfig | null
    const explicitRedirect = searchParams.get('redirect')

    // Determine final redirect based on intent or explicit redirect
    const intentData = intent ? intentConfig[intent] : null
    const redirectTo = explicitRedirect || intentData?.redirectTo || '/member/dashboard'

    const [showNeedsRegistration, setShowNeedsRegistration] = useState(false)
    const [googleUserData, setGoogleUserData] = useState<{ email: string; name: string } | null>(null)

    const handleLoginSuccess = async (token: string) => {
        // Verify user exists in our database
        const response = await fetch('/api/member/profile', {
            headers: { 'Authorization': `Bearer ${token}` }
        })

        if (response.ok) {
            toast.success('Signed in successfully!')
            router.push(redirectTo)
        } else if (response.status === 404) {
            toast.error('Account not found. Please register first.')
            // Preserve intent when redirecting to register
            const registerUrl = intent
                ? `/member/register?intent=${intent}`
                : '/member/register'
            router.push(registerUrl)
        } else {
            toast.error('Failed to sign in')
        }
    }

    const handleNeedsRegistration = (userData: { email: string; name: string }) => {
        setGoogleUserData(userData)
        setShowNeedsRegistration(true)
    }

    if (showNeedsRegistration && googleUserData) {
        // Preserve intent when redirecting to complete registration
        const registerUrl = `/member/register?email=${encodeURIComponent(googleUserData.email)}&name=${encodeURIComponent(googleUserData.name)}${intent ? `&intent=${intent}` : ''}`

        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <Card className="w-full max-w-md">
                    <CardHeader className="text-center">
                        <div className="flex justify-center mb-4">
                            <Heart className="h-12 w-12 text-red-600" />
                        </div>
                        <CardTitle>Complete Your Registration</CardTitle>
                        <CardDescription>
                            We found your Google account. Please complete your profile to continue.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-gray-600 mb-4">
                            Email: <strong>{googleUserData.email}</strong>
                        </p>
                        <Link
                            href={registerUrl}
                            className="block w-full text-center bg-red-600 text-white py-2 rounded-md hover:bg-red-700"
                        >
                            Complete Registration
                        </Link>
                    </CardContent>
                </Card>
            </div>
        )
    }

    const IntentIcon = intentData?.icon || Heart

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* Emergency Hotline Banner */}
            <EmergencyHotline variant="banner" />

            <div className="flex-1 flex items-center justify-center p-4">
                <Card className="w-full max-w-md">
                    <CardHeader className="text-center">
                        <div className={`flex justify-center mb-4`}>
                            <div className={`p-3 rounded-full ${intentData?.bgColor || 'bg-red-50'}`}>
                                <IntentIcon className={`h-8 w-8 ${intentData?.color || 'text-red-600'}`} />
                            </div>
                        </div>
                        <CardTitle className="text-2xl">
                            {intentData?.title || 'Welcome to RedAid'}
                        </CardTitle>
                        <CardDescription className="text-base">
                            {intentData?.description || 'Sign in to your account to continue'}
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-6">
                        {/* Intent-specific notice */}
                        {intentData && (
                            <div className={`${intentData.bgColor} rounded-lg p-3 flex items-start gap-2`}>
                                <AlertCircle className={`h-5 w-5 ${intentData.color} mt-0.5 flex-shrink-0`} />
                                <p className="text-sm text-gray-700">
                                    <strong>Why sign in?</strong> We need to verify your identity and keep track of requests for safety and accountability.
                                </p>
                            </div>
                        )}

                        {/* Google Sign In */}
                        <GoogleSignInButton
                            redirectTo={redirectTo}
                            onNeedsRegistration={handleNeedsRegistration}
                        />

                        {/* Divider */}
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-white px-2 text-gray-500">Or continue with email</span>
                            </div>
                        </div>

                        {/* Email/Password Form */}
                        <AuthForm
                            mode="login"
                            onSuccess={handleLoginSuccess}
                        />

                        {/* Links */}
                        <div className="text-center space-y-2">
                            <p className="text-sm text-gray-600">
                                Don't have an account?{' '}
                                <Link
                                    href={intent ? `/member/register?intent=${intent}` : '/member/register'}
                                    className="text-red-600 hover:underline font-medium"
                                >
                                    Register
                                </Link>
                            </p>
                            <Link href="/login" className="text-sm text-gray-500 hover:underline block">
                                Admin Login →
                            </Link>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

export default function MemberLoginPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <Card className="w-full max-w-md animate-pulse">
                    <CardHeader><div className="h-8 bg-gray-200 rounded"></div></CardHeader>
                    <CardContent><div className="h-64 bg-gray-200 rounded"></div></CardContent>
                </Card>
            </div>
        }>
            <LoginForm />
        </Suspense>
    )
}
