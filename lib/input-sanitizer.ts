import { securityLogger } from './security-logger'

// Malicious pattern detection
const maliciousPatterns = {
  xss: [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /<iframe\b[^>]*>/gi,
    /<object\b[^>]*>/gi,
    /<embed\b[^>]*>/gi,
    /<link\b[^>]*>/gi,
    /<meta\b[^>]*>/gi,
    /expression\s*\(/gi,
    /vbscript:/gi,
    /data:text\/html/gi
  ],
  
  sqlInjection: [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION)\b)/gi,
    /(\b(OR|AND)\s+\d+\s*=\s*\d+)/gi,
    /('|(\\')|(;)|(--)|(\|)|(\*)|(%27)|(%3D)|(%3B)|(%2D%2D)|(%7C)|(%2A))/gi,
    /(\b(WAITFOR|DELAY)\b)/gi,
    /(\b(CAST|CONVERT|SUBSTRING|ASCII|CHAR)\b)/gi
  ],
  
  pathTraversal: [
    /\.\.[\/\\]/g,
    /[\/\\]\.\.[\/\\]/g,
    /%2e%2e[\/\\]/gi,
    /%252e%252e[\/\\]/gi,
    /\.\.%2f/gi,
    /\.\.%5c/gi
  ],
  
  commandInjection: [
    /[;&|`$(){}[\]]/g,
    /\b(cat|ls|pwd|whoami|id|uname|ps|netstat|ifconfig|ping|wget|curl|nc|telnet|ssh|ftp)\b/gi,
    /(\||&&|;|`|\$\(|\${)/g
  ],
  
  ldapInjection: [
    /[()&|!*]/g,
    /\x00/g,
    /[\\]/g
  ]
}

// HTML entities for encoding
const htmlEntities: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
  '/': '&#x2F;',
  '`': '&#x60;',
  '=': '&#x3D;'
}

export interface SanitizationOptions {
  allowHtml?: boolean
  allowedTags?: string[]
  maxLength?: number
  trimWhitespace?: boolean
  removeNullBytes?: boolean
  normalizeUnicode?: boolean
  detectMalicious?: boolean
  logSuspicious?: boolean
  ipAddress?: string
  userId?: string
}

export interface SanitizationResult {
  sanitized: string
  wasModified: boolean
  detectedThreats: string[]
  originalLength: number
  sanitizedLength: number
}

/**
 * Input sanitizer class
 */
export class InputSanitizer {
  private options: Required<SanitizationOptions>
  
  constructor(options: SanitizationOptions = {}) {
    this.options = {
      allowHtml: false,
      allowedTags: [],
      maxLength: 10000,
      trimWhitespace: true,
      removeNullBytes: true,
      normalizeUnicode: true,
      detectMalicious: true,
      logSuspicious: true,
      ipAddress: '',
      userId: '',
      ...options
    }
  }
  
  /**
   * Sanitize input string
   */
  async sanitize(input: string, fieldName?: string): Promise<SanitizationResult> {
    if (typeof input !== 'string') {
      input = String(input)
    }
    
    const originalLength = input.length
    let sanitized = input
    const detectedThreats: string[] = []
    let wasModified = false
    
    // Remove null bytes
    if (this.options.removeNullBytes && sanitized.includes('\x00')) {
      sanitized = sanitized.replace(/\x00/g, '')
      wasModified = true
      detectedThreats.push('null_bytes')
    }
    
    // Normalize unicode
    if (this.options.normalizeUnicode) {
      const normalized = sanitized.normalize('NFC')
      if (normalized !== sanitized) {
        sanitized = normalized
        wasModified = true
      }
    }
    
    // Trim whitespace
    if (this.options.trimWhitespace) {
      const trimmed = sanitized.trim()
      if (trimmed !== sanitized) {
        sanitized = trimmed
        wasModified = true
      }
    }
    
    // Detect malicious patterns
    if (this.options.detectMalicious) {
      const threats = await this.detectMaliciousPatterns(sanitized, fieldName)
      detectedThreats.push(...threats)
    }
    
    // HTML encoding (if HTML not allowed)
    if (!this.options.allowHtml) {
      const encoded = this.encodeHtml(sanitized)
      if (encoded !== sanitized) {
        sanitized = encoded
        wasModified = true
      }
    } else {
      // Sanitize HTML (keep only allowed tags)
      const htmlSanitized = this.sanitizeHtml(sanitized)
      if (htmlSanitized !== sanitized) {
        sanitized = htmlSanitized
        wasModified = true
      }
    }
    
    // Enforce maximum length
    if (sanitized.length > this.options.maxLength) {
      sanitized = sanitized.substring(0, this.options.maxLength)
      wasModified = true
      detectedThreats.push('length_exceeded')
    }
    
    return {
      sanitized,
      wasModified,
      detectedThreats,
      originalLength,
      sanitizedLength: sanitized.length
    }
  }
  
