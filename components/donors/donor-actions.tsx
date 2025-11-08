'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { 
  MoreHorizontal, 
  Eye, 
  UserCheck, 
  Phone,
  UserX
} from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

interface DonorActionsProps {
  donor: {
    id: string
    name: string
    isVerified: boolean
    isAvailable: boolean
  }
}

export function DonorActions({ donor }: DonorActionsProps) {
  const [showVerifyDialog, setShowVerifyDialog] = useState(false)
  const [showContactDialog, setShowContactDialog] = useState(false)
  const [showAvailabilityDialog, setShowAvailabilityDialog] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleVerifyDonor = async () => {
    setIsLoading(true)
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      toast.success('Donor verified successfully')
      setShowVerifyDialog(false)
      // In real implementation, you would refresh the data
      window.location.reload()
    } catch (error) {
      toast.error('Failed to verify donor')
    } finally {
      setIsLoading(false)
    }
  }

  const handleToggleAvailability = async () => {
    setIsLoading(true)
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      const newStatus = donor.isAvailable ? 'unavailable' : 'available'
      toast.success(`Donor marked as ${newStatus}`)
      setShowAvailabilityDialog(false)
      // In real implementation, you would refresh the data
      window.location.reload()
    } catch (error) {
      toast.error('Failed to update donor status')
    } finally {
      setIsLoading(false)
    }
  }

  const handleContactDonor = () => {
    setShowContactDialog(true)
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem asChild>
            <Link href={`/dashboard/donors/${donor.id}`}>
              <Eye className="h-4 w-4 mr-2" />
              View Profile
            </Link>
          </DropdownMenuItem>
          {!donor.isVerified && (
            <DropdownMenuItem onClick={() => setShowVerifyDialog(true)}>
              <UserCheck className="h-4 w-4 mr-2" />
              Verify Donor
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onClick={handleContactDonor}>
            <Phone className="h-4 w-4 mr-2" />
            Contact Donor
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setShowAvailabilityDialog(true)}>
            <UserX className="h-4 w-4 mr-2" />
            {donor.isAvailable ? 'Mark Unavailable' : 'Mark Available'}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Verify Donor Dialog */}
      <Dialog open={showVerifyDialog} onOpenChange={setShowVerifyDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Verify Donor</DialogTitle>
            <DialogDescription>
              Are you sure you want to verify {donor.name}?
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              This action will mark the donor as verified and make them available for matching.
            </p>
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setShowVerifyDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleVerifyDonor} disabled={isLoading}>
              {isLoading ? 'Verifying...' : 'Verify Donor'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Contact Donor Dialog */}
      <Dialog open={showContactDialog} onOpenChange={setShowContactDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Contact Donor</DialogTitle>
            <DialogDescription>
              Contact options for {donor.name}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-3">
            <Button className="w-full justify-start" variant="outline">
              <Phone className="h-4 w-4 mr-2" />
              Call Donor
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <Phone className="h-4 w-4 mr-2" />
              Send SMS
            </Button>
            <p className="text-sm text-muted-foreground">
              Contact information is protected and only visible to verified staff.
            </p>
          </div>
          <div className="flex justify-end">
            <Button variant="outline" onClick={() => setShowContactDialog(false)}>
              Close
            </Button>
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
            <p className="text-sm text-muted-foreground">
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