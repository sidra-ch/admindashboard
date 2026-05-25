import { Controller, Get, UseGuards } from '@nestjs/common';
import { PermissionCode } from '@fleetrent/shared-types';
import { AuditService } from './audit.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.type';

@Controller('audit-logs')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  @Permissions(PermissionCode.AUDIT_READ)
  async getAuditLogs(@CurrentUser() user: AuthenticatedUser) {
    return this.auditService.listForTenant(user.tenantId);
  }
}
