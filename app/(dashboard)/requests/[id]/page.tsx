import { notFound } from 'next/navigation'
import { db } from '@/lib/db'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  ArrowLeft, 
  Phone, 
  Mail, 
  MapPin, 
  Calendar, 
  FileText,
  AlertTriangle,
  Clock,
  Heart,
  User,
  Building
} from 'lucide-react'
import Link from 'next/link'
import { format, formatDistanceToNow } from 'date-fns'

async function getRequestDetails(id: string) {
  try {
    const request = await db.request.findUnique({
      where: { id },
      include: {
        matches: {
          include: {
            donor: {
              select: {
                id: true,
                name: true,
                phone: true,
                bloodType: true,
                area: true,
                isVerified: true,
                reliabilityScore: true
              }
            },
            createdByUser: {
              select: {
                name: true
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    })

    return request
  } catch (error) {
    console.error('Error fetching request details:', error)
    return null
  }
}

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'PENDING':
      return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Pending</Badge>
    case 'IN_PROGRESS':
      return <Badge variant="secondary" className="bg-blue-100 text-blue-800">In Progress</Badge>
    case 'COMPLETED':
      return <Badge variant="secondary" className="bg-green-100 text-green-800">Completed</Badge>
    case 'CANCELLED':
      return <Badge variant="secondary" className="bg-red-100 text-red-800">Cancelled</Badge>
    default:
      return <Badge variant="secondary">{status}</Badge>
  }
}

const getUrgencyBadge = (urgency: string) => {
  switch (urgency) {
    case 'CRITICAL':
      return <Badge variant="destructive" className="bg-red-600 text-white">Critical</Badge>
    case 'URGENT':
      return <Badge variant="secondary" className="bg-orange-100 text-orange-800">Urgent</Badge>
    case 'NORMAL':
      return <Badge variant="secondary" className="bg-gray-100 text-gray-800">Normal</Badge>
    default:
      return <Badge variant="secondary">{urgency}</Badge>
  }
}

const getMatchStatusBadge = (status: string) => {
  switch (status) {
    case 'PENDING':
      return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Pending</Badge>
    case 'CONTACTED':
      return <Badge variant="secondary" className="bg-blue-100 text-blue-800">Contacted</Badge>
    case 'ACCEPTED':
      return <Badge variant="secondary" className="bg-green-100 text-green-800">Accepted</Badge>
    case 'REJECTED':
      return <Badge variant="secondary" className="bg-red-100 text-red-800">Rejected</Badge>
    case 'COMPLETED':
      return <Badge variant="secondary" className="bg-green-200 text-green-900">Completed</Badge>
    default:
      return <Badge variant="secondary">{status}</Badge>
  }
}

export default async function RequestDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const request = await getRequestDetails(params.id)

  if (!request) {
    notFound()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/dashboard/requests">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Request #{request.referenceId.slice(-8)}
            </h1>
            <p className="text-gray-600 mt-1">
              Blood request details and management
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {getStatusBadge(request.status)}
          {getUrgencyBadge(request.urgencyLevel)}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Request Details */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-red-600" />
                Request Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Blood Type</label>
                  <div className="mt-1">
                    <Badge variant="outline" className="font-mono text-lg px-3 py-1">
                      {request.bloodType.replace('_', '')}
                    </Badge>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Units Required</label>
                  <div className="mt-1 text-lg font-semibold">{request.unitsRequired}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Urgency Level</label>
                  <div className="mt-1">{getUrgencyBadge(request.urgencyLevel)}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Status</label>
                  <div className="mt-1">{getStatusBadge(request.status)}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Requester Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Name</label>
                  <div className="mt-1 font-medium">{request.requesterName}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Phone</label>
                  <div className="mt-1 flex items-center gap-2">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <span className="font-mono">{request.requesterPhone}</span>
                  </div>
                </div>
                {request.requesterEmail && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Email</label>
                    <div className="mt-1 flex items-center gap-2">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <span>{request.requesterEmail}</span>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                Hospital Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Hospital</label>
                  <div className="mt-1 font-medium">{request.hospital}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Location</label>
                  <div className="mt-1 flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    <span>{request.location}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {request.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Additional Notes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700">{request.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {request.status === 'PENDING' && (
                <Button className="w-full">
                  Assign Donor
                </Button>
              )}
              {request.status === 'IN_PROGRESS' && (
                <Button className="w-full">
                  Mark as Completed
                </Button>
              )}
              <Button variant="outline" className="w-full">
                Contact Requester
              </Button>
              <Button variant="outline" className="w-full">
                Edit Request
              </Button>
              {request.status !== 'COMPLETED' && request.status !== 'CANCELLED' && (
                <Button variant="destructive" className="w-full">
                  Cancel Request
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Timeline
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                <div>
                  <div className="font-medium">Request Created</div>
                  <div className="text-sm text-muted-foreground">
                    {format(new Date(request.createdAt), 'MMM dd, yyyy HH:mm')}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(request.createdAt), { addSuffix: true })}
                  </div>
                </div>
              </div>
              
              {request.completedAt && (
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                  <div>
                    <div className="font-medium">Request Completed</div>
                    <div className="text-sm text-muted-foreground">
                      {format(new Date(request.completedAt), 'MMM dd, yyyy HH:mm')}
                    </div>
                  </div>
                </div>
              )}
              
              {request.cancelledAt && (
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-red-500 rounded-full mt-2"></div>
                  <div>
                    <div className="font-medium">Request Cancelled</div>
                    <div className="text-sm text-muted-foreground">
                      {format(new Date(request.cancelledAt), 'MMM dd, yyyy HH:mm')}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Matched Donors */}
      {request.matches.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Matched Donors ({request.matches.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {request.matches.map((match) => (
                <div key={match.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                      <span className="font-medium text-red-700">
                        {match.donor.name.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <div className="font-medium">{match.donor.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {match.donor.bloodType.replace('_', '')} • {match.donor.area}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Reliability: {match.donor.reliabilityScore.toFixed(1)} • 
                        Matched by {match.createdByUser.name}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    {getMatchStatusBadge(match.status)}
                    <Button variant="outline" size="sm">
                      View Details
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}