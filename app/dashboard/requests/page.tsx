import { Suspense } from 'react'
import { RequestsTable } from '@/components/requests/requests-table'
import { RequestsFilters } from '@/components/requests/requests-filters'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Clock, AlertTriangle, Activity } from 'lucide-react'
import { db } from '@/lib/db'

async function getRequestsStats() {
  try {
    const [total, pending, critical] = await Promise.all([
      db.request.count(),
      db.request.count({ where: { status: 'PENDING' } }),
      db.request.count({ where: { urgencyLevel: 'CRITICAL', status: { not: 'COMPLETED' } } })
    ])

    return { total, pending, critical }
  } catch (error) {
    console.error('Error fetching requests stats:', error)
    return { total: 0, pending: 0, critical: 0 }
  }
}

export default async function RequestsPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  const stats = await getRequestsStats()

  return (
    <div className="space-y-6">
      {/* Simplified Stats - 3 Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-l-4 border-l-yellow-500">
          <CardContent className="pt-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-500">Pending</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{stats.pending}</p>
                <p className="text-xs text-gray-500 mt-1">Need attention</p>
              </div>
              <div className="p-2 bg-yellow-50 rounded-full">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={`border-l-4 ${stats.critical > 0 ? 'border-l-red-500 bg-red-50/30' : 'border-l-gray-200'}`}>
          <CardContent className="pt-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-500">Critical</p>
                <p className={`text-3xl font-bold mt-1 ${stats.critical > 0 ? 'text-red-600' : 'text-gray-900'}`}>
                  {stats.critical}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {stats.critical > 0 ? 'Urgent!' : 'All clear'}
                </p>
              </div>
              <div className={`p-2 rounded-full ${stats.critical > 0 ? 'bg-red-100' : 'bg-gray-100'}`}>
                <AlertTriangle className={`h-5 w-5 ${stats.critical > 0 ? 'text-red-600' : 'text-gray-400'}`} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-gray-300">
          <CardContent className="pt-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Requests</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{stats.total}</p>
                <p className="text-xs text-gray-500 mt-1">All time</p>
              </div>
              <div className="p-2 bg-gray-100 rounded-full">
                <Activity className="h-5 w-5 text-gray-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Suspense fallback={<div className="h-10 bg-gray-100 animate-pulse rounded"></div>}>
        <RequestsFilters />
      </Suspense>

      {/* Requests Table */}
      <Suspense fallback={
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-500">
          Loading requests...
        </div>
      }>
        <RequestsTable searchParams={searchParams} />
      </Suspense>
    </div>
  )
}