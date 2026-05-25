import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { CarsController } from './cars.controller';
import { CarsService } from './cars.service';

@Module({
  imports: [AuditModule],
  controllers: [CarsController],
  providers: [CarsService],
  exports: [CarsService],
})
export class CarsModule {}
