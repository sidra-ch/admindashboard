import { Injectable } from '@nestjs/common';
import { AuditActionType, MaintenanceStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { CreateMaintenanceJobDto } from './dto/create-maintenance-job.dto';
import { UpdateMaintenanceJobDto } from './dto/update-maintenance-job.dto';
import { ListMaintenanceQueryDto } from './dto/list-maintenance-query.dto';

@Injectable()
export class MaintenanceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async list(tenantId: string, query: ListMaintenanceQueryDto) {
    const where = {
      tenantId,
      ...(query.carId ? { carId: query.carId } : {}),
      ...(query.status ? { status: query.status } : {}),
      ...(query.type ? { type: query.type } : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.maintenanceJob.findMany({
        where,
        skip: query.skip,
        take: query.pageSize_n,
        orderBy: { scheduledAt: 'asc' },
        include: { car: { select: { id: true, brand: true, model: true, registrationNumber: true } } },
      }),
      this.prisma.maintenanceJob.count({ where }),
    ]);

    return { items, total, page: query.page_n, pageSize: query.pageSize_n };
  }

  async findOne(tenantId: string, id: string) {
    return this.prisma.maintenanceJob.findFirstOrThrow({
      where: { id, tenantId },
      include: { car: true },
    });
  }

  async create(actor: AuthenticatedUser, dto: CreateMaintenanceJobDto) {
    const job = await this.prisma.maintenanceJob.create({
      data: {
        tenantId: actor.tenantId,
        carId: dto.carId,
        type: dto.type,
        description: dto.description,
        odometerKm: dto.odometerKm,
        scheduledAt: new Date(dto.scheduledAt),
        costCents: dto.costCents ?? 0,
        vendor: dto.vendor,
        notes: dto.notes,
      },
      include: { car: true },
    });

    await this.auditService.log({
      tenantId: actor.tenantId,
      userId: actor.sub,
      actionType: AuditActionType.MAINTENANCE_CREATED,
      entityType: 'maintenanceJob',
      entityId: job.id,
      metadata: { carId: dto.carId, type: dto.type },
    });

    return job;
  }

  async update(actor: AuthenticatedUser, id: string, dto: UpdateMaintenanceJobDto) {
    const job = await this.prisma.maintenanceJob.updateMany({
      where: { id, tenantId: actor.tenantId },
      data: {
        ...(dto.status !== undefined ? { status: dto.status } : {}),
        ...(dto.description !== undefined ? { description: dto.description } : {}),
        ...(dto.odometerKm !== undefined ? { odometerKm: dto.odometerKm } : {}),
        ...(dto.scheduledAt !== undefined ? { scheduledAt: new Date(dto.scheduledAt) } : {}),
        ...(dto.completedAt !== undefined
          ? { completedAt: new Date(dto.completedAt), status: MaintenanceStatus.COMPLETED }
          : {}),
        ...(dto.costCents !== undefined ? { costCents: dto.costCents } : {}),
        ...(dto.vendor !== undefined ? { vendor: dto.vendor } : {}),
        ...(dto.notes !== undefined ? { notes: dto.notes } : {}),
      },
    });

    await this.auditService.log({
      tenantId: actor.tenantId,
      userId: actor.sub,
      actionType: AuditActionType.MAINTENANCE_UPDATED,
      entityType: 'maintenanceJob',
      entityId: id,
      metadata: dto as Record<string, unknown>,
    });

    return job;
  }

  async getScheduledCount(tenantId: string) {
    return this.prisma.maintenanceJob.count({
      where: { tenantId, status: MaintenanceStatus.SCHEDULED },
    });
  }
}
