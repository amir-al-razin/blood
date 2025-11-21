'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Search, 
  MapPin, 
  Clock, 
  Heart, 
  AlertCircle,
  CheckCircle,
  Users,
  Phone
} from 'lucide-react'
import { toast } from 'sonner'

interface CreateMatchDialogProps {
  children: React.ReactNode
}

interface BloodRequest {
  id: string
  referenceId: string
  requesterName: string
  bloodType: string
  location: string
  hospital: string
  urgencyLevel: string
  unitsRequired: number
  matchedCount: number
}

interface Donor {
  id: string
  name: string
  bloodType: string
  area: string
  location: string
  reliabilityScore: number
  donationCount: number
  lastDonation: string | null
  distance: number
  isEligible: boolean
  nextEligibleDate: string | null
  compatibilityScore: number
}

export function CreateMatchDialog({ children }: CreateMatchDialogProps) {
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState<'select-request' | 'find-donors' | 'create-match'>('select-request')
  const [requests, setRequests] = useState<BloodRequest[]>([])
  const [selectedRequest, setSelectedRequest] = useState<BloodRequest | null>(null)
  const [donors, setDonors] = useState<Donor[]>([])
  const [selectedDonors, setSelectedDonors] = useState<string[]>([])
  const [notes, setNotes] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [maxDistance, setMaxDistance] = useState(50)

  // Fetch pending requests
  useEffect(() => {
    if (open && step === 'select-request') {
      fetchRequests()
    }
  }, [open, step])

  const fetchRequests = async () => {
    try {
      const response = await fetch('/api/requests?status=PENDING&status=IN_PROGRESS&limit=50')
      const data = await response.json()
      setRequests(data.requests || [])
    } catch (error) {
      console.error('Error fetching requests:', error)
      toast.error('Failed to load requests')
    }
  }

  const findCompatibleDonors = async () => {
    if (!selectedRequest) return

    setIsLoading(true)
    try {
      const response = await fetch('/api/matches/find-donors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId: selectedRequest.id,
          maxDistance,
          limit: 20
        })
      })

      const data = await response.json()
      if (response.ok) {
        setDonors(data.donors || [])
        setStep('find-donors')
      } else {
        toast.error(data.error || 'Failed to find donors')
      }
    } catch (error) {
      console.error('Error finding donors:', error)
      toast.error('Failed to find donors')
    } finally {
      setIsLoading(false)
    }
  }

  const createMatches = async () => {
    if (!selectedRequest || selectedDonors.length === 0) return

    setIsLoading(true)
    try {
      const promises = selectedDonors.map(donorId =>
        fetch('/api/matches', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            donorId,
            requestId: selectedRequest.id,
            notes
          })
        })
      )

      const responses = await Promise.all(promises)
      const results = await Promise.all(responses.map(r => r.json()))
      
      const successful = results.filter(r => r.success).length
      const failed = results.filter(r => !r.success).length

      if (successful > 0) {
        toast.success(`Created ${successful} match(es) successfully`)
        if (failed > 0) {
          toast.warning(`${failed} match(es) failed to create`)
        }
        handleClose()
        window.location.reload() // Refresh the matches table
      } else {
        toast.error('Failed to create any matches')
      }
    } catch (error) {
      console.error('Error creating matches:', error)
      toast.error('Failed to create matches')
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    setOpen(false)
    setStep('select-request')
    setSelectedRequest(null)
    setDonors([])
    setSelectedDonors([])
    setNotes('')
  }

  const getUrgencyBadge = (urgency: string) => {
    switch (urgency) {
      case 'CRITICAL':
        return <Badge variant="destructive">Critical</Badge>
      case 'URGENT':
        return <Badge className="bg-orange-100 text-orange-800">Urgent</Badge>
      case 'NORMAL':
        return <Badge variant="secondary">Normal</Badge>
      default:
        return <Badge variant="secondary">{urgency}</Badge>
    }
  }

  const getBloodTypeBadge = (bloodType: string) => {
    return (
      <Badge variant="outline" className="font-mono">
        {bloodType.replace('_', '')}
      </Badge>
    )
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Match</DialogTitle>
          <DialogDescription>
            {step === 'select-request' && 'Select a blood request to match with donors'}
            {step === 'find-donors' && 'Select compatible donors for the request'}
            {step === 'create-match' && 'Review and create the matches'}
          </DialogDescription>
        </DialogHeader>

        {/* Step 1: Select Request */}
        {step === 'select-request' && (
          <div className="space-y-4">
            <div className="grid gap-4 max-h-96 overflow-y-auto">
              {requests.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No pending requests found
                </div>
              ) : (
                requests.map((request) => (
                  <Card 
                    key={request.id}
                    className={`cursor-pointer transition-colors ${
                      selectedRequest?.id === request.id ? 'ring-2 ring-red-500' : 'hover:bg-gray-50'
                    }`}
                    onClick={() => setSelectedRequest(request)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-sm">{request.referenceId.slice(-8)}</span>
                            {getUrgencyBadge(request.urgencyLevel)}
                            {getBloodTypeBadge(request.bloodType)}
                          </div>
                          <div className="font-medium">{request.requesterName}</div>
                          <div className="text-sm text-muted-foreground flex items-center gap-4">
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {request.hospital}
                            </span>
                            <span className="flex items-center gap-1">
                              <Users className="w-3 h-3" />
                              {request.unitsRequired} unit(s)
                            </span>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {request.matchedCount > 0 && (
                              <span>
                                {request.matchedCount}/{request.unitsRequired} unit(s) matched
                                {request.matchedCount >= request.unitsRequired && (
                                  <span className="text-green-600 ml-2">✓ Fully matched</span>
                                )}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
            
            <div className="flex justify-between">
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button 
                onClick={findCompatibleDonors}
                disabled={!selectedRequest || isLoading}
              >
                {isLoading ? 'Finding Donors...' : 'Find Compatible Donors'}
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Find Donors */}
        {step === 'find-donors' && selectedRequest && (
          <div className="space-y-4">
            {/* Request Summary */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Selected Request</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-mono">{selectedRequest.referenceId.slice(-8)}</span>
                  {getBloodTypeBadge(selectedRequest.bloodType)}
                  {getUrgencyBadge(selectedRequest.urgencyLevel)}
                  <span>• {selectedRequest.unitsRequired} unit(s) needed</span>
                </div>
              </CardContent>
            </Card>

            {/* Distance Filter */}
            <div className="flex items-center gap-4">
              <Label htmlFor="maxDistance">Max Distance (km):</Label>
              <Input
                id="maxDistance"
                type="number"
                value={maxDistance}
                onChange={(e) => setMaxDistance(parseInt(e.target.value) || 50)}
                className="w-24"
                min="1"
                max="500"
              />
              <Button 
                variant="outline" 
                size="sm"
                onClick={findCompatibleDonors}
                disabled={isLoading}
              >
                <Search className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>

            {/* Donors List */}
            <div className="grid gap-3 max-h-96 overflow-y-auto">
              {donors.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No compatible donors found within {maxDistance}km
                </div>
              ) : (
                donors.map((donor) => (
                  <Card 
                    key={donor.id}
                    className={`cursor-pointer transition-colors ${
                      selectedDonors.includes(donor.id) ? 'ring-2 ring-red-500' : 'hover:bg-gray-50'
                    } ${!donor.isEligible ? 'opacity-60' : ''}`}
                    onClick={() => {
                      if (donor.isEligible) {
                        setSelectedDonors(prev => 
                          prev.includes(donor.id) 
                            ? prev.filter(id => id !== donor.id)
                            : [...prev, donor.id]
                        )
                      }
                    }}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{donor.name}</span>
                            {getBloodTypeBadge(donor.bloodType)}
                            {donor.isEligible ? (
                              <CheckCircle className="w-4 h-4 text-green-600" />
                            ) : (
                              <AlertCircle className="w-4 h-4 text-orange-600" />
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground flex items-center gap-4">
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {donor.area} ({donor.distance}km)
                            </span>
                            <span className="flex items-center gap-1">
                              <Heart className="w-3 h-3" />
                              {donor.donationCount} donations
                            </span>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Score: {donor.compatibilityScore.toFixed(1)} • 
                            Reliability: {donor.reliabilityScore.toFixed(1)}
                            {!donor.isEligible && donor.nextEligibleDate && (
                              <span className="text-orange-600 ml-2">
                                Next eligible: {new Date(donor.nextEligibleDate).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notes (optional)</Label>
              <Textarea
                id="notes"
                placeholder="Add any notes about this match..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>

            {/* Multi-donor assignment warning */}
            {selectedRequest && selectedDonors.length + selectedRequest.matchedCount > selectedRequest.unitsRequired && (
              <div className="bg-orange-50 border border-orange-200 rounded-md p-3">
                <div className="flex items-center gap-2 text-orange-800">
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-sm font-medium">Over-assignment Warning</span>
                </div>
                <p className="text-sm text-orange-700 mt-1">
                  You're assigning {selectedDonors.length + selectedRequest.matchedCount} donors for {selectedRequest.unitsRequired} unit(s). 
                  This may result in extra donors being contacted.
                </p>
              </div>
            )}

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep('select-request')}>
                Back
              </Button>
              <Button 
                onClick={createMatches}
                disabled={selectedDonors.length === 0 || isLoading}
              >
                {isLoading ? 'Creating Matches...' : `Create ${selectedDonors.length} Match(es)`}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}