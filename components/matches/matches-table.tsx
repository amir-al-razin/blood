import { db } from '@/lib/db'
import { MatchActions } from './match-actions'
import { formatDistanceToNow, format } from 'date-fns'
import Link from 'next/link'
import { ChevronLeft, ChevronRight, AlertTriangle, Clock } from 'lucide-react'

interface MatchesTableProps {
  searchParams: { [key: string]: string | string[] | undefined }
}

async function getMatches(searchParams: MatchesTableProps['searchParams']) {
  const page = parseInt((searchParams.page as string) || '1')
  const limit = 15
  const status = searchParams.status as string
  const bloodType = searchParams.bloodType as string
  const search = searchParams.search as string

  const skip = (page - 1) * limit

  const where: any = {}
  if (status) where.status = status
  if (bloodType) {
    where.OR = [
      { donor: { bloodType } },
      { request: { bloodType } }
    ]
  }
  if (search) {
    where.OR = [
      { donor: { name: { contains: search, mode: 'insensitive' } } },
      { request: { referenceId: { contains: search, mode: 'insensitive' } } },
      { request: { hospital: { contains: search, mode: 'insensitive' } } }
    ]
  }

  try {
    const [matches, total] = await Promise.all([
      db.match.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ createdAt: 'desc' }],
        include: {
          donor: {
            select: { id: true, name: true, phone: true, bloodType: true, area: true }
          },
          request: {
            select: { id: true, referenceId: true, requesterName: true, bloodType: true, urgencyLevel: true, hospital: true }
          },
          createdByUser: { select: { name: true } }
        }
      }),
      db.match.count({ where })
    ])

    return { matches, pagination: { page, limit, total, pages: Math.ceil(total / limit) } }
  } catch (error) {
    console.error('Error fetching matches:', error)
    return { matches: [], pagination: { page: 1, limit: 15, total: 0, pages: 0 } }
  }
}

const getStatusStyle = (status: string) => {
  switch (status) {
    case 'PENDING': return 'bg-amber-100 text-amber-700'
    case 'CONTACTED': return 'bg-blue-100 text-blue-700'
    case 'ACCEPTED': return 'bg-emerald-100 text-emerald-700'
    case 'REJECTED': return 'bg-red-100 text-red-700'
    case 'COMPLETED': return 'bg-green-200 text-green-800'
    case 'CANCELLED': return 'bg-gray-100 text-gray-600'
    default: return 'bg-gray-100 text-gray-600'
  }
}

const getUrgencyStyle = (urgency: string) => {
  switch (urgency) {
    case 'CRITICAL': return { bg: 'bg-red-500', text: 'text-white', icon: true }
    case 'URGENT': return { bg: 'bg-orange-100', text: 'text-orange-700', icon: true }
    default: return { bg: 'bg-gray-100', text: 'text-gray-600', icon: false }
  }
}

export async function MatchesTable({ searchParams }: MatchesTableProps) {
  const { matches, pagination } = await getMatches(searchParams)

  if (matches.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-gray-400">
        <div className="text-5xl mb-4">🔗</div>
        <p className="text-lg font-medium text-gray-600">No matches found</p>
        <p className="text-sm">Try adjusting your filters</p>
      </div>
    )
  }

  const currentPage = pagination.page
  const totalPages = pagination.pages

  const getPageUrl = (page: number) => {
    const params = new URLSearchParams()
    Object.entries(searchParams).forEach(([key, value]) => {
      if (value && key !== 'page') params.set(key, value as string)
    })
    params.set('page', page.toString())
    return `?${params.toString()}`
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/50">
              <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide px-4 py-3">ID</th>
              <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide px-4 py-3">Donor</th>
              <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide px-4 py-3">Request</th>
              <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide px-4 py-3">Blood</th>
              <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide px-4 py-3">Status</th>
              <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide px-4 py-3">Created</th>
              <th className="w-10 px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {matches.map((match) => {
              const urgencyStyle = getUrgencyStyle(match.request.urgencyLevel)
              return (
                <tr key={match.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-4 py-3">
                    <span className="font-mono text-sm text-gray-900">
                      {match.id.slice(-8).toUpperCase()}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">{match.donor.name}</div>
                    <a href={`tel:${match.donor.phone}`} className="text-sm text-red-600 hover:underline">
                      {match.donor.phone}
                    </a>
                    <div className="text-xs text-gray-500">{match.donor.area}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-mono text-sm font-medium text-gray-900">
                      {match.request.referenceId.slice(-8).toUpperCase()}
                    </div>
                    <div className="text-sm text-gray-600">{match.request.requesterName}</div>
                    <div className="text-xs text-gray-500 truncate max-w-[140px]">{match.request.hospital}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-1">
                      <span className="inline-flex items-center px-2 py-0.5 rounded bg-red-50 text-red-700 font-bold text-xs w-fit">
                        {match.donor.bloodType.replace('_POSITIVE', '+').replace('_NEGATIVE', '-')}
                      </span>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium w-fit ${urgencyStyle.bg} ${urgencyStyle.text}`}>
                        {urgencyStyle.icon && (match.request.urgencyLevel === 'CRITICAL'
                          ? <AlertTriangle className="w-3 h-3" />
                          : <Clock className="w-3 h-3" />
                        )}
                        {match.request.urgencyLevel.charAt(0) + match.request.urgencyLevel.slice(1).toLowerCase()}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-sm font-medium ${getStatusStyle(match.status)}`}>
                      {match.status.charAt(0) + match.status.slice(1).toLowerCase()}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm font-medium text-gray-900">
                      {format(new Date(match.createdAt), 'MMM dd')}
                    </div>
                    <div className="text-xs text-gray-500">
                      by {match.createdByUser.name}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <MatchActions match={match} />
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
          <span className="font-medium">{pagination.total}</span> matches
        </p>

        {totalPages > 1 && (
          <div className="flex items-center gap-1">
            {currentPage > 1 ? (
              <Link href={getPageUrl(currentPage - 1)} className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-gray-600 hover:bg-gray-200 transition-colors">
                <ChevronLeft className="w-4 h-4" />
              </Link>
            ) : (
              <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-gray-300">
                <ChevronLeft className="w-4 h-4" />
              </span>
            )}

            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum: number
              if (totalPages <= 5) pageNum = i + 1
              else if (currentPage <= 3) pageNum = i + 1
              else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i
              else pageNum = currentPage - 2 + i

              return (
                <Link
                  key={pageNum}
                  href={getPageUrl(pageNum)}
                  className={`inline-flex items-center justify-center w-8 h-8 rounded-lg text-sm font-medium transition-colors
                    ${pageNum === currentPage ? 'bg-red-600 text-white' : 'text-gray-600 hover:bg-gray-200'}`}
                >
                  {pageNum}
                </Link>
              )
            })}

            {currentPage < totalPages ? (
              <Link href={getPageUrl(currentPage + 1)} className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-gray-600 hover:bg-gray-200 transition-colors">
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