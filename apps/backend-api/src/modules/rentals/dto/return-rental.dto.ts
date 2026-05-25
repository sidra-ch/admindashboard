import { IsDateString, IsInt, IsOptional, Min } from 'class-validator';

export class ReturnRentalDto {
  @IsOptional()
  @IsDateString()
  actualReturnAt?: string;

  @IsInt()
  @Min(0)
  endOdometerKm!: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  lateFeeAmountCents?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  damageChargeCents?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  fuelPenaltyCents?: number;
}
