import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { JobsService } from './jobs.service';
import { AlertsProcessor } from './processors/alerts.processor';
import { PrismaModule } from '../../prisma/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'alerts',
    }),
    PrismaModule,
    NotificationsModule,
  ],
  providers: [JobsService, AlertsProcessor],
  exports: [JobsService],
})
export class JobsModule {}
