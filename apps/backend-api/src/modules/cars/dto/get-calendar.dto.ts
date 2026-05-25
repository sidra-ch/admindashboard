import { Transform } from 'class-transformer';
import { IsDateString, IsInt, IsOptional, Min } from 'class-validator';

export class GetCalendarDto {
  @IsDateString()
  startDate!: string;

  @IsDateString()
  endDate!: string;

  @IsOptional()
  @Transform(({ value }) => (value ? parseInt(value, 10) : 1))
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Transform(({ value }) => (value ? parseInt(value, 10) : 50))
  @IsInt()
  @Min(1)
  pageSize?: number = 50;
}