  /**
   * Detect malicious patterns in input
   */
  private async detectMaliciousPatterns(input: string, fieldName?: string): Promise<string[]> {
    const threats: string[] = []
    
    // Check for XSS patterns
    for (const pattern of maliciousPatterns.xss) {
      if (pattern.test(input)) {
        threats.push('xss')
        if (this.options.logSuspicious) {
          await securityLogger.logXSSAttempt(
            fieldName || 'unknown',
            input,
            this.options.ipAddress,
            this.options.userId
          )
        }
        break
      }
    }
    
    // Check for SQL injection patterns
    for (const pattern of maliciousPatterns.sqlInjection) {
      if (pattern.test(input)) {
        threats.push('sql_injection')
        if (this.options.logSuspicious) {
          await securityLogger.logSQLInjectionAttempt(
            fieldName || 'unknown',
            input,
            this.options.ipAddress,
            this.options.userId
          )
        }
        break
      }
    }
    
    // Check for path traversal patterns
    for (const pattern of maliciousPatterns.pathTraversal) {
      if (pattern.test(input)) {
        threats.push('path_traversal')
        if (this.options.logSuspicious) {
          await securityLogger.logMaliciousInput(
            'path_traversal',
            input,
            this.options.ipAddress,
            this.options.userId
          )
        }
        break
      }
    }
    
    // Check for command injection patterns
    for (const pattern of maliciousPatterns.commandInjection) {
      if (pattern.test(input)) {
        threats.push('command_injection')
        if (this.options.logSuspicious) {
          await securityLogger.logMaliciousInput(
            'command_injection',
            input,
            this.options.ipAddress,
            this.options.userId
          )
        }
        break
      }
    }
    
    // Check for LDAP injection patterns
    for (const pattern of maliciousPatterns.ldapInjection) {
      if (pattern.test(input)) {
        threats.push('ldap_injection')
        if (this.options.logSuspicious) {
          await securityLogger.logMaliciousInput(
            'ldap_injection',
            input,
            this.options.ipAddress,
            this.options.userId
          )
        }
        break
      }
    }
    
    return threats
  }
  
  /**
   * Encode HTML entities
   */
  private encodeHtml(input: string): string {
    return input.replace(/[&<>"'`=\/]/g, (match) => htmlEntities[match] || match)
  }
  
  /**
   * Sanitize HTML (basic implementation)
   */
  private sanitizeHtml(input: string): string {
    if (this.options.allowedTags.length === 0) {
      return this.encodeHtml(input)
    }
    
    // Basic HTML sanitization - remove all tags except allowed ones
    const allowedTagsRegex = new RegExp(
      `<(?!\/?(?:${this.options.allowedTags.join('|')})\s*\/?>)[^>]+>`,
      'gi'
    )
    
    return input.replace(allowedTagsRegex, '')
  }
}

/**
 * Sanitize object properties recursively
 */
export async function sanitizeObject(
  obj: Record<string, any>,
  options: SanitizationOptions = {}
): Promise<{
  sanitized: Record<string, any>
  threats: Record<string, string[]>
  modified: string[]
}> {
  const sanitizer = new InputSanitizer(options)
  const sanitized: Record<string, any> = {}
  const threats: Record<string, string[]> = {}
  const modified: string[] = []
  
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      const result = await sanitizer.sanitize(value, key)
      sanitized[key] = result.sanitized
      
      if (result.detectedThreats.length > 0) {
        threats[key] = result.detectedThreats
      }
      
      if (result.wasModified) {
        modified.push(key)
      }
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      // Recursively sanitize nested objects
      const nestedResult = await sanitizeObject(value, options)
      sanitized[key] = nestedResult.sanitized
      
      // Merge nested threats and modifications
      Object.entries(nestedResult.threats).forEach(([nestedKey, nestedThreats]) => {
        threats[`${key}.${nestedKey}`] = nestedThreats
      })
      
      nestedResult.modified.forEach(nestedKey => {
        modified.push(`${key}.${nestedKey}`)
      })
    } else {
      // Keep non-string values as-is
      sanitized[key] = value
    }
  }
  
