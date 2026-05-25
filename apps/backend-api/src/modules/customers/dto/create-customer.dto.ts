import { CustomerRiskLevel, CustomerStatus } from '@prisma/client';
import { IsDateString, IsEmail, IsEnum, IsOptional, IsString } from 'class-validator';

export class CreateCustomerDto {
  @IsString()
  firstName!: string;

  @IsString()
  lastName!: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsString()
  phone!: string;

  @IsString()
  licenseNumber!: string;

  @IsOptional()
  @IsDateString()
  licenseExpiry?: string;

  @IsOptional()
  @IsEnum(CustomerRiskLevel)
  riskLevel?: CustomerRiskLevel;

  @IsOptional()
  @IsEnum(CustomerStatus)
  status?: CustomerStatus;
}
