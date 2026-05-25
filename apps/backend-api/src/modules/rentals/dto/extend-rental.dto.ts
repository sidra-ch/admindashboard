import { IsDateString, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class ExtendRentalDto {
  @IsDateString()
  newReturnAt!: string;

  @IsInt()
  @Min(0)
  additionalAmountCents!: number;

  @IsOptional()
  @IsString()
  notes?: string;
}