  return { sanitized, threats, modified }
}

/**
 * Validate file upload
 */
export interface FileValidationOptions {
  allowedMimeTypes: string[]
  maxSize: number
  allowedExtensions: string[]
  scanForMalware?: boolean
}

export interface FileValidationResult {
  isValid: boolean
  errors: string[]
  sanitizedFilename: string
}

export async function validateFileUpload(
  file: File,
  options: FileValidationOptions
): Promise<FileValidationResult> {
  const errors: string[] = []
  let sanitizedFilename = file.name
  
  // Validate file size
  if (file.size > options.maxSize) {
    errors.push(`File size exceeds maximum allowed size of ${options.maxSize} bytes`)
  }
  
  // Validate MIME type
  if (!options.allowedMimeTypes.includes(file.type)) {
    errors.push(`File type ${file.type} is not allowed`)
  }
  
  // Validate file extension
  const extension = sanitizedFilename.split('.').pop()?.toLowerCase()
  if (!extension || !options.allowedExtensions.includes(extension)) {
    errors.push(`File extension .${extension} is not allowed`)
  }
  
  // Sanitize filename
  sanitizedFilename = sanitizedFilename
    .replace(/[^a-zA-Z0-9.-]/g, '_') // Replace special characters
    .replace(/\.+/g, '.') // Remove multiple dots
    .replace(/^\./, '') // Remove leading dot
    .substring(0, 255) // Limit length
  
  // Basic malware detection (check for suspicious patterns in filename)
  const suspiciousPatterns = [
    /\.(exe|bat|cmd|com|pif|scr|vbs|js|jar|app|deb|rpm)$/i,
    /\.(php|asp|aspx|jsp|cgi|pl)$/i
  ]
  
  for (const pattern of suspiciousPatterns) {
    if (pattern.test(file.name)) {
      errors.push('File appears to contain executable code')
      break
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    sanitizedFilename
  }
}

/**
 * Quick sanitization functions for common use cases
 */
export const quickSanitize = {
  /**
   * Sanitize user input for display
   */
  forDisplay: async (input: string, options?: Partial<SanitizationOptions>) => {
    const sanitizer = new InputSanitizer({
      allowHtml: false,
      maxLength: 1000,
      detectMalicious: true,
      ...options
    })
    return await sanitizer.sanitize(input)
  },
  
  /**
   * Sanitize search query
   */
  forSearch: async (input: string, options?: Partial<SanitizationOptions>) => {
    const sanitizer = new InputSanitizer({
      allowHtml: false,
      maxLength: 100,
      detectMalicious: true,
      trimWhitespace: true,
      ...options
    })
    return await sanitizer.sanitize(input)
  },
  
  /**
   * Sanitize filename
   */
  forFilename: async (input: string) => {
    const sanitizer = new InputSanitizer({
      allowHtml: false,
      maxLength: 255,
      detectMalicious: false,
      trimWhitespace: true
    })
    
    const result = await sanitizer.sanitize(input)
    // Additional filename-specific sanitization
    result.sanitized = result.sanitized
      .replace(/[<>:"/\\|?*]/g, '_')
      .replace(/\s+/g, '_')
      .replace(/\.+/g, '.')
    
    return result
  },
  
  /**
   * Sanitize URL
   */
  forUrl: async (input: string) => {
    const sanitizer = new InputSanitizer({
      allowHtml: false,
      maxLength: 2048,
      detectMalicious: true,
      trimWhitespace: true
    })
    
    const result = await sanitizer.sanitize(input)
    
    // Validate URL format
    try {
      new URL(result.sanitized)
    } catch {
      result.detectedThreats.push('invalid_url')
    }
    
    return result
  }
}