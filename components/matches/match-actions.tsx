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
  Phone, 
  CheckCircle, 
  XCircle,
  MessageSquare
} from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

interface MatchActionsProps {
  match: {
    id: string
    status: string
    donor: {
      name: string
    }
  }
}

export function MatchActions({ match }: MatchActionsProps) {
  const [showContactedDialog, setShowContactedDialog] = useState(false)
  const [showAcceptedDialog, setShowAcceptedDialog] = useState(false)
  const [showRejectedDialog, setShowRejectedDialog] = useState(false)
  const [showCompletedDialog, setShowCompletedDialog] = useState(false)
  const [showNotesDialog, setShowNotesDialog] = useState(false)
  const [notes, setNotes] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const updateMatchStatus = async (status: string) => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/matches/${match.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      })

      const data = await response.json()
      
      if (response.ok) {
        toast.success(data.message || `Match marked as ${status.toLowerCase()}`)
        window.location.reload()
      } else {
        toast.error(data.error || 'Failed to update match')
      }
    } catch (error) {
      console.error('Error updating match:', error)
      toast.error('Failed to update match')
    } finally {
      setIsLoading(false)
    }
  }

  const handleMarkContacted = async () => {
    await updateMatchStatus('CONTACTED')
    setShowContactedDialog(false)
  }

  const handleMarkAccepted = async () => {
    await updateMatchStatus('ACCEPTED')
    setShowAcceptedDialog(false)
  }

  const handleMarkRejected = async () => {
    await updateMatchStatus('REJECTED')
    setShowRejectedDialog(false)
  }

  const handleMarkCompleted = async () => {
    await updateMatchStatus('COMPLETED')
    setShowCompletedDialog(false)
  }

  const handleSaveNotes = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/matches/${match.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          status: match.status, // Keep current status
          notes: notes.trim()
        })
      })

      const data = await response.json()
      
      if (response.ok) {
        toast.success('Notes saved successfully')
        setShowNotesDialog(false)
        setNotes('')
        window.location.reload()
      } else {
        toast.error(data.error || 'Failed to save notes')
      }
    } catch (error) {
      console.error('Error saving notes:', error)
      toast.error('Failed to save notes')
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
            <Link href={`/dashboard/matches/${match.id}`}>
              <Eye className="h-4 w-4 mr-2" />
              View Details
            </Link>
          </DropdownMenuItem>
          {match.status === 'PENDING' && (
            <DropdownMenuItem onClick={() => setShowContactedDialog(true)}>
              <Phone className="h-4 w-4 mr-2" />
              Mark as Contacted
            </DropdownMenuItem>
          )}
          {match.status === 'CONTACTED' && (
            <>
              <DropdownMenuItem onClick={() => setShowAcceptedDialog(true)}>
                <CheckCircle className="h-4 w-4 mr-2" />
                Mark as Accepted
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShowRejectedDialog(true)}>
                <XCircle className="h-4 w-4 mr-2" />
                Mark as Rejected
              </DropdownMenuItem>
            </>
          )}
          {match.status === 'ACCEPTED' && (
            <DropdownMenuItem onClick={() => setShowCompletedDialog(true)}>
              <CheckCircle className="h-4 w-4 mr-2" />
              Mark as Completed
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onClick={() => setShowNotesDialog(true)}>
            <MessageSquare className="h-4 w-4 mr-2" />
            Add Notes
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Contacted Dialog */}
      <Dialog open={showContactedDialog} onOpenChange={setShowContactedDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark as Contacted</DialogTitle>
            <DialogDescription>
              Confirm that you have contacted {match.donor.name}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              This will update the match status to "Contacted" and record the contact timestamp.
            </p>
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setShowContactedDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleMarkContacted} disabled={isLoading}>
              {isLoading ? 'Updating...' : 'Mark as Contacted'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Accepted Dialog */}
      <Dialog open={showAcceptedDialog} onOpenChange={setShowAcceptedDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark as Accepted</DialogTitle>
            <DialogDescription>
              Confirm that {match.donor.name} has accepted the donation request
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              This will update the match status to "Accepted" and the donor can proceed with donation.
            </p>
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setShowAcceptedDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleMarkAccepted} disabled={isLoading}>
              {isLoading ? 'Updating...' : 'Mark as Accepted'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Rejected Dialog */}
      <Dialog open={showRejectedDialog} onOpenChange={setShowRejectedDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark as Rejected</DialogTitle>
            <DialogDescription>
              Confirm that {match.donor.name} has rejected the donation request
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              This will update the match status to "Rejected" and you may need to find another donor.
            </p>
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setShowRejectedDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleMarkRejected} disabled={isLoading}>
              {isLoading ? 'Updating...' : 'Mark as Rejected'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Completed Dialog */}
      <Dialog open={showCompletedDialog} onOpenChange={setShowCompletedDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark as Completed</DialogTitle>
            <DialogDescription>
              Confirm that the blood donation has been completed successfully
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              This will mark the donation as completed and update all related records.
            </p>
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setShowCompletedDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleMarkCompleted} disabled={isLoading}>
              {isLoading ? 'Updating...' : 'Mark as Completed'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Notes Dialog */}
      <Dialog open={showNotesDialog} onOpenChange={setShowNotesDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Notes</DialogTitle>
            <DialogDescription>
              Add notes or comments about this match
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <textarea 
              className="w-full p-3 border rounded-md resize-none"
              rows={4}
              placeholder="Enter your notes here..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setShowNotesDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSaveNotes}
              disabled={isLoading || !notes.trim()}
            >
              {isLoading ? 'Saving...' : 'Save Notes'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}