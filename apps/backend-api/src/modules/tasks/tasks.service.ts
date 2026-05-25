import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class TasksService {
  constructor(private prisma: PrismaService) {}

  async getTasks(tenantId: string, assignedToId?: string, status?: string) {
    return this.prisma.staffTask.findMany({
      where: {
        tenantId,
        ...(assignedToId && { assignedToId }),
        ...(status && { status: status as any }),
      },
      orderBy: [{ priority: 'desc' }, { dueAt: 'asc' }],
    });
  }

  async createTask(data: {
    tenantId: string;
    assignedToId?: string;
    carId?: string;
    rentalId?: string;
    type: string;
    title: string;
    description?: string;
    priority?: number;
    dueAt?: string;
  }) {
    return this.prisma.staffTask.create({
      data: {
        tenantId: data.tenantId,
        assignedToId: data.assignedToId,
        carId: data.carId,
        rentalId: data.rentalId,
        type: data.type as any,
        title: data.title,
        description: data.description,
        priority: data.priority ?? 0,
        dueAt: data.dueAt ? new Date(data.dueAt) : null,
      },
    });
  }

  async updateTask(
    id: string,
    tenantId: string,
    data: { status?: string; assignedToId?: string; completedAt?: string },
  ) {
    return this.prisma.staffTask.update({
      where: { id, tenantId },
      data: {
        ...(data.status && { status: data.status as any }),
        ...(data.assignedToId && { assignedToId: data.assignedToId }),
        ...(data.completedAt && { completedAt: new Date(data.completedAt) }),
      },
    });
  }

  async completeTask(id: string, tenantId: string) {
    return this.prisma.staffTask.update({
      where: { id, tenantId },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
      },
    });
  }
}
