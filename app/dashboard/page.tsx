import { auth } from '@/lib/auth-utils'
import { db } from '@/lib/db'
import { DashboardContent } from '@/components/dashboard/dashboard-content'

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
    <DashboardContent stats={stats} userName={session?.user?.name} />
  )
}