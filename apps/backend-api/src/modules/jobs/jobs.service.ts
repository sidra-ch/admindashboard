import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class JobsService implements OnModuleInit {
  constructor(
    @InjectQueue('alerts') private alertsQueue: Queue,
    private prisma: PrismaService,
  ) {}

  async onModuleInit() {
    // Schedule recurring jobs
    await this.scheduleRecurringJobs();
  }

  private async scheduleRecurringJobs() {
    // Add repeatable jobs
    await this.alertsQueue.add(
      'check-overdue-rentals',
      {},
      {
        repeat: {
          pattern: '0 * * * *', // Every hour
        },
      },
    );

    await this.alertsQueue.add(
      'check-return-due',
      {},
      {
        repeat: {
          pattern: '0 8 * * *', // Daily at 8 AM
        },
      },
    );

    await this.alertsQueue.add(
      'check-maintenance-due',
      {},
      {
        repeat: {
          pattern: '0 9 * * *', // Daily at 9 AM
        },
      },
    );

    await this.alertsQueue.add(
      'check-document-expiry',
      {},
      {
        repeat: {
          pattern: '0 10 * * *', // Daily at 10 AM
        },
      },
    );
  }

  @Cron(CronExpression.EVERY_HOUR)
  async checkOverdueRentals() {
    await this.alertsQueue.add('check-overdue-rentals', {});
  }

  @Cron(CronExpression.EVERY_DAY_AT_8AM)
  async checkReturnDue() {
    await this.alertsQueue.add('check-return-due', {});
  }

  @Cron(CronExpression.EVERY_DAY_AT_9AM)
  async checkMaintenanceDue() {
    await this.alertsQueue.add('check-maintenance-due', {});
  }

  @Cron(CronExpression.EVERY_DAY_AT_10AM)
  async checkDocumentExpiry() {
    await this.alertsQueue.add('check-document-expiry', {});
  }
}
