import bcrypt from 'bcryptjs'
import { randomBytes, createHash } from 'crypto'
import { authenticator } from 'otplib'
import QRCode from 'qrcode'
import { db } from './db'
import { securityLogger } from './security-logger'

// Password policy configuration
export const passwordPolicy = {
  minLength: 8,
  maxLength: 128,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
  maxConsecutiveChars: 3,
  preventCommonPasswords: true,
  preventUserInfoInPassword: true,
  passwordHistoryCount: 5, // Remember last 5 passwords
  maxAge: 90 * 24 * 60 * 60 * 1000, // 90 days
  lockoutThreshold: 5, // Lock account after 5 failed attempts
  lockoutDuration: 30 * 60 * 1000 // 30 minutes
}

// Common passwords list (subset for demonstration)
const commonPasswords = new Set([
  'password', '123456', '123456789', 'qwerty', 'abc123', 'password123',
  'admin', 'letmein', 'welcome', 'monkey', '1234567890', 'password1',
  'qwerty123', 'dragon', 'master', 'hello', 'login', 'passw0rd'
])

export interface PasswordValidationResult {
  isValid: boolean
  score: number // 0-100
  errors: string[]
  suggestions: string[]
  strength: 'very-weak' | 'weak' | 'fair' | 'good' | 'strong'
}

export interface PasswordHashResult {
  hash: string
  salt: string
  algorithm: string
  iterations: number
}

export interface TwoFactorSetup {
  secret: string
  qrCodeUrl: string
  backupCodes: string[]
}

export interface LoginAttempt {
  userId: string
  success: boolean
  ipAddress?: string
  userAgent?: string
  timestamp: Date
}

/**
 * Password security utilities
 */
export class PasswordSecurity {
  private static readonly SALT_ROUNDS = 12
  private static readonly BACKUP_CODE_LENGTH = 8
  private static readonly BACKUP_CODE_COUNT = 10

  /**
   * Validate password against policy
   */
  static validatePassword(
    password: string, 
    userInfo?: { name?: string; email?: string; phone?: string }
  ): PasswordValidationResult {
    const errors: string[] = []
    const suggestions: string[] = []
    let score = 0

    // Length check
    if (password.length < passwordPolicy.minLength) {
      errors.push(`Password must be at least ${passwordPolicy.minLength} characters long`)
    } else if (password.length >= passwordPolicy.minLength) {
      score += 20
    }

    if (password.length > passwordPolicy.maxLength) {
      errors.push(`Password must not exceed ${passwordPolicy.maxLength} characters`)
    }

    // Character requirements
    if (passwordPolicy.requireUppercase && !/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter')
      suggestions.push('Add uppercase letters (A-Z)')
    } else if (/[A-Z]/.test(password)) {
      score += 15
    }

    if (passwordPolicy.requireLowercase && !/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter')
      suggestions.push('Add lowercase letters (a-z)')
    } else if (/[a-z]/.test(password)) {
      score += 15
    }

    if (passwordPolicy.requireNumbers && !/\d/.test(password)) {
      errors.push('Password must contain at least one number')
      suggestions.push('Add numbers (0-9)')
    } else if (/\d/.test(password)) {
      score += 15
    }

    if (passwordPolicy.requireSpecialChars && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      errors.push('Password must contain at least one special character')
      suggestions.push('Add special characters (!@#$%^&*)')
    } else if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      score += 15
    }

    // Consecutive characters check
    if (this.hasConsecutiveChars(password, passwordPolicy.maxConsecutiveChars)) {
      errors.push(`Password must not contain more than ${passwordPolicy.maxConsecutiveChars} consecutive identical characters`)
      suggestions.push('Avoid repeating the same character multiple times')
    } else {
      score += 10
    }

    // Common password check
    if (passwordPolicy.preventCommonPasswords && commonPasswords.has(password.toLowerCase())) {
      errors.push('Password is too common, please choose a more unique password')
      suggestions.push('Use a unique combination of words, numbers, and symbols')
    } else {
      score += 10
    }

    // User info in password check
    if (passwordPolicy.preventUserInfoInPassword && userInfo) {
      const userInfoValues = [userInfo.name, userInfo.email?.split('@')[0], userInfo.phone]
        .filter(Boolean)
        .map(val => val!.toLowerCase())

      for (const info of userInfoValues) {
        if (password.toLowerCase().includes(info)) {
          errors.push('Password must not contain personal information')
          suggestions.push('Avoid using your name, email, or phone number in the password')
          break
        }
      }
    }

    // Additional complexity scoring
    const uniqueChars = new Set(password).size
    if (uniqueChars >= password.length * 0.7) {
      score += 10 // Good character diversity
    }

    // Determine strength
    let strength: PasswordValidationResult['strength']
    if (score >= 90) strength = 'strong'
    else if (score >= 70) strength = 'good'
    else if (score >= 50) strength = 'fair'
    else if (score >= 30) strength = 'weak'
    else strength = 'very-weak'

