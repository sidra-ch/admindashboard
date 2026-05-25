import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { PermissionCode } from '@fleetrent/shared-types';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { TenantsService } from './tenants.service';

@Controller('tenants/me')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Get()
  @Permissions(PermissionCode.TENANT_READ)
  async getCurrentTenant(@CurrentUser() user: AuthenticatedUser) {
    return this.tenantsService.getCurrentTenant(user.tenantId);
  }

  @Patch()
  @Permissions(PermissionCode.TENANT_UPDATE)
  async updateCurrentTenant(@CurrentUser() user: AuthenticatedUser, @Body() dto: UpdateTenantDto) {
    return this.tenantsService.updateCurrentTenant(user.tenantId, dto);
  }
}
