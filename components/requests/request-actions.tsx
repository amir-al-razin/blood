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
  UserPlus, 
  CheckCircle, 
  XCircle 
} from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

interface RequestActionsProps {
  request: {
    id: string
    status: string
    referenceId: string
    requesterName: string
  }
}

export function RequestActions({ request }: RequestActionsProps) {
  const [showAssignDialog, setShowAssignDialog] = useState(false)
  const [showCompleteDialog, setShowCompleteDialog] = useState(false)
  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleAssignDonor = () => {
    setShowAssignDialog(true)
  }

  const handleMarkComplete = async () => {
    setIsLoading(true)
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      toast.success('Request marked as completed')
      setShowCompleteDialog(false)
      // In real implementation, you would refresh the data
      window.location.reload()
    } catch (error) {
      toast.error('Failed to update request')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancelRequest = async () => {
    setIsLoading(true)
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      toast.success('Request cancelled')
      setShowCancelDialog(false)
      // In real implementation, you would refresh the data
      window.location.reload()
    } catch (error) {
      toast.error('Failed to cancel request')
    } finally {
      setIsLoading(false)
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
          <DropdownMenuItem asChild>
            <Link href={`/dashboard/requests/${request.id}`}>
              <Eye className="h-4 w-4 mr-2" />
              View Details
            </Link>
          </DropdownMenuItem>
          {request.status === 'PENDING' && (
            <DropdownMenuItem onClick={handleAssignDonor}>
              <UserPlus className="h-4 w-4 mr-2" />
              Assign Donor
            </DropdownMenuItem>
          )}
          {request.status === 'IN_PROGRESS' && (
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

      {/* Assign Donor Dialog */}
      <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Donor</DialogTitle>
            <DialogDescription>
              This feature will allow you to search and assign compatible donors to this request.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              The donor assignment interface will include:
            </p>
            <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
              <li>• Search donors by blood type and location</li>
              <li>• Check donor availability and eligibility</li>
              <li>• Create match and send notifications</li>
            </ul>
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setShowAssignDialog(false)}>
              Cancel
            </Button>
            <Link href="/dashboard/matches">
              <Button>Go to Matches</Button>
            </Link>
          </div>
        </DialogContent>
      </Dialog>

      {/* Complete Dialog */}
      <Dialog open={showCompleteDialog} onOpenChange={setShowCompleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark Request as Completed</DialogTitle>
            <DialogDescription>
              Are you sure you want to mark request #{request.referenceId.slice(-8)} as completed?
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              This action will update the request status to completed and cannot be undone.
            </p>
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setShowCompleteDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleMarkComplete} disabled={isLoading}>
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
              Are you sure you want to cancel request #{request.referenceId.slice(-8)}?
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              This action will cancel the request and cannot be undone.
            </p>
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setShowCancelDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleCancelRequest} disabled={isLoading}>
              {isLoading ? 'Cancelling...' : 'Cancel Request'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}