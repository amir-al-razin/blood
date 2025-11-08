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
  Clock,
  AlertTriangle
} from 'lucide-react'
import { RequestActions } from './request-actions'
import { formatDistanceToNow } from 'date-fns'

interface RequestsTableProps {
  searchParams: { [key: string]: string | string[] | undefined }
}

async function getRequests(searchParams: RequestsTableProps['searchParams']) {
  const page = parseInt((searchParams.page as string) || '1')
  const limit = parseInt((searchParams.limit as string) || '10')
  const status = searchParams.status as string
  const bloodType = searchParams.bloodType as string
  const location = searchParams.location as string
  const urgency = searchParams.urgency as string

  const skip = (page - 1) * limit

  // Build where clause
  const where: any = {}
  if (status) where.status = status
  if (bloodType) where.bloodType = bloodType
  if (location) where.location = { contains: location, mode: 'insensitive' }
  if (urgency) where.urgencyLevel = urgency

  try {
    const [requests, total] = await Promise.all([
      db.request.findMany({
        where,
        skip,
        take: limit,
        orderBy: [
          { urgencyLevel: 'asc' }, // Critical first
          { createdAt: 'desc' }
        ],
        include: {
          matches: {
            include: {
              donor: {
                select: {
                  id: true,
                  name: true,
                  bloodType: true,
                  area: true,
                  isVerified: true
                }
              }
            }
          }
        }
      }),
      db.request.count({ where })
    ])

    return {
      requests,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    }
  } catch (error) {
    console.error('Error fetching requests:', error)
    return {
      requests: [],
      pagination: { page: 1, limit: 10, total: 0, pages: 0 }
    }
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
      return (
        <Badge variant="destructive" className="bg-red-600 text-white">
          <AlertTriangle className="w-3 h-3 mr-1" />
          Critical
        </Badge>
      )
    case 'URGENT':
      return (
        <Badge variant="secondary" className="bg-orange-100 text-orange-800">
          <Clock className="w-3 h-3 mr-1" />
          Urgent
        </Badge>
      )
    case 'NORMAL':
      return (
        <Badge variant="secondary" className="bg-gray-100 text-gray-800">
          Normal
        </Badge>
      )
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

export async function RequestsTable({ searchParams }: RequestsTableProps) {
  const { requests, pagination } = await getRequests(searchParams)

  if (requests.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No blood requests found.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Reference ID</TableHead>
              <TableHead>Requester</TableHead>
              <TableHead>Blood Type</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Urgency</TableHead>
              <TableHead>Units</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Matches</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {requests.map((request) => (
              <TableRow key={request.id}>
                <TableCell className="font-mono text-sm">
                  {request.referenceId.slice(-8)}
                </TableCell>
                <TableCell>
                  <div>
                    <div className="font-medium">{request.requesterName}</div>
                    <div className="text-sm text-muted-foreground">
                      {request.requesterPhone}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  {getBloodTypeBadge(request.bloodType)}
                </TableCell>
                <TableCell>
                  <div>
                    <div className="font-medium">{request.location}</div>
                    <div className="text-sm text-muted-foreground">
                      {request.hospital}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  {getUrgencyBadge(request.urgencyLevel)}
                </TableCell>
                <TableCell className="text-center">
                  {request.unitsRequired}
                </TableCell>
                <TableCell>
                  {getStatusBadge(request.status)}
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-1">
                    <span className="text-sm">
                      {request.matches.length}
                    </span>
                    {request.matches.length > 0 && (
                      <div className="flex -space-x-1">
                        {request.matches.slice(0, 3).map((match, index) => (
                          <div
                            key={match.id}
                            className="w-6 h-6 rounded-full bg-red-100 border-2 border-white flex items-center justify-center text-xs font-medium text-red-700"
                            title={match.donor.name}
                          >
                            {match.donor.name.charAt(0)}
                          </div>
                        ))}
                        {request.matches.length > 3 && (
                          <div className="w-6 h-6 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center text-xs font-medium text-gray-600">
                            +{request.matches.length - 3}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {formatDistanceToNow(new Date(request.createdAt), { addSuffix: true })}
                </TableCell>
                <TableCell>
                  <RequestActions request={request} />
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