import { Suspense } from 'react'
import { MatchesTable } from '@/components/matches/matches-table'
import { MatchesFilters } from '@/components/matches/matches-filters'
import { CreateMatchDialog } from '@/components/matches/create-match-dialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Clock, CheckCircle, Plus, Activity } from 'lucide-react'
import { db } from '@/lib/db'

async function getMatchesStats() {
  try {
    const [total, inProgress, completed] = await Promise.all([
      db.match.count(),
      db.match.count({ where: { status: { in: ['PENDING', 'CONTACTED', 'ACCEPTED'] } } }),
      db.match.count({ where: { status: 'COMPLETED' } })
    ])

    return { total, inProgress, completed }
  } catch (error) {
    console.error('Error fetching matches stats:', error)
    return { total: 0, inProgress: 0, completed: 0 }
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
      {/* Simplified Stats - 3 Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="pt-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-500">In Progress</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{stats.inProgress}</p>
                <p className="text-xs text-gray-500 mt-1">Active matches</p>
              </div>
              <div className="p-2 bg-blue-50 rounded-full">
                <Clock className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardContent className="pt-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-500">Completed</p>
                <p className="text-3xl font-bold text-green-600 mt-1">{stats.completed}</p>
                <p className="text-xs text-gray-500 mt-1">Successful donations</p>
              </div>
              <div className="p-2 bg-green-50 rounded-full">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-gray-300">
          <CardContent className="pt-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Matches</p>
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

      {/* Filters and Create Match */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex-1">
          <Suspense fallback={<div className="h-10 bg-gray-100 animate-pulse rounded"></div>}>
            <MatchesFilters />
          </Suspense>
        </div>
        <CreateMatchDialog>
          <Button className="bg-red-600 hover:bg-red-700">
            <Plus className="h-4 w-4 mr-2" />
            Create Match
          </Button>
        </CreateMatchDialog>
      </div>

      {/* Matches Table */}
      <Suspense fallback={
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-500">
          Loading matches...
        </div>
      }>
        <MatchesTable searchParams={searchParams} />
      </Suspense>
    </div>
  )
}