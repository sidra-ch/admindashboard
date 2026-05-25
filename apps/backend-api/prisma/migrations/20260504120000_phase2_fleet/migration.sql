-- CreateEnum
CREATE TYPE "CarStatus" AS ENUM ('AVAILABLE', 'RESERVED', 'RENTED', 'MAINTENANCE', 'OUT_OF_SERVICE');

-- CreateEnum
CREATE TYPE "CustomerRiskLevel" AS ENUM ('SAFE', 'MEDIUM', 'HIGH');

-- CreateEnum
CREATE TYPE "CustomerStatus" AS ENUM ('ACTIVE', 'PENDING_VERIFICATION', 'BLACKLISTED');

-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('PENDING', 'CONFIRMED', 'CANCELLED', 'CONVERTED');

-- CreateEnum
CREATE TYPE "RentalStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'OVERDUE', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PARTIAL', 'PAID', 'FAILED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'BANK_TRANSFER', 'STRIPE', 'CARD');

-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('DRAFT', 'ISSUED', 'PAID', 'VOID');

-- AlterEnum
ALTER TYPE "AuditActionType" ADD VALUE 'CAR_CREATED';
ALTER TYPE "AuditActionType" ADD VALUE 'CAR_UPDATED';
ALTER TYPE "AuditActionType" ADD VALUE 'CUSTOMER_CREATED';
ALTER TYPE "AuditActionType" ADD VALUE 'CUSTOMER_UPDATED';
ALTER TYPE "AuditActionType" ADD VALUE 'RENTAL_CREATED';
ALTER TYPE "AuditActionType" ADD VALUE 'RENTAL_EXTENDED';
ALTER TYPE "AuditActionType" ADD VALUE 'RENTAL_RETURNED';
ALTER TYPE "AuditActionType" ADD VALUE 'PAYMENT_CREATED';
ALTER TYPE "AuditActionType" ADD VALUE 'PAYMENT_UPDATED';

-- CreateTable
CREATE TABLE "Car" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "registrationNumber" TEXT NOT NULL,
    "make" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "color" TEXT,
    "category" TEXT NOT NULL,
    "vin" TEXT,
    "odometerKm" INTEGER NOT NULL DEFAULT 0,
    "dailyRateCents" INTEGER NOT NULL,
    "status" "CarStatus" NOT NULL DEFAULT 'AVAILABLE',
    "trackerInstalled" BOOLEAN NOT NULL DEFAULT false,
    "nextServiceDue" TIMESTAMP(3),
    "insuranceExpiry" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Car_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Customer" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT NOT NULL,
    "licenseNumber" TEXT NOT NULL,
    "licenseExpiry" TIMESTAMP(3),
    "riskLevel" "CustomerRiskLevel" NOT NULL DEFAULT 'SAFE',
    "status" "CustomerStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Booking" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "carId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "totalAmountCents" INTEGER NOT NULL,
    "status" "BookingStatus" NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Booking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Rental" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "bookingId" TEXT,
    "carId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "pickupAt" TIMESTAMP(3) NOT NULL,
    "expectedReturnAt" TIMESTAMP(3) NOT NULL,
    "actualReturnAt" TIMESTAMP(3),
    "startOdometerKm" INTEGER NOT NULL,
    "endOdometerKm" INTEGER,
    "totalAmountCents" INTEGER NOT NULL,
    "balanceDueCents" INTEGER NOT NULL,
    "depositAmountCents" INTEGER NOT NULL DEFAULT 0,
    "lateFeeAmountCents" INTEGER NOT NULL DEFAULT 0,
    "damageChargeCents" INTEGER NOT NULL DEFAULT 0,
    "fuelPenaltyCents" INTEGER NOT NULL DEFAULT 0,
    "status" "RentalStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Rental_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RentalExtension" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "rentalId" TEXT NOT NULL,
    "newReturnAt" TIMESTAMP(3) NOT NULL,
    "additionalAmountCents" INTEGER NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RentalExtension_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Invoice" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "rentalId" TEXT NOT NULL,
    "invoiceNumber" TEXT NOT NULL,
    "subtotalCents" INTEGER NOT NULL,
    "taxCents" INTEGER NOT NULL DEFAULT 0,
    "totalCents" INTEGER NOT NULL,
    "status" "InvoiceStatus" NOT NULL DEFAULT 'ISSUED',
    "pdfUrl" TEXT,
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dueAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "rentalId" TEXT,
    "customerId" TEXT,
    "invoiceId" TEXT,
    "amountCents" INTEGER NOT NULL,
    "method" "PaymentMethod" NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PAID',
    "reference" TEXT,
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Car_tenantId_status_idx" ON "Car"("tenantId", "status");

