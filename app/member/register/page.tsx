'use client'

import { Suspense, useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { GoogleSignInButton } from '@/components/auth/google-sign-in-button'
import { AuthForm } from '@/components/auth/auth-form'
import { toast } from 'sonner'
import { Heart, CheckCircle, Loader2 } from 'lucide-react'
import { getIdToken, getCurrentUser } from '@/lib/firebase-auth'

function RegisterForm() {
    const router = useRouter()
    const searchParams = useSearchParams()

    // Pre-fill from Google OAuth
    const defaultEmail = searchParams.get('email') || ''
    const defaultName = searchParams.get('name') || ''

    // State for Google users completing registration
    const [isGoogleUser, setIsGoogleUser] = useState(false)
    const [phone, setPhone] = useState('')
    const [loading, setLoading] = useState(false)
    const [checkingAuth, setCheckingAuth] = useState(true)

    // Check if user is already signed in via Google
    useEffect(() => {
        const checkAuth = async () => {
            const user = await getCurrentUser()
            if (user && defaultEmail) {
                // User signed in with Google and needs to complete registration
                setIsGoogleUser(true)
            }
            setCheckingAuth(false)
        }
        checkAuth()
    }, [defaultEmail])

    const handlePhoneSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        // Validate phone
        const phoneRegex = /^(\+880|880|0)?1[3-9]\d{8}$/
        if (!phoneRegex.test(phone)) {
            toast.error('Please enter a valid Bangladeshi phone number')
            return
        }

        setLoading(true)

        try {
            const token = await getIdToken()
            if (!token) {
                toast.error('Session expired. Please sign in again.')
                router.push('/member/login')
                return
            }

            const response = await fetch('/api/member/register', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name: defaultName,
                    phone: phone
                })
            })

            if (response.ok) {
                toast.success('Account created successfully!')
                // Use window.location for a hard redirect to ensure fresh page load
                window.location.href = '/member/dashboard'
            } else {
                const data = await response.json()
                toast.error(data.error || 'Failed to create account')
            }
        } catch (error) {
            console.error('Registration error:', error)
            toast.error('Failed to create account')
        } finally {
            setLoading(false)
        }
    }

    const handleRegisterSuccess = async (token: string, userData: { email: string; name?: string; phone?: string }) => {
        // Create member in our database
        const response = await fetch('/api/member/register', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name: userData.name,
                phone: userData.phone
            })
        })

        if (response.ok) {
            toast.success('Account created successfully!')
            router.push('/member/dashboard')
        } else {
            const data = await response.json()
            toast.error(data.error || 'Failed to create account')
        }
    }

    if (checkingAuth) {
        return (
            <Card className="w-full max-w-md">
                <CardContent className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-red-600" />
                </CardContent>
            </Card>
        )
    }

    // If user signed in with Google, show simplified phone-only form
    if (isGoogleUser) {
        return (
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <div className="flex justify-center mb-4">
                        <Heart className="h-12 w-12 text-red-600" />
                    </div>
                    <CardTitle className="text-2xl">Complete Your Registration</CardTitle>
                    <CardDescription>
                        Just one more step! Add your phone number to finish setting up your account.
                    </CardDescription>
                </CardHeader>

                <CardContent className="space-y-6">
                    <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                        <p className="text-sm text-green-800">
                            <strong>Signed in as:</strong> {defaultEmail}
                        </p>
                        {defaultName && (
                            <p className="text-sm text-green-800">
                                <strong>Name:</strong> {defaultName}
                            </p>
                        )}
                    </div>

                    <form onSubmit={handlePhoneSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="phone">Phone Number *</Label>
                            <Input
                                id="phone"
                                type="tel"
                                placeholder="+880 1XXX-XXXXXX"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                required
                            />
                            <p className="text-xs text-gray-500">
                                We'll use this number to contact you about your requests.
                            </p>
                        </div>

                        <Button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-red-600 hover:bg-red-700"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Creating account...
                                </>
                            ) : (
                                'Complete Registration'
                            )}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className="w-full max-w-md">
            <CardHeader className="text-center">
                <div className="flex justify-center mb-4">
                    <Heart className="h-12 w-12 text-red-600" />
                </div>
                <CardTitle className="text-2xl">Create an Account</CardTitle>
                <CardDescription>
                    Join RedAid to request blood or become a donor
                </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
                {/* Benefits */}
                <div className="bg-red-50 rounded-lg p-4">
                    <h4 className="font-medium text-red-900 mb-2">Why create an account?</h4>
                    <ul className="space-y-1.5 text-sm text-red-800">
                        <li className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-red-600" />
                            Request blood for yourself or loved ones
                        </li>
                        <li className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-red-600" />
                            Become a verified donor and save lives
                        </li>
                        <li className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-red-600" />
                            Track your donation eligibility
                        </li>
                    </ul>
                </div>

                {/* Google Sign Up */}
                <GoogleSignInButton
                    redirectTo="/member/dashboard"
                    onNeedsRegistration={(userData) => {
                        // User clicked Google but needs to complete registration
                        // Pre-fill the form
                        router.push(`/member/register?email=${encodeURIComponent(userData.email)}&name=${encodeURIComponent(userData.name)}`)
                    }}
                />

                {/* Divider */}
                <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-white px-2 text-gray-500">Or register with email</span>
                    </div>
                </div>

                {/* Email/Password Form */}
                <AuthForm
                    mode="register"
                    defaultValues={{
                        email: defaultEmail,
                        name: defaultName
                    }}
                    onSuccess={handleRegisterSuccess}
                />

                {/* Links */}
                <div className="text-center">
                    <p className="text-sm text-gray-600">
                        Already have an account?{' '}
                        <Link href="/member/login" className="text-red-600 hover:underline font-medium">
                            Sign In
                        </Link>
                    </p>
                </div>
            </CardContent>
        </Card>
    )
}

export default function MemberRegisterPage() {
    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <Suspense fallback={
                <Card className="w-full max-w-md animate-pulse">
                    <CardHeader><div className="h-8 bg-gray-200 rounded"></div></CardHeader>
                    <CardContent><div className="h-64 bg-gray-200 rounded"></div></CardContent>
                </Card>
            }>
                <RegisterForm />
            </Suspense>
        </div>
    )
}

