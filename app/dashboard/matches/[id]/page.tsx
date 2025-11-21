import { notFound } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  ArrowLeft, 
  Phone, 
  Mail, 
  MapPin, 
  Calendar, 
  Heart, 
  User,
  Building2,
  Clock,
  FileText
} from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'
import { MatchActions } from '@/components/matches/match-actions'

async function getMatch(id: string) {
  try {
    const response = await fetch(`${process.env.NEXTAUTH_URL}/api/matches/${id}`, {
      cache: 'no-store'
    })
    
    if (!response.ok) {
      return null
    }
    
    const data = await response.json()
    return data.match
  } catch (error) {
    console.error('Error fetching match:', error)
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

const getBloodTypeBadge = (bloodType: string) => {
  const formatted = bloodType.replace('_', '')
  return (
    <Badge variant="outline" className="font-mono">
      {formatted}
    </Badge>
  )
}

export default async function MatchDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const match = await getMatch(params.id)

  if (!match) {
    notFound()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/matches">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Matches
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Match Details</h1>
            <p className="text-muted-foreground">
              Match ID: {match.id.slice(-12)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {getStatusBadge(match.status)}
          <MatchActions match={match} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Donor Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Donor Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-medium text-lg">{match.donor.name}</span>
              <div className="flex items-center gap-2">
                {getBloodTypeBadge(match.donor.bloodType)}
                {match.donor.isVerified && (
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    Verified
                  </Badge>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{match.donor.phone}</span>
              </div>
              {match.donor.email && (
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{match.donor.email}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span>{match.donor.area}</span>
              </div>
              <div className="flex items-center gap-2">
                <Heart className="h-4 w-4 text-muted-foreground" />
                <span>{match.donor.donationCount} donations</span>
              </div>
            </div>

            {match.donor.address && (
              <div className="pt-2 border-t">
                <p className="text-sm text-muted-foreground">Address</p>
                <p className="text-sm">{match.donor.address}</p>
              </div>
            )}

            <div className="pt-2 border-t">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Reliability Score</p>
                  <p className="font-medium">{match.donor.reliabilityScore.toFixed(1)}/10</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Last Donation</p>
                  <p className="font-medium">
                    {match.donor.lastDonation 
                      ? format(new Date(match.donor.lastDonation), 'MMM dd, yyyy')
                      : 'Never'
                    }
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Request Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Blood Request Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-medium text-lg">{match.request.requesterName}</span>
              <div className="flex items-center gap-2">
                {getBloodTypeBadge(match.request.bloodType)}
                {getUrgencyBadge(match.request.urgencyLevel)}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{match.request.requesterPhone}</span>
              </div>
              {match.request.requesterEmail && (
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{match.request.requesterEmail}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <span>{match.request.hospital}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span>{match.request.location}</span>
              </div>
            </div>

            <div className="pt-2 border-t">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Reference ID</p>
                  <p className="font-mono">{match.request.referenceId}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Units Required</p>
                  <p className="font-medium">{match.request.unitsRequired}</p>
                </div>
              </div>
            </div>

            {match.request.notes && (
              <div className="pt-2 border-t">
                <p className="text-sm text-muted-foreground">Request Notes</p>
                <p className="text-sm">{match.request.notes}</p>
              </div>
            )}

            {match.request.prescriptionUrl && (
              <div className="pt-2 border-t">
                <p className="text-sm text-muted-foreground">Prescription</p>
                <Button variant="outline" size="sm" asChild>
                  <a href={match.request.prescriptionUrl} target="_blank" rel="noopener noreferrer">
                    View Prescription
                  </a>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Match Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Match Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Created */}
            <div className="flex items-start gap-4">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">Match Created</span>
                  <Badge variant="outline">PENDING</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(match.createdAt), 'MMM dd, yyyy HH:mm')} by {match.createdByUser.name}
                </p>
              </div>
            </div>

            {/* Contacted */}
            {match.contactedAt && (
              <div className="flex items-start gap-4">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Donor Contacted</span>
                    <Badge variant="outline">CONTACTED</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(match.contactedAt), 'MMM dd, yyyy HH:mm')}
                  </p>
                </div>
              </div>
            )}

            {/* Accepted */}
            {match.acceptedAt && (
              <div className="flex items-start gap-4">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Donation Accepted</span>
                    <Badge variant="outline">ACCEPTED</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(match.acceptedAt), 'MMM dd, yyyy HH:mm')}
                  </p>
                </div>
              </div>
            )}

            {/* Rejected */}
            {match.rejectedAt && (
              <div className="flex items-start gap-4">
                <div className="w-2 h-2 bg-red-500 rounded-full mt-2"></div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Donation Rejected</span>
                    <Badge variant="outline">REJECTED</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(match.rejectedAt), 'MMM dd, yyyy HH:mm')}
                  </p>
                </div>
              </div>
            )}

            {/* Completed */}
            {match.completedAt && (
              <div className="flex items-start gap-4">
                <div className="w-2 h-2 bg-green-600 rounded-full mt-2"></div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Donation Completed</span>
                    <Badge variant="outline">COMPLETED</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(match.completedAt), 'MMM dd, yyyy HH:mm')}
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Notes */}
      {match.notes && (
        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap">{match.notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}