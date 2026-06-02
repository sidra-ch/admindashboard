import { CarStatus, TransmissionType, FuelType, PlateState, CarCondition } from '@prisma/client';
import { Transform } from 'class-transformer';
import { IsBoolean, IsDateString, IsEnum, IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class CreateCarDto {
  @IsString()
  branchId!: string;

  @Transform(({ value }) => (value === '' || value === null ? undefined : value))
  @IsOptional()
  @IsString()
  categoryId?: string;

  // Basic Info
  @IsString()
  @MaxLength(100)
  brand!: string;

  @IsString()
  @MaxLength(100)
  model!: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  variant?: string;

  @IsInt()
  @Min(2000)
  year!: number;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  color?: string;

  @IsString()
  @MaxLength(30)
  registrationNumber!: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  vin?: string;

  @IsOptional()
  @IsEnum(PlateState)
  plateState?: PlateState;

  // Performance
  @IsOptional()
  @IsString()
  @MaxLength(20)
  engineSize?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  horsepower?: number;

  @IsOptional()
  @IsEnum(TransmissionType)
  transmissionType?: TransmissionType;

  @IsOptional()
  @IsEnum(FuelType)
  fuelType?: FuelType;

  @IsOptional()
  @IsInt()
  @Min(0)
  fuelTankCapacity?: number;

  // Capacity
  @IsOptional()
  @IsInt()
  @Min(1)
  seats?: number;

  @IsOptional()
  @IsInt()
  @Min(2)
  doors?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  bagsCapacity?: number;

  // Rental Specs
  @IsInt()
  @Min(0)
  dailyRateCents!: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  weeklyRateCents?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  monthlyRateCents?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  depositAmountCents?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  lateFeePerDayCents?: number;

  // Condition & Service
  @IsInt()
  @Min(0)
  odometerKm!: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  nextServiceKm?: number;

  @IsOptional()
  @IsDateString()
  nextServiceDue?: string;

  @IsOptional()
  @IsDateString()
  lastServiceDate?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  lastServiceKm?: number;

  @IsOptional()
  @IsDateString()
  insuranceExpiry?: string;

  @IsOptional()
  @IsEnum(CarCondition)
  condition?: CarCondition;

  @IsOptional()
  @IsInt()
  @Min(0)
  purchasePrice?: number;

  @IsOptional()
  @IsDateString()
  purchaseDate?: string;

  // Extra Features
  @IsOptional()
  @IsBoolean()
  trackerInstalled?: boolean;

  @IsOptional()
  @IsBoolean()
  reverseCamera?: boolean;

  @IsOptional()
  @IsBoolean()
  bluetooth?: boolean;

  @IsOptional()
  @IsBoolean()
  cruiseControl?: boolean;

  @IsOptional()
  @IsBoolean()
  sunroof?: boolean;

  @IsOptional()
  @IsBoolean()
  childSeatSupport?: boolean;

  @IsOptional()
  @IsBoolean()
  appleCarPlay?: boolean;

  @IsOptional()
  @IsBoolean()
  androidAuto?: boolean;

  // Status
  @IsOptional()
  @IsEnum(CarStatus)
  status?: CarStatus;
}
