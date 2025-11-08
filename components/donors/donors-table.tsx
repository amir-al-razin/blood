import { db } from '@/lib/db'
import { Badge } from '@/components/ui/badge'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import { 
  UserCheck, 
  UserX, 
  Phone,
  Mail,
  MapPin,
  Calendar,
  Star
} from 'lucide-react'
import { DonorActions } from './donor-actions'
import { formatDistanceToNow, format } from 'date-fns'

interface DonorsTableProps {
  searchParams: { [key: string]: string | string[] | undefined }
}

async function getDonors(searchParams: DonorsTableProps['searchParams']) {
  const page = parseInt((searchParams.page as string) || '1')
  const limit = parseInt((searchParams.limit as string) || '10')
  const bloodType = searchParams.bloodType as string
  const location = searchParams.location as string
  const area = searchParams.area as string
  const isAvailable = searchParams.isAvailable as string
  const isVerified = searchParams.isVerified as string
  const search = searchParams.search as string

  const skip = (page - 1) * limit

  // Build where clause
  const where: any = {}
  if (bloodType) where.bloodType = bloodType
  if (location) where.location = { contains: location, mode: 'insensitive' }
  if (area) where.area = { contains: area, mode: 'insensitive' }
  if (isAvailable !== undefined && isAvailable !== '') where.isAvailable = isAvailable === 'true'
  if (isVerified !== undefined && isVerified !== '') where.isVerified = isVerified === 'true'
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { phone: { contains: search } },
      { email: { contains: search, mode: 'insensitive' } }
    ]
  }

  try {
    const [donors, total] = await Promise.all([
      db.donor.findMany({
        where,
        skip,
        take: limit,
        orderBy: [
          { isVerified: 'desc' },
          { reliabilityScore: 'desc' },
          { createdAt: 'desc' }
        ],
        include: {
          matches: {
            select: {
              id: true,
              status: true,
              createdAt: true
            },
            take: 5,
            orderBy: { createdAt: 'desc' }
          }
        }
      }),
      db.donor.count({ where })
    ])

    return {
      donors,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    }
  } catch (error) {
    console.error('Error fetching donors:', error)
    return {
      donors: [],
      pagination: { page: 1, limit: 10, total: 0, pages: 0 }
    }
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
      Pending
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

const getBloodTypeBadge = (bloodType: string) => {
  const formatted = bloodType.replace('_', '')
  return (
    <Badge variant="outline" className="font-mono">
      {formatted}
    </Badge>
  )
}

const getReliabilityStars = (score: number) => {
  const stars = Math.round(score * 5) // Convert 0-1 to 0-5 stars
  return (
    <div className="flex items-center">
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          className={`w-3 h-3 ${
            i < stars ? 'text-yellow-400 fill-current' : 'text-gray-300'
          }`}
        />
      ))}
      <span className="ml-1 text-xs text-muted-foreground">
        ({score.toFixed(1)})
      </span>
    </div>
  )
}

export async function DonorsTable({ searchParams }: DonorsTableProps) {
  const { donors, pagination } = await getDonors(searchParams)

  if (donors.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No donors found.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Donor</TableHead>
              <TableHead>Blood Type</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Donations</TableHead>
              <TableHead>Reliability</TableHead>
              <TableHead>Last Donation</TableHead>
              <TableHead>Registered</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {donors.map((donor) => (
              <TableRow key={donor.id}>
                <TableCell>
                  <div>
                    <div className="font-medium">{donor.name}</div>
                    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                      <Phone className="w-3 h-3" />
                      <span>{donor.phone}</span>
                      {donor.email && (
                        <>
                          <Mail className="w-3 h-3 ml-2" />
                          <span>{donor.email}</span>
                        </>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  {getBloodTypeBadge(donor.bloodType)}
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-1">
                    <MapPin className="w-3 h-3 text-muted-foreground" />
                    <div>
                      <div className="font-medium">{donor.area}</div>
                      <div className="text-sm text-muted-foreground">
                        {donor.location}
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    {getVerificationBadge(donor.isVerified)}
                    {getAvailabilityBadge(donor.isAvailable)}
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  <div className="font-medium">{donor.donationCount}</div>
                  <div className="text-xs text-muted-foreground">
                    {donor.matches.length} matches
                  </div>
                </TableCell>
                <TableCell>
                  {getReliabilityStars(donor.reliabilityScore)}
                </TableCell>
                <TableCell>
                  {donor.lastDonation ? (
                    <div>
                      <div className="text-sm">
                        {format(new Date(donor.lastDonation), 'MMM dd, yyyy')}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(donor.lastDonation), { addSuffix: true })}
                      </div>
                    </div>
                  ) : (
                    <span className="text-muted-foreground text-sm">Never</span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-1">
                    <Calendar className="w-3 h-3 text-muted-foreground" />
                    <div className="text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(donor.createdAt), { addSuffix: true })}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <DonorActions donor={donor} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
            {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
            {pagination.total} results
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-muted-foreground">
              Page {pagination.page} of {pagination.pages}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}