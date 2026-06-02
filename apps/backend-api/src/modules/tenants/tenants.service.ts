import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateBranchDto } from './dto/create-branch.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';

@Injectable()
export class TenantsService {
  constructor(private readonly prisma: PrismaService) {}

  async getCurrentTenant(tenantId: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      include: {
        branches: {
          orderBy: { name: 'asc' },
          include: {
            _count: { select: { users: true, cars: true } },
          },
        },
      },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    return tenant;
  }

  async updateCurrentTenant(tenantId: string, dto: UpdateTenantDto) {
    return this.prisma.tenant.update({
      where: { id: tenantId },
      data: dto,
    });
  }

  async createBranch(tenantId: string, dto: CreateBranchDto) {
    const existing = await this.prisma.branch.findUnique({
      where: { tenantId_code: { tenantId, code: dto.code.toUpperCase() } },
    });
    if (existing) {
      throw new ConflictException(`Branch code "${dto.code}" already exists`);
    }
    return this.prisma.branch.create({
      data: {
        tenantId,
        name: dto.name,
        code: dto.code.toUpperCase(),
        address: dto.address,
        city: dto.city,
        state: dto.state,
      },
    });
  }

  async deleteBranch(tenantId: string, branchId: string) {
    const branch = await this.prisma.branch.findFirst({
      where: { id: branchId, tenantId },
      include: { _count: { select: { cars: true, rentals: true } } },
    });
    if (!branch) throw new NotFoundException('Branch not found');
    if (branch._count.cars > 0 || branch._count.rentals > 0) {
      throw new ConflictException('Cannot delete a branch with active cars or rentals');
    }
    await this.prisma.branch.delete({ where: { id: branchId } });
    return { deleted: true };
  }
}
