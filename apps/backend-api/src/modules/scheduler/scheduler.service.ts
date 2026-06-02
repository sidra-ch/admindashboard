import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { RentalStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { MailerService } from '../mailer/mailer.service';

@Injectable()
export class SchedulerService {
  private readonly logger = new Logger(SchedulerService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mailer: MailerService,
  ) {}

  /**
   * Runs daily at 9 AM — sends overdue reminders for all active overdue rentals.
   */
  @Cron(CronExpression.EVERY_DAY_AT_9AM)
  async sendOverdueReminders() {
    this.logger.log('Running overdue rental reminder job...');

    const now = new Date();
    const overdueRentals = await this.prisma.rental.findMany({
      where: {
        status: RentalStatus.OVERDUE,
        expectedReturnAt: { lt: now },
      },
      include: {
        customer: { select: { email: true, firstName: true, lastName: true } },
        car: { select: { brand: true, model: true, registrationNumber: true } },
        tenant: { select: { name: true } },
      },
    });

    this.logger.log(`Found ${overdueRentals.length} overdue rentals`);

    for (const rental of overdueRentals) {
      if (!rental.customer?.email) continue;

      const daysOverdue = Math.floor(
        (now.getTime() - rental.expectedReturnAt.getTime()) / (1000 * 60 * 60 * 24),
      );

      // Only send on day 1, 3, 7, and every 7 days after
      if (![1, 3, 7].includes(daysOverdue) && daysOverdue % 7 !== 0) continue;

      await this.mailer.sendOverdueReminder({
        toEmail: rental.customer.email,
        customerName: `${rental.customer.firstName} ${rental.customer.lastName}`,
        carName: `${rental.car.brand} ${rental.car.model}`,
        registrationNumber: rental.car.registrationNumber,
        expectedReturnAt: rental.expectedReturnAt,
        daysOverdue,
        balanceDueCents: rental.balanceDueCents,
        tenantName: rental.tenant.name,
      });
    }
  }

  /**
   * Runs daily at 8 AM — marks rentals as OVERDUE if past expected return date.
   */
  @Cron(CronExpression.EVERY_DAY_AT_8AM)
  async markOverdueRentals() {
    this.logger.log('Running mark-overdue job...');

    const result = await this.prisma.rental.updateMany({
      where: {
        status: RentalStatus.ACTIVE,
        expectedReturnAt: { lt: new Date() },
      },
      data: { status: RentalStatus.OVERDUE },
    });

    if (result.count > 0) {
      this.logger.log(`Marked ${result.count} rental(s) as OVERDUE`);
    }
  }
}
