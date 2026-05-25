-- CreateEnum
CREATE TYPE "MaintenanceStatus" AS ENUM ('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "MaintenanceType" AS ENUM ('ROUTINE_SERVICE', 'TYRE_REPLACEMENT', 'BRAKE_SERVICE', 'ENGINE_REPAIR', 'BODY_REPAIR', 'ELECTRICAL', 'OTHER');

-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('REGISTRATION', 'INSURANCE', 'ROADWORTHY', 'LICENCE', 'CONTRACT', 'OTHER');

-- AlterEnum
ALTER TYPE "AuditActionType" ADD VALUE 'MAINTENANCE_CREATED';
ALTER TYPE "AuditActionType" ADD VALUE 'MAINTENANCE_UPDATED';
ALTER TYPE "AuditActionType" ADD VALUE 'DOCUMENT_UPLOADED';

-- CreateTable
CREATE TABLE "MaintenanceJob" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "carId" TEXT NOT NULL,
    "type" "MaintenanceType" NOT NULL,
    "status" "MaintenanceStatus" NOT NULL DEFAULT 'SCHEDULED',
    "description" TEXT,
    "odometerKm" INTEGER,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),
    "costCents" INTEGER NOT NULL DEFAULT 0,
    "vendor" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MaintenanceJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Document" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "carId" TEXT,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "type" "DocumentType" NOT NULL,
    "name" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileSizeBytes" INTEGER NOT NULL DEFAULT 0,
    "mimeType" TEXT,
    "expiresAt" TIMESTAMP(3),
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MaintenanceJob_tenantId_status_scheduledAt_idx" ON "MaintenanceJob"("tenantId", "status", "scheduledAt");

-- CreateIndex
CREATE INDEX "MaintenanceJob_carId_idx" ON "MaintenanceJob"("carId");

-- CreateIndex
CREATE INDEX "Document_tenantId_entityType_entityId_idx" ON "Document"("tenantId", "entityType", "entityId");

-- CreateIndex
CREATE INDEX "Document_carId_idx" ON "Document"("carId");

-- CreateIndex
CREATE INDEX "Document_expiresAt_idx" ON "Document"("expiresAt");

-- AddForeignKey
ALTER TABLE "MaintenanceJob" ADD CONSTRAINT "MaintenanceJob_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaintenanceJob" ADD CONSTRAINT "MaintenanceJob_carId_fkey" FOREIGN KEY ("carId") REFERENCES "Car"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_carId_fkey" FOREIGN KEY ("carId") REFERENCES "Car"("id") ON DELETE SET NULL ON UPDATE CASCADE;
