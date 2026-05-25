import { IsEnum, IsOptional, IsNumberString } from 'class-validator';
import { MaintenanceStatus, MaintenanceType } from '@prisma/client';

export class ListMaintenanceQueryDto {
  @IsOptional()
  @IsNumberString()
  page?: string;

  @IsOptional()
  @IsNumberString()
  pageSize?: string;

  @IsOptional()
  carId?: string;

  @IsOptional()
  @IsEnum(MaintenanceStatus)
  status?: MaintenanceStatus;

  @IsOptional()
  @IsEnum(MaintenanceType)
  type?: MaintenanceType;

  get page_n() { return Math.max(1, parseInt(this.page ?? '1', 10)); }
  get pageSize_n() { return Math.min(100, parseInt(this.pageSize ?? '20', 10)); }
  get skip() { return (this.page_n - 1) * this.pageSize_n; }
}
