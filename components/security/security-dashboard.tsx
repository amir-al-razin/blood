'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Shield, 
  AlertTriangle, 
  Lock, 
  Eye, 
  Activity,
  TrendingUp,
  Users,
  Clock
} from 'lucide-react'

interface SecurityEvent {
  id: string
  type: string
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  description: string
  timestamp: string
  ipAddress?: string
  userId?: string
}

interface SecurityAlert {
  id: string
  type: string
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  count: number
  lastOccurrence: string
  isResolved: boolean
}

interface SecurityStats {
  totalEvents: number
  criticalAlerts: number
  failedLogins: number
  blockedRequests: number
  activeUsers: number
}

export function SecurityDashboard() {
  const [events, setEvents] = useState<SecurityEvent[]>([])
  const [alerts, setAlerts] = useState<SecurityAlert[]>([])
  const [stats, setStats] = useState<SecurityStats>({
    totalEvents: 0,
    criticalAlerts: 0,
    failedLogins: 0,
    blockedRequests: 0,
    activeUsers: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSecurityData()
    const interval = setInterval(fetchSecurityData, 30000) // Refresh every 30 seconds
    return () => clearInterval(interval)
  }, [])

  const fetchSecurityData = async () => {
    try {
      const [eventsRes, alertsRes, statsRes] = await Promise.all([
        fetch('/api/security/events'),
        fetch('/api/security/alerts'),
        fetch('/api/security/stats')
      ])

      if (eventsRes.ok) {
        const eventsData = await eventsRes.json()
        setEvents(eventsData.events || [])
      }

      if (alertsRes.ok) {
        const alertsData = await alertsRes.json()
        setAlerts(alertsData.alerts || [])
      }

      if (statsRes.ok) {
        const statsData = await statsRes.json()
        setStats(statsData)
      }
    } catch (error) {
      console.error('Failed to fetch security data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return 'destructive'
      case 'HIGH': return 'destructive'
      case 'MEDIUM': return 'default'
      case 'LOW': return 'secondary'
      default: return 'secondary'
    }
  }

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return <AlertTriangle className="h-4 w-4 text-red-500" />
      case 'HIGH': return <AlertTriangle className="h-4 w-4 text-orange-500" />
      case 'MEDIUM': return <Eye className="h-4 w-4 text-yellow-500" />
      case 'LOW': return <Activity className="h-4 w-4 text-blue-500" />
      default: return <Activity className="h-4 w-4" />
    }
  }

  const resolveAlert = async (alertId: string) => {
    try {
      const response = await fetch(`/api/security/alerts/${alertId}/resolve`, {
        method: 'POST'
      })

      if (response.ok) {
        setAlerts(alerts.map(alert => 
          alert.id === alertId ? { ...alert, isResolved: true } : alert
        ))
      }
    } catch (error) {
      console.error('Failed to resolve alert:', error)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => (
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
      {/* Security Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Events</p>
                <p className="text-2xl font-bold">{stats.totalEvents}</p>
              </div>
              <Activity className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Critical Alerts</p>
                <p className="text-2xl font-bold text-red-600">{stats.criticalAlerts}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Failed Logins</p>
                <p className="text-2xl font-bold text-orange-600">{stats.failedLogins}</p>
              </div>
              <Lock className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Blocked Requests</p>
                <p className="text-2xl font-bold">{stats.blockedRequests}</p>
              </div>
              <Shield className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Users</p>
                <p className="text-2xl font-bold text-green-600">{stats.activeUsers}</p>
              </div>
              <Users className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Critical Alerts Banner */}
      {alerts.filter(alert => alert.severity === 'CRITICAL' && !alert.isResolved).length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Critical Security Alert:</strong> {alerts.filter(alert => alert.severity === 'CRITICAL' && !alert.isResolved).length} critical security issues require immediate attention.
          </AlertDescription>
        </Alert>
      )}

      {/* Security Events and Alerts */}
      <Tabs defaultValue="events" className="space-y-4">
        <TabsList>
          <TabsTrigger value="events">Recent Events</TabsTrigger>
          <TabsTrigger value="alerts">
            Active Alerts
            {alerts.filter(alert => !alert.isResolved).length > 0 && (
              <Badge variant="destructive" className="ml-2">
                {alerts.filter(alert => !alert.isResolved).length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="events">
          <Card>
            <CardHeader>
              <CardTitle>Recent Security Events</CardTitle>
              <CardDescription>
                Latest security events and activities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {events.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No recent security events</p>
                ) : (
                  events.map((event) => (
                    <div key={event.id} className="flex items-start space-x-3 p-3 border rounded-lg">
                      {getSeverityIcon(event.severity)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-gray-900">
                            {event.type.replace(/_/g, ' ')}
                          </p>
                          <div className="flex items-center space-x-2">
                            <Badge variant={getSeverityColor(event.severity)}>
                              {event.severity}
                            </Badge>
                            <span className="text-xs text-gray-500 flex items-center">
                              <Clock className="h-3 w-3 mr-1" />
                              {new Date(event.timestamp).toLocaleString()}
                            </span>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          {event.description}
                        </p>
                        {event.ipAddress && (
                          <p className="text-xs text-gray-500 mt-1">
                            IP: {event.ipAddress}
                          </p>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts">
          <Card>
            <CardHeader>
              <CardTitle>Security Alerts</CardTitle>
              <CardDescription>
                Active security alerts requiring attention
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {alerts.filter(alert => !alert.isResolved).length === 0 ? (
                  <div className="text-center py-8">
                    <Shield className="h-12 w-12 text-green-500 mx-auto mb-4" />
                    <p className="text-gray-500">No active security alerts</p>
                    <p className="text-sm text-gray-400">All security issues have been resolved</p>
                  </div>
                ) : (
                  alerts
                    .filter(alert => !alert.isResolved)
                    .map((alert) => (
                      <div key={alert.id} className="flex items-start space-x-3 p-4 border rounded-lg bg-red-50 border-red-200">
                        {getSeverityIcon(alert.severity)}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-gray-900">
                              {alert.type.replace(/_/g, ' ')}
                            </p>
                            <div className="flex items-center space-x-2">
                              <Badge variant={getSeverityColor(alert.severity)}>
                                {alert.severity}
                              </Badge>
                              <Badge variant="outline">
                                {alert.count} occurrences
                              </Badge>
                            </div>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            Last occurrence: {new Date(alert.lastOccurrence).toLocaleString()}
                          </p>
                          <div className="mt-3">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => resolveAlert(alert.id)}
                            >
                              Mark as Resolved
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}