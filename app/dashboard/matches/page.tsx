import { Suspense } from 'react'
import { MatchesTable } from '@/components/matches/matches-table'
import { MatchesFilters } from '@/components/matches/matches-filters'
import { CreateMatchDialog } from '@/components/matches/create-match-dialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { UserCheck, Clock, CheckCircle, XCircle, Plus } from 'lucide-react'
import { db } from '@/lib/db'

async function getMatchesStats() {
  try {
    const [total, pending, contacted, accepted, completed, rejected] = await Promise.all([
      db.match.count(),
      db.match.count({ where: { status: 'PENDING' } }),
      db.match.count({ where: { status: 'CONTACTED' } }),
      db.match.count({ where: { status: 'ACCEPTED' } }),
      db.match.count({ where: { status: 'COMPLETED' } }),
      db.match.count({ where: { status: 'REJECTED' } })
    ])

    return { total, pending, contacted, accepted, completed, rejected }
  } catch (error) {
    console.error('Error fetching matches stats:', error)
    return { total: 0, pending: 0, contacted: 0, accepted: 0, completed: 0, rejected: 0 }
  }
}

export default async function MatchesPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  const stats = await getMatchesStats()

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Matches</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
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
            <CardTitle className="text-sm font-medium">Contacted</CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.contacted}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Accepted</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.accepted}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-700" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-700">{stats.completed}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rejected</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Actions */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex-1">
          <Suspense fallback={<div>Loading filters...</div>}>
            <MatchesFilters />
          </Suspense>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            Export Matches
          </Button>
          <CreateMatchDialog>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Match
            </Button>
          </CreateMatchDialog>
        </div>
      </div>

      {/* Matches Table */}
      <Card>
        <CardHeader>
          <CardTitle>Donor Matches</CardTitle>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<div>Loading matches...</div>}>
            <MatchesTable searchParams={searchParams} />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  )
}