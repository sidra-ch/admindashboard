import { Transform } from 'class-transformer';
import { IsEnum, IsOptional } from 'class-validator';
import { PaymentStatus } from '@prisma/client';
import { PaginationQueryDto } from '../../../shared/dto/pagination-query.dto';

export class ListPaymentsQueryDto extends PaginationQueryDto {
  @IsOptional()
  @Transform(({ value }) => value || undefined)
  @IsEnum(PaymentStatus)
  status?: PaymentStatus;
}
