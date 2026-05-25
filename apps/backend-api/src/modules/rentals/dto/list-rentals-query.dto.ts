import { Transform } from 'class-transformer';
import { IsEnum, IsOptional } from 'class-validator';
import { RentalStatus } from '@prisma/client';
import { PaginationQueryDto } from '../../../shared/dto/pagination-query.dto';

export class ListRentalsQueryDto extends PaginationQueryDto {
  @IsOptional()
  @Transform(({ value }) => value || undefined)
  @IsEnum(RentalStatus)
  status?: RentalStatus;
}
