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
  Star,
  Shield,
  Clock,
  CheckCircle,
  UserCheck,
  UserX
} from 'lucide-react'
import Link from 'next/link'
import { format, formatDistanceToNow } from 'date-fns'
import { DonorQuickActions } from '@/components/donors/donor-quick-actions'

async function getDonorDetails(id: string) {
  try {
    const donor = await db.donor.findUnique({
      where: { id },
      include: {
        matches: {
          include: {
            request: {
              select: {
                id: true,
                referenceId: true,
                requesterName: true,
                bloodType: true,
                urgencyLevel: true,
                hospital: true,
                createdAt: true
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    })

    return donor
  } catch (error) {
    console.error('Error fetching donor details:', error)
    return null
  }
}

const getVerificationBadge = (isVerified: boolean) => {
  return isVerified ? (
    <Badge variant="secondary" className="bg-green-100 text-green-800">
      <UserCheck className="w-3 h-3 mr-1" />
      Verified
    </Badge>
  ) : (
    <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
      <UserX className="w-3 h-3 mr-1" />
      Pending Verification
    </Badge>
  )
}

const getAvailabilityBadge = (isAvailable: boolean) => {
  return isAvailable ? (
    <Badge variant="secondary" className="bg-blue-100 text-blue-800">
      Available
    </Badge>
  ) : (
    <Badge variant="secondary" className="bg-gray-100 text-gray-800">
      Unavailable
    </Badge>
  )
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

const getReliabilityStars = (score: number) => {
  const stars = Math.round(score * 5)
  return (
    <div className="flex items-center">
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          className={`w-4 h-4 ${i < stars ? 'text-yellow-400 fill-current' : 'text-gray-300'
            }`}
        />
      ))}
      <span className="ml-2 text-sm text-muted-foreground">
        ({score.toFixed(1)})
      </span>
    </div>
  )
}

export default async function DonorDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const donor = await getDonorDetails(params.id)

  if (!donor) {
    notFound()
  }

  const completedDonations = donor.matches.filter(match => match.status === 'COMPLETED').length
  const nextEligibleDate = donor.lastDonation
    ? new Date(donor.lastDonation.getTime() + (donor.gender === 'MALE' ? 90 : 120) * 24 * 60 * 60 * 1000)
    : null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/dashboard/donors">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {donor.name}
            </h1>
            <p className="text-gray-600 mt-1">
              Donor profile and donation history
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {getVerificationBadge(donor.isVerified)}
          {getAvailabilityBadge(donor.isAvailable)}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Donor Details */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Full Name</label>
                  <div className="mt-1 font-medium">{donor.name}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Blood Type</label>
                  <div className="mt-1">
                    <Badge variant="outline" className="font-mono text-lg px-3 py-1">
                      {donor.bloodType.replace('_', '')}
                    </Badge>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Phone</label>
                  <div className="mt-1 flex items-center gap-2">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <span className="font-mono">{donor.phone}</span>
                  </div>
                </div>
                {donor.email && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Email</label>
                    <div className="mt-1 flex items-center gap-2">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <span>{donor.email}</span>
                    </div>
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium text-gray-500">Date of Birth</label>
                  <div className="mt-1 flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span>{format(new Date(donor.dateOfBirth), 'MMM dd, yyyy')}</span>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Gender</label>
                  <div className="mt-1 capitalize">{donor.gender.toLowerCase()}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Weight</label>
                  <div className="mt-1">{donor.weight} kg</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Location Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Area</label>
                  <div className="mt-1 font-medium">{donor.area}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Location</label>
                  <div className="mt-1">{donor.location}</div>
                </div>
                {donor.address && (
                  <div className="md:col-span-2">
                    <label className="text-sm font-medium text-gray-500">Address</label>
                    <div className="mt-1">{donor.address}</div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-red-600" />
                Donation Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Total Donations</label>
                  <div className="mt-1 text-2xl font-bold text-red-600">{donor.donationCount}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Completed Matches</label>
                  <div className="mt-1 text-2xl font-bold text-green-600">{completedDonations}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Reliability Score</label>
                  <div className="mt-1">{getReliabilityStars(donor.reliabilityScore)}</div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Last Donation</label>
                  <div className="mt-1">
                    {donor.lastDonation ? (
                      <div>
                        <div>{format(new Date(donor.lastDonation), 'MMM dd, yyyy')}</div>
                        <div className="text-sm text-muted-foreground">
                          {formatDistanceToNow(new Date(donor.lastDonation), { addSuffix: true })}
                        </div>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">Never donated</span>
                    )}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Next Eligible Date</label>
                  <div className="mt-1">
                    {nextEligibleDate ? (
                      <div>
                        <div>{format(nextEligibleDate, 'MMM dd, yyyy')}</div>
                        <div className="text-sm text-muted-foreground">
                          {nextEligibleDate > new Date()
                            ? `In ${formatDistanceToNow(nextEligibleDate)}`
                            : 'Eligible now'
                          }
                        </div>
                      </div>
                    ) : (
                      <span className="text-green-600 font-medium">Eligible now</span>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {donor.notes && (
            <Card>
              <CardHeader>
                <CardTitle>Additional Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700">{donor.notes}</p>
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
            <CardContent>
              <DonorQuickActions donor={{
                id: donor.id,
                name: donor.name,
                phone: donor.phone,
                email: donor.email,
                isVerified: donor.isVerified,
                isAvailable: donor.isAvailable
              }} />
            </CardContent>
          </Card>

          {/* Registration Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Registration Info
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                <div>
                  <div className="font-medium">Registered</div>
                  <div className="text-sm text-muted-foreground">
                    {format(new Date(donor.createdAt), 'MMM dd, yyyy HH:mm')}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(donor.createdAt), { addSuffix: true })}
                  </div>
                </div>
              </div>

              {donor.isVerified && (
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                  <div>
                    <div className="font-medium">Verified</div>
                    <div className="text-sm text-muted-foreground">
                      Profile verified by admin
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Match History */}
      {donor.matches.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Match History ({donor.matches.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {donor.matches.map((match) => (
                <div key={match.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <Heart className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <div className="font-medium">
                        Request #{match.request.referenceId.slice(-8)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {match.request.requesterName} • {match.request.hospital}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {format(new Date(match.createdAt), 'MMM dd, yyyy')} •
                        {match.request.urgencyLevel.toLowerCase()} priority
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    {getMatchStatusBadge(match.status)}
                    <Link href={`/dashboard/requests/${match.request.id}`}>
                      <Button variant="outline" size="sm">
                        View Request
                      </Button>
                    </Link>
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