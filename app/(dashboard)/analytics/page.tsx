import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Heart, 
  Download,
  Calendar,
  MapPin,
  Clock
} from 'lucide-react'
import { db } from '@/lib/db'
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns'

async function getAnalyticsData() {
  try {
    const now = new Date()
    const thirtyDaysAgo = subDays(now, 30)
    const startOfThisMonth = startOfMonth(now)
    const endOfThisMonth = endOfMonth(now)

    const [
      totalStats,
      monthlyStats,
      bloodTypeDistribution,
      locationStats,
      urgencyStats,
      recentTrends
    ] = await Promise.all([
      // Total stats
      Promise.all([
        db.donor.count(),
        db.request.count(),
        db.match.count(),
        db.match.count({ where: { status: 'COMPLETED' } })
      ]),
      
      // Monthly stats
      Promise.all([
        db.donor.count({ 
          where: { createdAt: { gte: startOfThisMonth, lte: endOfThisMonth } } 
        }),
        db.request.count({ 
          where: { createdAt: { gte: startOfThisMonth, lte: endOfThisMonth } } 
        }),
        db.match.count({ 
          where: { createdAt: { gte: startOfThisMonth, lte: endOfThisMonth } } 
        })
      ]),

      // Blood type distribution
      db.donor.groupBy({
        by: ['bloodType'],
        _count: { bloodType: true }
      }),

      // Location stats
      db.donor.groupBy({
        by: ['area'],
        _count: { area: true },
        orderBy: { _count: { area: 'desc' } },
        take: 10
      }),

      // Urgency level stats
      db.request.groupBy({
        by: ['urgencyLevel'],
        _count: { urgencyLevel: true }
      }),

      // Recent trends (last 30 days)
      Promise.all([
        db.donor.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
        db.request.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
        db.match.count({ where: { createdAt: { gte: thirtyDaysAgo } } })
      ])
    ])

    return {
      totalDonors: totalStats[0],
      totalRequests: totalStats[1],
      totalMatches: totalStats[2],
      completedMatches: totalStats[3],
      monthlyDonors: monthlyStats[0],
      monthlyRequests: monthlyStats[1],
      monthlyMatches: monthlyStats[2],
      bloodTypeDistribution,
      locationStats,
      urgencyStats,
      recentDonors: recentTrends[0],
      recentRequests: recentTrends[1],
      recentMatches: recentTrends[2]
    }
  } catch (error) {
    console.error('Error fetching analytics data:', error)
    return {
      totalDonors: 0,
      totalRequests: 0,
      totalMatches: 0,
      completedMatches: 0,
      monthlyDonors: 0,
      monthlyRequests: 0,
      monthlyMatches: 0,
      bloodTypeDistribution: [],
      locationStats: [],
      urgencyStats: [],
      recentDonors: 0,
      recentRequests: 0,
      recentMatches: 0
    }
  }
}

export default async function AnalyticsPage() {
  const data = await getAnalyticsData()
  const successRate = data.totalMatches > 0 ? ((data.completedMatches / data.totalMatches) * 100).toFixed(1) : '0'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics & Reports</h1>
          <p className="text-gray-600 mt-2">
            Insights into your blood donation platform performance
          </p>
        </div>
        <Button>
          <Download className="h-4 w-4 mr-2" />
          Export Report
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Donors</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.totalDonors}</div>
            <p className="text-xs text-muted-foreground">
              +{data.monthlyDonors} this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Blood Requests</CardTitle>
            <Heart className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.totalRequests}</div>
            <p className="text-xs text-muted-foreground">
              +{data.monthlyRequests} this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{successRate}%</div>
            <p className="text-xs text-muted-foreground">
              {data.completedMatches} of {data.totalMatches} matches
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Matches</CardTitle>
            <BarChart3 className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.totalMatches - data.completedMatches}</div>
            <p className="text-xs text-muted-foreground">
              +{data.monthlyMatches} this month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Detailed Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Blood Type Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5" />
              Blood Type Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.bloodTypeDistribution.map((item) => {
                const percentage = data.totalDonors > 0 ? ((item._count.bloodType / data.totalDonors) * 100).toFixed(1) : '0'
                return (
                  <div key={item.bloodType} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 bg-red-500 rounded"></div>
                      <span className="font-medium">{item.bloodType.replace('_', '')}</span>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{item._count.bloodType}</div>
                      <div className="text-xs text-muted-foreground">{percentage}%</div>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Location Statistics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Top Donor Areas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.locationStats.slice(0, 8).map((item, index) => {
                const percentage = data.totalDonors > 0 ? ((item._count.area / data.totalDonors) * 100).toFixed(1) : '0'
                return (
                  <div key={item.area} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-xs font-medium">
                        {index + 1}
                      </div>
                      <span className="font-medium">{item.area}</span>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{item._count.area}</div>
                      <div className="text-xs text-muted-foreground">{percentage}%</div>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Request Urgency Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Request Urgency Levels
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.urgencyStats.map((item) => {
                const percentage = data.totalRequests > 0 ? ((item._count.urgencyLevel / data.totalRequests) * 100).toFixed(1) : '0'
                const color = item.urgencyLevel === 'CRITICAL' ? 'bg-red-500' : 
                             item.urgencyLevel === 'URGENT' ? 'bg-orange-500' : 'bg-green-500'
                return (
                  <div key={item.urgencyLevel} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-4 h-4 ${color} rounded`}></div>
                      <span className="font-medium capitalize">{item.urgencyLevel.toLowerCase()}</span>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{item._count.urgencyLevel}</div>
                      <div className="text-xs text-muted-foreground">{percentage}%</div>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity Trends */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              30-Day Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <div>
                  <div className="font-medium">New Donors</div>
                  <div className="text-sm text-muted-foreground">Last 30 days</div>
                </div>
                <div className="text-2xl font-bold text-blue-600">{data.recentDonors}</div>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                <div>
                  <div className="font-medium">Blood Requests</div>
                  <div className="text-sm text-muted-foreground">Last 30 days</div>
                </div>
                <div className="text-2xl font-bold text-red-600">{data.recentRequests}</div>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div>
                  <div className="font-medium">Matches Created</div>
                  <div className="text-sm text-muted-foreground">Last 30 days</div>
                </div>
                <div className="text-2xl font-bold text-green-600">{data.recentMatches}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Export Options */}
      <Card>
        <CardHeader>
          <CardTitle>Export Reports</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button variant="outline" className="h-auto p-4">
              <div className="text-left">
                <div className="font-medium">Donor Report</div>
                <div className="text-sm text-muted-foreground">
                  Complete donor database with statistics
                </div>
              </div>
            </Button>
            
            <Button variant="outline" className="h-auto p-4">
              <div className="text-left">
                <div className="font-medium">Request Report</div>
                <div className="text-sm text-muted-foreground">
                  Blood requests and fulfillment data
                </div>
              </div>
            </Button>
            
            <Button variant="outline" className="h-auto p-4">
              <div className="text-left">
                <div className="font-medium">Analytics Summary</div>
                <div className="text-sm text-muted-foreground">
                  Monthly performance summary
                </div>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}