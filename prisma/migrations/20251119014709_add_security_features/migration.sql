-- CreateEnum
CREATE TYPE "SecurityEventType" AS ENUM ('FAILED_LOGIN', 'SUSPICIOUS_ACTIVITY', 'RATE_LIMIT_EXCEEDED', 'UNAUTHORIZED_ACCESS', 'DATA_BREACH_ATTEMPT', 'MALICIOUS_INPUT', 'CSRF_ATTACK', 'XSS_ATTEMPT', 'SQL_INJECTION_ATTEMPT', 'FILE_UPLOAD_VIOLATION', 'PRIVILEGE_ESCALATION', 'BRUTE_FORCE_ATTACK');

-- CreateEnum
CREATE TYPE "SecurityEventSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "failedLoginCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "isLocked" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "lastLoginAt" TIMESTAMP(3),
ADD COLUMN     "lastLoginIp" TEXT,
ADD COLUMN     "lockedUntil" TIMESTAMP(3),
ADD COLUMN     "passwordChangedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "passwordHistory" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "twoFactorBackupCodes" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "twoFactorSecret" TEXT;

-- CreateTable
CREATE TABLE "security_events" (
    "id" TEXT NOT NULL,
    "type" "SecurityEventType" NOT NULL,
    "severity" "SecurityEventSeverity" NOT NULL,
    "description" TEXT NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "userId" TEXT,
    "metadata" JSONB,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "security_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "security_alerts" (
    "id" TEXT NOT NULL,
    "type" "SecurityEventType" NOT NULL,
    "severity" "SecurityEventSeverity" NOT NULL,
    "count" INTEGER NOT NULL,
    "firstOccurrence" TIMESTAMP(3) NOT NULL,
    "lastOccurrence" TIMESTAMP(3) NOT NULL,
    "ipAddresses" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "userIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "isResolved" BOOLEAN NOT NULL DEFAULT false,
    "resolvedAt" TIMESTAMP(3),
    "resolvedBy" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "security_alerts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "login_attempts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "success" BOOLEAN NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "login_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rate_limit_logs" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "count" INTEGER NOT NULL,
    "windowStart" TIMESTAMP(3) NOT NULL,
    "windowEnd" TIMESTAMP(3) NOT NULL,
    "blocked" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rate_limit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "file_upload_logs" (
    "id" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "uploadedBy" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "scanResult" TEXT,
    "isQuarantined" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "file_upload_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "security_events_type_timestamp_idx" ON "security_events"("type", "timestamp");

-- CreateIndex
CREATE INDEX "security_events_severity_timestamp_idx" ON "security_events"("severity", "timestamp");

-- CreateIndex
CREATE INDEX "security_events_userId_timestamp_idx" ON "security_events"("userId", "timestamp");

-- CreateIndex
CREATE INDEX "security_events_ipAddress_timestamp_idx" ON "security_events"("ipAddress", "timestamp");

-- CreateIndex
CREATE INDEX "security_alerts_type_isResolved_idx" ON "security_alerts"("type", "isResolved");

-- CreateIndex
CREATE INDEX "security_alerts_severity_isResolved_idx" ON "security_alerts"("severity", "isResolved");

-- CreateIndex
CREATE INDEX "security_alerts_lastOccurrence_idx" ON "security_alerts"("lastOccurrence");

-- CreateIndex
CREATE INDEX "login_attempts_userId_timestamp_idx" ON "login_attempts"("userId", "timestamp");

-- CreateIndex
CREATE INDEX "login_attempts_success_timestamp_idx" ON "login_attempts"("success", "timestamp");

-- CreateIndex
CREATE INDEX "login_attempts_ipAddress_timestamp_idx" ON "login_attempts"("ipAddress", "timestamp");

-- CreateIndex
CREATE INDEX "rate_limit_logs_identifier_windowStart_idx" ON "rate_limit_logs"("identifier", "windowStart");

-- CreateIndex
CREATE INDEX "rate_limit_logs_endpoint_windowStart_idx" ON "rate_limit_logs"("endpoint", "windowStart");

-- CreateIndex
CREATE INDEX "rate_limit_logs_blocked_createdAt_idx" ON "rate_limit_logs"("blocked", "createdAt");

-- CreateIndex
CREATE INDEX "file_upload_logs_uploadedBy_createdAt_idx" ON "file_upload_logs"("uploadedBy", "createdAt");

-- CreateIndex
CREATE INDEX "file_upload_logs_isQuarantined_idx" ON "file_upload_logs"("isQuarantined");

-- CreateIndex
CREATE INDEX "file_upload_logs_scanResult_idx" ON "file_upload_logs"("scanResult");

-- AddForeignKey
ALTER TABLE "security_events" ADD CONSTRAINT "security_events_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "login_attempts" ADD CONSTRAINT "login_attempts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
