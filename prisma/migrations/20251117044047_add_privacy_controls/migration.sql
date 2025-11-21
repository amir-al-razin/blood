-- DropForeignKey
ALTER TABLE "audit_logs" DROP CONSTRAINT "audit_logs_userId_fkey";

-- AlterTable
ALTER TABLE "audit_logs" ADD COLUMN     "sensitive" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "userAgent" TEXT,
ALTER COLUMN "userId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "donors" ADD COLUMN     "allowContactByEmail" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "allowContactByPhone" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "allowDataSharing" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "consentDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "dataRetentionConsent" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "deletionRequestedAt" TIMESTAMP(3),
ADD COLUMN     "privacyConsent" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "donor_privacy_settings" (
    "id" TEXT NOT NULL,
    "donorId" TEXT NOT NULL,
    "allowSMSNotifications" BOOLEAN NOT NULL DEFAULT true,
    "allowEmailNotifications" BOOLEAN NOT NULL DEFAULT true,
    "allowPhoneCalls" BOOLEAN NOT NULL DEFAULT false,
    "shareLocationWithRequests" BOOLEAN NOT NULL DEFAULT true,
    "shareStatisticsAnonymously" BOOLEAN NOT NULL DEFAULT true,
    "allowResearchParticipation" BOOLEAN NOT NULL DEFAULT false,
    "hideFromPublicStats" BOOLEAN NOT NULL DEFAULT false,
    "anonymizeInReports" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "donor_privacy_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "data_deletion_logs" (
    "id" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "deletedBy" TEXT,
    "reason" TEXT NOT NULL,
    "dataBackup" JSONB,
    "deletedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "data_deletion_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "consent_logs" (
    "id" TEXT NOT NULL,
    "donorId" TEXT NOT NULL,
    "consentType" TEXT NOT NULL,
    "granted" BOOLEAN NOT NULL,
    "version" TEXT NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "consent_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "donor_privacy_settings_donorId_key" ON "donor_privacy_settings"("donorId");

-- CreateIndex
CREATE INDEX "data_deletion_logs_entityType_entityId_idx" ON "data_deletion_logs"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "data_deletion_logs_deletedAt_idx" ON "data_deletion_logs"("deletedAt");

-- CreateIndex
CREATE INDEX "consent_logs_donorId_consentType_idx" ON "consent_logs"("donorId", "consentType");

-- CreateIndex
CREATE INDEX "consent_logs_createdAt_idx" ON "consent_logs"("createdAt");

-- CreateIndex
CREATE INDEX "audit_logs_sensitive_createdAt_idx" ON "audit_logs"("sensitive", "createdAt");

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "donor_privacy_settings" ADD CONSTRAINT "donor_privacy_settings_donorId_fkey" FOREIGN KEY ("donorId") REFERENCES "donors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "data_deletion_logs" ADD CONSTRAINT "data_deletion_logs_deletedBy_fkey" FOREIGN KEY ("deletedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
