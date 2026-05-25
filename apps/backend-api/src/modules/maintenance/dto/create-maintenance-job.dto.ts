import { IsEnum, IsOptional, IsString, IsInt, IsDateString, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { MaintenanceType, MaintenanceStatus } from '@prisma/client';

export class CreateMaintenanceJobDto {
  @IsString()
  carId!: string;

  @IsEnum(MaintenanceType)
  type!: MaintenanceType;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  odometerKm?: number;

  @IsDateString()
  scheduledAt!: string;

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
