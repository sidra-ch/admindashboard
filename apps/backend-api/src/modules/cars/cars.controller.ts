import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { PermissionCode } from '@fleetrent/shared-types';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { TenantId } from '../auth/decorators/tenant-id.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { CarsService } from './cars.service';
import { CreateCarDto } from './dto/create-car.dto';
import { ListCarsQueryDto } from './dto/list-cars-query.dto';
import { UpdateCarDto } from './dto/update-car.dto';
import { CheckAvailabilityDto } from './dto/check-availability.dto';
import { GetCalendarDto } from './dto/get-calendar.dto';

@Controller('cars')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class CarsController {
  constructor(private readonly carsService: CarsService) {}

  @Get()
  @Permissions(PermissionCode.CAR_READ)
  async list(@CurrentUser() user: AuthenticatedUser, @Query() query: ListCarsQueryDto) {
    return this.carsService.listForTenant(user.tenantId, query);
  }

  @Get(':id')
  @Permissions(PermissionCode.CAR_READ)
  async getById(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.carsService.getById(user.tenantId, id);
  }

  @Post()
  @Permissions(PermissionCode.CAR_WRITE)
  async create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateCarDto) {
    return this.carsService.create(user, dto);
  }

  @Patch(':id')
  @Permissions(PermissionCode.CAR_WRITE)
  async update(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @Body() dto: UpdateCarDto) {
    return this.carsService.update(user, id, dto);
  }

  @Post(':id/check-availability')
  @Permissions(PermissionCode.CAR_READ)
  async checkAvailability(
    @TenantId() tenantId: string,
    @Param('id') carId: string,
    @Body() dto: CheckAvailabilityDto,
  ) {
    return this.carsService.checkAvailability(tenantId, carId, dto);
  }

  @Get('calendar/fleet')
  @Permissions(PermissionCode.CAR_READ)
  async getFleetCalendar(@TenantId() tenantId: string, @Query() query: GetCalendarDto) {
    return this.carsService.getFleetCalendar(tenantId, query);
  }

  @Get(':id/calendar')
  @Permissions(PermissionCode.CAR_READ)
  async getCarCalendar(
    @TenantId() tenantId: string,
    @Param('id') carId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.carsService.getCarCalendar(tenantId, carId, startDate, endDate);
  }
}
