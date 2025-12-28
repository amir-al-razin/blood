import { db } from '@/lib/db'
import { DonorActions } from './donor-actions'
import { formatDistanceToNow, format } from 'date-fns'
import Link from 'next/link'
import { ChevronLeft, ChevronRight, UserCheck, Star } from 'lucide-react'

interface DonorsTableProps {
  searchParams: { [key: string]: string | string[] | undefined }
}

async function getDonors(searchParams: DonorsTableProps['searchParams']) {
  const page = parseInt((searchParams.page as string) || '1')
  const limit = 15
  const bloodType = searchParams.bloodType as string
  const isAvailable = searchParams.isAvailable as string
  const isVerified = searchParams.isVerified as string
  const search = searchParams.search as string

  const skip = (page - 1) * limit

  const where: any = {}
  if (bloodType) where.bloodType = bloodType
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
            select: { id: true, status: true },
            take: 5
          }
        }
      }),
      db.donor.count({ where })
    ])

    return {
      donors,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) }
    }
  } catch (error) {
    console.error('Error fetching donors:', error)
    return { donors: [], pagination: { page: 1, limit: 15, total: 0, pages: 0 } }
  }
}

const getReliabilityStars = (score: number) => {
  const stars = Math.round(score * 5)
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          className={`w-3 h-3 ${i < stars ? 'text-amber-400 fill-current' : 'text-gray-200'}`}
        />
      ))}
      <span className="ml-1 text-xs text-gray-500">({score.toFixed(1)})</span>
    </div>
  )
}

export async function DonorsTable({ searchParams }: DonorsTableProps) {
  const { donors, pagination } = await getDonors(searchParams)

  if (donors.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-gray-400">
        <div className="text-5xl mb-4">👥</div>
        <p className="text-lg font-medium text-gray-600">No donors found</p>
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
              <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide px-4 py-3">Donor</th>
              <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide px-4 py-3">Blood</th>
              <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide px-4 py-3">Location</th>
              <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide px-4 py-3">Status</th>
              <th className="text-center text-xs font-medium text-gray-500 uppercase tracking-wide px-4 py-3">Donations</th>
              <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide px-4 py-3">Reliability</th>
              <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide px-4 py-3">Last Donation</th>
              <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide px-4 py-3">Registered</th>
              <th className="w-10 px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {donors.map((donor) => (
              <tr key={donor.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-4 py-3">
                  <div className="font-medium text-gray-900">{donor.name}</div>
                  <a href={`tel:${donor.phone}`} className="text-sm text-red-600 hover:underline">
                    {donor.phone}
                  </a>
                  {donor.email && (
                    <div className="text-xs text-gray-500 truncate max-w-[160px]">{donor.email}</div>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-red-50 text-red-700 font-bold text-sm">
                    {donor.bloodType.replace('_POSITIVE', '+').replace('_NEGATIVE', '-')}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="font-medium text-gray-900">{donor.area}</div>
                  <div className="text-sm text-gray-500">{donor.location}</div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-col gap-1">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium w-fit
                      ${donor.isVerified ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                      {donor.isVerified && <UserCheck className="w-3 h-3" />}
                      {donor.isVerified ? 'Verified' : 'Pending'}
                    </span>
                    <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium w-fit
                      ${donor.isAvailable ? 'bg-blue-50 text-blue-700' : 'bg-gray-100 text-gray-500'}`}>
                      {donor.isAvailable ? 'Available' : 'Unavailable'}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3 text-center">
                  <span className="font-semibold text-gray-900">{donor.donationCount}</span>
                  <div className="text-xs text-gray-500">{donor.matches.length} matches</div>
                </td>
                <td className="px-4 py-3">
                  {getReliabilityStars(donor.reliabilityScore)}
                </td>
                <td className="px-4 py-3">
                  {donor.lastDonation ? (
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {format(new Date(donor.lastDonation), 'MMM dd, yyyy')}
                      </div>
                      <div className="text-xs text-gray-500">
                        {formatDistanceToNow(new Date(donor.lastDonation), { addSuffix: true })}
                      </div>
                    </div>
                  ) : (
                    <span className="text-gray-400 text-sm">Never</span>
                  )}
                </td>
                <td className="px-4 py-3 text-sm text-gray-500">
                  {formatDistanceToNow(new Date(donor.createdAt), { addSuffix: true })}
                </td>
                <td className="px-4 py-3">
                  <DonorActions donor={donor} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-gray-50/50">
        <p className="text-sm text-gray-600">
          Showing <span className="font-medium">{((pagination.page - 1) * pagination.limit) + 1}</span> to{' '}
          <span className="font-medium">{Math.min(pagination.page * pagination.limit, pagination.total)}</span> of{' '}
          <span className="font-medium">{pagination.total}</span> donors
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