    return {
      isValid: errors.length === 0,
      score: Math.min(score, 100),
      errors,
      suggestions,
      strength
    }
  }

  /**
   * Hash password securely
   */
  static async hashPassword(password: string): Promise<string> {
    return await bcrypt.hash(password, this.SALT_ROUNDS)
  }

  /**
   * Verify password against hash
   */
  static async verifyPassword(password: string, hash: string): Promise<boolean> {
    return await bcrypt.compare(password, hash)
  }

  /**
   * Generate secure random password
   */
  static generateSecurePassword(length: number = 16): string {
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    const lowercase = 'abcdefghijklmnopqrstuvwxyz'
    const numbers = '0123456789'
    const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?'
    
    const allChars = uppercase + lowercase + numbers + symbols
    let password = ''
    
    // Ensure at least one character from each required set
    password += uppercase[Math.floor(Math.random() * uppercase.length)]
    password += lowercase[Math.floor(Math.random() * lowercase.length)]
    password += numbers[Math.floor(Math.random() * numbers.length)]
    password += symbols[Math.floor(Math.random() * symbols.length)]
    
    // Fill the rest randomly
    for (let i = 4; i < length; i++) {
      password += allChars[Math.floor(Math.random() * allChars.length)]
    }
    
    // Shuffle the password
    return password.split('').sort(() => Math.random() - 0.5).join('')
  }

  /**
   * Check for consecutive characters
   */
  private static hasConsecutiveChars(password: string, maxConsecutive: number): boolean {
    let count = 1
    for (let i = 1; i < password.length; i++) {
      if (password[i] === password[i - 1]) {
        count++
        if (count > maxConsecutive) {
          return true
        }
      } else {
        count = 1
      }
    }
    return false
  }

  /**
   * Setup Two-Factor Authentication
   */
  static async setupTwoFactor(userId: string, appName: string = 'RedAid'): Promise<TwoFactorSetup> {
    // Generate secret
    const secret = authenticator.generateSecret()
    
    // Get user info for QR code
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { email: true, name: true }
    })

    if (!user) {
      throw new Error('User not found')
    }

    // Generate QR code URL
    const otpauth = authenticator.keyuri(user.email, appName, secret)
    const qrCodeUrl = await QRCode.toDataURL(otpauth)

    // Generate backup codes
    const backupCodes = this.generateBackupCodes()

    // Store 2FA settings in database
    await db.user.update({
      where: { id: userId },
      data: {
        twoFactorSecret: secret,
        twoFactorBackupCodes: backupCodes,
        twoFactorEnabled: false // Will be enabled after verification
      }
    })

    return {
      secret,
      qrCodeUrl,
      backupCodes
    }
  }

  /**
   * Verify 2FA token and enable 2FA
   */
  static async verifyAndEnable2FA(userId: string, token: string): Promise<boolean> {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { twoFactorSecret: true }
    })

    if (!user?.twoFactorSecret) {
      throw new Error('2FA not set up for this user')
    }

    const isValid = authenticator.verify({
      token,
      secret: user.twoFactorSecret
    })

    if (isValid) {
      await db.user.update({
        where: { id: userId },
        data: { twoFactorEnabled: true }
      })
    }

    return isValid
  }

  /**
   * Verify 2FA token for login
   */
  static async verify2FAToken(userId: string, token: string): Promise<boolean> {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { 
        twoFactorSecret: true, 
        twoFactorEnabled: true,
        twoFactorBackupCodes: true
      }
    })

    if (!user?.twoFactorEnabled || !user.twoFactorSecret) {
      return false
    }

    // Try TOTP token first
    const isValidTOTP = authenticator.verify({
      token,
      secret: user.twoFactorSecret,
      window: 2 // Allow 2 time steps tolerance
    })

    if (isValidTOTP) {
      return true
    }

    // Try backup codes
    if (user.twoFactorBackupCodes && user.twoFactorBackupCodes.includes(token)) {
      // Remove used backup code
      const updatedCodes = user.twoFactorBackupCodes.filter(code => code !== token)
      await db.user.update({
        where: { id: userId },
        data: { twoFactorBackupCodes: updatedCodes }
      })
      return true
    }

    return false
  }

  /**
   * Disable 2FA
   */
  static async disable2FA(userId: string, password: string): Promise<boolean> {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { password: true }
    })

    if (!user) {
      throw new Error('User not found')
    }

    const isPasswordValid = await this.verifyPassword(password, user.password)
    if (!isPasswordValid) {
      throw new Error('Invalid password')
    }

    await db.user.update({
      where: { id: userId },
      data: {
        twoFactorEnabled: false,
        twoFactorSecret: null,
        twoFactorBackupCodes: null
      }
    })

    return true
  }

  /**
   * Generate backup codes
   */
  private static generateBackupCodes(): string[] {
    const codes: string[] = []
    for (let i = 0; i < this.BACKUP_CODE_COUNT; i++) {
      codes.push(randomBytes(this.BACKUP_CODE_LENGTH).toString('hex').toUpperCase())
    }
    return codes
  }

  /**
   * Track login attempt
   */
  static async trackLoginAttempt(attempt: LoginAttempt): Promise<void> {
    try {
      await db.loginAttempt.create({
        data: {
          userId: attempt.userId,
          success: attempt.success,
          ipAddress: attempt.ipAddress,
          userAgent: attempt.userAgent,
          timestamp: attempt.timestamp
        }
      })

      // Check for account lockout
      if (!attempt.success) {
        await this.checkAccountLockout(attempt.userId, attempt.ipAddress)
      }
    } catch (error) {
      console.error('Failed to track login attempt:', error)
    }
  }

  /**
   * Check if account should be locked due to failed attempts
   */
  private static async checkAccountLockout(userId: string, ipAddress?: string): Promise<void> {
    const timeWindow = new Date(Date.now() - passwordPolicy.lockoutDuration)
    
    const failedAttempts = await db.loginAttempt.count({
      where: {
        userId,
        success: false,
        timestamp: { gte: timeWindow }
      }
    })

    if (failedAttempts >= passwordPolicy.lockoutThreshold) {
      const lockoutUntil = new Date(Date.now() + passwordPolicy.lockoutDuration)
      
      await db.user.update({
        where: { id: userId },
        data: { 
          isLocked: true,
          lockedUntil: lockoutUntil
        }
      })

      // Log security event
      await securityLogger.logEvent({
        type: 'BRUTE_FORCE_ATTACK',
        severity: 'HIGH',
        description: `Account locked due to ${failedAttempts} failed login attempts`,
        userId,
        ipAddress,
        metadata: { failedAttempts, lockoutUntil }
      })
    }
  }

  /**
   * Check if account is currently locked
   */
  static async isAccountLocked(userId: string): Promise<boolean> {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { isLocked: true, lockedUntil: true }
    })

    if (!user?.isLocked) {
      return false
    }

    // Check if lockout period has expired
    if (user.lockedUntil && new Date() > user.lockedUntil) {
      await db.user.update({
        where: { id: userId },
        data: { 
          isLocked: false,
          lockedUntil: null
        }
      })
      return false
    }

    return true
  }

  /**
   * Unlock account (admin function)
   */
  static async unlockAccount(userId: string, adminId: string): Promise<void> {
    await db.user.update({
      where: { id: userId },
      data: { 
        isLocked: false,
        lockedUntil: null
      }
    })

    // Log admin action
    await securityLogger.logEvent({
      type: 'SUSPICIOUS_ACTIVITY',
      severity: 'MEDIUM',
      description: `Account ${userId} unlocked by admin`,
      userId: adminId,
      metadata: { unlockedUserId: userId }
    })
  }

  /**
   * Check if password needs to be changed (age-based)
   */
  static async isPasswordExpired(userId: string): Promise<boolean> {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { passwordChangedAt: true }
    })

    if (!user?.passwordChangedAt) {
      return true // Force password change if no change date recorded
    }

    const passwordAge = Date.now() - user.passwordChangedAt.getTime()
    return passwordAge > passwordPolicy.maxAge
  }

  /**
   * Change password with history check
   */
  static async changePassword(
    userId: string, 
    currentPassword: string, 
    newPassword: string
  ): Promise<{ success: boolean; errors: string[] }> {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { 
        password: true, 
        passwordHistory: true,
        name: true,
        email: true,
        phone: true
      }
    })

    if (!user) {
      return { success: false, errors: ['User not found'] }
    }

    // Verify current password
    const isCurrentPasswordValid = await this.verifyPassword(currentPassword, user.password)
    if (!isCurrentPasswordValid) {
      return { success: false, errors: ['Current password is incorrect'] }
    }

    // Validate new password
    const validation = this.validatePassword(newPassword, {
      name: user.name,
      email: user.email,
      phone: user.phone || undefined
    })

    if (!validation.isValid) {
      return { success: false, errors: validation.errors }
    }

    // Check password history
    const passwordHistory = user.passwordHistory || []
    for (const oldHash of passwordHistory) {
      if (await this.verifyPassword(newPassword, oldHash)) {
        return { 
          success: false, 
          errors: [`Password cannot be one of your last ${passwordPolicy.passwordHistoryCount} passwords`] 
        }
      }
    }

    // Hash new password
    const newPasswordHash = await this.hashPassword(newPassword)

    // Update password and history
    const updatedHistory = [user.password, ...passwordHistory]
      .slice(0, passwordPolicy.passwordHistoryCount)

    await db.user.update({
      where: { id: userId },
      data: {
        password: newPasswordHash,
        passwordHistory: updatedHistory,
        passwordChangedAt: new Date()
      }
    })

    return { success: true, errors: [] }
  }
}