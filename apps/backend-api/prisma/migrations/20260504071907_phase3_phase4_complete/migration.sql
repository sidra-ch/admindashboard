-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('RENTAL_DUE', 'RENTAL_OVERDUE', 'PAYMENT_DUE', 'PAYMENT_RECEIVED', 'MAINTENANCE_DUE', 'INSURANCE_EXPIRY', 'REGISTRATION_EXPIRY', 'GEOFENCE_ALERT', 'SYSTEM_ALERT');

-- CreateEnum
CREATE TYPE "NotificationChannel" AS ENUM ('DASHBOARD', 'EMAIL', 'SMS', 'PUSH');

-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "TaskType" AS ENUM ('CLEANING', 'DELIVERY', 'PICKUP', 'WORKSHOP_VISIT', 'INSPECTION', 'FUEL_REFILL', 'OTHER');

-- CreateTable
CREATE TABLE "GpsDevice" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "carId" TEXT NOT NULL,
    "imei" TEXT NOT NULL,
    "simNumber" TEXT,
    "provider" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastPingAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GpsDevice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GpsTrackingLog" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "location" geography(Point, 4326) NOT NULL,
    "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,
    "speedKmh" DOUBLE PRECISION,
    "heading" DOUBLE PRECISION,
    "altitude" DOUBLE PRECISION,
    "ignitionOn" BOOLEAN NOT NULL DEFAULT false,
    "batteryVoltage" DOUBLE PRECISION,
    "fuelLevelPercent" DOUBLE PRECISION,
    "recordedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GpsTrackingLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GpsLiveStatus" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "location" geography(Point, 4326) NOT NULL,
    "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,
    "speedKmh" DOUBLE PRECISION,
    "heading" DOUBLE PRECISION,
    "altitude" DOUBLE PRECISION,
    "ignitionOn" BOOLEAN NOT NULL DEFAULT false,
    "batteryVoltage" DOUBLE PRECISION,
    "fuelLevelPercent" DOUBLE PRECISION,
    "recordedAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GpsLiveStatus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Geofence" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "center" geography(Point, 4326) NOT NULL,
    "centerLat" DOUBLE PRECISION NOT NULL,
    "centerLng" DOUBLE PRECISION NOT NULL,
    "radiusM" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Geofence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GeofenceEvent" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "geofenceId" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "carId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GeofenceEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "entityType" TEXT,
    "entityId" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationTemplate" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "channel" "NotificationChannel" NOT NULL,
    "subject" TEXT,
    "template" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NotificationTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StaffTask" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "assignedToId" TEXT,
    "carId" TEXT,
    "rentalId" TEXT,
    "type" "TaskType" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "TaskStatus" NOT NULL DEFAULT 'PENDING',
    "priority" INTEGER NOT NULL DEFAULT 0,
    "dueAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StaffTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MaintenancePart" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "maintenanceId" TEXT NOT NULL,
    "partName" TEXT NOT NULL,
    "partNumber" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "costCents" INTEGER NOT NULL,
    "supplier" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MaintenancePart_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DamageReport" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "rentalId" TEXT NOT NULL,
    "carId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "costCents" INTEGER NOT NULL DEFAULT 0,
    "imageUrls" TEXT[],
    "reportedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DamageReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CarImage" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "carId" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CarImage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CarCategory" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CarCategory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "GpsDevice_carId_key" ON "GpsDevice"("carId");

-- CreateIndex
CREATE UNIQUE INDEX "GpsDevice_imei_key" ON "GpsDevice"("imei");

-- CreateIndex
CREATE INDEX "GpsDevice_tenantId_idx" ON "GpsDevice"("tenantId");

-- CreateIndex
CREATE INDEX "GpsDevice_imei_idx" ON "GpsDevice"("imei");

-- CreateIndex
CREATE INDEX "GpsTrackingLog_tenantId_deviceId_recordedAt_idx" ON "GpsTrackingLog"("tenantId", "deviceId", "recordedAt");

