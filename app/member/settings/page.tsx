'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useMemberAuth, useRequireMember } from '@/components/auth/member-auth-context'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
    Heart,
    ArrowLeft,
    User,
    Mail,
    Phone,
    LogOut,
    Loader2,
    Shield,
    Droplets
} from 'lucide-react'

export default function MemberSettings() {
    const router = useRouter()
    const { member, loading, signOut } = useMemberAuth()
    const { isAuthenticated, isDonor, isVerifiedDonor } = useRequireMember()

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-red-600" />
            </div>
        )
    }

    if (!isAuthenticated || !member) {
        router.push('/member/login')
        return null
    }

    const handleSignOut = async () => {
        await signOut()
        router.push('/')
    }

    return (
        <div className="min-h-screen bg-gray-50">
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

                        <div className="w-24" /> {/* Spacer for centering */}
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-8">
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Account Settings</h1>
                    <p className="text-gray-600 mt-1">View and manage your account information</p>
                </div>

                {/* Profile Information */}
                <Card className="mb-6">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <User className="h-5 w-5" />
                            Profile Information
                        </CardTitle>
                        <CardDescription>
                            Your personal details used for blood donation activities
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-medium text-gray-500">Full Name</label>
                                <p className="text-gray-900 mt-1">{member.name}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-500">Email Address</label>
                                <div className="flex items-center gap-2 mt-1">
                                    <Mail className="h-4 w-4 text-gray-400" />
                                    <p className="text-gray-900">{member.email}</p>
                                </div>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-500">Phone Number</label>
                                <div className="flex items-center gap-2 mt-1">
                                    <Phone className="h-4 w-4 text-gray-400" />
                                    <p className="text-gray-900">{member.phone}</p>
                                </div>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-500">Account Status</label>
                                <div className="mt-1">
                                    <Badge variant="outline" className="text-green-600 border-green-600">
                                        Active
                                    </Badge>
                                </div>
                            </div>
                        </div>

                        <div className="pt-4">
                            <p className="text-sm text-gray-500">
                                To update your profile information, please contact our support team.
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* Donor Status */}
                <Card className="mb-6">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Droplets className="h-5 w-5" />
                            Donor Status
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {isDonor ? (
                            <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                    <span className="text-gray-600">Status:</span>
                                    {isVerifiedDonor ? (
                                        <Badge className="bg-green-100 text-green-800">Verified Donor</Badge>
                                    ) : (
                                        <Badge className="bg-yellow-100 text-yellow-800">Pending Verification</Badge>
                                    )}
                                </div>
                                {member.donor && (
                                    <div className="flex items-center gap-2">
                                        <span className="text-gray-600">Blood Type:</span>
                                        <Badge variant="outline" className="text-red-600 border-red-600">
                                            {member.donor.bloodType.replace('_', ' ').replace('POSITIVE', '+').replace('NEGATIVE', '-')}
                                        </Badge>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="text-center py-4">
                                <p className="text-gray-600 mb-4">You haven't registered as a donor yet.</p>
                                <Link href="/member/donor/apply">
                                    <Button className="bg-red-600 hover:bg-red-700">
                                        Become a Donor
                                    </Button>
                                </Link>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Security */}
                <Card className="mb-6">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Shield className="h-5 w-5" />
                            Security
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-medium text-gray-900">Sign Out</p>
                                    <p className="text-sm text-gray-500">Sign out of your account on this device</p>
                                </div>
                                <Button variant="outline" onClick={handleSignOut}>
                                    <LogOut className="h-4 w-4 mr-2" />
                                    Sign Out
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Danger Zone */}
                <Card className="border-red-200">
                    <CardHeader>
                        <CardTitle className="text-red-600">Danger Zone</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-medium text-gray-900">Delete Account</p>
                                <p className="text-sm text-gray-500">
                                    Permanently delete your account and all associated data
                                </p>
                            </div>
                            <Button variant="outline" className="text-red-600 border-red-600 hover:bg-red-50">
                                Delete Account
                            </Button>
                        </div>
                        <p className="text-xs text-gray-500 mt-4">
                            Account deletion is permanent. Contact support@redaid.org to request deletion.
                        </p>
                    </CardContent>
                </Card>
            </main>
        </div>
    )
}
