import { IsDateString, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CheckAvailabilityDto {
  @IsDateString()
  @IsNotEmpty()
  startAt!: string;

  @IsDateString()
  @IsNotEmpty()
  endAt!: string;

  @IsOptional()
  @IsString()
  excludeBookingId?: string;

  @IsOptional()
  @IsString()
  excludeRentalId?: string;
}
