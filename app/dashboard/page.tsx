import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Users, Heart, Clock, CheckCircle, AlertTriangle, UserPlus, Activity } from 'lucide-react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'

async function getDashboardStats() {
  try {
    const [
      donorCount, 
      requestCount, 
      pendingRequests, 
      completedRequests,
      criticalRequests,
      verifiedDonors,
      availableDonors,
      recentActivity
    ] = await Promise.all([
      db.donor.count(),
      db.request.count(),
      db.request.count({ where: { status: 'PENDING' } }),
      db.request.count({ where: { status: 'COMPLETED' } }),
      db.request.count({ where: { urgencyLevel: 'CRITICAL', status: { not: 'COMPLETED' } } }),
      db.donor.count({ where: { isVerified: true } }),
      db.donor.count({ where: { isAvailable: true, isVerified: true } }),
      // Get recent activity
      Promise.all([
        db.donor.findMany({
          take: 3,
          orderBy: { createdAt: 'desc' },
          select: { name: true, createdAt: true, bloodType: true }
        }),
        db.request.findMany({
          take: 3,
          orderBy: { createdAt: 'desc' },
          select: { requesterName: true, createdAt: true, urgencyLevel: true, bloodType: true }
        })
      ])
    ])

    return {
      donorCount,
      requestCount,
      pendingRequests,
      completedRequests,
      criticalRequests,
      verifiedDonors,
      availableDonors,
      recentDonors: recentActivity[0],
      recentRequests: recentActivity[1]
    }
  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
    return {
      donorCount: 0,
      requestCount: 0,
      pendingRequests: 0,
      completedRequests: 0,
      criticalRequests: 0,
      verifiedDonors: 0,
      availableDonors: 0,
      recentDonors: [],
      recentRequests: []
    }
  }
}

export default async function DashboardPage() {
  const session = await auth()
  const stats = await getDashboardStats()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome back, {session?.user?.name}
        </h1>
        <p className="text-gray-600 mt-2">
          Here's an overview of your blood donation platform
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Donors</CardTitle>
            <Users className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.donorCount}</div>
            <p className="text-xs text-muted-foreground">
              {stats.verifiedDonors} verified • {stats.availableDonors} available
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Blood Requests</CardTitle>
            <Heart className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.requestCount}</div>
            <p className="text-xs text-muted-foreground">
              {stats.pendingRequests} pending • {stats.completedRequests} completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingRequests}</div>
            <p className="text-xs text-muted-foreground">
              Need donor assignment
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical Requests</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.criticalRequests}</div>
            <p className="text-xs text-muted-foreground">
              Urgent attention needed
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.recentDonors.map((donor, index) => (
                <div key={index} className="flex items-center space-x-4">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">
                      New donor: {donor.name} ({donor.bloodType.replace('_', '')})
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(donor.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              ))}
              {stats.recentRequests.map((request, index) => (
                <div key={index} className="flex items-center space-x-4">
                  <div className={`w-2 h-2 rounded-full ${
                    request.urgencyLevel === 'CRITICAL' ? 'bg-red-500' : 
                    request.urgencyLevel === 'URGENT' ? 'bg-orange-500' : 'bg-blue-500'
                  }`}></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">
                      Blood request: {request.bloodType.replace('_', '')} by {request.requesterName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(request.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              ))}
              {stats.recentDonors.length === 0 && stats.recentRequests.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No recent activity
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Link href="/dashboard/requests?status=PENDING">
                <Button variant="outline" className="w-full justify-start h-auto p-4">
                  <div className="text-left">
                    <div className="font-medium flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      View Pending Requests
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {stats.pendingRequests} requests need attention
                    </div>
                  </div>
                </Button>
              </Link>
              
              <Link href="/dashboard/donors?isVerified=false">
                <Button variant="outline" className="w-full justify-start h-auto p-4">
                  <div className="text-left">
                    <div className="font-medium flex items-center gap-2">
                      <UserPlus className="h-4 w-4" />
                      Verify New Donors
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Review and verify donor profiles
                    </div>
                  </div>
                </Button>
              </Link>
              
              <Link href="/dashboard/matches">
                <Button variant="outline" className="w-full justify-start h-auto p-4">
                  <div className="text-left">
                    <div className="font-medium flex items-center gap-2">
                      <Heart className="h-4 w-4" />
                      Create Match
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Assign donors to requests
                    </div>
                  </div>
                </Button>
              </Link>

              {stats.criticalRequests > 0 && (
                <Link href="/dashboard/requests?urgency=CRITICAL">
                  <Button className="w-full justify-start h-auto p-4 bg-red-600 hover:bg-red-700">
                    <div className="text-left">
                      <div className="font-medium flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4" />
                        Critical Requests
                      </div>
                      <div className="text-sm text-red-100">
                        {stats.criticalRequests} critical requests need immediate attention
                      </div>
                    </div>
                  </Button>
                </Link>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}