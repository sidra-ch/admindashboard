import { Injectable, NotFoundException } from '@nestjs/common';
import { AuditActionType, Prisma, BookingStatus, RentalStatus, MaintenanceStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { CreateCarDto } from './dto/create-car.dto';
import { ListCarsQueryDto } from './dto/list-cars-query.dto';
import { UpdateCarDto } from './dto/update-car.dto';
import { CheckAvailabilityDto } from './dto/check-availability.dto';
import { GetCalendarDto } from './dto/get-calendar.dto';
import { BulkImportCarsDto } from './dto/bulk-import-cars.dto';

@Injectable()
export class CarsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async listForTenant(tenantId: string, query: ListCarsQueryDto) {
    const skip = (query.page - 1) * query.pageSize;
    
    // Build where clause with all filters
    const where: Prisma.CarWhereInput = {
      tenantId,
      ...(query.branchId && { branchId: query.branchId }),
      ...(query.status && { status: query.status }),
      ...(query.categoryId && { categoryId: query.categoryId }),
      ...(query.brand && { brand: { contains: query.brand, mode: 'insensitive' } }),
      ...(query.model && { model: { contains: query.model, mode: 'insensitive' } }),
      ...(query.year && { year: query.year }),
      ...(query.transmissionType && { transmissionType: query.transmissionType }),
      ...(query.fuelType && { fuelType: query.fuelType }),
      ...(query.minPrice && { dailyRateCents: { gte: query.minPrice } }),
      ...(query.maxPrice && { dailyRateCents: { lte: query.maxPrice } }),
      ...(query.serviceDueSoon && {
        nextServiceDue: {
          lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Next 30 days
        },
      }),
      ...(query.insuranceExpiringSoon && {
        insuranceExpiry: {
          lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Next 30 days
        },
      }),
      ...(query.search && {
        OR: [
          { registrationNumber: { contains: query.search, mode: 'insensitive' } },
          { brand: { contains: query.search, mode: 'insensitive' } },
          { model: { contains: query.search, mode: 'insensitive' } },
          { vin: { contains: query.search, mode: 'insensitive' } },
        ],
      }),
    };

    // Build orderBy clause
    let orderBy: Prisma.CarOrderByWithRelationInput = { createdAt: 'desc' };
    if (query.sortBy) {
      const sortOrder = query.sortOrder || 'asc';
      switch (query.sortBy) {
        case 'price':
          orderBy = { dailyRateCents: sortOrder };
          break;
        case 'year':
          orderBy = { year: sortOrder };
          break;
        case 'odometer':
          orderBy = { odometerKm: sortOrder };
          break;
        case 'nextService':
          orderBy = { nextServiceDue: sortOrder };
          break;
      }
    }

    const [items, total] = await Promise.all([
      this.prisma.car.findMany({
        where,
        skip,
        take: query.pageSize,
        orderBy,
        include: {
          branch: { select: { id: true, name: true, code: true } },
          category: { select: { id: true, name: true, icon: true } },
          rentals: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            select: { id: true, status: true, expectedReturnAt: true },
          },
        },
      }),
      this.prisma.car.count({ where }),
    ]);

    return {
      items,
      total,
      page: query.page,
      pageSize: query.pageSize,
    };
  }

  async getById(tenantId: string, id: string) {
    const car = await this.prisma.car.findFirst({
      where: { id, tenantId },
      include: {
        branch: true,
        bookings: {
          orderBy: { startDate: 'desc' },
          include: {
            customer: { select: { firstName: true, lastName: true, phone: true } },
          },
          take: 10,
        },
        rentals: {
          orderBy: { pickupAt: 'desc' },
          include: {
            customer: { select: { firstName: true, lastName: true, phone: true } },
            payments: true,
            invoice: true,
            extensions: true,
          },
          take: 10,
        },
      },
    });

    if (!car) {
      throw new NotFoundException('Car not found');
    }

    return car;
  }

  async create(actor: AuthenticatedUser, dto: CreateCarDto) {
    const car = await this.prisma.car.create({
      data: {
        tenantId: actor.tenantId,
        ...dto,
        nextServiceDue: dto.nextServiceDue ? new Date(dto.nextServiceDue) : undefined,
        lastServiceDate: dto.lastServiceDate ? new Date(dto.lastServiceDate) : undefined,
        insuranceExpiry: dto.insuranceExpiry ? new Date(dto.insuranceExpiry) : undefined,
        purchaseDate: dto.purchaseDate ? new Date(dto.purchaseDate) : undefined,
      },
    });

    await this.auditService.log({
      tenantId: actor.tenantId,
      userId: actor.sub,
      actionType: AuditActionType.CAR_CREATED,
      entityType: 'car',
      entityId: car.id,
      metadata: { registrationNumber: car.registrationNumber },
    });

    return car;
  }

  async bulkImport(actor: AuthenticatedUser, dto: BulkImportCarsDto) {
    const results: { success: number; failed: number; errors: { row: number; message: string }[] } = {
      success: 0,
      failed: 0,
      errors: [],
    };

    for (let i = 0; i < dto.cars.length; i++) {
      const carDto = dto.cars[i];
      try {
        await this.prisma.car.create({
          data: {
            tenantId: actor.tenantId,
            ...carDto,
            nextServiceDue: carDto.nextServiceDue ? new Date(carDto.nextServiceDue) : undefined,
            lastServiceDate: carDto.lastServiceDate ? new Date(carDto.lastServiceDate) : undefined,
            insuranceExpiry: carDto.insuranceExpiry ? new Date(carDto.insuranceExpiry) : undefined,
            purchaseDate: carDto.purchaseDate ? new Date(carDto.purchaseDate) : undefined,
          },
        });
        results.success++;
      } catch (err: unknown) {
        results.failed++;
        const message = err instanceof Error ? err.message : 'Unknown error';
        results.errors.push({ row: i + 2, message });
      }
    }

    if (results.success > 0) {
      await this.auditService.log({
        tenantId: actor.tenantId,
        userId: actor.sub,
        actionType: AuditActionType.CAR_CREATED,
        entityType: 'car',
        entityId: 'bulk',
        metadata: { importedCount: results.success },
      });
    }

    return results;
  }

  async update(actor: AuthenticatedUser, id: string, dto: UpdateCarDto) {
    await this.getById(actor.tenantId, id);

    const car = await this.prisma.car.update({
      where: { id },
      data: {
        ...dto,
        nextServiceDue: dto.nextServiceDue ? new Date(dto.nextServiceDue) : undefined,
        lastServiceDate: dto.lastServiceDate ? new Date(dto.lastServiceDate) : undefined,
        insuranceExpiry: dto.insuranceExpiry ? new Date(dto.insuranceExpiry) : undefined,
      },
    });

    await this.auditService.log({
      tenantId: actor.tenantId,
      userId: actor.sub,
      actionType: AuditActionType.CAR_UPDATED,
      entityType: 'car',
      entityId: car.id,
      metadata: dto as Record<string, unknown>,
    });

    return car;
  }

  /**
   * Check if a car is available for a given time period
   */
  async checkAvailability(tenantId: string, carId: string, dto: CheckAvailabilityDto) {
    const startAt = new Date(dto.startAt);
    const endAt = new Date(dto.endAt);

    // Check for conflicting bookings
    const conflictingBooking = await this.prisma.booking.findFirst({
      where: {
        tenantId,
        carId,
        id: dto.excludeBookingId ? { not: dto.excludeBookingId } : undefined,
        status: { in: [BookingStatus.PENDING, BookingStatus.CONFIRMED] },
        AND: [
          { startDate: { lt: endAt } },
          { endDate: { gt: startAt } },
        ],
      },
      include: {
        customer: { select: { firstName: true, lastName: true } },
      },
    });

    if (conflictingBooking) {
      return {
        available: false,
        reason: 'BOOKING_CONFLICT',
        conflict: {
          type: 'booking',
          id: conflictingBooking.id,
          startAt: conflictingBooking.startDate,
          endAt: conflictingBooking.endDate,
          customerName: `${conflictingBooking.customer.firstName} ${conflictingBooking.customer.lastName}`,
        },
      };
    }

    // Check for conflicting rentals
    const conflictingRental = await this.prisma.rental.findFirst({
      where: {
        tenantId,
        carId,
        id: dto.excludeRentalId ? { not: dto.excludeRentalId } : undefined,
        status: { in: [RentalStatus.ACTIVE, RentalStatus.OVERDUE] },
        AND: [
          { pickupAt: { lt: endAt } },
          {
            OR: [
              { actualReturnAt: { gt: startAt } },
              { actualReturnAt: null, expectedReturnAt: { gt: startAt } },
            ],
          },
        ],
      },
      include: {
        customer: { select: { firstName: true, lastName: true } },
      },
    });

    if (conflictingRental) {
      const rentalEndAt = conflictingRental.actualReturnAt || conflictingRental.expectedReturnAt;
      return {
        available: false,
        reason: 'RENTAL_CONFLICT',
        conflict: {
          type: 'rental',
          id: conflictingRental.id,
          startAt: conflictingRental.pickupAt,
          endAt: rentalEndAt,
          customerName: `${conflictingRental.customer.firstName} ${conflictingRental.customer.lastName}`,
          status: conflictingRental.status,
        },
      };
    }

    // Check for conflicting maintenance
    const conflictingMaintenance = await this.prisma.maintenanceJob.findFirst({
      where: {
        tenantId,
        carId,
        status: { in: [MaintenanceStatus.SCHEDULED, MaintenanceStatus.IN_PROGRESS] },
        AND: [
          { scheduledAt: { lt: endAt } },
          {
            OR: [
              { completedAt: { gt: startAt } },
              { completedAt: null },
            ],
          },
        ],
      },
    });

    if (conflictingMaintenance) {
      return {
        available: false,
        reason: 'MAINTENANCE_CONFLICT',
        conflict: {
          type: 'maintenance',
          id: conflictingMaintenance.id,
          startAt: conflictingMaintenance.scheduledAt,
          endAt: conflictingMaintenance.completedAt,
          description: conflictingMaintenance.description,
        },
      };
    }

    // Find next availability if requested period is not available
    const nextBooking = await this.prisma.booking.findFirst({
      where: {
        tenantId,
        carId,
        status: { in: [BookingStatus.PENDING, BookingStatus.CONFIRMED] },
        startDate: { gte: endAt },
      },
      orderBy: { startDate: 'asc' },
    });

    const nextRental = await this.prisma.rental.findFirst({
      where: {
        tenantId,
        carId,
        status: { in: [RentalStatus.ACTIVE, RentalStatus.OVERDUE] },
        pickupAt: { gte: endAt },
      },
      orderBy: { pickupAt: 'asc' },
    });

    let nextAvailableAfter = null;
    if (nextBooking || nextRental) {
      const nextBookingDate = nextBooking?.startDate;
      const nextRentalDate = nextRental?.pickupAt;
      
      if (nextBookingDate && nextRentalDate) {
        nextAvailableAfter = nextBookingDate < nextRentalDate ? nextBookingDate : nextRentalDate;
      } else {
        nextAvailableAfter = nextBookingDate || nextRentalDate;
      }
    }

    return {
      available: true,
      nextAvailableAfter,
    };
  }

  /**
   * Get calendar data for fleet view
   */
  async getFleetCalendar(tenantId: string, query: GetCalendarDto) {
    const startDate = new Date(query.startDate);
    const endDate = new Date(query.endDate);
    const skip = ((query.page || 1) - 1) * (query.pageSize || 50);

    // Get cars with their bookings, rentals, and maintenance in the date range
    const [cars, total] = await Promise.all([
      this.prisma.car.findMany({
        where: { tenantId },
        skip,
        take: query.pageSize,
        orderBy: { brand: 'asc' },
        include: {
          branch: { select: { name: true } },
          category: { select: { name: true, icon: true } },
          bookings: {
            where: {
              status: { in: [BookingStatus.PENDING, BookingStatus.CONFIRMED] },
              AND: [
                { startDate: { lt: endDate } },
                { endDate: { gt: startDate } },
              ],
            },
            include: {
              customer: { select: { firstName: true, lastName: true, phone: true } },
            },
            orderBy: { startDate: 'asc' },
          },
          rentals: {
            where: {
              status: { in: [RentalStatus.ACTIVE, RentalStatus.OVERDUE] },
              AND: [
                { pickupAt: { lt: endDate } },
                {
                  OR: [
                    { actualReturnAt: { gt: startDate } },
                    { actualReturnAt: null, expectedReturnAt: { gt: startDate } },
                  ],
                },
              ],
            },
            include: {
              customer: { select: { firstName: true, lastName: true, phone: true } },
              payments: { select: { amountCents: true, status: true } },
            },
            orderBy: { pickupAt: 'asc' },
          },
          maintenanceJobs: {
            where: {
              status: { in: [MaintenanceStatus.SCHEDULED, MaintenanceStatus.IN_PROGRESS] },
              AND: [
                { scheduledAt: { lt: endDate } },
                {
                  OR: [
                    { completedAt: { gt: startDate } },
                    { completedAt: null },
                  ],
                },
              ],
            },
            orderBy: { scheduledAt: 'asc' },
          },
        },
      }),
      this.prisma.car.count({ where: { tenantId } }),
    ]);

    return {
      cars,
      total,
      page: query.page || 1,
      pageSize: query.pageSize || 50,
    };
  }

  /**
   * Get calendar data for a single car
   */
  async getCarCalendar(tenantId: string, carId: string, startDate: string, endDate: string) {
    const car = await this.prisma.car.findFirst({
      where: { id: carId, tenantId },
      include: {
        branch: true,
        category: true,
        bookings: {
          where: {
            AND: [
              { startDate: { lt: new Date(endDate) } },
              { endDate: { gt: new Date(startDate) } },
            ],
          },
          include: {
            customer: { select: { firstName: true, lastName: true, phone: true, email: true } },
          },
          orderBy: { startDate: 'asc' },
        },
        rentals: {
          where: {
            AND: [
              { pickupAt: { lt: new Date(endDate) } },
              {
                OR: [
                  { actualReturnAt: { gt: new Date(startDate) } },
                  { actualReturnAt: null, expectedReturnAt: { gt: new Date(startDate) } },
                ],
              },
            ],
          },
          include: {
            customer: { select: { firstName: true, lastName: true, phone: true, email: true } },
            payments: true,
            invoice: true,
          },
          orderBy: { pickupAt: 'asc' },
        },
        maintenanceJobs: {
          where: {
            AND: [
              { scheduledAt: { lt: new Date(endDate) } },
              {
                OR: [
                  { completedAt: { gt: new Date(startDate) } },
                  { completedAt: null },
                ],
              },
            ],
          },
          orderBy: { scheduledAt: 'asc' },
        },
      },
    });

    if (!car) {
      throw new NotFoundException('Car not found');
    }

    return car;
  }
}
