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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { Shield, Phone, Mail, User } from 'lucide-react'

interface ContactAccessDialogProps {
  donorId: string
  donorName: string
  isOpen: boolean
  onClose: () => void
  onAccessGranted: (contactData: any) => void
}

export function ContactAccessDialog({
  donorId,
  donorName,
  isOpen,
  onClose,
  onAccessGranted
}: ContactAccessDialogProps) {
  const [accessType, setAccessType] = useState<'phone' | 'email' | 'full'>('phone')
  const [reason, setReason] = useState('')
  const [requestId, setRequestId] = useState('')
  const [loading, setLoading] = useState(false)

  const handleRequestAccess = async () => {
    if (reason.length < 10) {
      toast.error('Please provide a detailed reason (at least 10 characters)')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/privacy/contact-access', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          donorId,
          requestId: requestId || undefined,
          reason,
          accessType
        })
      })

      if (response.ok) {
        const data = await response.json()
        toast.success('Contact access granted')
        onAccessGranted(data.donor)
        onClose()
        // Reset form
        setReason('')
        setRequestId('')
        setAccessType('phone')
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to access contact information')
      }
    } catch (error) {
      console.error('Error requesting contact access:', error)
      toast.error('Failed to access contact information')
    } finally {
      setLoading(false)
    }
  }

  const getAccessTypeIcon = () => {
    switch (accessType) {
      case 'phone':
        return <Phone className="h-4 w-4" />
      case 'email':
        return <Mail className="h-4 w-4" />
      case 'full':
        return <User className="h-4 w-4" />
    }
  }

  const getAccessTypeDescription = () => {
    switch (accessType) {
      case 'phone':
        return 'Access to phone number only'
      case 'email':
        return 'Access to email address only'
      case 'full':
        return 'Access to all contact information and personal details'
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-red-600" />
            Request Contact Access
          </DialogTitle>
          <DialogDescription>
            Request access to contact information for <strong>{donorName}</strong>.
            This action will be logged for audit purposes.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="accessType">Access Type</Label>
            <Select value={accessType} onValueChange={(value: any) => setAccessType(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="phone">
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    Phone Number Only
                  </div>
                </SelectItem>
                <SelectItem value="email">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Email Address Only
                  </div>
                </SelectItem>
                <SelectItem value="full">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Full Contact Information
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-gray-600 flex items-center gap-2">
              {getAccessTypeIcon()}
              {getAccessTypeDescription()}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="requestId">Related Request ID (Optional)</Label>
            <Input
              id="requestId"
              placeholder="e.g., REQ-2024-001"
              value={requestId}
              onChange={(e) => setRequestId(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">Reason for Access *</Label>
            <Textarea
              id="reason"
              placeholder="Please provide a detailed reason for accessing this donor's contact information..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
            />
            <p className="text-sm text-gray-600">
              {reason.length}/10 characters minimum
            </p>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <Shield className="h-4 w-4 text-yellow-600 mt-0.5" />
              <div className="text-sm text-yellow-800">
                <p className="font-medium">Privacy Notice</p>
                <p>This access request will be logged with your user ID, timestamp, and reason. Use donor contact information responsibly and only for legitimate donation coordination purposes.</p>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button 
            onClick={handleRequestAccess} 
            disabled={loading || reason.length < 10}
          >
            {loading ? 'Requesting...' : 'Request Access'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}