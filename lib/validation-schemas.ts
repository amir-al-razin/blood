import { z } from 'zod'

// Common validation patterns
export const phoneRegex = /^(\+880|880|0)?1[3-9]\d{8}$/
export const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
export const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/

// Base validation schemas
export const baseValidation = {
  id: z.string().uuid('Invalid ID format'),
  email: z.string().email('Invalid email format').max(255, 'Email too long'),
  phone: z.string().regex(phoneRegex, 'Invalid phone number format'),
  name: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name too long')
    .regex(/^[a-zA-Z\s\u0980-\u09FF]+$/, 'Name contains invalid characters'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password too long')
    .regex(passwordRegex, 'Password must contain uppercase, lowercase, number and special character'),
  bloodType: z.enum(['A_POSITIVE', 'A_NEGATIVE', 'B_POSITIVE', 'B_NEGATIVE', 'AB_POSITIVE', 'AB_NEGATIVE', 'O_POSITIVE', 'O_NEGATIVE']),
  location: z.string().min(1, 'Location is required').max(50, 'Location too long'),
  notes: z.string().max(1000, 'Notes too long').optional(),
  referenceId: z.string().regex(/^REQ-\d{8}-[A-Z0-9]{4}$/, 'Invalid reference ID format')
}

// Sanitization helpers
export const sanitizeInput = {
  text: (input: string): string => {
    return input.trim().replace(/[<>]/g, '')
  },
  
  html: (input: string): string => {
    return input
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
  },
  
  sql: (input: string): string => {
    return input.replace(/['";\\]/g, '')
  }
}

// Donor registration schema with enhanced validation
export const donorRegistrationSchema = z.object({
  name: baseValidation.name,
  phone: baseValidation.phone,
  email: baseValidation.email.optional().or(z.literal('')),
  bloodType: baseValidation.bloodType,
  location: baseValidation.location,
  area: z.string()
    .min(2, 'Area is required')
    .max(100, 'Area name too long')
    .regex(/^[a-zA-Z\s\u0980-\u09FF,-]+$/, 'Area contains invalid characters'),
  address: z.string().max(200, 'Address too long').optional(),
  dateOfBirth: z.string().refine((date) => {
    const birthDate = new Date(date)
    const today = new Date()
    const age = today.getFullYear() - birthDate.getFullYear()
    return age >= 18 && age <= 65 && !isNaN(birthDate.getTime())
  }, 'Invalid date or age must be between 18 and 65'),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']),
  weight: z.number()
    .min(50, 'Weight must be at least 50 kg')
    .max(200, 'Weight must be less than 200 kg'),
  lastDonation: z.string().optional().refine((date) => {
    if (!date) return true
    const donationDate = new Date(date)
    return !isNaN(donationDate.getTime()) && donationDate <= new Date()
  }, 'Invalid donation date'),
  hasHealthConditions: z.boolean(),
  healthConditions: z.string().max(500, 'Health conditions description too long').optional(),
  medications: z.string().max(500, 'Medications list too long').optional(),
  isAvailable: z.boolean().default(true),
  allowContactByPhone: z.boolean().default(true),
  allowContactByEmail: z.boolean().default(true),
  allowDataSharing: z.boolean().default(false),
  privacyConsent: z.boolean().refine((val) => val === true, 'Privacy consent is required'),
  termsConsent: z.boolean().refine((val) => val === true, 'Terms consent is required')
}).refine((data) => {
  // Cross-field validation
  if (data.hasHealthConditions && !data.healthConditions?.trim()) {
    return false
  }
  return true
}, {
  message: 'Health conditions description is required when health conditions are indicated',
  path: ['healthConditions']
})

// Blood request schema with enhanced validation
export const bloodRequestSchema = z.object({
  requesterName: baseValidation.name,
  requesterPhone: baseValidation.phone,
  requesterEmail: baseValidation.email.optional().or(z.literal('')),
  bloodType: baseValidation.bloodType,
  location: baseValidation.location,
  hospital: z.string()
    .min(2, 'Hospital name is required')
    .max(100, 'Hospital name too long')
    .regex(/^[a-zA-Z\s\u0980-\u09FF,.-]+$/, 'Hospital name contains invalid characters'),
  urgencyLevel: z.enum(['CRITICAL', 'URGENT', 'NORMAL']),
  unitsRequired: z.number()
    .min(1, 'At least 1 unit is required')
    .max(10, 'Maximum 10 units allowed'),
  notes: baseValidation.notes
})

// User management schemas
export const userCreateSchema = z.object({
  email: baseValidation.email,
  password: baseValidation.password,
  name: baseValidation.name,
  role: z.enum(['SUPER_ADMIN', 'STAFF', 'VIEWER']),
  phone: baseValidation.phone.optional()
})

export const userUpdateSchema = z.object({
  email: baseValidation.email.optional(),
  name: baseValidation.name.optional(),
  role: z.enum(['SUPER_ADMIN', 'STAFF', 'VIEWER']).optional(),
  phone: baseValidation.phone.optional(),
  isActive: z.boolean().optional()
})

export const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: baseValidation.password,
  confirmPassword: z.string()
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword']
})

// Login schema
export const loginSchema = z.object({
  email: baseValidation.email,
  password: z.string().min(1, 'Password is required')
})

// API parameter validation
export const queryParamsSchema = z.object({
  page: z.string().regex(/^\d+$/).transform(Number).optional(),
  limit: z.string().regex(/^\d+$/).transform(Number).optional(),
  search: z.string().max(100).optional(),
  bloodType: baseValidation.bloodType.optional(),
  location: baseValidation.location.optional(),
  status: z.string().max(20).optional(),
  sortBy: z.string().max(50).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional()
})

// File upload validation
export const fileUploadSchema = z.object({
  filename: z.string().max(255, 'Filename too long'),
  mimetype: z.enum([
    'application/pdf',
    'image/jpeg',
    'image/jpg', 
    'image/png'
  ], { errorMap: () => ({ message: 'Only PDF, JPG, and PNG files are allowed' }) }),
  size: z.number().max(5 * 1024 * 1024, 'File size must be less than 5MB')
})

// Match creation schema
export const matchCreateSchema = z.object({
  donorId: baseValidation.id,
  requestId: baseValidation.id,
  notes: baseValidation.notes
})

// Notification schema
export const notificationSchema = z.object({
  recipientId: baseValidation.id,
  type: z.enum(['SMS', 'EMAIL', 'BOTH']),
  template: z.string().min(1, 'Template is required'),
  data: z.record(z.any()).optional()
})

// Privacy settings schema
export const privacySettingsSchema = z.object({
  allowContactByPhone: z.boolean(),
  allowContactByEmail: z.boolean(),
  allowDataSharing: z.boolean(),
  dataRetentionPeriod: z.number().min(1).max(120).optional() // months
})

// Audit log schema
export const auditLogSchema = z.object({
  action: z.string().max(100, 'Action description too long'),
  resourceType: z.string().max(50, 'Resource type too long'),
  resourceId: z.string().max(100, 'Resource ID too long'),
  details: z.record(z.any()).optional(),
  ipAddress: z.string().ip().optional(),
  userAgent: z.string().max(500, 'User agent too long').optional()
})

// Rate limiting schema
export const rateLimitSchema = z.object({
  identifier: z.string().max(100, 'Identifier too long'),
  action: z.string().max(50, 'Action too long'),
  windowMs: z.number().min(1000).max(3600000), // 1 second to 1 hour
  maxRequests: z.number().min(1).max(1000)
})

// Security event schema
export const securityEventSchema = z.object({
  type: z.enum([
    'FAILED_LOGIN',
    'SUSPICIOUS_ACTIVITY', 
    'RATE_LIMIT_EXCEEDED',
    'UNAUTHORIZED_ACCESS',
    'DATA_BREACH_ATTEMPT',
    'MALICIOUS_INPUT'
  ]),
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
  description: z.string().max(500, 'Description too long'),
  ipAddress: z.string().ip().optional(),
  userAgent: z.string().max(500, 'User agent too long').optional(),
  userId: baseValidation.id.optional(),
  metadata: z.record(z.any()).optional()
})

// Export validation helper functions
export const validateAndSanitize = {
  donorRegistration: (data: unknown) => {
    const result = donorRegistrationSchema.safeParse(data)
    if (!result.success) {
      throw new Error(`Validation failed: ${result.error.errors.map(e => e.message).join(', ')}`)
    }
    
    // Sanitize text fields
    const sanitized = { ...result.data }
    if (sanitized.name) sanitized.name = sanitizeInput.text(sanitized.name)
    if (sanitized.area) sanitized.area = sanitizeInput.text(sanitized.area)
    if (sanitized.address) sanitized.address = sanitizeInput.text(sanitized.address)
    if (sanitized.healthConditions) sanitized.healthConditions = sanitizeInput.text(sanitized.healthConditions)
    if (sanitized.medications) sanitized.medications = sanitizeInput.text(sanitized.medications)
    
    return sanitized
  },
  
  bloodRequest: (data: unknown) => {
    const result = bloodRequestSchema.safeParse(data)
    if (!result.success) {
      throw new Error(`Validation failed: ${result.error.errors.map(e => e.message).join(', ')}`)
    }
    
    // Sanitize text fields
    const sanitized = { ...result.data }
    if (sanitized.requesterName) sanitized.requesterName = sanitizeInput.text(sanitized.requesterName)
    if (sanitized.hospital) sanitized.hospital = sanitizeInput.text(sanitized.hospital)
    if (sanitized.notes) sanitized.notes = sanitizeInput.text(sanitized.notes)
    
    return sanitized
  },
  
  userCreate: (data: unknown) => {
    const result = userCreateSchema.safeParse(data)
    if (!result.success) {
      throw new Error(`Validation failed: ${result.error.errors.map(e => e.message).join(', ')}`)
    }
    
    // Sanitize text fields
    const sanitized = { ...result.data }
    if (sanitized.name) sanitized.name = sanitizeInput.text(sanitized.name)
    
    return sanitized
  }
}