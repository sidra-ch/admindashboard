import { Module } from '@nestjs/common';
import { MailerModule } from '../mailer/mailer.module';
import { SchedulerService } from './scheduler.service';

@Module({
  imports: [MailerModule],
  providers: [SchedulerService],
})
export class SchedulerModule {}
