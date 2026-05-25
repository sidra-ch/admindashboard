import { IsNotEmpty, IsNumber, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateCarCategoryDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name!: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  icon?: string;

  @IsNumber()
  @IsOptional()
  basePriceAdjustment?: number;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  description?: string;
}
