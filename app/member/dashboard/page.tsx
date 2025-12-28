'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useMemberAuth, useRequireMember } from '@/components/auth/member-auth-context'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { VerifiedBadge } from '@/components/donor/verified-badge'
import { DonorEligibilityStatus } from '@/components/donor/donor-eligibility-status'
import {
    Heart,
    Droplets,
    UserPlus,
    History,
    LogOut,
    Loader2,
    CheckCircle,
    Clock
} from 'lucide-react'

export default function MemberDashboard() {
    const router = useRouter()
    const { member, loading, signOut, refreshMember } = useMemberAuth()
    const { isAuthenticated, needsRegistration, isDonor, isVerifiedDonor } = useRequireMember()

    useEffect(() => {
        if (!loading && !isAuthenticated) {
            router.push('/member/login')
        }
        if (!loading && needsRegistration) {
            router.push('/member/register')
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

    const handleSignOut = async () => {
        await signOut()
        router.push('/')
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white border-b sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <Link href="/" className="flex items-center gap-2">
                            <Heart className="h-8 w-8 text-red-600" />
                            <span className="font-bold text-xl text-gray-900">RedAid</span>
                        </Link>

                        <div className="flex items-center gap-4">
                            <div className="text-right hidden sm:block">
                                <p className="text-sm font-medium text-gray-900">{member.name}</p>
                                <p className="text-xs text-gray-500">{member.email}</p>
                            </div>

                            {isVerifiedDonor && <VerifiedBadge />}

                            <Link href="/member/settings">
                                <Button variant="ghost" size="sm">
                                    Settings
                                </Button>
                            </Link>

                            <Button variant="ghost" size="sm" onClick={handleSignOut}>
                                <LogOut className="h-4 w-4 mr-2" />
                                Sign Out
                            </Button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Welcome Section */}
                <div className="mb-8">
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                        Welcome back, {member.name.split(' ')[0]}! 👋
                    </h1>
                    <p className="text-gray-600 mt-1">
                        Manage your blood donation activities and requests
                    </p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                    {/* Donor Status Card */}
                    {isDonor ? (
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium">Donor Status</CardTitle>
                                <Droplets className="h-4 w-4 text-red-600" />
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center gap-2 mb-2">
                                    {member.donor?.isVerified ? (
                                        <>
                                            <CheckCircle className="h-5 w-5 text-green-600" />
                                            <span className="text-lg font-semibold text-green-600">Verified Donor</span>
                                        </>
                                    ) : (
                                        <>
                                            <Clock className="h-5 w-5 text-yellow-600" />
                                            <span className="text-lg font-semibold text-yellow-600">Pending Verification</span>
                                        </>
                                    )}
                                </div>
                                <p className="text-sm text-gray-500">
                                    Blood Type: <Badge variant="outline">{member.donor?.bloodType.replace('_', ' ')}</Badge>
                                </p>
                            </CardContent>
                        </Card>
                    ) : (
                        <Card className="bg-gradient-to-br from-red-50 to-pink-50 border-red-100">
                            <CardHeader>
                                <CardTitle className="text-red-900">Become a Donor</CardTitle>
                                <CardDescription className="text-red-700">
                                    Save lives by registering as a blood donor
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Link href="/member/donor/apply">
                                    <Button className="w-full bg-red-600 hover:bg-red-700">
                                        <UserPlus className="h-4 w-4 mr-2" />
                                        Apply Now
                                    </Button>
                                </Link>
                            </CardContent>
                        </Card>
                    )}

                    {/* Donation Count */}
                    {isDonor && (
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium">Total Donations</CardTitle>
                                <Heart className="h-4 w-4 text-red-600" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold text-gray-900">
                                    {member.donor?.donationCount || 0}
                                </div>
                                <p className="text-sm text-gray-500">
                                    {member.donor?.donationCount === 1 ? 'life saved' : 'lives saved'}
                                </p>
                            </CardContent>
                        </Card>
                    )}

                    {/* Request Count */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">Blood Requests</CardTitle>
                            <History className="h-4 w-4 text-blue-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-gray-900">
                                0
                            </div>
                            <Link href="/member/request-blood" className="text-sm text-blue-600 hover:underline">
                                Request Blood →
                            </Link>
                        </CardContent>
                    </Card>
                </div>

                {/* Blood Donation Eligibility (for verified donors) */}
                {isVerifiedDonor && member.donor && (
                    <div className="mb-8">
                        <DonorEligibilityStatus
                            lastDonation={member.donor.lastDonation}
                            gender={member.donor.gender || 'MALE'}
                            donationCount={member.donor.donationCount}
                            isVerified={member.donor.isVerified}
                        />
                    </div>
                )}

                {/* Quick Actions */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Link href="/member/request-blood">
                        <Card className="hover:border-red-200 hover:bg-red-50/50 transition-colors cursor-pointer">
                            <CardContent className="flex items-center gap-4 p-4">
                                <div className="bg-red-100 p-3 rounded-lg">
                                    <Droplets className="h-6 w-6 text-red-600" />
                                </div>
                                <div>
                                    <p className="font-medium">Request Blood</p>
                                    <p className="text-sm text-gray-500">Submit a request</p>
                                </div>
                            </CardContent>
                        </Card>
                    </Link>

                    {isDonor && (
                        <Link href="/member/donor/eligibility">
                            <Card className="hover:border-green-200 hover:bg-green-50/50 transition-colors cursor-pointer">
                                <CardContent className="flex items-center gap-4 p-4">
                                    <div className="bg-green-100 p-3 rounded-lg">
                                        <CheckCircle className="h-6 w-6 text-green-600" />
                                    </div>
                                    <div>
                                        <p className="font-medium">Eligibility Status</p>
                                        <p className="text-sm text-gray-500">Check your status</p>
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>
                    )}

                    {!isDonor && (
                        <Link href="/member/donor/apply">
                            <Card className="hover:border-pink-200 hover:bg-pink-50/50 transition-colors cursor-pointer">
                                <CardContent className="flex items-center gap-4 p-4">
                                    <div className="bg-pink-100 p-3 rounded-lg">
                                        <UserPlus className="h-6 w-6 text-pink-600" />
                                    </div>
                                    <div>
                                        <p className="font-medium">Become a Donor</p>
                                        <p className="text-sm text-gray-500">Register to donate</p>
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>
                    )}
                </div>
            </main>
        </div>
    )
}
