'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Clock, AlertTriangle, UserCheck, ArrowRight, Phone } from 'lucide-react'
import Link from 'next/link'
import { useTranslations } from '@/lib/i18n'

interface DashboardStats {
  donorCount: number
  requestCount: number
  pendingRequests: number
  completedRequests: number
  criticalRequests: number
  verifiedDonors: number
  availableDonors: number
  recentDonors: any[]
  recentRequests: any[]
}

interface DashboardContentProps {
  stats: DashboardStats
  userName?: string
}

export function DashboardContent({ stats, userName }: DashboardContentProps) {
  const t = useTranslations('pages')

  // Calculate unverified donors
  const unverifiedDonors = stats.donorCount - stats.verifiedDonors

  return (
    <div className="space-y-8">
      {/* Welcome - simpler */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">
          Welcome back{userName ? `, ${userName}` : ''}
        </h1>
        <p className="text-gray-500 mt-1">
          Here's what needs your attention today.
        </p>
      </div>

      {/* 3 Key Metrics - Big, Clear, Actionable */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Pending Requests - Primary Focus */}
        <Link href="/dashboard/requests?status=PENDING">
          <Card className="hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-yellow-500">
            <CardContent className="pt-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                    Pending Requests
                  </p>
                  <p className="text-4xl font-bold text-gray-900 mt-2">
                    {stats.pendingRequests}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    Need donor assignment
                  </p>
                </div>
                <div className="p-3 bg-yellow-50 rounded-full">
                  <Clock className="h-6 w-6 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Critical Requests */}
        <Link href="/dashboard/requests?urgency=CRITICAL">
          <Card className={`hover:shadow-md transition-shadow cursor-pointer border-l-4 ${stats.criticalRequests > 0 ? 'border-l-red-500 bg-red-50/30' : 'border-l-gray-200'
            }`}>
            <CardContent className="pt-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                    Critical
                  </p>
                  <p className={`text-4xl font-bold mt-2 ${stats.criticalRequests > 0 ? 'text-red-600' : 'text-gray-900'
                    }`}>
                    {stats.criticalRequests}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    {stats.criticalRequests > 0 ? 'Urgent attention!' : 'All clear'}
                  </p>
                </div>
                <div className={`p-3 rounded-full ${stats.criticalRequests > 0 ? 'bg-red-100' : 'bg-gray-100'
                  }`}>
                  <AlertTriangle className={`h-6 w-6 ${stats.criticalRequests > 0 ? 'text-red-600' : 'text-gray-400'
                    }`} />
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Donors to Verify */}
        <Link href="/dashboard/donors?isVerified=false">
          <Card className="hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-blue-500">
            <CardContent className="pt-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                    To Verify
                  </p>
                  <p className="text-4xl font-bold text-gray-900 mt-2">
                    {unverifiedDonors}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    New donor applications
                  </p>
                </div>
                <div className="p-3 bg-blue-50 rounded-full">
                  <UserCheck className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Quick Actions - Simplified */}
      <div className="bg-white rounded-xl border p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Link href="/dashboard/requests">
            <Button variant="outline" className="w-full h-14 justify-between group">
              <span>View All Requests</span>
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>

          <Link href="/dashboard/donors">
            <Button variant="outline" className="w-full h-14 justify-between group">
              <span>Donor Database</span>
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>

          <Link href="/dashboard/matches">
            <Button variant="outline" className="w-full h-14 justify-between group">
              <span>Manage Matches</span>
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Workflow Reminder */}
      <div className="bg-gradient-to-r from-red-50 to-red-100/50 rounded-xl border border-red-200 p-6">
        <div className="flex items-start gap-4">
          <div className="p-2 bg-white rounded-lg shadow-sm">
            <Phone className="h-5 w-5 text-red-600" />
          </div>
          <div>
            <h3 className="font-medium text-gray-900">Your Workflow</h3>
            <p className="text-sm text-gray-600 mt-1">
              1. Check pending requests → 2. Find matching donors → 3. Call both parties → 4. Update match status
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
