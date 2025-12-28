import { db } from '@/lib/db'
import { Badge } from '@/components/ui/badge'
import { RequestActions } from './request-actions'
import { formatDistanceToNow } from 'date-fns'
import Link from 'next/link'
import { ChevronLeft, ChevronRight, AlertTriangle, Clock } from 'lucide-react'

interface RequestsTableProps {
  searchParams: { [key: string]: string | string[] | undefined }
}

async function getRequests(searchParams: RequestsTableProps['searchParams']) {
  const page = parseInt((searchParams.page as string) || '1')
  const limit = 15 // Show more items per page
  const status = searchParams.status as string
  const bloodType = searchParams.bloodType as string
  const urgency = searchParams.urgency as string
  const search = searchParams.search as string

  const skip = (page - 1) * limit

  // Build where clause
  const where: any = {}
  if (status) where.status = status
  if (bloodType) where.bloodType = bloodType
  if (urgency) where.urgencyLevel = urgency
  if (search) {
    where.OR = [
      { requesterName: { contains: search, mode: 'insensitive' } },
      { requesterPhone: { contains: search, mode: 'insensitive' } },
      { referenceId: { contains: search, mode: 'insensitive' } },
    ]
  }

  try {
    const [requests, total] = await Promise.all([
      db.request.findMany({
        where,
        skip,
        take: limit,
        orderBy: [
          { urgencyLevel: 'asc' },
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
      pagination: { page: 1, limit: 15, total: 0, pages: 0 }
    }
  }
}

const getStatusStyle = (status: string) => {
  switch (status) {
    case 'PENDING':
      return 'bg-amber-50 text-amber-700 border-amber-200'
    case 'IN_PROGRESS':
      return 'bg-blue-50 text-blue-700 border-blue-200'
    case 'COMPLETED':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200'
    case 'CANCELLED':
      return 'bg-gray-100 text-gray-600 border-gray-200'
    default:
      return 'bg-gray-100 text-gray-600 border-gray-200'
  }
}

const getUrgencyStyle = (urgency: string) => {
  switch (urgency) {
    case 'CRITICAL':
      return { bg: 'bg-red-500', text: 'text-white', icon: true }
    case 'URGENT':
      return { bg: 'bg-orange-100', text: 'text-orange-700', icon: true }
    case 'NORMAL':
      return { bg: 'bg-gray-100', text: 'text-gray-600', icon: false }
    default:
      return { bg: 'bg-gray-100', text: 'text-gray-600', icon: false }
  }
}

export async function RequestsTable({ searchParams }: RequestsTableProps) {
  const { requests, pagination } = await getRequests(searchParams)

  if (requests.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-gray-400">
        <div className="text-5xl mb-4">📋</div>
        <p className="text-lg font-medium text-gray-600">No requests found</p>
        <p className="text-sm">Try adjusting your filters</p>
      </div>
    )
  }

  const currentPage = pagination.page
  const totalPages = pagination.pages

  // Build pagination URL helper
  const getPageUrl = (page: number) => {
    const params = new URLSearchParams()
    Object.entries(searchParams).forEach(([key, value]) => {
      if (value && key !== 'page') {
        params.set(key, value as string)
      }
    })
    params.set('page', page.toString())
    return `?${params.toString()}`
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/50">
              <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide px-4 py-3">ID</th>
              <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide px-4 py-3">Requester</th>
              <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide px-4 py-3">Blood</th>
              <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide px-4 py-3">Location</th>
              <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide px-4 py-3">Urgency</th>
              <th className="text-center text-xs font-medium text-gray-500 uppercase tracking-wide px-4 py-3">Units</th>
              <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide px-4 py-3">Status</th>
              <th className="text-center text-xs font-medium text-gray-500 uppercase tracking-wide px-4 py-3">Matches</th>
              <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide px-4 py-3">Created</th>
              <th className="w-10 px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {requests.map((request) => {
              const urgencyStyle = getUrgencyStyle(request.urgencyLevel)
              return (
                <tr key={request.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-4 py-3">
                    <span className="font-mono text-sm text-gray-900">
                      {request.referenceId.slice(-8).toUpperCase()}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">{request.requesterName}</div>
                    <a href={`tel:${request.requesterPhone}`} className="text-sm text-red-600 hover:underline">
                      {request.requesterPhone}
                    </a>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-red-50 text-red-700 font-bold text-sm">
                      {request.bloodType.replace('_POSITIVE', '+').replace('_NEGATIVE', '-')}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">{request.location}</div>
                    <div className="text-sm text-gray-500 truncate max-w-[160px]">{request.hospital}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-sm font-medium ${urgencyStyle.bg} ${urgencyStyle.text}`}>
                      {urgencyStyle.icon && (request.urgencyLevel === 'CRITICAL'
                        ? <AlertTriangle className="w-3 h-3" />
                        : <Clock className="w-3 h-3" />
                      )}
                      {request.urgencyLevel.charAt(0) + request.urgencyLevel.slice(1).toLowerCase()}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="font-semibold text-gray-900">{request.unitsRequired}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-sm font-medium border ${getStatusStyle(request.status)}`}>
                      {request.status.replace('_', ' ').charAt(0) + request.status.replace('_', ' ').slice(1).toLowerCase()}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-sm font-medium
                      ${request.matches.length > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                      {request.matches.length}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {formatDistanceToNow(new Date(request.createdAt), { addSuffix: true })}
                  </td>
                  <td className="px-4 py-3">
                    <RequestActions request={request} />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-gray-50/50">
        <p className="text-sm text-gray-600">
          Showing <span className="font-medium">{((pagination.page - 1) * pagination.limit) + 1}</span> to{' '}
          <span className="font-medium">{Math.min(pagination.page * pagination.limit, pagination.total)}</span> of{' '}
          <span className="font-medium">{pagination.total}</span> results
        </p>

        {totalPages > 1 && (
          <div className="flex items-center gap-1">
            {/* Previous */}
            {currentPage > 1 ? (
              <Link
                href={getPageUrl(currentPage - 1)}
                className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-gray-600 hover:bg-gray-200 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </Link>
            ) : (
              <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-gray-300">
                <ChevronLeft className="w-4 h-4" />
              </span>
            )}

            {/* Page Numbers */}
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum: number
              if (totalPages <= 5) {
                pageNum = i + 1
              } else if (currentPage <= 3) {
                pageNum = i + 1
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i
              } else {
                pageNum = currentPage - 2 + i
              }

              return (
                <Link
                  key={pageNum}
                  href={getPageUrl(pageNum)}
                  className={`inline-flex items-center justify-center w-8 h-8 rounded-lg text-sm font-medium transition-colors
                    ${pageNum === currentPage
                      ? 'bg-red-600 text-white'
                      : 'text-gray-600 hover:bg-gray-200'
                    }`}
                >
                  {pageNum}
                </Link>
              )
            })}

            {/* Next */}
            {currentPage < totalPages ? (
              <Link
                href={getPageUrl(currentPage + 1)}
                className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-gray-600 hover:bg-gray-200 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </Link>
            ) : (
              <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-gray-300">
                <ChevronRight className="w-4 h-4" />
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}