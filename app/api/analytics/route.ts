import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { auth } from '@/lib/auth-utils'
import {
  startOfDay,
  endOfDay,
  subDays,
  format,
  eachDayOfInterval,
  startOfMonth,
  endOfMonth,
  subMonths
} from 'date-fns'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const period = searchParams.get('period') || '30d' // 7d, 30d, 90d, 1y

    // Calculate date range
    let dateRange = {
      start: subDays(new Date(), 30),
      end: new Date()
    }

    if (startDate && endDate) {
      dateRange = {
        start: new Date(startDate),
        end: new Date(endDate)
      }
    } else {
      switch (period) {
        case '7d':
          dateRange.start = subDays(new Date(), 7)
          break
        case '30d':
          dateRange.start = subDays(new Date(), 30)
          break
        case '90d':
          dateRange.start = subDays(new Date(), 90)
          break
        case '1y':
          dateRange.start = subDays(new Date(), 365)
          break
      }
    }

    // Get comprehensive analytics data
    const [
      totalStats,
      periodStats,
      bloodTypeDistribution,
      locationStats,
      urgencyStats,
      donorRetention,
      dailyTrends,
      monthlyTrends,
      successRateByBloodType,
      averageResponseTime
    ] = await Promise.all([
      // Total stats (all time)
      Promise.all([
        db.donor.count(),
        db.request.count(),
        db.match.count(),
        db.match.count({ where: { status: 'COMPLETED' } }),
        db.donor.count({ where: { isVerified: true } }),
        db.donor.count({ where: { isAvailable: true } })
      ]),

      // Period-specific stats
      Promise.all([
        db.donor.count({
          where: {
            createdAt: {
              gte: startOfDay(dateRange.start),
              lte: endOfDay(dateRange.end)
            }
          }
        }),
        db.request.count({
          where: {
            createdAt: {
              gte: startOfDay(dateRange.start),
              lte: endOfDay(dateRange.end)
            }
          }
        }),
        db.match.count({
          where: {
            createdAt: {
              gte: startOfDay(dateRange.start),
              lte: endOfDay(dateRange.end)
            }
          }
        }),
        db.match.count({
          where: {
            status: 'COMPLETED',
            createdAt: {
              gte: startOfDay(dateRange.start),
              lte: endOfDay(dateRange.end)
            }
          }
        })
      ]),

      // Blood type distribution
      db.donor.groupBy({
        by: ['bloodType'],
        _count: { bloodType: true },
        orderBy: { _count: { bloodType: 'desc' } }
      }),

      // Location stats
      db.donor.groupBy({
        by: ['area'],
        _count: { area: true },
        orderBy: { _count: { area: 'desc' } },
        take: 15
      }),

      // Urgency level stats
      db.request.groupBy({
        by: ['urgencyLevel'],
        _count: { urgencyLevel: true },
        where: {
          createdAt: {
            gte: startOfDay(dateRange.start),
            lte: endOfDay(dateRange.end)
          }
        }
      }),

      // Donor retention (donors who donated multiple times)
      db.donor.findMany({
        where: {
          donationCount: { gt: 1 }
        },
        select: {
          donationCount: true,
          createdAt: true,
          lastDonation: true
        }
      }),

      // Daily trends for the period
      getDailyTrends(dateRange.start, dateRange.end),

      // Monthly trends for the last 12 months
      getMonthlyTrends(),

      // Success rate by blood type
      getSuccessRateByBloodType(dateRange.start, dateRange.end),

      // Average response time
      getAverageResponseTime(dateRange.start, dateRange.end)
    ])

    const analytics = {
      summary: {
        totalDonors: totalStats[0],
        totalRequests: totalStats[1],
        totalMatches: totalStats[2],
        completedMatches: totalStats[3],
        verifiedDonors: totalStats[4],
        availableDonors: totalStats[5],
        successRate: totalStats[2] > 0 ? (totalStats[3] / totalStats[2]) * 100 : 0
      },
      period: {
        newDonors: periodStats[0],
        newRequests: periodStats[1],
        newMatches: periodStats[2],
        completedMatches: periodStats[3],
        successRate: periodStats[2] > 0 ? (periodStats[3] / periodStats[2]) * 100 : 0
      },
      distributions: {
        bloodTypes: bloodTypeDistribution,
        locations: locationStats,
        urgencyLevels: urgencyStats
      },
      trends: {
        daily: dailyTrends,
        monthly: monthlyTrends
      },
      retention: {
        repeatDonors: donorRetention.length,
        averageDonations: donorRetention.length > 0
          ? donorRetention.reduce((sum, donor) => sum + donor.donationCount, 0) / donorRetention.length
          : 0,
        retentionRate: totalStats[0] > 0 ? (donorRetention.length / totalStats[0]) * 100 : 0
      },
      performance: {
        successRateByBloodType,
        averageResponseTime
      },
      dateRange: {
        start: dateRange.start,
        end: dateRange.end
      }
    }

    return NextResponse.json(analytics)
  } catch (error) {
    console.error('Analytics API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch analytics data' },
      { status: 500 }
    )
  }
}

