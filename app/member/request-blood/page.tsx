'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useMemberAuth, useRequireMember } from '@/components/auth/member-auth-context'
import { BloodRequestFormAuthenticated } from '@/components/forms/blood-request-form-authenticated'
import { EmergencyHotline } from '@/components/ui/emergency-hotline'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Heart, Droplets, ArrowLeft, Loader2 } from 'lucide-react'

export default function RequestBloodPage() {
    const router = useRouter()
    const { member, loading } = useMemberAuth()
    const { isAuthenticated, needsRegistration } = useRequireMember()

    useEffect(() => {
        if (!loading && !isAuthenticated) {
            router.push('/member/login?intent=request-blood')
        }
        if (!loading && needsRegistration) {
            router.push('/member/register?intent=request-blood')
        }
    }, [loading, isAuthenticated, needsRegistration, router])

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-red-600" />
            </div>
        )
    }

    if (!member) {
        return null
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Emergency Hotline Banner */}
            <EmergencyHotline variant="banner" />

            {/* Header */}
            <header className="bg-white border-b">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <Link href="/member/dashboard" className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
                            <ArrowLeft className="h-5 w-5" />
                            <span className="hidden sm:inline">Back to Dashboard</span>
                        </Link>

                        <Link href="/" className="flex items-center gap-2">
                            <Heart className="h-6 w-6 text-red-600" />
                            <span className="font-bold text-xl text-gray-900">RedAid</span>
                        </Link>

                        <div className="text-right">
                            <p className="text-sm font-medium text-gray-900">{member.name}</p>
                            <p className="text-xs text-gray-500">{member.email}</p>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Page Title */}
                <div className="text-center mb-8">
                    <div className="flex justify-center mb-4">
                        <div className="bg-red-100 p-4 rounded-full">
                            <Droplets className="h-10 w-10 text-red-600" />
                        </div>
                    </div>
                    <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
                        Request Blood
                    </h1>
                    <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                        Fill out the form below and we'll match you with available donors in your area.
                        We'll keep you updated on the status of your request.
                    </p>
                </div>

                {/* Info Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <Card className="bg-blue-50 border-blue-100">
                        <CardContent className="p-4 text-center">
                            <div className="text-2xl font-bold text-blue-600">&lt; 24h</div>
                            <p className="text-sm text-blue-800">Average Response Time</p>
                        </CardContent>
                    </Card>
                    <Card className="bg-green-50 border-green-100">
                        <CardContent className="p-4 text-center">
                            <div className="text-2xl font-bold text-green-600">1,247+</div>
                            <p className="text-sm text-green-800">Active Donors</p>
                        </CardContent>
                    </Card>
                    <Card className="bg-purple-50 border-purple-100">
                        <CardContent className="p-4 text-center">
                            <div className="text-2xl font-bold text-purple-600">64</div>
                            <p className="text-sm text-purple-800">Areas Covered</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Request Form */}
                <BloodRequestFormAuthenticated member={member} />
            </main>
        </div>
    )
}
