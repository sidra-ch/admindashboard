import { Injectable, NotFoundException } from '@nestjs/common';
import { AuditActionType, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { ListCustomersQueryDto } from './dto/list-customers-query.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

@Injectable()
export class CustomersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async listForTenant(tenantId: string, query: ListCustomersQueryDto) {
    const skip = (query.page - 1) * query.pageSize;
    const where: Prisma.CustomerWhereInput = {
      tenantId,
      status: query.status,
      ...(query.search
        ? {
            OR: [
              { firstName: { contains: query.search, mode: 'insensitive' } },
              { lastName: { contains: query.search, mode: 'insensitive' } },
              { phone: { contains: query.search, mode: 'insensitive' } },
              { licenseNumber: { contains: query.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.customer.findMany({
        where,
        skip,
        take: query.pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          rentals: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            select: { id: true, status: true, balanceDueCents: true },
          },
        },
      }),
      this.prisma.customer.count({ where }),
    ]);

    return { items, total, page: query.page, pageSize: query.pageSize };
  }

  async getById(tenantId: string, id: string) {
    const customer = await this.prisma.customer.findFirst({
      where: { id, tenantId },
      include: {
        bookings: {
          orderBy: { startDate: 'desc' },
          include: { car: true },
          take: 10,
        },
        rentals: {
          orderBy: { pickupAt: 'desc' },
          include: {
            car: true,
            payments: true,
            invoice: true,
            extensions: true,
          },
          take: 10,
        },
      },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    return customer;
  }

  async create(actor: AuthenticatedUser, dto: CreateCustomerDto) {
    const customer = await this.prisma.customer.create({
      data: {
        tenantId: actor.tenantId,
        firstName: dto.firstName,
        lastName: dto.lastName,
        email: dto.email,
        phone: dto.phone,
        licenseNumber: dto.licenseNumber,
        licenseExpiry: dto.licenseExpiry ? new Date(dto.licenseExpiry) : undefined,
        riskLevel: dto.riskLevel,
        status: dto.status,
      },
    });

    await this.auditService.log({
      tenantId: actor.tenantId,
      userId: actor.sub,
      actionType: AuditActionType.CUSTOMER_CREATED,
      entityType: 'customer',
      entityId: customer.id,
      metadata: { licenseNumber: customer.licenseNumber },
    });

    return customer;
  }

  async update(actor: AuthenticatedUser, id: string, dto: UpdateCustomerDto) {
    await this.getById(actor.tenantId, id);

    const customer = await this.prisma.customer.update({
      where: { id },
      data: {
        ...dto,
        licenseExpiry: dto.licenseExpiry ? new Date(dto.licenseExpiry) : undefined,
      },
    });

    await this.auditService.log({
      tenantId: actor.tenantId,
      userId: actor.sub,
      actionType: AuditActionType.CUSTOMER_UPDATED,
      entityType: 'customer',
      entityId: customer.id,
      metadata: dto as Record<string, unknown>,
    });

    return customer;
  }
}
