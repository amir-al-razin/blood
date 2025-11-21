'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { FileText, Shield, Eye, User, Calendar } from 'lucide-react'
import { format } from 'date-fns'

interface AuditLogEntry {
  id: string
  action: string
  details?: any
  ipAddress?: string
  userAgent?: string
  sensitive: boolean
  createdAt: string
  user?: {
    id: string
    name: string
    email: string
    role: string
  }
}

interface AuditTrailDialogProps {
  entityType: string
  entityId: string
  entityName: string
  isOpen: boolean
  onClose: () => void
}

export function AuditTrailDialog({
  entityType,
  entityId,
  entityName,
  isOpen,
  onClose
}: AuditTrailDialogProps) {
  const [auditTrail, setAuditTrail] = useState<AuditLogEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [sensitiveOnly, setSensitiveOnly] = useState(false)

  useEffect(() => {
    if (isOpen) {
      fetchAuditTrail()
    }
  }, [isOpen, sensitiveOnly])

  const fetchAuditTrail = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        entityType,
        entityId,
        ...(sensitiveOnly && { sensitiveOnly: 'true' })
      })

      const response = await fetch(`/api/privacy/audit?${params}`)
      if (response.ok) {
        const data = await response.json()
        setAuditTrail(data.auditTrail)
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to load audit trail')
      }
    } catch (error) {
      console.error('Error fetching audit trail:', error)
      toast.error('Failed to load audit trail')
    } finally {
      setLoading(false)
    }
  }

  const getActionIcon = (action: string) => {
    if (action.includes('VIEW') || action.includes('ACCESS')) {
      return <Eye className="h-4 w-4" />
    }
    if (action.includes('UPDATE') || action.includes('CREATE')) {
      return <FileText className="h-4 w-4" />
    }
    if (action.includes('DELETE')) {
      return <Shield className="h-4 w-4" />
    }
    return <User className="h-4 w-4" />
  }

  const getActionColor = (action: string, sensitive: boolean) => {
    if (sensitive) return 'destructive'
    if (action.includes('VIEW') || action.includes('ACCESS')) return 'secondary'
    if (action.includes('UPDATE') || action.includes('CREATE')) return 'default'
    if (action.includes('DELETE')) return 'destructive'
    return 'default'
  }

  const formatAction = (action: string) => {
    return action
      .replace(/_/g, ' ')
      .toLowerCase()
      .replace(/\b\w/g, l => l.toUpperCase())
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Audit Trail - {entityName}
          </DialogTitle>
          <DialogDescription>
            Complete audit log of all actions performed on this {entityType}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="sensitiveOnly"
              checked={sensitiveOnly}
              onCheckedChange={(checked) => setSensitiveOnly(checked as boolean)}
            />
            <Label htmlFor="sensitiveOnly" className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-red-600" />
              Show sensitive data access only
            </Label>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {auditTrail.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No audit entries found
                </div>
              ) : (
                auditTrail.map((entry) => (
                  <div
                    key={entry.id}
                    className={`border rounded-lg p-4 space-y-2 ${
                      entry.sensitive ? 'border-red-200 bg-red-50' : 'border-gray-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getActionIcon(entry.action)}
                        <Badge variant={getActionColor(entry.action, entry.sensitive)}>
                          {formatAction(entry.action)}
                        </Badge>
                        {entry.sensitive && (
                          <Badge variant="destructive" className="text-xs">
                            <Shield className="h-3 w-3 mr-1" />
                            Sensitive
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Calendar className="h-4 w-4" />
                        {format(new Date(entry.createdAt), 'MMM dd, yyyy HH:mm')}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-sm">
                      <User className="h-4 w-4 text-gray-400" />
                      <span>
                        {entry.user ? (
                          <>
                            <strong>{entry.user.name}</strong> ({entry.user.email})
                            <Badge variant="outline" className="ml-2 text-xs">
                              {entry.user.role}
                            </Badge>
                          </>
                        ) : (
                          'System'
                        )}
                      </span>
                    </div>

                    {entry.details && (
                      <div className="text-sm text-gray-600 bg-gray-50 rounded p-2">
                        <strong>Details:</strong>
                        <pre className="mt-1 text-xs overflow-x-auto">
                          {JSON.stringify(entry.details, null, 2)}
                        </pre>
                      </div>
                    )}

                    {(entry.ipAddress || entry.userAgent) && (
                      <div className="text-xs text-gray-500 space-y-1">
                        {entry.ipAddress && (
                          <div>IP: {entry.ipAddress}</div>
                        )}
                        {entry.userAgent && (
                          <div>User Agent: {entry.userAgent}</div>
                        )}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        <div className="flex justify-end">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}