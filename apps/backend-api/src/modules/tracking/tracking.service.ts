import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { TrackingGateway } from './tracking.gateway';

@Injectable()
export class TrackingService {
  constructor(
    private prisma: PrismaService,
    private trackingGateway: TrackingGateway,
  ) {}

  async pushLocation(data: {
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
  }) {
    const device = await this.prisma.gpsDevice.findUnique({
      where: { imei: data.imei },
      include: { car: true },
    });

    if (!device) {
      throw new NotFoundException(`GPS device with IMEI ${data.imei} not found`);
    }

    if (!device.isActive) {
      throw new BadRequestException(`GPS device ${data.imei} is not active`);
    }

    const recordedAt = new Date(data.recordedAt);

    await this.prisma.$executeRaw(Prisma.sql`
      INSERT INTO "GpsTrackingLog" (id, "tenantId", "deviceId", location, lat, lng,
        "speedKmh", heading, altitude, "ignitionOn", "batteryVoltage", "fuelLevelPercent", "recordedAt", "createdAt")
      VALUES (
        gen_random_uuid()::text, ${device.tenantId}, ${device.id},
        ST_SetSRID(ST_MakePoint(${data.lng}, ${data.lat}), 4326),
        ${data.lat}, ${data.lng},
        ${data.speedKmh ?? null}, ${data.heading ?? null}, ${data.altitude ?? null},
        ${data.ignitionOn ?? false}, ${data.batteryVoltage ?? null}, ${data.fuelLevelPercent ?? null},
        ${recordedAt}, NOW()
      )
    `);

    await this.prisma.$executeRaw(Prisma.sql`
      INSERT INTO "GpsLiveStatus" (id, "tenantId", "deviceId", location, lat, lng,
        "speedKmh", heading, altitude, "ignitionOn", "batteryVoltage", "fuelLevelPercent", "recordedAt", "updatedAt")
      VALUES (
        gen_random_uuid()::text, ${device.tenantId}, ${device.id},
        ST_SetSRID(ST_MakePoint(${data.lng}, ${data.lat}), 4326),
        ${data.lat}, ${data.lng},
        ${data.speedKmh ?? null}, ${data.heading ?? null}, ${data.altitude ?? null},
        ${data.ignitionOn ?? false}, ${data.batteryVoltage ?? null}, ${data.fuelLevelPercent ?? null},
        ${recordedAt}, NOW()
      )
      ON CONFLICT ("deviceId") DO UPDATE SET
        location = ST_SetSRID(ST_MakePoint(${data.lng}, ${data.lat}), 4326),
        lat = ${data.lat}, lng = ${data.lng},
        "speedKmh" = ${data.speedKmh ?? null}, heading = ${data.heading ?? null},
        altitude = ${data.altitude ?? null}, "ignitionOn" = ${data.ignitionOn ?? false},
        "batteryVoltage" = ${data.batteryVoltage ?? null},
        "fuelLevelPercent" = ${data.fuelLevelPercent ?? null},
        "recordedAt" = ${recordedAt}, "updatedAt" = NOW()
    `);

    await this.prisma.gpsDevice.update({
      where: { id: device.id },
      data: { lastPingAt: new Date() },
    });

    this.trackingGateway.emitLocationUpdate(device.tenantId, {
      carId: device.carId,
      lat: data.lat,
      lng: data.lng,
      speedKmh: data.speedKmh,
      heading: data.heading,
      ignitionOn: data.ignitionOn ?? false,
      recordedAt: recordedAt.toISOString(),
    });

    await this.checkGeofences(device, data.lat, data.lng, recordedAt);

    return { success: true };
  }

  async getLiveLocations(tenantId: string) {
    const liveStatuses = await this.prisma.gpsLiveStatus.findMany({
      where: { tenantId },
      include: {
        device: {
          include: {
            car: {
              include: {
                rentals: {
                  where: { status: 'ACTIVE' },
                  take: 1,
                  include: { customer: true },
                },
              },
            },
          },
        },
      },
    });

    return liveStatuses.map((status) => ({
      carId: status.device.carId,
      car: {
        id: status.device.car.id,
        registrationNumber: status.device.car.registrationNumber,
        make: status.device.car.brand,
        model: status.device.car.model,
        status: status.device.car.status,
      },
      lat: status.lat,
      lng: status.lng,
      speedKmh: status.speedKmh,
      heading: status.heading,
      ignitionOn: status.ignitionOn,
      batteryVoltage: status.batteryVoltage,
      fuelLevelPercent: status.fuelLevelPercent,
      recordedAt: status.recordedAt.toISOString(),
      rental: status.device.car.rentals[0]
        ? {
            id: status.device.car.rentals[0].id,
            customer: {
              firstName: status.device.car.rentals[0].customer.firstName,
              lastName: status.device.car.rentals[0].customer.lastName,
            },
            expectedReturnAt: status.device.car.rentals[0].expectedReturnAt.toISOString(),
          }
        : null,
    }));
  }

