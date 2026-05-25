import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { IsString, IsOptional, IsNumber, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { PermissionCode } from '@fleetrent/shared-types';
import { StorageService } from './storage.service';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.type';

class PresignedUploadDto {
  @IsString()
  entityType!: string;

  @IsString()
  entityId!: string;

  @IsString()
  filename!: string;

  @IsString()
  mimeType!: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(50)
  @Type(() => Number)
  maxSizeMb?: number;
}

@Controller('storage')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class StorageController {
  constructor(private readonly storageService: StorageService) {}

  @Post('presign')
  @Permissions(PermissionCode.DOCUMENT_WRITE)
  async presign(@CurrentUser() user: AuthenticatedUser, @Body() dto: PresignedUploadDto) {
    return this.storageService.getPresignedUpload({
      tenantId: user.tenantId,
      entityType: dto.entityType,
      entityId: dto.entityId,
      filename: dto.filename,
      mimeType: dto.mimeType,
      maxSizeMb: dto.maxSizeMb,
    });
  }
}
