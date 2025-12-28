'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
    Droplets,
    CheckCircle,
    Clock,
    Calendar,
    Heart
} from 'lucide-react'
import { differenceInDays, addDays, format } from 'date-fns'

interface DonorEligibilityStatusProps {
    lastDonation: Date | string | null | undefined
    gender: 'MALE' | 'FEMALE' | string
    donationCount?: number
    isVerified?: boolean
}

// Eligibility intervals in days (Bangladesh guidelines)
const ELIGIBILITY_INTERVALS = {
    MALE: 90,    // 3 months for males
    FEMALE: 120  // 4 months for females
}

export function DonorEligibilityStatus({
    lastDonation,
    gender,
    donationCount = 0,
    isVerified = true
}: DonorEligibilityStatusProps) {

    // Get the required interval based on gender
    const requiredInterval = gender === 'FEMALE' ? ELIGIBILITY_INTERVALS.FEMALE : ELIGIBILITY_INTERVALS.MALE

    // Calculate eligibility
    const calculateEligibility = () => {
        if (!lastDonation) {
            // Never donated - eligible now
            return {
                isEligible: true,
                daysUntilEligible: 0,
                daysSinceLastDonation: null,
                nextEligibleDate: null,
                progressPercentage: 100
            }
        }

        const lastDonationDate = new Date(lastDonation)
        const today = new Date()
        const daysSince = differenceInDays(today, lastDonationDate)
        const daysRemaining = Math.max(0, requiredInterval - daysSince)
        const nextEligible = addDays(lastDonationDate, requiredInterval)
        const progress = Math.min(100, (daysSince / requiredInterval) * 100)

        return {
            isEligible: daysRemaining === 0,
            daysUntilEligible: daysRemaining,
            daysSinceLastDonation: daysSince,
            nextEligibleDate: nextEligible,
            progressPercentage: progress
        }
    }

    const eligibility = calculateEligibility()

    if (!isVerified) {
        return (
            <Card className="border-yellow-200 bg-yellow-50">
                <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Clock className="h-5 w-5 text-yellow-600" />
                        Verification Pending
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-yellow-800">
                        Your donor profile is pending verification. Once verified, you'll be able to see your donation eligibility status.
                    </p>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className={eligibility.isEligible ? 'border-green-200 bg-gradient-to-br from-green-50 to-emerald-50' : 'border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50'}>
            <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Droplets className={`h-5 w-5 ${eligibility.isEligible ? 'text-green-600' : 'text-blue-600'}`} />
                        Donation Eligibility
                    </CardTitle>
                    <Badge
                        className={eligibility.isEligible
                            ? 'bg-green-100 text-green-800 hover:bg-green-100'
                            : 'bg-blue-100 text-blue-800 hover:bg-blue-100'
                        }
                    >
                        {eligibility.isEligible ? 'Eligible' : 'Recovering'}
                    </Badge>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Main Status */}
                <div className="flex items-center gap-3">
                    {eligibility.isEligible ? (
                        <>
                            <div className="bg-green-100 p-3 rounded-full">
                                <CheckCircle className="h-6 w-6 text-green-600" />
                            </div>
                            <div>
                                <p className="font-semibold text-green-800">You're eligible to donate!</p>
                                <p className="text-sm text-green-600">Your body has fully recovered</p>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="bg-blue-100 p-3 rounded-full">
                                <Clock className="h-6 w-6 text-blue-600" />
                            </div>
                            <div>
                                <p className="font-semibold text-blue-800">
                                    {eligibility.daysUntilEligible} days until eligible
                                </p>
                                <p className="text-sm text-blue-600">
                                    Eligible on {eligibility.nextEligibleDate && format(eligibility.nextEligibleDate, 'MMMM d, yyyy')}
                                </p>
                            </div>
                        </>
                    )}
                </div>

                {/* Progress Bar */}
                <div className="space-y-2">
                    <div className="flex justify-between text-xs text-gray-500">
                        <span>Recovery Progress</span>
                        <span>{Math.round(eligibility.progressPercentage)}%</span>
                    </div>
                    <Progress
                        value={eligibility.progressPercentage}
                        className={`h-2 ${eligibility.isEligible ? '[&>div]:bg-green-500' : '[&>div]:bg-blue-500'}`}
                    />
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-100">
                    <div className="text-center">
                        <div className="flex items-center justify-center gap-1 text-gray-500 text-xs mb-1">
                            <Heart className="h-3 w-3" />
                            Total Donations
                        </div>
                        <p className="text-xl font-bold text-red-600">{donationCount}</p>
                    </div>
                    <div className="text-center">
                        <div className="flex items-center justify-center gap-1 text-gray-500 text-xs mb-1">
                            <Calendar className="h-3 w-3" />
                            Last Donation
                        </div>
                        <p className="text-sm font-medium text-gray-700">
                            {lastDonation
                                ? format(new Date(lastDonation), 'MMM d, yyyy')
                                : 'Never'
                            }
                        </p>
                    </div>
                </div>

                {/* Info Note */}
                <p className="text-xs text-gray-500 pt-2">
                    {gender === 'FEMALE'
                        ? 'Women need 4 months (120 days) between donations to fully recover.'
                        : 'Men need 3 months (90 days) between donations to fully recover.'
                    }
                </p>
            </CardContent>
        </Card>
    )
}
