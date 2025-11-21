'use client'

import { useState, useEffect } from 'react'
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
  Clock,
  Activity,
  Target,
  RefreshCw
} from 'lucide-react'
import { 
  DailyTrendsChart, 
  MonthlyTrendsChart, 
  BloodTypeDistributionChart, 
  SuccessRateChart,
  MetricCard 
} from '@/components/analytics/charts'
import { DateRangePicker } from '@/components/analytics/date-range-picker'
import { ExportDialog } from '@/components/analytics/export-dialog'
import { format, subDays } from 'date-fns'
import { toast } from 'sonner'

interface AnalyticsData {
  summary: {
    totalDonors: number
    totalRequests: number
    totalMatches: number
    completedMatches: number
    verifiedDonors: number
    availableDonors: number
    successRate: number
  }
  period: {
    newDonors: number
    newRequests: number
    newMatches: number
    completedMatches: number
    successRate: number
  }
  distributions: {
    bloodTypes: Array<{ bloodType: string; _count: { bloodType: number } }>
    locations: Array<{ area: string; _count: { area: number } }>
    urgencyLevels: Array<{ urgencyLevel: string; _count: { urgencyLevel: number } }>
  }
  trends: {
    daily: Array<{ date: string; donors: number; requests: number; matches: number }>
    monthly: Array<{ 
      month: string
      donors: number
      requests: number
      matches: number
      completedMatches: number
      successRate: number
    }>
  }
  retention: {
    repeatDonors: number
    averageDonations: number
    retentionRate: number
  }
  performance: {
    successRateByBloodType: Array<{
      bloodType: string
      totalMatches: number
      completedMatches: number
      successRate: number
    }>
    averageResponseTime: number
  }
  dateRange: {
    start: string
    end: string
  }
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState({
    start: subDays(new Date(), 30),
    end: new Date()
  })

  const fetchAnalytics = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        startDate: format(dateRange.start, 'yyyy-MM-dd'),
        endDate: format(dateRange.end, 'yyyy-MM-dd')
      })

      const response = await fetch(`/api/analytics?${params}`)
      if (!response.ok) throw new Error('Failed to fetch analytics')
      
      const analyticsData = await response.json()
      setData(analyticsData)
    } catch (error) {
      console.error('Error fetching analytics:', error)
      toast.error('Failed to load analytics data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAnalytics()
  }, [dateRange])

  if (loading || !data) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Analytics & Reports</h1>
            <p className="text-gray-600 mt-2">Loading analytics data...</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics & Reports</h1>
          <p className="text-gray-600 mt-2">
            Insights into your blood donation platform performance
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <DateRangePicker
            value={dateRange}
            onChange={setDateRange}
            className="w-full sm:w-auto"
          />
          <Button
            variant="outline"
            onClick={fetchAnalytics}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <ExportDialog />
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Donors"
          value={data.summary.totalDonors.toLocaleString()}
          change={`+${data.period.newDonors} this period`}
          changeType="positive"
          icon={<Users className="h-5 w-5 text-blue-600" />}
        />
        
        <MetricCard
          title="Blood Requests"
          value={data.summary.totalRequests.toLocaleString()}
          change={`+${data.period.newRequests} this period`}
          changeType="positive"
          icon={<Heart className="h-5 w-5 text-red-600" />}
        />
        
        <MetricCard
          title="Success Rate"
          value={`${data.summary.successRate.toFixed(1)}%`}
          change={`${data.period.successRate.toFixed(1)}% this period`}
          changeType={data.period.successRate >= data.summary.successRate ? "positive" : "negative"}
          icon={<Target className="h-5 w-5 text-green-600" />}
        />
        
        <MetricCard
          title="Active Donors"
          value={data.summary.availableDonors.toLocaleString()}
          change={`${((data.summary.availableDonors / data.summary.totalDonors) * 100).toFixed(1)}% of total`}
          changeType="neutral"
          icon={<Activity className="h-5 w-5 text-purple-600" />}
        />
      </div>

      {/* Additional Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <MetricCard
          title="Verified Donors"
          value={data.summary.verifiedDonors.toLocaleString()}
          change={`${((data.summary.verifiedDonors / data.summary.totalDonors) * 100).toFixed(1)}% verified`}
          changeType="positive"
        />
        
        <MetricCard
          title="Donor Retention"
          value={`${data.retention.retentionRate.toFixed(1)}%`}
          change={`${data.retention.repeatDonors} repeat donors`}
          changeType="positive"
        />
        
        <MetricCard
          title="Avg Response Time"
          value={`${data.performance.averageResponseTime.toFixed(1)}h`}
          change="Average donor response time"
          changeType="neutral"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Trends */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Daily Activity Trends
            </CardTitle>
          </CardHeader>
          <CardContent>
            <DailyTrendsChart data={data.trends.daily} />
          </CardContent>
        </Card>

        {/* Blood Type Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5" />
              Blood Type Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <BloodTypeDistributionChart data={data.distributions.bloodTypes} />
          </CardContent>
        </Card>

        {/* Monthly Trends */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Monthly Performance Trends
            </CardTitle>
          </CardHeader>
          <CardContent>
            <MonthlyTrendsChart data={data.trends.monthly} />
          </CardContent>
        </Card>

        {/* Success Rate by Blood Type */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Success Rate by Blood Type
            </CardTitle>
          </CardHeader>
          <CardContent>
            <SuccessRateChart data={data.performance.successRateByBloodType} />
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
              {data.distributions.locations.slice(0, 8).map((item, index) => {
                const percentage = data.summary.totalDonors > 0 
                  ? ((item._count.area / data.summary.totalDonors) * 100).toFixed(1) 
                  : '0'
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
      </div>

      {/* Urgency Level Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Request Urgency Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {data.distributions.urgencyLevels.map((item) => {
              const percentage = data.summary.totalRequests > 0 
                ? ((item._count.urgencyLevel / data.summary.totalRequests) * 100).toFixed(1) 
                : '0'
              const color = item.urgencyLevel === 'CRITICAL' ? 'bg-red-500' : 
                           item.urgencyLevel === 'URGENT' ? 'bg-orange-500' : 'bg-green-500'
              const bgColor = item.urgencyLevel === 'CRITICAL' ? 'bg-red-50' : 
                             item.urgencyLevel === 'URGENT' ? 'bg-orange-50' : 'bg-green-50'
              
              return (
                <div key={item.urgencyLevel} className={`p-4 rounded-lg ${bgColor}`}>
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`w-4 h-4 ${color} rounded`}></div>
                    <span className="font-medium capitalize">{item.urgencyLevel.toLowerCase()}</span>
                  </div>
                  <div className="text-2xl font-bold">{item._count.urgencyLevel}</div>
                  <div className="text-sm text-muted-foreground">{percentage}% of requests</div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}