import { NextRequest } from 'next/server'

// In-memory store for rate limiting (in production, use Redis)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

export interface RateLimitConfig {
  windowMs: number // Time window in milliseconds
  maxRequests: number // Maximum requests per window
  message?: string // Custom error message
  skipSuccessfulRequests?: boolean // Don't count successful requests
  skipFailedRequests?: boolean // Don't count failed requests
}

export interface RateLimitResult {
  success: boolean
  limit: number
  remaining: number
  resetTime: number
  message?: string
}

// Default rate limit configurations
export const rateLimitConfigs = {
  // API endpoints
  api: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100,
    message: 'Too many API requests, please try again later'
  },
  
  // Authentication endpoints
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5,
    message: 'Too many login attempts, please try again later'
  },
  
  // Form submissions
  forms: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 3,
    message: 'Too many form submissions, please wait before trying again'
  },
  
  // File uploads
  uploads: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 5,
    message: 'Too many file uploads, please wait before trying again'
  },
  
  // Password reset
  passwordReset: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 3,
    message: 'Too many password reset attempts, please try again later'
  },
  
  // Sensitive operations
  sensitive: {
    windowMs: 5 * 60 * 1000, // 5 minutes
    maxRequests: 10,
    message: 'Too many sensitive operations, please wait before trying again'
  }
}

/**
 * Rate limiter implementation
 */
export class RateLimiter {
  private config: RateLimitConfig
  
  constructor(config: RateLimitConfig) {
    this.config = config
  }
  
  /**
   * Check if request is within rate limit
   */
  check(identifier: string): RateLimitResult {
    const now = Date.now()
    const key = `${identifier}`
    
    // Clean up expired entries
    this.cleanup()
    
    const record = rateLimitStore.get(key)
    
    if (!record || now > record.resetTime) {
      // First request or window expired
      const resetTime = now + this.config.windowMs
      rateLimitStore.set(key, { count: 1, resetTime })
      
      return {
        success: true,
        limit: this.config.maxRequests,
        remaining: this.config.maxRequests - 1,
        resetTime
      }
    }
    
    if (record.count >= this.config.maxRequests) {
      // Rate limit exceeded
      return {
        success: false,
        limit: this.config.maxRequests,
        remaining: 0,
        resetTime: record.resetTime,
        message: this.config.message
      }
    }
    
    // Increment counter
    record.count++
    rateLimitStore.set(key, record)
    
    return {
      success: true,
      limit: this.config.maxRequests,
      remaining: this.config.maxRequests - record.count,
      resetTime: record.resetTime
    }
  }
  
  /**
   * Reset rate limit for identifier
   */
  reset(identifier: string): void {
    rateLimitStore.delete(identifier)
  }
  
  /**
   * Clean up expired entries
   */
  private cleanup(): void {
    const now = Date.now()
    for (const [key, record] of rateLimitStore.entries()) {
      if (now > record.resetTime) {
        rateLimitStore.delete(key)
      }
    }
  }
}

/**
 * Get client identifier for rate limiting
 */
export function getClientIdentifier(request: NextRequest): string {
  // Try to get real IP from headers (for production behind proxy)
  const forwardedFor = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  const cfConnectingIp = request.headers.get('cf-connecting-ip')
  
  const ip = forwardedFor?.split(',')[0] || realIp || cfConnectingIp || 'unknown'
  
  // Include user agent for additional uniqueness
  const userAgent = request.headers.get('user-agent') || 'unknown'
  const userAgentHash = Buffer.from(userAgent).toString('base64').slice(0, 10)
  
  return `${ip}:${userAgentHash}`
}

/**
 * Rate limit middleware factory
 */
export function createRateLimiter(config: RateLimitConfig) {
  const limiter = new RateLimiter(config)
  
  return (request: NextRequest): RateLimitResult => {
    const identifier = getClientIdentifier(request)
    return limiter.check(identifier)
  }
}

/**
 * Pre-configured rate limiters
 */
export const rateLimiters = {
  api: createRateLimiter(rateLimitConfigs.api),
  auth: createRateLimiter(rateLimitConfigs.auth),
  forms: createRateLimiter(rateLimitConfigs.forms),
  uploads: createRateLimiter(rateLimitConfigs.uploads),
  passwordReset: createRateLimiter(rateLimitConfigs.passwordReset),
  sensitive: createRateLimiter(rateLimitConfigs.sensitive)
}

/**
 * Rate limit response headers
 */
export function getRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    'X-RateLimit-Limit': result.limit.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': new Date(result.resetTime).toISOString(),
    'Retry-After': Math.ceil((result.resetTime - Date.now()) / 1000).toString()
  }
}

/**
 * Apply rate limiting to API route
 */
export function withRateLimit(
  handler: (request: NextRequest) => Promise<Response>,
  limiterType: keyof typeof rateLimiters = 'api'
) {
  return async (request: NextRequest): Promise<Response> => {
    const limiter = rateLimiters[limiterType]
    const result = limiter(request)
    
    if (!result.success) {
      const headers = getRateLimitHeaders(result)
      return new Response(
        JSON.stringify({
          error: 'Rate limit exceeded',
          message: result.message,
          retryAfter: Math.ceil((result.resetTime - Date.now()) / 1000)
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            ...headers
          }
        }
      )
    }
    
    // Add rate limit headers to successful responses
    const response = await handler(request)
    const headers = getRateLimitHeaders(result)
    
    Object.entries(headers).forEach(([key, value]) => {
      response.headers.set(key, value)
    })
    
    return response
  }
}

/**
 * Rate limit by user ID (for authenticated requests)
 */
export function createUserRateLimiter(config: RateLimitConfig) {
  const limiter = new RateLimiter(config)
  
  return (userId: string): RateLimitResult => {
    return limiter.check(`user:${userId}`)
  }
}

/**
 * Rate limit by action type
 */
export function createActionRateLimiter(config: RateLimitConfig) {
  const limiter = new RateLimiter(config)
  
  return (identifier: string, action: string): RateLimitResult => {
    return limiter.check(`${identifier}:${action}`)
  }
}