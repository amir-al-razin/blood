import { NextRequest, NextResponse } from 'next/server'
import { clearAllRateLimits, getRateLimitStatus } from '@/lib/rate-limiter'

/**
 * Development only endpoint to manage rate limits
 * GET - View current rate limit status
 * POST - Clear all rate limits
 */
export async function GET(request: NextRequest) {
  // Only allow in development
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'Not available in production' },
      { status: 403 }
    )
  }

  const status = getRateLimitStatus()
  
  return NextResponse.json({
    message: 'Rate limit status',
    timestamp: new Date().toISOString(),
    ...status
  })
}

export async function POST(request: NextRequest) {
  // Only allow in development
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'Not available in production' },
      { status: 403 }
    )
  }

  const { action } = await request.json()

  if (action === 'clear') {
    clearAllRateLimits()
    return NextResponse.json({
      message: 'All rate limits cleared successfully',
      timestamp: new Date().toISOString()
    })
  }

  return NextResponse.json(
    { error: 'Invalid action. Use action: "clear"' },
    { status: 400 }
  )
}
