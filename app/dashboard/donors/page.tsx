import { Suspense } from 'react'
import { DonorsTable } from '@/components/donors/donors-table'
import { DonorsFilters } from '@/components/donors/donors-filters'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { UserCheck, Clock, Users } from 'lucide-react'
import { db } from '@/lib/db'

async function getDonorsStats() {
  try {
    const [total, verified, unverified] = await Promise.all([
      db.donor.count(),
      db.donor.count({ where: { isVerified: true } }),
      db.donor.count({ where: { isVerified: false } })
    ])

    return { total, verified, unverified }
  } catch (error) {
    console.error('Error fetching donors stats:', error)
    return { total: 0, verified: 0, unverified: 0 }
  }
}

export default async function DonorsPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  const stats = await getDonorsStats()

  return (
    <div className="space-y-6">
      {/* Simplified Stats - 3 Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="pt-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-500">Verified</p>
                <p className="text-3xl font-bold text-green-600 mt-1">{stats.verified}</p>
                <p className="text-xs text-gray-500 mt-1">Ready to donate</p>
              </div>
              <div className="p-2 bg-green-50 rounded-full">
                <UserCheck className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={`border-l-4 ${stats.unverified > 0 ? 'border-l-yellow-500' : 'border-l-gray-200'}`}>
          <CardContent className="pt-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-500">Pending Verification</p>
                <p className={`text-3xl font-bold mt-1 ${stats.unverified > 0 ? 'text-yellow-600' : 'text-gray-900'}`}>
                  {stats.unverified}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {stats.unverified > 0 ? 'Need review' : 'All clear'}
                </p>
              </div>
              <div className={`p-2 rounded-full ${stats.unverified > 0 ? 'bg-yellow-50' : 'bg-gray-100'}`}>
                <Clock className={`h-5 w-5 ${stats.unverified > 0 ? 'text-yellow-600' : 'text-gray-400'}`} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-gray-300">
          <CardContent className="pt-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Donors</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{stats.total}</p>
                <p className="text-xs text-gray-500 mt-1">In database</p>
              </div>
              <div className="p-2 bg-gray-100 rounded-full">
                <Users className="h-5 w-5 text-gray-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Suspense fallback={<div className="h-10 bg-gray-100 animate-pulse rounded"></div>}>
        <DonorsFilters />
      </Suspense>

      {/* Donors Table */}
      <Suspense fallback={
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-500">
          Loading donors...
        </div>
      }>
        <DonorsTable searchParams={searchParams} />
      </Suspense>
    </div>
  )
}