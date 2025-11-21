'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'
import { Trash2, AlertTriangle, Shield } from 'lucide-react'

interface DataDeletionDialogProps {
  donorId: string
  donorName: string
  isOpen: boolean
  onClose: () => void
  onDeleted: () => void
  mode: 'request' | 'execute'
}

export function DataDeletionDialog({
  donorId,
  donorName,
  isOpen,
  onClose,
  onDeleted,
  mode
}: DataDeletionDialogProps) {
  const [reason, setReason] = useState('')
  const [confirmDeletion, setConfirmDeletion] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    if (reason.length < 10) {
      toast.error('Please provide a detailed reason (at least 10 characters)')
      return
    }

    if (mode === 'execute' && !confirmDeletion) {
      toast.error('Please confirm that you want to permanently delete this data')
      return
    }

    setLoading(true)
    try {
      const endpoint = '/api/privacy/data-deletion'
      const method = mode === 'execute' ? 'DELETE' : 'POST'
      
      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          donorId,
          reason,
          ...(mode === 'execute' && { confirmDeletion })
        })
      })

      if (response.ok) {
        const action = mode === 'execute' ? 'executed' : 'requested'
        toast.success(`Data deletion ${action} successfully`)
        onDeleted()
        onClose()
        // Reset form
        setReason('')
        setConfirmDeletion(false)
      } else {
        const error = await response.json()
        toast.error(error.error || `Failed to ${mode} data deletion`)
      }
    } catch (error) {
      console.error(`Error ${mode}ing data deletion:`, error)
      toast.error(`Failed to ${mode} data deletion`)
    } finally {
      setLoading(false)
    }
  }

  const getTitle = () => {
    return mode === 'execute' 
      ? 'Execute Data Deletion' 
      : 'Request Data Deletion'
  }

  const getDescription = () => {
    return mode === 'execute'
      ? `Permanently delete all personal data for ${donorName}. This action cannot be undone.`
      : `Request deletion of personal data for ${donorName}. The donor will be marked for deletion and made unavailable.`
  }

  const getButtonText = () => {
    if (loading) {
      return mode === 'execute' ? 'Deleting...' : 'Requesting...'
    }
    return mode === 'execute' ? 'Delete Data' : 'Request Deletion'
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <Trash2 className="h-5 w-5" />
            {getTitle()}
          </DialogTitle>
          <DialogDescription>
            {getDescription()}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="reason">Reason for Deletion *</Label>
            <Textarea
              id="reason"
              placeholder="Please provide a detailed reason for the data deletion request..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
            />
            <p className="text-sm text-gray-600">
              {reason.length}/10 characters minimum
            </p>
          </div>

          {mode === 'execute' && (
            <div className="space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                  <div className="text-sm text-red-800">
                    <p className="font-medium">Warning: Permanent Deletion</p>
                    <ul className="mt-2 space-y-1 list-disc list-inside">
                      <li>All personal information will be permanently deleted</li>
                      <li>Contact details will be removed from the database</li>
                      <li>Donation history will be anonymized but preserved</li>
                      <li>This action cannot be undone</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="confirmDeletion"
                  checked={confirmDeletion}
                  onCheckedChange={(checked) => setConfirmDeletion(checked as boolean)}
                />
                <Label htmlFor="confirmDeletion" className="text-sm">
                  I understand that this will permanently delete all personal data for <strong>{donorName}</strong>
                </Label>
              </div>
            </div>
          )}

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <Shield className="h-4 w-4 text-blue-600 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-medium">Audit Trail</p>
                <p>This action will be logged with your user ID, timestamp, and reason for compliance purposes.</p>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button 
            variant={mode === 'execute' ? 'destructive' : 'default'}
            onClick={handleSubmit} 
            disabled={
              loading || 
              reason.length < 10 || 
              (mode === 'execute' && !confirmDeletion)
            }
          >
            {getButtonText()}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}