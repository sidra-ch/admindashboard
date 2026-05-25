import { Transform } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { CarStatus, TransmissionType, FuelType } from '@prisma/client';
import { PaginationQueryDto } from '../../../shared/dto/pagination-query.dto';

export class ListCarsQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @Transform(({ value }) => value || undefined)
  @IsEnum(CarStatus)
  status?: CarStatus;

  @IsOptional()
  @IsString()
  branchId?: string;

  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsOptional()
  @IsString()
  brand?: string;

  @IsOptional()
  @IsString()
  model?: string;

  @IsOptional()
  @Transform(({ value }) => (value ? parseInt(value, 10) : undefined))
  @IsInt()
  @Min(2000)
  year?: number;

  @IsOptional()
  @Transform(({ value }) => value || undefined)
  @IsEnum(TransmissionType)
  transmissionType?: TransmissionType;

  @IsOptional()
  @Transform(({ value }) => value || undefined)
  @IsEnum(FuelType)
  fuelType?: FuelType;

  @IsOptional()
  @Transform(({ value }) => (value ? parseInt(value, 10) : undefined))
  @IsInt()
  @Min(0)
  minPrice?: number;

  @IsOptional()
  @Transform(({ value }) => (value ? parseInt(value, 10) : undefined))
  @IsInt()
  @Min(0)
  maxPrice?: number;

  @IsOptional()
  @Transform(({ value }) => value === 'true')
  serviceDueSoon?: boolean;

  @IsOptional()
  @Transform(({ value }) => value === 'true')
  insuranceExpiringSoon?: boolean;

  @IsOptional()
  @IsString()
  sortBy?: 'price' | 'year' | 'odometer' | 'nextService';

  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc';
}
