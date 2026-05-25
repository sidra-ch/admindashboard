import { IsDateString, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class StartRentalDto {
  @IsString()
  branchId!: string;

  @IsString()
  carId!: string;

  @IsString()
  customerId!: string;

  @IsOptional()
  @IsString()
  bookingId?: string;

  @IsOptional()
  @IsDateString()
  pickupAt?: string;

  @IsDateString()
  expectedReturnAt!: string;

  @IsInt()
  @Min(0)
  startOdometerKm!: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  depositAmountCents?: number;
}
