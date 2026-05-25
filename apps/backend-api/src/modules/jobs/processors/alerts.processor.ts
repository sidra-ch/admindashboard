import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { PrismaService } from '../../../prisma/prisma.service';
import { NotificationsService } from '../../notifications/notifications.service';

@Processor('alerts')
export class AlertsProcessor extends WorkerHost {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {
    super();
  }

  async process(job: Job): Promise<any> {
    switch (job.name) {
      case 'check-overdue-rentals':
        return this.checkOverdueRentals();
      case 'check-return-due':
        return this.checkReturnDue();
      case 'check-maintenance-due':
        return this.checkMaintenanceDue();
      case 'check-document-expiry':
        return this.checkDocumentExpiry();
      default:
        return { success: false, message: 'Unknown job type' };
    }
  }

  private async checkOverdueRentals() {
    const now = new Date();
    const overdueRentals = await this.prisma.rental.findMany({
      where: {
        status: 'ACTIVE',
        expectedReturnAt: {
          lt: now,
        },
      },
      include: {
        customer: true,
        car: true,
      },
    });

    for (const rental of overdueRentals) {
      // Update rental status
      await this.prisma.rental.update({
        where: { id: rental.id },
        data: { status: 'OVERDUE' },
      });

      // Calculate late fee
      const daysLate = Math.ceil(
        (now.getTime() - rental.expectedReturnAt.getTime()) / (1000 * 60 * 60 * 24),
      );
      const lateFee = daysLate * 5000; // $50 per day in cents

      await this.prisma.rental.update({
        where: { id: rental.id },
        data: {
          lateFeeAmountCents: lateFee,
          balanceDueCents: rental.balanceDueCents + lateFee,
        },
      });

      // Create notification
      await this.notificationsService.createNotification({
        tenantId: rental.tenantId,
        type: 'RENTAL_OVERDUE',
        title: 'Rental Overdue',
        message: `Rental for ${rental.car.brand} ${rental.car.model} (${rental.car.registrationNumber}) is ${daysLate} day(s) overdue. Customer: ${rental.customer.firstName} ${rental.customer.lastName}`,
        entityType: 'rental',
        entityId: rental.id,
      });
    }

    return { processed: overdueRentals.length };
  }

  private async checkReturnDue() {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(23, 59, 59, 999);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const rentals = await this.prisma.rental.findMany({
      where: {
        status: 'ACTIVE',
        expectedReturnAt: {
          gte: today,
          lte: tomorrow,
        },
      },
      include: {
        customer: true,
        car: true,
      },
    });

    for (const rental of rentals) {
      await this.notificationsService.createNotification({
        tenantId: rental.tenantId,
        type: 'RENTAL_DUE',
        title: 'Rental Due Tomorrow',
        message: `${rental.car.brand} ${rental.car.model} (${rental.car.registrationNumber}) is due for return tomorrow. Customer: ${rental.customer.firstName} ${rental.customer.lastName}`,
        entityType: 'rental',
        entityId: rental.id,
      });
    }

    return { processed: rentals.length };
  }

  private async checkMaintenanceDue() {
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);

    const jobs = await this.prisma.maintenanceJob.findMany({
      where: {
        status: 'SCHEDULED',
        scheduledAt: {
          lte: nextWeek,
        },
      },
      include: {
        car: true,
      },
    });

    for (const job of jobs) {
      await this.notificationsService.createNotification({
        tenantId: job.tenantId,
        type: 'MAINTENANCE_DUE',
        title: 'Maintenance Due Soon',
        message: `${job.type} scheduled for ${job.car.brand} ${job.car.model} (${job.car.registrationNumber}) on ${job.scheduledAt.toLocaleDateString()}`,
        entityType: 'maintenance',
        entityId: job.id,
      });
    }

    return { processed: jobs.length };
  }

  private async checkDocumentExpiry() {
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    // Check insurance expiry
    const carsWithExpiringInsurance = await this.prisma.car.findMany({
      where: {
        insuranceExpiry: {
          lte: thirtyDaysFromNow,
          gte: new Date(),
        },
      },
    });

    for (const car of carsWithExpiringInsurance) {
      await this.notificationsService.createNotification({
        tenantId: car.tenantId,
        type: 'INSURANCE_EXPIRY',
        title: 'Insurance Expiring Soon',
        message: `Insurance for ${car.brand} ${car.model} (${car.registrationNumber}) expires on ${car.insuranceExpiry?.toLocaleDateString()}`,
        entityType: 'car',
        entityId: car.id,
      });
    }

    // Check document expiry
    const expiringDocuments = await this.prisma.document.findMany({
      where: {
        expiresAt: {
          lte: thirtyDaysFromNow,
          gte: new Date(),
        },
      },
    });

    for (const doc of expiringDocuments) {
      await this.notificationsService.createNotification({
        tenantId: doc.tenantId,
        type: doc.type === 'REGISTRATION' ? 'REGISTRATION_EXPIRY' : 'SYSTEM_ALERT',
        title: 'Document Expiring Soon',
        message: `${doc.type} document "${doc.name}" expires on ${doc.expiresAt?.toLocaleDateString()}`,
        entityType: doc.entityType,
        entityId: doc.entityId,
      });
    }

    return {
      insurance: carsWithExpiringInsurance.length,
      documents: expiringDocuments.length,
    };
  }
}
