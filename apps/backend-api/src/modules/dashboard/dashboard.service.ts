import { Injectable } from '@nestjs/common';
import { CarStatus, PaymentStatus, RentalStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getOverview(tenantId: string) {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfToday = new Date(now);
    endOfToday.setHours(23, 59, 59, 999);
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);

    const [
      totalCars,
      availableCars,
      rentedCars,
      carsInMaintenance,
      carsReturningToday,
      overdueRentals,
      pendingPayments,
      monthlyRevenue,
      activeRentals,
      latestPayments,
      expiringDocs,
      allCars,
      rentalTrendRows,
      paymentTrendRows,
    ] = await Promise.all([
      this.prisma.car.count({ where: { tenantId } }),
      this.prisma.car.count({ where: { tenantId, status: CarStatus.AVAILABLE } }),
      this.prisma.car.count({ where: { tenantId, status: CarStatus.RENTED } }),
      this.prisma.car.count({ where: { tenantId, status: CarStatus.MAINTENANCE } }),
      this.prisma.rental.count({
        where: {
          tenantId,
          status: { in: [RentalStatus.ACTIVE, RentalStatus.OVERDUE] },
          expectedReturnAt: { gte: startOfToday, lte: endOfToday },
        },
      }),
      this.prisma.rental.count({ where: { tenantId, status: RentalStatus.OVERDUE } }),
      this.prisma.payment.count({ where: { tenantId, status: { in: [PaymentStatus.PENDING, PaymentStatus.PARTIAL] } } }),
      this.prisma.payment.aggregate({
        where: { tenantId, status: PaymentStatus.PAID, paidAt: { gte: startOfMonth } },
        _sum: { amountCents: true },
      }),
      this.prisma.rental.findMany({
        where: { tenantId, status: { in: [RentalStatus.ACTIVE, RentalStatus.OVERDUE] } },
        orderBy: { expectedReturnAt: 'asc' },
        take: 5,
        include: {
          car: { select: { registrationNumber: true, model: true } },
          customer: { select: { firstName: true, lastName: true } },
          branch: { select: { name: true } },
        },
      }),
      this.prisma.payment.findMany({
        where: { tenantId },
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: {
          customer: { select: { firstName: true, lastName: true } },
          rental: { select: { id: true, status: true } },
        },
      }),
      this.prisma.car.findMany({
        where: {
          tenantId,
          insuranceExpiry: { not: null, lte: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000) },
        },
        orderBy: { insuranceExpiry: 'asc' },
        take: 5,
        select: {
          id: true,
          registrationNumber: true,
          model: true,
          insuranceExpiry: true,
        },
      }),
      this.prisma.car.findMany({ where: { tenantId }, select: { status: true } }),
      this.prisma.rental.findMany({
        where: { tenantId },
        orderBy: { pickupAt: 'asc' },
        select: { pickupAt: true },
      }),
      this.prisma.payment.findMany({
        where: { tenantId, paidAt: { not: null } },
        orderBy: { paidAt: 'asc' },
        select: { amountCents: true, paidAt: true },
      }),
    ]);

    const overdueList = await this.prisma.rental.findMany({
      where: { tenantId, status: RentalStatus.OVERDUE },
      orderBy: { expectedReturnAt: 'asc' },
      take: 5,
      include: {
        car: { select: { registrationNumber: true, model: true } },
        customer: { select: { firstName: true, lastName: true } },
      },
    });

    const statusCounts = allCars.reduce(
      (accumulator, car) => {
        accumulator[car.status] = (accumulator[car.status] ?? 0) + 1;
        return accumulator;
      },
      {} as Record<string, number>,
    );

    const months = Array.from({ length: 6 }, (_, index) => {
      const date = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1);
      const key = `${date.getFullYear()}-${date.getMonth()}`;
      return { label: date.toLocaleString('en-AU', { month: 'short' }), key };
    });

    const rentalsByMonth = rentalTrendRows.reduce(
      (accumulator, rental) => {
        const key = `${rental.pickupAt.getFullYear()}-${rental.pickupAt.getMonth()}`;
        accumulator[key] = (accumulator[key] ?? 0) + 1;
        return accumulator;
      },
      {} as Record<string, number>,
    );

    const revenueByMonth = paymentTrendRows.reduce(
      (accumulator, payment) => {
        if (!payment.paidAt) {
          return accumulator;
        }
        const key = `${payment.paidAt.getFullYear()}-${payment.paidAt.getMonth()}`;
        accumulator[key] = (accumulator[key] ?? 0) + payment.amountCents;
        return accumulator;
      },
      {} as Record<string, number>,
    );

    return {
      kpis: {
        totalCars,
        availableCars,
        rentedCars,
        carsInMaintenance,
        carsReturningToday,
        overdueRentals,
        pendingPayments,
        monthlyRevenueCents: monthlyRevenue._sum.amountCents ?? 0,
        maintenanceCostThisMonthCents: 0,
      },
      charts: {
        rentalsTrend: months.map((month) => ({ month: month.label, rentals: rentalsByMonth[month.key] ?? 0 })),
        revenueTrend: months.map((month) => ({ month: month.label, revenueCents: revenueByMonth[month.key] ?? 0 })),
        utilization: [
          { label: 'Available', value: statusCounts[CarStatus.AVAILABLE] ?? 0 },
          { label: 'Rented', value: statusCounts[CarStatus.RENTED] ?? 0 },
          { label: 'Maintenance', value: statusCounts[CarStatus.MAINTENANCE] ?? 0 },
          { label: 'Booked', value: statusCounts[CarStatus.BOOKED] ?? 0 },
        ],
      },
      tables: {
        activeRentals: activeRentals.map((rental) => ({
          id: rental.id,
          customerName: `${rental.customer.firstName} ${rental.customer.lastName}`,
          carName: rental.car.model,
          registrationNumber: rental.car.registrationNumber,
          branchName: rental.branch.name,
          expectedReturnAt: rental.expectedReturnAt,
          status: rental.status,
          balanceDueCents: rental.balanceDueCents,
        })),
        returningToday: activeRentals
          .filter((rental) => rental.expectedReturnAt >= startOfToday && rental.expectedReturnAt <= endOfToday)
          .map((rental) => ({
            id: rental.id,
            customerName: `${rental.customer.firstName} ${rental.customer.lastName}`,
            registrationNumber: rental.car.registrationNumber,
            expectedReturnAt: rental.expectedReturnAt,
          })),
        overdueList: overdueList.map((rental) => ({
          id: rental.id,
          customerName: `${rental.customer.firstName} ${rental.customer.lastName}`,
          carName: rental.car.model,
          registrationNumber: rental.car.registrationNumber,
          expectedReturnAt: rental.expectedReturnAt,
          lateFeeAmountCents: rental.lateFeeAmountCents,
        })),
        pendingMaintenance: allCars
          .filter((car) => car.status === CarStatus.MAINTENANCE)
          .slice(0, 5),
        latestPayments: latestPayments.map((payment) => ({
          id: payment.id,
          amountCents: payment.amountCents,
          status: payment.status,
          method: payment.method,
          customerName: payment.customer ? `${payment.customer.firstName} ${payment.customer.lastName}` : 'Walk-in',
          createdAt: payment.createdAt,
        })),
        documentExpiries: expiringDocs,
      },
    };
  }
}
