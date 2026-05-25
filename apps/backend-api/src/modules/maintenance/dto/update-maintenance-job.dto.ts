import { IsEnum, IsOptional, IsString, IsInt, IsDateString, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { MaintenanceStatus } from '@prisma/client';

export class UpdateMaintenanceJobDto {
  @IsOptional()
  @IsEnum(MaintenanceStatus)
  status?: MaintenanceStatus;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  odometerKm?: number;

  @IsOptional()
  @IsDateString()
  scheduledAt?: string;

  @IsOptional()
  @IsDateString()
  completedAt?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  costCents?: number;

  @IsOptional()
  @IsString()
  vendor?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
