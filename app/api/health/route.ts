import { NextResponse } from 'next/server'
import { healthCheck } from '@/lib/db-utils'

export async function GET() {
  try {
    const health = await healthCheck.checkConnection()
    
    if (health.status === 'healthy') {
      return NextResponse.json(health)
    } else {
      return NextResponse.json(health, { status: 503 })
    }
  } catch (error) {
    return NextResponse.json(
      { 
        status: 'unhealthy', 
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date() 
      },
      { status: 503 }
    )
  }
}