import { Suspense } from 'react'
import { DonorsTable } from '@/components/donors/donors-table'
import { DonorsFilters } from '@/components/donors/donors-filters'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Users, UserCheck, UserX, Clock, Shield } from 'lucide-react'
import { db } from '@/lib/db'

async function getDonorsStats() {
  try {
    const [total, verified, unverified, available, recentDonors] = await Promise.all([
      db.donor.count(),
      db.donor.count({ where: { isVerified: true } }),
      db.donor.count({ where: { isVerified: false } }),
      db.donor.count({ where: { isAvailable: true, isVerified: true } }),
      db.donor.count({ 
        where: { 
          createdAt: { 
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
          } 
        } 
      })
    ])

    return { total, verified, unverified, available, recentDonors }
  } catch (error) {
    console.error('Error fetching donors stats:', error)
    return { total: 0, verified: 0, unverified: 0, available: 0, recentDonors: 0 }
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
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Donors</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Verified</CardTitle>
            <UserCheck className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.verified}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Verification</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.unverified}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available</CardTitle>
            <Shield className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.available}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">New This Week</CardTitle>
            <UserX className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{stats.recentDonors}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Actions */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex-1">
          <Suspense fallback={<div>Loading filters...</div>}>
            <DonorsFilters />
          </Suspense>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            Export Donors
          </Button>
          <Button variant="outline">
            Bulk Verify
          </Button>
          <Button>
            Add Donor
          </Button>
        </div>
      </div>

      {/* Donors Table */}
      <Card>
        <CardHeader>
          <CardTitle>Donor Database</CardTitle>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<div>Loading donors...</div>}>
            <DonorsTable searchParams={searchParams} />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  )
}