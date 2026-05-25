import { Controller, Get, Post, Patch, Param, Body, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { PermissionCode } from '@fleetrent/shared-types';
import { MaintenanceService } from './maintenance.service';
import { CreateMaintenanceJobDto } from './dto/create-maintenance-job.dto';
import { UpdateMaintenanceJobDto } from './dto/update-maintenance-job.dto';
import { ListMaintenanceQueryDto } from './dto/list-maintenance-query.dto';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.type';

@Controller('maintenance')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class MaintenanceController {
  constructor(private readonly maintenanceService: MaintenanceService) {}

  @Get()
  @Permissions(PermissionCode.MAINTENANCE_READ)
  list(@CurrentUser() user: AuthenticatedUser, @Query() query: ListMaintenanceQueryDto) {
    return this.maintenanceService.list(user.tenantId, query);
  }

  @Get(':id')
  @Permissions(PermissionCode.MAINTENANCE_READ)
  findOne(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.maintenanceService.findOne(user.tenantId, id);
  }

  @Post()
  @Permissions(PermissionCode.MAINTENANCE_WRITE)
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateMaintenanceJobDto) {
    return this.maintenanceService.create(user, dto);
  }

  @Patch(':id')
  @Permissions(PermissionCode.MAINTENANCE_WRITE)
  update(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @Body() dto: UpdateMaintenanceJobDto) {
    return this.maintenanceService.update(user, id, dto);
  }
}