-- CreateIndex
CREATE INDEX "Car_branchId_idx" ON "Car"("branchId");

-- CreateIndex
CREATE UNIQUE INDEX "Car_tenantId_registrationNumber_key" ON "Car"("tenantId", "registrationNumber");

-- CreateIndex
CREATE INDEX "Customer_tenantId_status_idx" ON "Customer"("tenantId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Customer_tenantId_licenseNumber_key" ON "Customer"("tenantId", "licenseNumber");

-- CreateIndex
CREATE INDEX "Booking_tenantId_status_startDate_idx" ON "Booking"("tenantId", "status", "startDate");

-- CreateIndex
CREATE INDEX "Booking_carId_idx" ON "Booking"("carId");

-- CreateIndex
CREATE INDEX "Booking_customerId_idx" ON "Booking"("customerId");

-- CreateIndex
CREATE UNIQUE INDEX "Rental_bookingId_key" ON "Rental"("bookingId");

-- CreateIndex
CREATE INDEX "Rental_tenantId_status_expectedReturnAt_idx" ON "Rental"("tenantId", "status", "expectedReturnAt");

-- CreateIndex
CREATE INDEX "Rental_carId_idx" ON "Rental"("carId");

-- CreateIndex
CREATE INDEX "Rental_customerId_idx" ON "Rental"("customerId");

-- CreateIndex
CREATE INDEX "RentalExtension_tenantId_rentalId_idx" ON "RentalExtension"("tenantId", "rentalId");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_rentalId_key" ON "Invoice"("rentalId");

-- CreateIndex
CREATE INDEX "Invoice_tenantId_status_idx" ON "Invoice"("tenantId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_tenantId_invoiceNumber_key" ON "Invoice"("tenantId", "invoiceNumber");

-- CreateIndex
CREATE INDEX "Payment_tenantId_status_createdAt_idx" ON "Payment"("tenantId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "Payment_rentalId_idx" ON "Payment"("rentalId");

-- CreateIndex
CREATE INDEX "Payment_invoiceId_idx" ON "Payment"("invoiceId");

-- AddForeignKey
ALTER TABLE "Car" ADD CONSTRAINT "Car_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Car" ADD CONSTRAINT "Car_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Customer" ADD CONSTRAINT "Customer_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_carId_fkey" FOREIGN KEY ("carId") REFERENCES "Car"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rental" ADD CONSTRAINT "Rental_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rental" ADD CONSTRAINT "Rental_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rental" ADD CONSTRAINT "Rental_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rental" ADD CONSTRAINT "Rental_carId_fkey" FOREIGN KEY ("carId") REFERENCES "Car"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rental" ADD CONSTRAINT "Rental_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RentalExtension" ADD CONSTRAINT "RentalExtension_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RentalExtension" ADD CONSTRAINT "RentalExtension_rentalId_fkey" FOREIGN KEY ("rentalId") REFERENCES "Rental"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_rentalId_fkey" FOREIGN KEY ("rentalId") REFERENCES "Rental"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_rentalId_fkey" FOREIGN KEY ("rentalId") REFERENCES "Rental"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE SET NULL ON UPDATE CASCADE;
