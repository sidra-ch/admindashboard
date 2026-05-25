import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { PermissionCode } from '@fleetrent/shared-types';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { CreateUserDto } from './dto/create-user.dto';
import { UsersService } from './users.service';

@Controller('users')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Permissions(PermissionCode.USER_READ)
  async list(@CurrentUser() user: AuthenticatedUser) {
    return this.usersService.listForTenant(user.tenantId);
  }

  @Post()
  @Permissions(PermissionCode.USER_WRITE)
  async create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateUserDto) {
    return this.usersService.createForTenant(user, dto);
  }
}
