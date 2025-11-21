import { NextRequest } from 'next/server'
import { db } from './db'
import { securityEventSchema } from './validation-schemas'

export type SecurityEventType = 
  | 'FAILED_LOGIN'
  | 'SUSPICIOUS_ACTIVITY'
  | 'RATE_LIMIT_EXCEEDED'
  | 'UNAUTHORIZED_ACCESS'
  | 'DATA_BREACH_ATTEMPT'
  | 'MALICIOUS_INPUT'
  | 'CSRF_ATTACK'
  | 'XSS_ATTEMPT'
  | 'SQL_INJECTION_ATTEMPT'
  | 'FILE_UPLOAD_VIOLATION'
  | 'PRIVILEGE_ESCALATION'
  | 'BRUTE_FORCE_ATTACK'

export type SecurityEventSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'

export interface SecurityEvent {
  type: SecurityEventType
  severity: SecurityEventSeverity
  description: string
  ipAddress?: string
  userAgent?: string
  userId?: string
  metadata?: Record<string, any>
  timestamp?: Date
}

export interface SecurityAlert {
  id: string
  type: SecurityEventType
  severity: SecurityEventSeverity
  count: number
  firstOccurrence: Date
  lastOccurrence: Date
  ipAddresses: string[]
  userIds: string[]
  isResolved: boolean
}

/**
 * Security event logger
 */
export class SecurityLogger {
  private static instance: SecurityLogger
  private alertThresholds: Map<SecurityEventType, number> = new Map([
    ['FAILED_LOGIN', 5],
    ['SUSPICIOUS_ACTIVITY', 3],
    ['RATE_LIMIT_EXCEEDED', 10],
    ['UNAUTHORIZED_ACCESS', 1],
    ['DATA_BREACH_ATTEMPT', 1],
    ['MALICIOUS_INPUT', 3],
    ['CSRF_ATTACK', 1],
    ['XSS_ATTEMPT', 1],
    ['SQL_INJECTION_ATTEMPT', 1],
    ['FILE_UPLOAD_VIOLATION', 3],
    ['PRIVILEGE_ESCALATION', 1],
    ['BRUTE_FORCE_ATTACK', 1]
  ])

  static getInstance(): SecurityLogger {
    if (!SecurityLogger.instance) {
      SecurityLogger.instance = new SecurityLogger()
    }
    return SecurityLogger.instance
  }

  /**
   * Log a security event
   */
  async logEvent(event: SecurityEvent): Promise<void> {
    try {
      // Validate event data
      const validatedEvent = securityEventSchema.parse(event)
      
      // Store in database
      await db.securityEvent.create({
        data: {
          type: validatedEvent.type,
          severity: validatedEvent.severity,
          description: validatedEvent.description,
          ipAddress: validatedEvent.ipAddress,
          userAgent: validatedEvent.userAgent,
          userId: validatedEvent.userId,
          metadata: validatedEvent.metadata || {},
          timestamp: new Date()
        }
      })

      // Check if this triggers an alert
      await this.checkForAlerts(validatedEvent)

      // Log to console for immediate visibility
      console.warn(`[SECURITY] ${validatedEvent.severity}: ${validatedEvent.type} - ${validatedEvent.description}`, {
        ip: validatedEvent.ipAddress,
        userId: validatedEvent.userId,
        metadata: validatedEvent.metadata
      })

    } catch (error) {
      console.error('Failed to log security event:', error)
      // Fallback to console logging
      console.warn(`[SECURITY FALLBACK] ${event.severity}: ${event.type} - ${event.description}`)
    }
  }

  /**
   * Log failed login attempt
   */
  async logFailedLogin(email: string, ipAddress?: string, userAgent?: string): Promise<void> {
    await this.logEvent({
      type: 'FAILED_LOGIN',
      severity: 'MEDIUM',
      description: `Failed login attempt for email: ${email}`,
      ipAddress,
      userAgent,
      metadata: { email }
    })
  }

