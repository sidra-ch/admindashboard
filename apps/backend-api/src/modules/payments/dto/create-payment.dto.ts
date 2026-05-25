import { PaymentMethod, PaymentStatus } from '@prisma/client';
import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class CreatePaymentDto {
  @IsOptional()
  @IsString()
  rentalId?: string;

  @IsOptional()
  @IsString()
  customerId?: string;

  @IsOptional()
  @IsString()
  invoiceId?: string;

  @IsInt()
  @Min(0)
  amountCents!: number;

  @IsEnum(PaymentMethod)
  method!: PaymentMethod;

  @IsOptional()
  @IsEnum(PaymentStatus)
  status?: PaymentStatus;

  @IsOptional()
  @IsString()
  reference?: string;
}
