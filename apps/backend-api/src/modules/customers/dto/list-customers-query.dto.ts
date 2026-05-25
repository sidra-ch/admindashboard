import { Transform } from 'class-transformer';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { CustomerStatus } from '@prisma/client';
import { PaginationQueryDto } from '../../../shared/dto/pagination-query.dto';

export class ListCustomersQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @Transform(({ value }) => value || undefined)
  @IsEnum(CustomerStatus)
  status?: CustomerStatus;
}
