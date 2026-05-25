import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { PermissionCode } from '@fleetrent/shared-types';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { ExtendRentalDto } from './dto/extend-rental.dto';
import { ListRentalsQueryDto } from './dto/list-rentals-query.dto';
import { ReturnRentalDto } from './dto/return-rental.dto';
import { StartRentalDto } from './dto/start-rental.dto';
import { RentalsService } from './rentals.service';

@Controller('rentals')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class RentalsController {
  constructor(private readonly rentalsService: RentalsService) {}

  @Get('active')
  @Permissions(PermissionCode.RENTAL_READ)
  async listActive(@CurrentUser() user: AuthenticatedUser, @Query() query: ListRentalsQueryDto) {
    return this.rentalsService.listActive(user.tenantId, query);
  }

  @Get('bookings')
  @Permissions(PermissionCode.RENTAL_READ)
  async listBookings(@CurrentUser() user: AuthenticatedUser, @Query() query: ListRentalsQueryDto) {
    return this.rentalsService.listBookings(user.tenantId, query);
  }

  @Get(':id')
  @Permissions(PermissionCode.RENTAL_READ)
  async getById(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.rentalsService.getById(user.tenantId, id);
  }

  @Post('start')
  @Permissions(PermissionCode.RENTAL_WRITE)
  async startRental(@CurrentUser() user: AuthenticatedUser, @Body() dto: StartRentalDto) {
    return this.rentalsService.startRental(user, dto);
  }

  @Post(':id/extend')
  @Permissions(PermissionCode.RENTAL_WRITE)
  async extendRental(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @Body() dto: ExtendRentalDto) {
    return this.rentalsService.extendRental(user, id, dto);
  }

  @Post(':id/return')
  @Permissions(PermissionCode.RENTAL_WRITE)
  async returnRental(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @Body() dto: ReturnRentalDto) {
    return this.rentalsService.returnRental(user, id, dto);
  }
}
