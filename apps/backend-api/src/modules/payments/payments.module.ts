import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { PdfModule } from '../pdf/pdf.module';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';

@Module({
  imports: [AuditModule, PdfModule],
  controllers: [PaymentsController],
  providers: [PaymentsService],
  exports: [PaymentsService],
})
export class PaymentsModule {}
