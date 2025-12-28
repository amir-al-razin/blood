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
  CheckCircle,
  XCircle,
  Phone,
  Mail,
  MapPin,
  Building,
  Droplets,
  Clock,
  AlertTriangle,
  FileText
} from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'

interface RequestActionsProps {
  request: {
    id: string
    referenceId: string
    requesterName: string
    requesterPhone: string
    requesterEmail?: string | null
    bloodType: string
    unitsRequired: number
    urgencyLevel: string
    hospital: string
    location: string
    patientName?: string | null
    patientAge?: number | null
    patientRelation?: string | null
    reason?: string | null
    notes?: string | null
    status: string
    createdAt: Date | string
    matches?: any[]
  }
}

export function RequestActions({ request }: RequestActionsProps) {
  const [showDetailsDialog, setShowDetailsDialog] = useState(false)
  const [showCompleteDialog, setShowCompleteDialog] = useState(false)
  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const [showInProgressDialog, setShowInProgressDialog] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const updateStatus = async (status: string, successMessage: string) => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/admin/requests/${request.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      })

      if (response.ok) {
        toast.success(successMessage)
        window.location.reload()
      } else {
        const data = await response.json()
        toast.error(data.error || 'Failed to update request')
      }
    } catch (error) {
      toast.error('Failed to update request')
    } finally {
      setIsLoading(false)
    }
  }

  const formatBloodType = (type: string) =>
    type.replace('_POSITIVE', '+').replace('_NEGATIVE', '-')

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
      case 'IN_PROGRESS':
        return <Badge className="bg-blue-100 text-blue-800">In Progress</Badge>
      case 'COMPLETED':
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>
      case 'CANCELLED':
        return <Badge className="bg-gray-100 text-gray-600">Cancelled</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  const getUrgencyBadge = (urgency: string) => {
    switch (urgency) {
      case 'CRITICAL':
        return <Badge className="bg-red-500 text-white"><AlertTriangle className="h-3 w-3 mr-1" />Critical</Badge>
      case 'URGENT':
        return <Badge className="bg-orange-100 text-orange-700"><Clock className="h-3 w-3 mr-1" />Urgent</Badge>
      default:
        return <Badge className="bg-gray-100 text-gray-600">Normal</Badge>
    }
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
          <DropdownMenuItem onClick={() => setShowDetailsDialog(true)}>
            <Eye className="h-4 w-4 mr-2" />
            View Details
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {request.status === 'PENDING' && (
            <DropdownMenuItem onClick={() => setShowInProgressDialog(true)}>
              <Clock className="h-4 w-4 mr-2" />
              Start Processing
            </DropdownMenuItem>
          )}
          {(request.status === 'PENDING' || request.status === 'IN_PROGRESS') && (
            <DropdownMenuItem onClick={() => setShowCompleteDialog(true)}>
              <CheckCircle className="h-4 w-4 mr-2" />
              Mark Complete
            </DropdownMenuItem>
          )}
          {request.status !== 'COMPLETED' && request.status !== 'CANCELLED' && (
            <DropdownMenuItem
              className="text-red-600"
              onClick={() => setShowCancelDialog(true)}
            >
              <XCircle className="h-4 w-4 mr-2" />
              Cancel Request
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* View Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              Request #{request.referenceId.slice(-8).toUpperCase()}
              <Badge variant="outline" className="font-mono text-red-600 border-red-600">
                {formatBloodType(request.bloodType)}
              </Badge>
            </DialogTitle>
            <DialogDescription className="flex gap-2 flex-wrap">
              {getStatusBadge(request.status)}
              {getUrgencyBadge(request.urgencyLevel)}
              <Badge variant="outline">{request.unitsRequired} units</Badge>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Requester Info */}
            <div className="bg-gray-50 rounded-lg p-3 space-y-2">
              <h4 className="font-medium text-sm text-gray-500">Requester</h4>
              <div className="font-medium">{request.requesterName}</div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-gray-400" />
                <span>{request.requesterPhone}</span>
                <a href={`tel:${request.requesterPhone}`} className="ml-auto">
                  <Button size="sm" className="bg-green-600 hover:bg-green-700 h-7">Call</Button>
                </a>
              </div>
              {request.requesterEmail && (
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <span className="text-sm">{request.requesterEmail}</span>
                </div>
              )}
            </div>

            {/* Location */}
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-gray-500">Hospital:</span>
                <p className="font-medium">{request.hospital}</p>
              </div>
              <div>
                <span className="text-gray-500">Location:</span>
                <p className="font-medium">{request.location}</p>
              </div>
            </div>

            {/* Patient Info */}
            {(request.patientName || request.patientAge || request.patientRelation) && (
              <div className="grid grid-cols-3 gap-3 text-sm">
                {request.patientName && (
                  <div>
                    <span className="text-gray-500">Patient:</span>
                    <p className="font-medium">{request.patientName}</p>
                  </div>
                )}
                {request.patientAge && (
                  <div>
                    <span className="text-gray-500">Age:</span>
                    <p className="font-medium">{request.patientAge}</p>
                  </div>
                )}
                {request.patientRelation && (
                  <div>
                    <span className="text-gray-500">Relation:</span>
                    <p className="font-medium">{request.patientRelation}</p>
                  </div>
                )}
              </div>
            )}

            {/* Reason */}
            {request.reason && (
              <div className="text-sm">
                <span className="text-gray-500">Reason:</span>
                <p className="font-medium">{request.reason}</p>
              </div>
            )}

            {/* Notes */}
            {request.notes && (
              <div className="text-sm">
                <span className="text-gray-500">Notes:</span>
                <p className="font-medium">{request.notes}</p>
              </div>
            )}

            {/* Matches */}
            {request.matches && request.matches.length > 0 && (
              <div className="text-sm">
                <span className="text-gray-500">Matched Donors: {request.matches.length}</span>
              </div>
            )}

            {/* Created */}
            <div className="text-xs text-gray-500 pt-2 border-t">
              Created: {format(new Date(request.createdAt), 'MMM d, yyyy h:mm a')}
            </div>
          </div>

          <div className="flex justify-between pt-2">
            {request.status === 'PENDING' && (
              <Button onClick={() => { setShowDetailsDialog(false); setShowInProgressDialog(true); }} className="bg-blue-600 hover:bg-blue-700">
                <Clock className="h-4 w-4 mr-1" />
                Start Processing
              </Button>
            )}
            {request.status === 'IN_PROGRESS' && (
              <Button onClick={() => { setShowDetailsDialog(false); setShowCompleteDialog(true); }} className="bg-green-600 hover:bg-green-700">
                <CheckCircle className="h-4 w-4 mr-1" />
                Complete
              </Button>
            )}
            <Button variant="outline" onClick={() => setShowDetailsDialog(false)} className="ml-auto">
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Start Processing Dialog */}
      <Dialog open={showInProgressDialog} onOpenChange={setShowInProgressDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Start Processing Request</DialogTitle>
            <DialogDescription>
              Mark request #{request.referenceId.slice(-8)} as in progress?
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-gray-600">
              This indicates you've contacted the requester and are working on finding donors.
            </p>
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setShowInProgressDialog(false)}>
              Cancel
            </Button>
            <Button onClick={() => updateStatus('IN_PROGRESS', 'Request marked as in progress')} disabled={isLoading} className="bg-blue-600 hover:bg-blue-700">
              {isLoading ? 'Updating...' : 'Start Processing'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Complete Dialog */}
      <Dialog open={showCompleteDialog} onOpenChange={setShowCompleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark Request as Completed</DialogTitle>
            <DialogDescription>
              Mark request #{request.referenceId.slice(-8)} as completed?
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-gray-600">
              This means blood was successfully provided to the patient.
            </p>
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setShowCompleteDialog(false)}>
              Cancel
            </Button>
            <Button onClick={() => updateStatus('COMPLETED', 'Request marked as completed')} disabled={isLoading} className="bg-green-600 hover:bg-green-700">
              {isLoading ? 'Updating...' : 'Mark Complete'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Cancel Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Request</DialogTitle>
            <DialogDescription>
              Cancel request #{request.referenceId.slice(-8)}?
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-gray-600">
              This action cannot be undone. Use this if the request is no longer needed.
            </p>
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setShowCancelDialog(false)}>
              Keep Request
            </Button>
            <Button variant="destructive" onClick={() => updateStatus('CANCELLED', 'Request cancelled')} disabled={isLoading}>
              {isLoading ? 'Cancelling...' : 'Cancel Request'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}