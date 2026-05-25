import { UserRoleCode } from '@fleetrent/shared-types';
import { IsEmail, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateUserDto {
  @IsString()
  firstName!: string;

  @IsString()
  lastName!: string;

  @IsEmail()
  email!: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  branchId?: string;

  @IsEnum(UserRoleCode)
  roleCode!: UserRoleCode;

  @IsString()
  @MinLength(10)
  password!: string;
}