-- CreateIndex
CREATE INDEX "GpsTrackingLog_recordedAt_idx" ON "GpsTrackingLog"("recordedAt");

-- CreateIndex
CREATE UNIQUE INDEX "GpsLiveStatus_deviceId_key" ON "GpsLiveStatus"("deviceId");

-- CreateIndex
CREATE INDEX "GpsLiveStatus_tenantId_idx" ON "GpsLiveStatus"("tenantId");

-- CreateIndex
CREATE INDEX "Geofence_tenantId_idx" ON "Geofence"("tenantId");

-- CreateIndex
CREATE INDEX "GeofenceEvent_tenantId_carId_occurredAt_idx" ON "GeofenceEvent"("tenantId", "carId", "occurredAt");

-- CreateIndex
CREATE INDEX "GeofenceEvent_geofenceId_idx" ON "GeofenceEvent"("geofenceId");

-- CreateIndex
CREATE INDEX "Notification_tenantId_userId_isRead_idx" ON "Notification"("tenantId", "userId", "isRead");

-- CreateIndex
CREATE INDEX "Notification_createdAt_idx" ON "Notification"("createdAt");

-- CreateIndex
CREATE INDEX "NotificationTemplate_tenantId_idx" ON "NotificationTemplate"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "NotificationTemplate_tenantId_type_channel_key" ON "NotificationTemplate"("tenantId", "type", "channel");

-- CreateIndex
CREATE INDEX "StaffTask_tenantId_status_dueAt_idx" ON "StaffTask"("tenantId", "status", "dueAt");

-- CreateIndex
CREATE INDEX "StaffTask_assignedToId_idx" ON "StaffTask"("assignedToId");

-- CreateIndex
CREATE INDEX "MaintenancePart_tenantId_maintenanceId_idx" ON "MaintenancePart"("tenantId", "maintenanceId");

-- CreateIndex
CREATE INDEX "DamageReport_tenantId_rentalId_idx" ON "DamageReport"("tenantId", "rentalId");

-- CreateIndex
CREATE INDEX "DamageReport_carId_idx" ON "DamageReport"("carId");

-- CreateIndex
CREATE INDEX "CarImage_tenantId_carId_idx" ON "CarImage"("tenantId", "carId");

-- CreateIndex
CREATE INDEX "CarCategory_tenantId_idx" ON "CarCategory"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "CarCategory_tenantId_name_key" ON "CarCategory"("tenantId", "name");

-- AddForeignKey
ALTER TABLE "GpsDevice" ADD CONSTRAINT "GpsDevice_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GpsDevice" ADD CONSTRAINT "GpsDevice_carId_fkey" FOREIGN KEY ("carId") REFERENCES "Car"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GpsTrackingLog" ADD CONSTRAINT "GpsTrackingLog_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GpsTrackingLog" ADD CONSTRAINT "GpsTrackingLog_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "GpsDevice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GpsLiveStatus" ADD CONSTRAINT "GpsLiveStatus_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GpsLiveStatus" ADD CONSTRAINT "GpsLiveStatus_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "GpsDevice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Geofence" ADD CONSTRAINT "Geofence_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GeofenceEvent" ADD CONSTRAINT "GeofenceEvent_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GeofenceEvent" ADD CONSTRAINT "GeofenceEvent_geofenceId_fkey" FOREIGN KEY ("geofenceId") REFERENCES "Geofence"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationTemplate" ADD CONSTRAINT "NotificationTemplate_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffTask" ADD CONSTRAINT "StaffTask_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaintenancePart" ADD CONSTRAINT "MaintenancePart_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaintenancePart" ADD CONSTRAINT "MaintenancePart_maintenanceId_fkey" FOREIGN KEY ("maintenanceId") REFERENCES "MaintenanceJob"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DamageReport" ADD CONSTRAINT "DamageReport_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CarImage" ADD CONSTRAINT "CarImage_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CarImage" ADD CONSTRAINT "CarImage_carId_fkey" FOREIGN KEY ("carId") REFERENCES "Car"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CarCategory" ADD CONSTRAINT "CarCategory_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
