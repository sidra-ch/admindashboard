import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { PermissionCode } from '@fleetrent/shared-types';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { ListCustomersQueryDto } from './dto/list-customers-query.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { CustomersService } from './customers.service';

@Controller('customers')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Get()
  @Permissions(PermissionCode.CUSTOMER_READ)
  async list(@CurrentUser() user: AuthenticatedUser, @Query() query: ListCustomersQueryDto) {
    return this.customersService.listForTenant(user.tenantId, query);
  }

  @Get(':id')
  @Permissions(PermissionCode.CUSTOMER_READ)
  async getById(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.customersService.getById(user.tenantId, id);
  }

  @Post()
  @Permissions(PermissionCode.CUSTOMER_WRITE)
  async create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateCustomerDto) {
    return this.customersService.create(user, dto);
  }

  @Patch(':id')
  @Permissions(PermissionCode.CUSTOMER_WRITE)
  async update(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @Body() dto: UpdateCustomerDto) {
    return this.customersService.update(user, id, dto);
  }
}
