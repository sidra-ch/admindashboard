import { Controller, Post, Get, Body, Query, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TrackingService } from './tracking.service';

@Controller('tracking')
@UseGuards(JwtAuthGuard)
export class TrackingController {
  constructor(private trackingService: TrackingService) {}

  @Post('push')
  async pushLocation(
    @Body()
    body: {
      imei: string;
      lat: number;
      lng: number;
      speedKmh?: number;
      heading?: number;
      altitude?: number;
      ignitionOn?: boolean;
      batteryVoltage?: number;
      fuelLevelPercent?: number;
      recordedAt: string;
    },
  ) {
    return this.trackingService.pushLocation(body);
  }

  @Get('live')
  async getLiveLocations(@Query('tenantId') tenantId: string) {
    return this.trackingService.getLiveLocations(tenantId);
  }

  @Get('history/:carId')
  async getRouteHistory(
    @Param('carId') carId: string,
    @Query('tenantId') tenantId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.trackingService.getRouteHistory(tenantId, carId, startDate, endDate);
  }

  @Post('geofences')
  async createGeofence(
    @Body()
    body: {
      tenantId: string;
      name: string;
      description?: string;
      centerLat: number;
      centerLng: number;
      radiusM: number;
    },
  ) {
    return this.trackingService.createGeofence(body.tenantId, body);
  }

  @Get('geofences')
  async getGeofences(@Query('tenantId') tenantId: string) {
    return this.trackingService.getGeofences(tenantId);
  }

  @Get('geofence-events')
  async getGeofenceEvents(
    @Query('tenantId') tenantId: string,
    @Query('geofenceId') geofenceId?: string,
  ) {
    return this.trackingService.getGeofenceEvents(tenantId, geofenceId);
  }
}