  async getRouteHistory(tenantId: string, carId: string, startDate: string, endDate: string) {
    const car = await this.prisma.car.findFirst({
      where: { id: carId, tenantId },
      include: { gpsDevice: true },
    });

    if (!car || !car.gpsDevice) {
      throw new NotFoundException('Car or GPS device not found');
    }

    const logs = await this.prisma.gpsTrackingLog.findMany({
      where: {
        deviceId: car.gpsDevice.id,
        recordedAt: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
      },
      orderBy: { recordedAt: 'asc' },
    });

    return logs.map((log) => ({
      lat: log.lat,
      lng: log.lng,
      speedKmh: log.speedKmh,
      heading: log.heading,
      ignitionOn: log.ignitionOn,
      recordedAt: log.recordedAt.toISOString(),
    }));
  }

  async createGeofence(
    tenantId: string,
    data: {
      name: string;
      description?: string;
      centerLat: number;
      centerLng: number;
      radiusM: number;
    },
  ) {
    const result = await this.prisma.$queryRaw<{ id: string }[]>(Prisma.sql`
      INSERT INTO "Geofence" (id, "tenantId", name, description, center, "centerLat", "centerLng", "radiusM", "isActive", "createdAt", "updatedAt")
      VALUES (
        gen_random_uuid()::text, ${tenantId}, ${data.name}, ${data.description ?? null},
        ST_SetSRID(ST_MakePoint(${data.centerLng}, ${data.centerLat}), 4326),
        ${data.centerLat}, ${data.centerLng}, ${data.radiusM}, true, NOW(), NOW()
      )
      RETURNING id, "tenantId", name, description, "centerLat", "centerLng", "radiusM", "isActive", "createdAt", "updatedAt"
    `);
    return result[0];
  }

  async getGeofences(tenantId: string) {
    return this.prisma.geofence.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getGeofenceEvents(tenantId: string, geofenceId?: string) {
    return this.prisma.geofenceEvent.findMany({
      where: {
        tenantId,
        ...(geofenceId && { geofenceId }),
      },
      include: {
        geofence: true,
      },
      orderBy: { occurredAt: 'desc' },
      take: 100,
    });
  }

  private async checkGeofences(device: any, lat: number, lng: number, occurredAt: Date) {
    const geofences = await this.prisma.geofence.findMany({
      where: { tenantId: device.tenantId, isActive: true },
    });

    for (const geofence of geofences) {
      const distance = this.calculateDistance(lat, lng, geofence.centerLat, geofence.centerLng);
      const isInside = distance <= geofence.radiusM;

      const lastEvent = await this.prisma.geofenceEvent.findFirst({
        where: { geofenceId: geofence.id, deviceId: device.id },
        orderBy: { occurredAt: 'desc' },
      });

      const wasInside = lastEvent?.eventType === 'ENTER';

      if (isInside && !wasInside) {
        await this.prisma.geofenceEvent.create({
          data: {
            tenantId: device.tenantId,
            geofenceId: geofence.id,
            deviceId: device.id,
            carId: device.carId,
            eventType: 'ENTER',
            lat,
            lng,
            occurredAt,
          },
        });

        await this.prisma.notification.create({
          data: {
            tenantId: device.tenantId,
            type: 'GEOFENCE_ALERT',
            title: 'Geofence Alert',
            message: `Vehicle entered geofence: ${geofence.name}`,
            entityType: 'car',
            entityId: device.carId,
          },
        });
      } else if (!isInside && wasInside) {
        await this.prisma.geofenceEvent.create({
          data: {
            tenantId: device.tenantId,
            geofenceId: geofence.id,
            deviceId: device.id,
            carId: device.carId,
            eventType: 'EXIT',
            lat,
            lng,
            occurredAt,
          },
        });

        await this.prisma.notification.create({
          data: {
            tenantId: device.tenantId,
            type: 'GEOFENCE_ALERT',
            title: 'Geofence Alert',
            message: `Vehicle exited geofence: ${geofence.name}`,
            entityType: 'car',
            entityId: device.carId,
          },
        });
      }
    }
  }

  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371000;
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lng2 - lng1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }
}
