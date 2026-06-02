import { Module } from '@nestjs/common';
import { MailerService } from './mailer.service';
import { PdfModule } from '../pdf/pdf.module';

@Module({
  imports: [PdfModule],
  providers: [MailerService],
  exports: [MailerService],
})
export class MailerModule {}
