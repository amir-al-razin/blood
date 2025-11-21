'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { DataDeletionDialog } from './data-deletion-dialog'
import { toast } from 'sonner'
import { 
  Shield, 
  Trash2, 
  Search, 
  Calendar, 
  User, 
  AlertTriangle,
  FileText,
  Eye
} from 'lucide-react'
import { format } from 'date-fns'

interface DeletionRequest {
  id: string
  name: string
  phone: string
  email?: string
  deletionRequestedAt: string
  createdAt: string
}

export function PrivacyManagement() {
  const [deletionRequests, setDeletionRequests] = useState<DeletionRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedDonor, setSelectedDonor] = useState<DeletionRequest | null>(null)
  const [deletionDialogOpen, setDeletionDialogOpen] = useState(false)
  const [deletionMode, setDeletionMode] = useState<'request' | 'execute'>('execute')

  useEffect(() => {
    fetchDeletionRequests()
  }, [])

  const fetchDeletionRequests = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/privacy/data-deletion')
      if (response.ok) {
        const data = await response.json()
        setDeletionRequests(data.deletionRequests)
      } else {
        toast.error('Failed to load deletion requests')
      }
    } catch (error) {
      console.error('Error fetching deletion requests:', error)
      toast.error('Failed to load deletion requests')
    } finally {
      setLoading(false)
    }
  }

  const handleExecuteDeletion = (donor: DeletionRequest) => {
    setSelectedDonor(donor)
    setDeletionMode('execute')
    setDeletionDialogOpen(true)
  }

  const handleDeletionComplete = () => {
    fetchDeletionRequests()
    setSelectedDonor(null)
  }

  const filteredRequests = deletionRequests.filter(request =>
    request.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    request.phone.includes(searchTerm) ||
    request.email?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {/* Privacy Overview Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pending Deletions
            </CardTitle>
            <Trash2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{deletionRequests.length}</div>
            <p className="text-xs text-muted-foreground">
              Donors requesting data deletion
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Privacy Compliance
            </CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">Active</div>
            <p className="text-xs text-muted-foreground">
              All privacy controls operational
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Audit Logging
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">Enabled</div>
            <p className="text-xs text-muted-foreground">
              All sensitive actions logged
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Data Deletion Requests */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trash2 className="h-5 w-5" />
            Data Deletion Requests
          </CardTitle>
          <CardDescription>
            Manage pending data deletion requests from donors
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Search className="h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search deletion requests..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
              </div>
            ) : filteredRequests.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                {searchTerm ? 'No matching deletion requests found' : 'No pending deletion requests'}
              </div>
            ) : (
              <div className="space-y-3">
                {filteredRequests.map((request) => (
                  <div
                    key={request.id}
                    className="border rounded-lg p-4 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-gray-400" />
                          <span className="font-medium">{request.name}</span>
                          <Badge variant="destructive" className="text-xs">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            Deletion Requested
                          </Badge>
                        </div>
                        <div className="text-sm text-gray-600 space-y-1">
                          <div>Phone: {request.phone}</div>
                          {request.email && <div>Email: {request.email}</div>}
                        </div>
                      </div>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleExecuteDeletion(request)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Execute Deletion
                      </Button>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        Requested: {format(new Date(request.deletionRequestedAt), 'MMM dd, yyyy')}
                      </div>
                      <div className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        Registered: {format(new Date(request.createdAt), 'MMM dd, yyyy')}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Privacy Policy Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Privacy Policy & Compliance
          </CardTitle>
          <CardDescription>
            Current privacy policy version and compliance information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Current Privacy Policy Version</Label>
                <div className="text-lg font-semibold">v1.0</div>
                <p className="text-sm text-gray-600">
                  Last updated: {format(new Date(), 'MMMM dd, yyyy')}
                </p>
              </div>
              <div className="space-y-2">
                <Label>Data Retention Period</Label>
                <div className="text-lg font-semibold">5 Years</div>
                <p className="text-sm text-gray-600">
                  After last donation or account activity
                </p>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium">Privacy Controls Active</p>
                  <ul className="mt-2 space-y-1 list-disc list-inside">
                    <li>Contact information access requires justification and is logged</li>
                    <li>Donors can control communication preferences</li>
                    <li>Data sharing requires explicit consent</li>
                    <li>All sensitive data access is audited</li>
                    <li>Data deletion requests are processed securely</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Deletion Dialog */}
      {selectedDonor && (
        <DataDeletionDialog
          donorId={selectedDonor.id}
          donorName={selectedDonor.name}
          isOpen={deletionDialogOpen}
          onClose={() => {
            setDeletionDialogOpen(false)
            setSelectedDonor(null)
          }}
          onDeleted={handleDeletionComplete}
          mode={deletionMode}
        />
      )}
    </div>
  )
}