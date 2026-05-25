import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { RentalsController } from './rentals.controller';
import { RentalsService } from './rentals.service';

@Module({
  imports: [AuditModule],
  controllers: [RentalsController],
  providers: [RentalsService],
  exports: [RentalsService],
})
export class RentalsModule {}
