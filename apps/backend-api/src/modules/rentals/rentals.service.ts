import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { AuditActionType, BookingStatus, CarStatus, InvoiceStatus, PaymentStatus, RentalStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { ExtendRentalDto } from './dto/extend-rental.dto';
import { ListRentalsQueryDto } from './dto/list-rentals-query.dto';
import { ReturnRentalDto } from './dto/return-rental.dto';
import { StartRentalDto } from './dto/start-rental.dto';

@Injectable()
export class RentalsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async listActive(tenantId: string, query: ListRentalsQueryDto) {
    const skip = (query.page - 1) * query.pageSize;
    const where = {
      tenantId,
      status: query.status ?? { in: [RentalStatus.ACTIVE, RentalStatus.OVERDUE] },
    };

    const [items, total] = await Promise.all([
      this.prisma.rental.findMany({
        where,
        skip,
        take: query.pageSize,
        orderBy: { expectedReturnAt: 'asc' },
        include: {
          car: true,
          customer: true,
          branch: true,
          invoice: true,
          payments: true,
          extensions: true,
        },
      }),
      this.prisma.rental.count({ where }),
    ]);

    return { items, total, page: query.page, pageSize: query.pageSize };
  }

  async listBookings(tenantId: string, query: ListRentalsQueryDto) {
    const skip = (query.page - 1) * query.pageSize;
    const [items, total] = await Promise.all([
      this.prisma.booking.findMany({
        where: { tenantId },
        skip,
        take: query.pageSize,
        orderBy: { startDate: 'asc' },
        include: {
          car: true,
          customer: true,
          branch: true,
          rental: true,
        },
      }),
      this.prisma.booking.count({ where: { tenantId } }),
    ]);

    return { items, total, page: query.page, pageSize: query.pageSize };
  }

  async getById(tenantId: string, id: string) {
    const rental = await this.prisma.rental.findFirst({
      where: { id, tenantId },
      include: {
        branch: true,
        car: true,
        customer: true,
        booking: true,
        invoice: true,
        payments: { orderBy: { createdAt: 'desc' } },
        extensions: { orderBy: { createdAt: 'desc' } },
      },
    });

    if (!rental) {
      throw new NotFoundException('Rental not found');
    }

    return rental;
  }

  async startRental(actor: AuthenticatedUser, dto: StartRentalDto) {
    const pickupAt = dto.pickupAt ? new Date(dto.pickupAt) : new Date();
    const expectedReturnAt = new Date(dto.expectedReturnAt);
    if (expectedReturnAt <= pickupAt) {
      throw new BadRequestException('Expected return must be after pickup');
    }

    const car = await this.prisma.car.findFirst({ where: { id: dto.carId, tenantId: actor.tenantId } });
    const customer = await this.prisma.customer.findFirst({ where: { id: dto.customerId, tenantId: actor.tenantId } });
    if (!car || !customer) {
      throw new NotFoundException('Car or customer not found');
    }
    if (car.status !== CarStatus.AVAILABLE && car.status !== CarStatus.BOOKED) {
      throw new BadRequestException('Car is not available for rental');
    }

    const durationMs = expectedReturnAt.getTime() - pickupAt.getTime();
    const dayCount = Math.max(1, Math.ceil(durationMs / (24 * 60 * 60 * 1000)));
    const totalAmountCents = dayCount * car.dailyRateCents;
    const invoiceNumber = await this.nextInvoiceNumber(actor.tenantId);

    const rental = await this.prisma.$transaction(async (tx) => {
      const createdRental = await tx.rental.create({
        data: {
          tenantId: actor.tenantId,
          branchId: dto.branchId,
          bookingId: dto.bookingId,
          carId: dto.carId,
          customerId: dto.customerId,
          pickupAt,
          expectedReturnAt,
          startOdometerKm: dto.startOdometerKm,
          totalAmountCents,
          balanceDueCents: totalAmountCents,
          depositAmountCents: dto.depositAmountCents ?? 0,
        },
      });

      await tx.invoice.create({
        data: {
          tenantId: actor.tenantId,
          rentalId: createdRental.id,
          invoiceNumber,
          subtotalCents: totalAmountCents,
          totalCents: totalAmountCents,
          status: InvoiceStatus.ISSUED,
          dueAt: expectedReturnAt,
        },
      });

      if (dto.bookingId) {
        await tx.booking.update({ where: { id: dto.bookingId }, data: { status: BookingStatus.CONVERTED } });
      }

      await tx.car.update({ where: { id: dto.carId }, data: { status: CarStatus.RENTED, odometerKm: dto.startOdometerKm } });
      return createdRental;
    });

    await this.auditService.log({
      tenantId: actor.tenantId,
      userId: actor.sub,
      actionType: AuditActionType.RENTAL_CREATED,
      entityType: 'rental',
      entityId: rental.id,
      metadata: { carId: dto.carId, customerId: dto.customerId },
    });

    return this.getById(actor.tenantId, rental.id);
  }

  async extendRental(actor: AuthenticatedUser, id: string, dto: ExtendRentalDto) {
    const rental = await this.getById(actor.tenantId, id);
    const newReturnAt = new Date(dto.newReturnAt);
    if (newReturnAt <= rental.expectedReturnAt) {
      throw new BadRequestException('New return time must be later than the current return time');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.rentalExtension.create({
        data: {
          tenantId: actor.tenantId,
          rentalId: id,
          newReturnAt,
          additionalAmountCents: dto.additionalAmountCents,
          notes: dto.notes,
        },
      });

      await tx.rental.update({
        where: { id },
        data: {
          expectedReturnAt: newReturnAt,
          totalAmountCents: rental.totalAmountCents + dto.additionalAmountCents,
          balanceDueCents: rental.balanceDueCents + dto.additionalAmountCents,
          status: RentalStatus.ACTIVE,
        },
      });

      if (rental.invoice) {
        await tx.invoice.update({
          where: { id: rental.invoice.id },
          data: {
            subtotalCents: rental.invoice.subtotalCents + dto.additionalAmountCents,
            totalCents: rental.invoice.totalCents + dto.additionalAmountCents,
            dueAt: newReturnAt,
          },
        });
      }
    });

    await this.auditService.log({
      tenantId: actor.tenantId,
      userId: actor.sub,
      actionType: AuditActionType.RENTAL_EXTENDED,
      entityType: 'rental',
      entityId: id,
      metadata: { additionalAmountCents: dto.additionalAmountCents },
    });

    return this.getById(actor.tenantId, id);
  }

  async returnRental(actor: AuthenticatedUser, id: string, dto: ReturnRentalDto) {
    const rental = await this.getById(actor.tenantId, id);
    const actualReturnAt = dto.actualReturnAt ? new Date(dto.actualReturnAt) : new Date();
    const additionalCharges = (dto.lateFeeAmountCents ?? 0) + (dto.damageChargeCents ?? 0) + (dto.fuelPenaltyCents ?? 0);
    const updatedBalance = rental.balanceDueCents + additionalCharges;

    await this.prisma.$transaction(async (tx) => {
      await tx.rental.update({
        where: { id },
        data: {
          actualReturnAt,
          endOdometerKm: dto.endOdometerKm,
          lateFeeAmountCents: dto.lateFeeAmountCents ?? 0,
          damageChargeCents: dto.damageChargeCents ?? 0,
          fuelPenaltyCents: dto.fuelPenaltyCents ?? 0,
          balanceDueCents: updatedBalance,
          status: RentalStatus.COMPLETED,
        },
      });

      await tx.car.update({
        where: { id: rental.carId },
        data: { status: CarStatus.AVAILABLE, odometerKm: dto.endOdometerKm },
      });

      if (rental.invoice) {
        await tx.invoice.update({
          where: { id: rental.invoice.id },
          data: {
            subtotalCents: rental.invoice.subtotalCents + additionalCharges,
            totalCents: rental.invoice.totalCents + additionalCharges,
            status: updatedBalance > 0 ? InvoiceStatus.ISSUED : InvoiceStatus.PAID,
          },
        });
      }
    });

    await this.auditService.log({
      tenantId: actor.tenantId,
      userId: actor.sub,
      actionType: AuditActionType.RENTAL_RETURNED,
      entityType: 'rental',
      entityId: id,
      metadata: { endOdometerKm: dto.endOdometerKm },
    });

    return this.getById(actor.tenantId, id);
  }

  private async nextInvoiceNumber(tenantId: string) {
    const invoiceCount = await this.prisma.invoice.count({ where: { tenantId } });
    return `INV-${new Date().getFullYear()}-${String(invoiceCount + 1001).padStart(4, '0')}`;
  }
}
