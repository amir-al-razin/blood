'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
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
  UserX,
  Mail,
  MapPin,
  Calendar,
  Droplets,
  Loader2
} from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'

interface DonorActionsProps {
  donor: {
    id: string
    name: string
    phone: string
    email?: string | null
    bloodType: string
    area: string
    location: string
    dateOfBirth?: Date | string
    gender?: string
    weight?: number
    address?: string
    notes?: string
    isVerified: boolean
    isAvailable: boolean
    donationCount?: number
    lastDonation?: Date | string | null
    createdAt?: Date | string
  }
}

export function DonorActions({ donor }: DonorActionsProps) {
  const [showDetailsDialog, setShowDetailsDialog] = useState(false)
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

  const formatBloodType = (type: string) =>
    type.replace('_POSITIVE', '+').replace('_NEGATIVE', '-')

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setShowDetailsDialog(true)}>
            <Eye className="h-4 w-4 mr-2" />
            View Details
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setShowContactDialog(true)}>
            <Phone className="h-4 w-4 mr-2" />
            Contact Donor
          </DropdownMenuItem>
          {!donor.isVerified && (
            <DropdownMenuItem onClick={() => setShowVerifyDialog(true)}>
              <UserCheck className="h-4 w-4 mr-2" />
              Verify Donor
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onClick={() => setShowAvailabilityDialog(true)}>
            <UserX className="h-4 w-4 mr-2" />
            {donor.isAvailable ? 'Mark Unavailable' : 'Mark Available'}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* View Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {donor.name}
              <Badge variant="outline" className="font-mono text-red-600 border-red-600">
                {formatBloodType(donor.bloodType)}
              </Badge>
            </DialogTitle>
            <DialogDescription className="flex gap-2">
              {donor.isVerified ? (
                <Badge className="bg-green-100 text-green-800">Verified</Badge>
              ) : (
                <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
              )}
              {donor.isAvailable ? (
                <Badge className="bg-blue-100 text-blue-800">Available</Badge>
              ) : (
                <Badge className="bg-gray-100 text-gray-600">Unavailable</Badge>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Contact Info */}
            <div className="bg-gray-50 rounded-lg p-3 space-y-2">
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-gray-400" />
                <span className="font-medium">{donor.phone}</span>
                <a href={`tel:${donor.phone}`} className="ml-auto">
                  <Button size="sm" className="bg-green-600 hover:bg-green-700 h-7">Call</Button>
                </a>
              </div>
              {donor.email && (
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <span className="text-sm">{donor.email}</span>
                </div>
              )}
            </div>

            {/* Location */}
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-gray-500">Area:</span>
                <p className="font-medium">{donor.area}</p>
              </div>
              <div>
                <span className="text-gray-500">Location:</span>
                <p className="font-medium">{donor.location}</p>
              </div>
              {donor.address && (
                <div className="col-span-2">
                  <span className="text-gray-500">Address:</span>
                  <p className="font-medium">{donor.address}</p>
                </div>
              )}
            </div>

            {/* Personal Info */}
            <div className="grid grid-cols-3 gap-3 text-sm">
              {donor.gender && (
                <div>
                  <span className="text-gray-500">Gender:</span>
                  <p className="font-medium capitalize">{donor.gender.toLowerCase()}</p>
                </div>
              )}
              {donor.weight && (
                <div>
                  <span className="text-gray-500">Weight:</span>
                  <p className="font-medium">{donor.weight} kg</p>
                </div>
              )}
              {donor.dateOfBirth && (
                <div>
                  <span className="text-gray-500">DOB:</span>
                  <p className="font-medium">{format(new Date(donor.dateOfBirth), 'MMM d, yyyy')}</p>
                </div>
              )}
            </div>

            {/* Donation Info */}
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-gray-500">Donations:</span>
                <p className="font-medium text-red-600">{donor.donationCount || 0}</p>
              </div>
              <div>
                <span className="text-gray-500">Last Donation:</span>
                <p className="font-medium">
                  {donor.lastDonation ? format(new Date(donor.lastDonation), 'MMM d, yyyy') : 'Never'}
                </p>
              </div>
            </div>

            {/* Notes */}
            {donor.notes && (
              <div className="text-sm">
                <span className="text-gray-500">Notes:</span>
                <p className="font-medium">{donor.notes}</p>
              </div>
            )}

            {/* Registered */}
            {donor.createdAt && (
              <div className="text-xs text-gray-500 pt-2 border-t">
                Registered: {format(new Date(donor.createdAt), 'MMM d, yyyy')}
              </div>
            )}
          </div>

          <div className="flex justify-between pt-2">
            {!donor.isVerified && (
              <Button onClick={() => { setShowDetailsDialog(false); setShowVerifyDialog(true); }} className="bg-green-600 hover:bg-green-700">
                <UserCheck className="h-4 w-4 mr-1" />
                Verify
              </Button>
            )}
            <Button variant="outline" onClick={() => setShowDetailsDialog(false)} className="ml-auto">
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Verify Donor Dialog */}
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

      {/* Contact Donor Dialog */}
      <Dialog open={showContactDialog} onOpenChange={setShowContactDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Contact {donor.name}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
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