  /**
   * Log suspicious activity
   */
  async logSuspiciousActivity(
    description: string, 
    userId?: string, 
    ipAddress?: string, 
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.logEvent({
      type: 'SUSPICIOUS_ACTIVITY',
      severity: 'HIGH',
      description,
      userId,
      ipAddress,
      metadata
    })
  }

  /**
   * Log rate limit exceeded
   */
  async logRateLimitExceeded(
    endpoint: string, 
    ipAddress?: string, 
    userId?: string
  ): Promise<void> {
    await this.logEvent({
      type: 'RATE_LIMIT_EXCEEDED',
      severity: 'MEDIUM',
      description: `Rate limit exceeded for endpoint: ${endpoint}`,
      ipAddress,
      userId,
      metadata: { endpoint }
    })
  }

  /**
   * Log unauthorized access attempt
   */
  async logUnauthorizedAccess(
    resource: string, 
    userId?: string, 
    ipAddress?: string
  ): Promise<void> {
    await this.logEvent({
      type: 'UNAUTHORIZED_ACCESS',
      severity: 'HIGH',
      description: `Unauthorized access attempt to: ${resource}`,
      userId,
      ipAddress,
      metadata: { resource }
    })
  }

  /**
   * Log malicious input detection
   */
  async logMaliciousInput(
    inputType: string, 
    pattern: string, 
    ipAddress?: string, 
    userId?: string
  ): Promise<void> {
    await this.logEvent({
      type: 'MALICIOUS_INPUT',
      severity: 'HIGH',
      description: `Malicious input detected in ${inputType}`,
      ipAddress,
      userId,
      metadata: { inputType, pattern }
    })
  }

  /**
   * Log CSRF attack attempt
   */
  async logCSRFAttempt(
    endpoint: string, 
    ipAddress?: string, 
    userAgent?: string
  ): Promise<void> {
    await this.logEvent({
      type: 'CSRF_ATTACK',
      severity: 'CRITICAL',
      description: `CSRF attack attempt on endpoint: ${endpoint}`,
      ipAddress,
      userAgent,
      metadata: { endpoint }
    })
  }

  /**
   * Log XSS attempt
   */
  async logXSSAttempt(
    field: string, 
    payload: string, 
    ipAddress?: string, 
    userId?: string
  ): Promise<void> {
    await this.logEvent({
      type: 'XSS_ATTEMPT',
      severity: 'CRITICAL',
      description: `XSS attempt detected in field: ${field}`,
      ipAddress,
      userId,
      metadata: { field, payload: payload.substring(0, 100) }
    })
  }

  /**
   * Log SQL injection attempt
   */
  async logSQLInjectionAttempt(
    field: string, 
    payload: string, 
    ipAddress?: string, 
    userId?: string
  ): Promise<void> {
    await this.logEvent({
      type: 'SQL_INJECTION_ATTEMPT',
      severity: 'CRITICAL',
      description: `SQL injection attempt detected in field: ${field}`,
      ipAddress,
      userId,
      metadata: { field, payload: payload.substring(0, 100) }
    })
  }

  /**
   * Check for security alerts based on event patterns
   */
  private async checkForAlerts(event: SecurityEvent): Promise<void> {
    const threshold = this.alertThresholds.get(event.type) || 5
    const timeWindow = 15 * 60 * 1000 // 15 minutes

    try {
      // Count recent events of the same type
      const recentEvents = await db.securityEvent.count({
        where: {
          type: event.type,
          timestamp: {
            gte: new Date(Date.now() - timeWindow)
          },
          ...(event.ipAddress && { ipAddress: event.ipAddress })
        }
      })

      if (recentEvents >= threshold) {
        await this.createAlert(event.type, recentEvents, event.ipAddress)
      }
    } catch (error) {
      console.error('Failed to check for security alerts:', error)
    }
  }

