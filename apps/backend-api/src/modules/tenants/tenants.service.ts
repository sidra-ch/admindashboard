import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
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
}
