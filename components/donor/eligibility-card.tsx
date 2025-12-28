'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { CheckCircle, XCircle, Calendar, Edit, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { getIdToken } from '@/lib/firebase-auth'

interface Eligibility {
    canDonate: boolean
    daysSinceDonation: number | null
    daysRemaining: number
    requiredDays: number
    nextEligibleDate: string | null
}

interface EligibilityCardProps {
    eligibility: Eligibility
    gender: string
    lastDonation?: Date | string | null
    onUpdate?: () => void
}

export function EligibilityCard({ eligibility, gender, lastDonation, onUpdate }: EligibilityCardProps) {
    const [isEditing, setIsEditing] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [newDate, setNewDate] = useState('')

    const progressPercent = eligibility.daysSinceDonation !== null
        ? Math.min(100, (eligibility.daysSinceDonation / eligibility.requiredDays) * 100)
        : 100

    const formatDate = (date: Date | string | null | undefined) => {
        if (!date) return 'Never'
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        })
    }

    const handleUpdateDonation = async () => {
        if (!newDate) {
            toast.error('Please select a date')
            return
        }

        const selectedDate = new Date(newDate)
        if (selectedDate > new Date()) {
            toast.error('Date cannot be in the future')
            return
        }

        setIsLoading(true)

        try {
            const token = await getIdToken()
            if (!token) {
                toast.error('Session expired. Please log in again.')
                return
            }

            const response = await fetch('/api/member/donor/update-donation', {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ lastDonation: newDate })
            })

            if (response.ok) {
                toast.success('Donation date updated successfully!')
                setIsEditing(false)
                setNewDate('')
                onUpdate?.()
            } else {
                const data = await response.json()
                toast.error(data.error || 'Failed to update donation date')
            }
        } catch (error) {
            console.error('Error updating donation:', error)
            toast.error('Failed to update donation date')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Card className={eligibility.canDonate ? 'border-green-200 bg-green-50/50' : 'border-red-200 bg-red-50/50'}>
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            {eligibility.canDonate ? (
                                <>
                                    <CheckCircle className="h-5 w-5 text-green-600" />
                                    <span className="text-green-700">Eligible to Donate</span>
                                </>
                            ) : (
                                <>
                                    <XCircle className="h-5 w-5 text-red-600" />
                                    <span className="text-red-700">Not Yet Eligible</span>
                                </>
                            )}
                        </CardTitle>
                        <CardDescription className={eligibility.canDonate ? 'text-green-600' : 'text-red-600'}>
                            {eligibility.canDonate
                                ? 'You can donate blood now! Find a donation center near you.'
                                : `${eligibility.daysRemaining} days until you can donate again`}
                        </CardDescription>
                    </div>

                    <Dialog open={isEditing} onOpenChange={setIsEditing}>
                        <DialogTrigger asChild>
                            <Button variant="outline" size="sm">
                                <Edit className="h-4 w-4 mr-2" />
                                Update
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Update Last Donation Date</DialogTitle>
                                <DialogDescription>
                                    Record when you last donated blood. This helps us track your eligibility.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label htmlFor="donationDate">Donation Date</Label>
                                    <Input
                                        id="donationDate"
                                        type="date"
                                        value={newDate}
                                        onChange={(e) => setNewDate(e.target.value)}
                                        max={new Date().toISOString().split('T')[0]}
                                    />
                                </div>
                                <Button
                                    onClick={handleUpdateDonation}
                                    disabled={isLoading}
                                    className="w-full"
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            Updating...
                                        </>
                                    ) : (
                                        'Save Donation Date'
                                    )}
                                </Button>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>
            </CardHeader>

            <CardContent className="space-y-4">
                {/* Progress Bar */}
                <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Progress to next eligible donation</span>
                        <span className={eligibility.canDonate ? 'text-green-600' : 'text-gray-600'}>
                            {Math.round(progressPercent)}%
                        </span>
                    </div>
                    <Progress
                        value={progressPercent}
                        className={`h-3 ${eligibility.canDonate ? '[&>div]:bg-green-500' : '[&>div]:bg-red-400'}`}
                    />
                </div>

                {/* Info Grid */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="bg-white rounded-lg p-3 border">
                        <div className="flex items-center gap-2 text-gray-500 mb-1">
                            <Calendar className="h-4 w-4" />
                            Last Donation
                        </div>
                        <p className="font-medium">{formatDate(lastDonation)}</p>
                    </div>

                    <div className="bg-white rounded-lg p-3 border">
                        <div className="text-gray-500 mb-1">Required Wait</div>
                        <p className="font-medium">
                            {eligibility.requiredDays} days ({gender === 'MALE' ? 'Male' : 'Female'})
                        </p>
                    </div>

                    {eligibility.daysSinceDonation !== null && (
                        <div className="bg-white rounded-lg p-3 border">
                            <div className="text-gray-500 mb-1">Days Since Donation</div>
                            <p className="font-medium">{eligibility.daysSinceDonation} days</p>
                        </div>
                    )}

                    {eligibility.nextEligibleDate && (
                        <div className="bg-white rounded-lg p-3 border">
                            <div className="text-gray-500 mb-1">Next Eligible Date</div>
                            <p className="font-medium">
                                {new Date(eligibility.nextEligibleDate).toLocaleDateString()}
                            </p>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}