  /**
   * Create security alert
   */
  private async createAlert(
    type: SecurityEventType, 
    count: number, 
    ipAddress?: string
  ): Promise<void> {
    try {
      // Check if alert already exists for this type and IP
      const existingAlert = await db.securityAlert.findFirst({
        where: {
          type,
          isResolved: false,
          ...(ipAddress && {
            ipAddresses: {
              has: ipAddress
            }
          })
        }
      })

      if (existingAlert) {
        // Update existing alert
        await db.securityAlert.update({
          where: { id: existingAlert.id },
          data: {
            count: count,
            lastOccurrence: new Date(),
            ...(ipAddress && !existingAlert.ipAddresses.includes(ipAddress) && {
              ipAddresses: [...existingAlert.ipAddresses, ipAddress]
            })
          }
        })
      } else {
        // Create new alert
        await db.securityAlert.create({
          data: {
            type,
            severity: this.getSeverityForType(type),
            count,
            firstOccurrence: new Date(),
            lastOccurrence: new Date(),
            ipAddresses: ipAddress ? [ipAddress] : [],
            userIds: [],
            isResolved: false
          }
        })

        // Send immediate notification for critical alerts
        if (this.getSeverityForType(type) === 'CRITICAL') {
          console.error(`[CRITICAL SECURITY ALERT] ${type}: ${count} occurrences detected`)
          // In production, send email/SMS to security team
        }
      }
    } catch (error) {
      console.error('Failed to create security alert:', error)
    }
  }

  /**
   * Get severity level for event type
   */
  private getSeverityForType(type: SecurityEventType): SecurityEventSeverity {
    const criticalTypes: SecurityEventType[] = [
      'DATA_BREACH_ATTEMPT',
      'CSRF_ATTACK',
      'XSS_ATTEMPT',
      'SQL_INJECTION_ATTEMPT',
      'PRIVILEGE_ESCALATION',
      'BRUTE_FORCE_ATTACK'
    ]

    const highTypes: SecurityEventType[] = [
      'UNAUTHORIZED_ACCESS',
      'SUSPICIOUS_ACTIVITY',
      'MALICIOUS_INPUT'
    ]

    if (criticalTypes.includes(type)) return 'CRITICAL'
    if (highTypes.includes(type)) return 'HIGH'
    return 'MEDIUM'
  }

  /**
   * Get security events for analysis
   */
  async getEvents(
    filters: {
      type?: SecurityEventType
      severity?: SecurityEventSeverity
      userId?: string
      ipAddress?: string
      startDate?: Date
      endDate?: Date
      limit?: number
    } = {}
  ): Promise<any[]> {
    return await db.securityEvent.findMany({
      where: {
        ...(filters.type && { type: filters.type }),
        ...(filters.severity && { severity: filters.severity }),
        ...(filters.userId && { userId: filters.userId }),
        ...(filters.ipAddress && { ipAddress: filters.ipAddress }),
        ...(filters.startDate && { timestamp: { gte: filters.startDate } }),
        ...(filters.endDate && { timestamp: { lte: filters.endDate } })
      },
      orderBy: { timestamp: 'desc' },
      take: filters.limit || 100
    })
  }

  /**
   * Get active security alerts
   */
  async getActiveAlerts(): Promise<any[]> {
    return await db.securityAlert.findMany({
      where: { isResolved: false },
      orderBy: [
        { severity: 'desc' },
        { lastOccurrence: 'desc' }
      ]
    })
  }

  /**
   * Resolve security alert
   */
  async resolveAlert(alertId: string, resolvedBy: string): Promise<void> {
    await db.securityAlert.update({
      where: { id: alertId },
      data: {
        isResolved: true,
        resolvedAt: new Date(),
        resolvedBy
      }
    })
  }
}

/**
 * Helper function to extract request info
 */
export function getRequestInfo(request: NextRequest): {
  ipAddress?: string
  userAgent?: string
} {
  const forwardedFor = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  const cfConnectingIp = request.headers.get('cf-connecting-ip')
  
  const ipAddress = forwardedFor?.split(',')[0] || realIp || cfConnectingIp || undefined
  const userAgent = request.headers.get('user-agent') || undefined

  return { ipAddress, userAgent }
}

/**
 * Singleton instance
 */
export const securityLogger = SecurityLogger.getInstance()