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
  User,
  Heart,
  Building,
  CheckCircle,
  XCircle,
  MessageSquare,
  Clock
} from 'lucide-react'
import Link from 'next/link'
import { format, formatDistanceToNow } from 'date-fns'

async function getMatchDetails(id: string) {
  try {
    const match = await db.match.findUnique({
      where: { id },
      include: {
        donor: true,
        request: true,
        createdByUser: {
          select: {
            name: true,
            email: true
          }
        }
      }
    })

    return match
  } catch (error) {
    console.error('Error fetching match details:', error)
    return null
  }
}

const getStatusBadge = (status: string) => {
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
    case 'CANCELLED':
      return <Badge variant="secondary" className="bg-gray-100 text-gray-800">Cancelled</Badge>
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

export default async function MatchDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const match = await getMatchDetails(params.id)

  if (!match) {
    notFound()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/dashboard/matches">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Match #{match.id.slice(-8)}
            </h1>
            <p className="text-gray-600 mt-1">
              Donor-Request match details and management
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {getStatusBadge(match.status)}
          {getUrgencyBadge(match.request.urgencyLevel)}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Match Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Match Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-red-600" />
                Match Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Match Status</label>
                  <div className="mt-1">{getStatusBadge(match.status)}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Blood Type</label>
                  <div className="mt-1">
                    <Badge variant="outline" className="font-mono text-lg px-3 py-1">
                      {match.donor.bloodType.replace('_', '')}
                    </Badge>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Created By</label>
                  <div className="mt-1 font-medium">{match.createdByUser.name}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Created Date</label>
                  <div className="mt-1">
                    <div>{format(new Date(match.createdAt), 'MMM dd, yyyy HH:mm')}</div>
                    <div className="text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(match.createdAt), { addSuffix: true })}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Donor Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Donor Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Name</label>
                  <div className="mt-1 font-medium">{match.donor.name}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Phone</label>
                  <div className="mt-1 flex items-center gap-2">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <span className="font-mono">{match.donor.phone}</span>
                  </div>
                </div>
                {match.donor.email && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Email</label>
                    <div className="mt-1 flex items-center gap-2">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <span>{match.donor.email}</span>
                    </div>
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium text-gray-500">Location</label>
                  <div className="mt-1 flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    <span>{match.donor.area}, {match.donor.location}</span>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Reliability Score</label>
                  <div className="mt-1 font-medium">{match.donor.reliabilityScore.toFixed(1)}/5.0</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Donation Count</label>
                  <div className="mt-1 font-medium">{match.donor.donationCount}</div>
                </div>
              </div>
              <div className="flex space-x-2">
                <Link href={`/dashboard/donors/${match.donor.id}`}>
                  <Button variant="outline" size="sm">
                    View Full Profile
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Request Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                Request Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Reference ID</label>
                  <div className="mt-1 font-mono">{match.request.referenceId}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Requester</label>
                  <div className="mt-1 font-medium">{match.request.requesterName}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Hospital</label>
                  <div className="mt-1">{match.request.hospital}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Location</label>
                  <div className="mt-1">{match.request.location}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Units Required</label>
                  <div className="mt-1 font-medium">{match.request.unitsRequired}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Urgency</label>
                  <div className="mt-1">{getUrgencyBadge(match.request.urgencyLevel)}</div>
                </div>
              </div>
              <div className="flex space-x-2">
                <Link href={`/dashboard/requests/${match.request.id}`}>
                  <Button variant="outline" size="sm">
                    View Full Request
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          {match.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Notes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700">{match.notes}</p>
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
              {match.status === 'PENDING' && (
                <Button className="w-full">
                  <Phone className="h-4 w-4 mr-2" />
                  Mark as Contacted
                </Button>
              )}
              {match.status === 'CONTACTED' && (
                <>
                  <Button className="w-full">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Mark as Accepted
                  </Button>
                  <Button variant="destructive" className="w-full">
                    <XCircle className="h-4 w-4 mr-2" />
                    Mark as Rejected
                  </Button>
                </>
              )}
              {match.status === 'ACCEPTED' && (
                <Button className="w-full">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Mark as Completed
                </Button>
              )}
              <Button variant="outline" className="w-full">
                <MessageSquare className="h-4 w-4 mr-2" />
                Add Notes
              </Button>
              <Button variant="outline" className="w-full">
                <Phone className="h-4 w-4 mr-2" />
                Contact Donor
              </Button>
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Match Timeline
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                <div>
                  <div className="font-medium">Match Created</div>
                  <div className="text-sm text-muted-foreground">
                    {format(new Date(match.createdAt), 'MMM dd, yyyy HH:mm')}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    by {match.createdByUser.name}
                  </div>
                </div>
              </div>
              
              {match.contactedAt && (
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2"></div>
                  <div>
                    <div className="font-medium">Donor Contacted</div>
                    <div className="text-sm text-muted-foreground">
                      {format(new Date(match.contactedAt), 'MMM dd, yyyy HH:mm')}
                    </div>
                  </div>
                </div>
              )}
              
              {match.acceptedAt && (
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                  <div>
                    <div className="font-medium">Donor Accepted</div>
                    <div className="text-sm text-muted-foreground">
                      {format(new Date(match.acceptedAt), 'MMM dd, yyyy HH:mm')}
                    </div>
                  </div>
                </div>
              )}
              
              {match.rejectedAt && (
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-red-500 rounded-full mt-2"></div>
                  <div>
                    <div className="font-medium">Donor Rejected</div>
                    <div className="text-sm text-muted-foreground">
                      {format(new Date(match.rejectedAt), 'MMM dd, yyyy HH:mm')}
                    </div>
                  </div>
                </div>
              )}
              
              {match.completedAt && (
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-green-600 rounded-full mt-2"></div>
                  <div>
                    <div className="font-medium">Donation Completed</div>
                    <div className="text-sm text-muted-foreground">
                      {format(new Date(match.completedAt), 'MMM dd, yyyy HH:mm')}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Compatibility Info */}
          <Card>
            <CardHeader>
              <CardTitle>Compatibility</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Blood Type Match</span>
                <CheckCircle className="h-4 w-4 text-green-600" />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Location Proximity</span>
                <CheckCircle className="h-4 w-4 text-green-600" />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Donor Availability</span>
                {match.donor.isAvailable ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-600" />
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Donor Verified</span>
                {match.donor.isVerified ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <Clock className="h-4 w-4 text-yellow-600" />
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}