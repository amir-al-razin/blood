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
  Phone, 
  Clock
} from 'lucide-react'
import { MatchActions } from './match-actions'
import { formatDistanceToNow, format } from 'date-fns'

interface MatchesTableProps {
  searchParams: { [key: string]: string | string[] | undefined }
}

async function getMatches(searchParams: MatchesTableProps['searchParams']) {
  const page = parseInt((searchParams.page as string) || '1')
  const limit = parseInt((searchParams.limit as string) || '10')
  const status = searchParams.status as string
  const bloodType = searchParams.bloodType as string

  const skip = (page - 1) * limit

  // Build where clause
  const where: any = {}
  if (status) where.status = status
  if (bloodType) {
    where.OR = [
      { donor: { bloodType } },
      { request: { bloodType } }
    ]
  }

  try {
    const [matches, total] = await Promise.all([
      db.match.findMany({
        where,
        skip,
        take: limit,
        orderBy: [
          { createdAt: 'desc' }
        ],
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
          request: {
            select: {
              id: true,
              referenceId: true,
              requesterName: true,
              bloodType: true,
              urgencyLevel: true,
              unitsRequired: true,
              hospital: true,
              location: true
            }
          },
          createdByUser: {
            select: {
              name: true
            }
          }
        }
      }),
      db.match.count({ where })
    ])

    return {
      matches,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    }
  } catch (error) {
    console.error('Error fetching matches:', error)
    return {
      matches: [],
      pagination: { page: 1, limit: 10, total: 0, pages: 0 }
    }
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

export async function MatchesTable({ searchParams }: MatchesTableProps) {
  const { matches, pagination } = await getMatches(searchParams)

  if (matches.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No matches found.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Match ID</TableHead>
              <TableHead>Donor</TableHead>
              <TableHead>Request</TableHead>
              <TableHead>Blood Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Last Update</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {matches.map((match) => (
              <TableRow key={match.id}>
                <TableCell className="font-mono text-sm">
                  {match.id.slice(-8)}
                </TableCell>
                <TableCell>
                  <div>
                    <div className="font-medium">{match.donor.name}</div>
                    <div className="text-sm text-muted-foreground flex items-center gap-2">
                      <Phone className="w-3 h-3" />
                      {match.donor.phone}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {match.donor.area} • Score: {match.donor.reliabilityScore.toFixed(1)}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div>
                    <div className="font-medium">
                      {match.request.referenceId.slice(-8)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {match.request.requesterName}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {match.request.hospital}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    {getBloodTypeBadge(match.donor.bloodType)}
                    {getUrgencyBadge(match.request.urgencyLevel)}
                  </div>
                </TableCell>
                <TableCell>
                  {getStatusBadge(match.status)}
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    {format(new Date(match.createdAt), 'MMM dd, yyyy')}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    by {match.createdByUser.name}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-sm text-muted-foreground">
                    {match.contactedAt && (
                      <div>Contacted: {formatDistanceToNow(new Date(match.contactedAt), { addSuffix: true })}</div>
                    )}
                    {match.acceptedAt && (
                      <div>Accepted: {formatDistanceToNow(new Date(match.acceptedAt), { addSuffix: true })}</div>
                    )}
                    {match.completedAt && (
                      <div>Completed: {formatDistanceToNow(new Date(match.completedAt), { addSuffix: true })}</div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <MatchActions match={match} />
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