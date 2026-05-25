import { Controller, Get, Post, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { PermissionCode } from '@fleetrent/shared-types';
import { DocumentsService } from './documents.service';
import { CreateDocumentDto } from './dto/create-document.dto';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.type';

@Controller('documents')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Get()
  @Permissions(PermissionCode.DOCUMENT_READ)
  list(
    @CurrentUser() user: AuthenticatedUser,
    @Query('entityType') entityType?: string,
    @Query('entityId') entityId?: string,
  ) {
    return this.documentsService.list(user.tenantId, entityType, entityId);
  }

  @Get('expiring')
  @Permissions(PermissionCode.DOCUMENT_READ)
  expiring(@CurrentUser() user: AuthenticatedUser, @Query('days') days?: string) {
    return this.documentsService.getExpiringSoon(user.tenantId, days ? parseInt(days, 10) : 30);
  }

  @Post()
  @Permissions(PermissionCode.DOCUMENT_WRITE)
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateDocumentDto) {
    return this.documentsService.create(user, dto);
  }

  @Delete(':id')
  @Permissions(PermissionCode.DOCUMENT_WRITE)
  remove(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.documentsService.delete(user, id);
  }
}
