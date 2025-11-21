import { Suspense } from 'react'
import { RequestsTable } from '@/components/requests/requests-table'
import { RequestsFilters } from '@/components/requests/requests-filters'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, AlertTriangle, Clock, CheckCircle } from 'lucide-react'
import { db } from '@/lib/db'

async function getRequestsStats() {
  try {
    const [total, pending, inProgress, completed, critical] = await Promise.all([
      db.request.count(),
      db.request.count({ where: { status: 'PENDING' } }),
      db.request.count({ where: { status: 'IN_PROGRESS' } }),
      db.request.count({ where: { status: 'COMPLETED' } }),
      db.request.count({ where: { urgencyLevel: 'CRITICAL', status: { not: 'COMPLETED' } } })
    ])

    return { total, pending, inProgress, completed, critical }
  } catch (error) {
    console.error('Error fetching requests stats:', error)
    return { total: 0, pending: 0, inProgress: 0, completed: 0, critical: 0 }
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
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
            <Plus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.inProgress}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.critical}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Actions */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex-1">
          <Suspense fallback={<div>Loading filters...</div>}>
            <RequestsFilters />
          </Suspense>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            Export
          </Button>
          <Button>
            Create Match
          </Button>
        </div>
      </div>

      {/* Requests Table */}
      <Card>
        <CardHeader>
          <CardTitle>Blood Requests</CardTitle>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<div>Loading requests...</div>}>
            <RequestsTable searchParams={searchParams} />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  )
}