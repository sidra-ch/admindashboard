import { IsEnum, IsOptional, IsString, IsUrl, MaxLength } from 'class-validator';
import { SubscriptionPlan } from '@prisma/client';

export class UpdateTenantDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  name?: string;

  @IsOptional()
  @IsEnum(SubscriptionPlan)
  subscriptionPlan?: SubscriptionPlan;

  @IsOptional()
  @IsUrl()
  logoUrl?: string;
}
