import { Module } from '@nestjs/common';
import { MaintenanceService } from './maintenance.service';
import { MaintenanceController } from './maintenance.controller';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [AuditModule],
  providers: [MaintenanceService],
  controllers: [MaintenanceController],
  exports: [MaintenanceService],
})
export class MaintenanceModule {}
