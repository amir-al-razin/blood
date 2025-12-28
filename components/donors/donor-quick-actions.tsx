'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Phone, Mail, UserCheck, UserX } from 'lucide-react'
import { toast } from 'sonner'

interface DonorQuickActionsProps {
    donor: {
        id: string
        name: string
        phone: string
        email?: string | null
        isVerified: boolean
        isAvailable: boolean
    }
}

export function DonorQuickActions({ donor }: DonorQuickActionsProps) {
    const [showVerifyDialog, setShowVerifyDialog] = useState(false)
    const [showContactDialog, setShowContactDialog] = useState(false)
    const [showAvailabilityDialog, setShowAvailabilityDialog] = useState(false)
    const [isLoading, setIsLoading] = useState(false)

    const handleVerifyDonor = async () => {
        setIsLoading(true)
        try {
            const response = await fetch(`/api/admin/donors/${donor.id}/verify`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            })

            if (response.ok) {
                toast.success('Donor verified successfully')
                setShowVerifyDialog(false)
                window.location.reload()
            } else {
                const data = await response.json()
                toast.error(data.error || 'Failed to verify donor')
            }
        } catch (error) {
            toast.error('Failed to verify donor')
        } finally {
            setIsLoading(false)
        }
    }

    const handleToggleAvailability = async () => {
        setIsLoading(true)
        try {
            const response = await fetch(`/api/admin/donors/${donor.id}/availability`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isAvailable: !donor.isAvailable })
            })

            if (response.ok) {
                const newStatus = donor.isAvailable ? 'unavailable' : 'available'
                toast.success(`Donor marked as ${newStatus}`)
                setShowAvailabilityDialog(false)
                window.location.reload()
            } else {
                const data = await response.json()
                toast.error(data.error || 'Failed to update donor status')
            }
        } catch (error) {
            toast.error('Failed to update donor status')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <>
            <div className="space-y-3">
                {!donor.isVerified && (
                    <Button
                        className="w-full bg-green-600 hover:bg-green-700"
                        onClick={() => setShowVerifyDialog(true)}
                    >
                        <UserCheck className="h-4 w-4 mr-2" />
                        Verify Donor
                    </Button>
                )}
                <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => setShowContactDialog(true)}
                >
                    <Phone className="h-4 w-4 mr-2" />
                    Contact Donor
                </Button>
                <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => setShowAvailabilityDialog(true)}
                >
                    <UserX className="h-4 w-4 mr-2" />
                    {donor.isAvailable ? 'Mark Unavailable' : 'Mark Available'}
                </Button>
            </div>

            {/* Verify Dialog */}
            <Dialog open={showVerifyDialog} onOpenChange={setShowVerifyDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Verify Donor</DialogTitle>
                        <DialogDescription>
                            Confirm that you have called and verified {donor.name}'s identity.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4 space-y-3">
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <p className="text-sm text-blue-800 font-medium">Before verifying:</p>
                            <ul className="text-sm text-blue-700 list-disc list-inside mt-1">
                                <li>Call the donor's phone number</li>
                                <li>Confirm their name and blood type</li>
                                <li>Verify they're willing to donate</li>
                            </ul>
                        </div>
                    </div>
                    <div className="flex justify-end space-x-2">
                        <Button variant="outline" onClick={() => setShowVerifyDialog(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleVerifyDonor} disabled={isLoading} className="bg-green-600 hover:bg-green-700">
                            {isLoading ? 'Verifying...' : 'Mark as Verified'}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Contact Dialog */}
            <Dialog open={showContactDialog} onOpenChange={setShowContactDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Contact {donor.name}</DialogTitle>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                        <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <Phone className="h-5 w-5 text-gray-400" />
                                    <span className="font-medium">{donor.phone}</span>
                                </div>
                                <a href={`tel:${donor.phone}`}>
                                    <Button size="sm" className="bg-green-600 hover:bg-green-700">
                                        <Phone className="h-4 w-4 mr-1" />
                                        Call
                                    </Button>
                                </a>
                            </div>
                            {donor.email && (
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <Mail className="h-5 w-5 text-gray-400" />
                                        <span className="font-medium">{donor.email}</span>
                                    </div>
                                    <a href={`mailto:${donor.email}`}>
                                        <Button size="sm" variant="outline">
                                            <Mail className="h-4 w-4 mr-1" />
                                            Email
                                        </Button>
                                    </a>
                                </div>
                            )}
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Availability Dialog */}
            <Dialog open={showAvailabilityDialog} onOpenChange={setShowAvailabilityDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Update Availability</DialogTitle>
                        <DialogDescription>
                            Change availability status for {donor.name}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <p className="text-sm text-gray-600">
                            {donor.isAvailable
                                ? 'This will mark the donor as unavailable and exclude them from new matches.'
                                : 'This will mark the donor as available and include them in new matches.'
                            }
                        </p>
                    </div>
                    <div className="flex justify-end space-x-2">
                        <Button variant="outline" onClick={() => setShowAvailabilityDialog(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleToggleAvailability} disabled={isLoading}>
                            {isLoading ? 'Updating...' : `Mark ${donor.isAvailable ? 'Unavailable' : 'Available'}`}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    )
}
