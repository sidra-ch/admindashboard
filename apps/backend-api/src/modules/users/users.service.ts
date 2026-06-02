import { Injectable, NotFoundException } from '@nestjs/common';
import { PermissionCode, UserRoleCode } from '@fleetrent/shared-types';
import { hash } from '@node-rs/bcrypt';
import { AuditActionType } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async listForTenant(tenantId: string) {
    return this.prisma.user.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      include: {
        role: {
          select: { code: true, name: true },
        },
        branch: {
          select: { id: true, name: true, code: true },
        },
      },
    });
  }

  async createForTenant(actor: AuthenticatedUser, dto: CreateUserDto) {
    const role = await this.prisma.role.findUnique({ where: { code: dto.roleCode } });
    if (!role) {
      throw new NotFoundException('Role not found');
    }

    const user = await this.prisma.user.create({
      data: {
        tenantId: actor.tenantId,
        branchId: dto.branchId,
        roleId: role.id,
        firstName: dto.firstName,
        lastName: dto.lastName,
        email: dto.email,
        phone: dto.phone,
        passwordHash: await hash(dto.password, 12),
      },
      include: {
        role: {
          select: { code: true, name: true },
        },
      },
    });

    await this.auditService.log({
      tenantId: actor.tenantId,
      userId: actor.sub,
      actionType: AuditActionType.USER_CREATED,
      entityType: 'user',
      entityId: user.id,
      metadata: {
        email: user.email,
        role: user.role.code,
      },
    });

    return user;
  }

  async getRolePermissions(roleCode: UserRoleCode) {
    const role = await this.prisma.role.findUnique({
      where: { code: roleCode },
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
      },
    });

    if (!role) {
      return [];
    }

    return role.permissions.map((entry) => entry.permission.code as PermissionCode);
  }

  async listRoles() {
    return this.prisma.role.findMany({
      orderBy: { name: 'asc' },
      select: { id: true, code: true, name: true, description: true },
    });
  }
}