async function getDailyTrends(startDate: Date, endDate: Date) {
  const days = eachDayOfInterval({ start: startDate, end: endDate })

  const trends = await Promise.all(
    days.map(async (day) => {
      const dayStart = startOfDay(day)
      const dayEnd = endOfDay(day)

      const [donors, requests, matches] = await Promise.all([
        db.donor.count({
          where: { createdAt: { gte: dayStart, lte: dayEnd } }
        }),
        db.request.count({
          where: { createdAt: { gte: dayStart, lte: dayEnd } }
        }),
        db.match.count({
          where: { createdAt: { gte: dayStart, lte: dayEnd } }
        })
      ])

      return {
        date: format(day, 'yyyy-MM-dd'),
        donors,
        requests,
        matches
      }
    })
  )

  return trends
}

async function getMonthlyTrends() {
  const months = []
  for (let i = 11; i >= 0; i--) {
    const monthStart = startOfMonth(subMonths(new Date(), i))
    const monthEnd = endOfMonth(subMonths(new Date(), i))

    const [donors, requests, matches, completedMatches] = await Promise.all([
      db.donor.count({
        where: { createdAt: { gte: monthStart, lte: monthEnd } }
      }),
      db.request.count({
        where: { createdAt: { gte: monthStart, lte: monthEnd } }
      }),
      db.match.count({
        where: { createdAt: { gte: monthStart, lte: monthEnd } }
      }),
      db.match.count({
        where: {
          status: 'COMPLETED',
          createdAt: { gte: monthStart, lte: monthEnd }
        }
      })
    ])

    months.push({
      month: format(monthStart, 'MMM yyyy'),
      donors,
      requests,
      matches,
      completedMatches,
      successRate: matches > 0 ? (completedMatches / matches) * 100 : 0
    })
  }

  return months
}

async function getSuccessRateByBloodType(startDate: Date, endDate: Date) {
  const bloodTypes = ['A_POSITIVE', 'A_NEGATIVE', 'B_POSITIVE', 'B_NEGATIVE', 'AB_POSITIVE', 'AB_NEGATIVE', 'O_POSITIVE', 'O_NEGATIVE']

  const successRates = await Promise.all(
    bloodTypes.map(async (bloodType) => {
      const [totalMatches, completedMatches] = await Promise.all([
        db.match.count({
          where: {
            request: { bloodType },
            createdAt: { gte: startDate, lte: endDate }
          }
        }),
        db.match.count({
          where: {
            request: { bloodType },
            status: 'COMPLETED',
            createdAt: { gte: startDate, lte: endDate }
          }
        })
      ])

      return {
        bloodType: bloodType.replace('_', ''),
        totalMatches,
        completedMatches,
        successRate: totalMatches > 0 ? (completedMatches / totalMatches) * 100 : 0
      }
    })
  )

  return successRates.filter(rate => rate.totalMatches > 0)
}

async function getAverageResponseTime(startDate: Date, endDate: Date) {
  const matches = await db.match.findMany({
    where: {
      createdAt: { gte: startDate, lte: endDate },
      acceptedAt: { not: null }
    },
    select: {
      createdAt: true,
      acceptedAt: true
    }
  })

  if (matches.length === 0) return 0

  const totalResponseTime = matches.reduce((sum, match) => {
    if (match.acceptedAt) {
      return sum + (match.acceptedAt.getTime() - match.createdAt.getTime())
    }
    return sum
  }, 0)

  // Return average response time in hours
  return totalResponseTime / matches.length / (1000 * 60 * 60)
}