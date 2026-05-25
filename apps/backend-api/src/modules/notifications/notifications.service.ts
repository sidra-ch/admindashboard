import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  async getNotifications(tenantId: string, userId?: string, unreadOnly = false) {
    return this.prisma.notification.findMany({
      where: {
        tenantId,
        ...(userId && { userId }),
        ...(unreadOnly && { isRead: false }),
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  async markAsRead(id: string, tenantId: string) {
    return this.prisma.notification.update({
      where: { id, tenantId },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });
  }

  async markAllAsRead(tenantId: string, userId?: string) {
    return this.prisma.notification.updateMany({
      where: {
        tenantId,
        ...(userId && { userId }),
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });
  }

  async createNotification(data: {
    tenantId: string;
    userId?: string;
    type: string;
    title: string;
    message: string;
    entityType?: string;
    entityId?: string;
  }) {
    return this.prisma.notification.create({
      data: {
        tenantId: data.tenantId,
        userId: data.userId,
        type: data.type as any,
        title: data.title,
        message: data.message,
        entityType: data.entityType,
        entityId: data.entityId,
      },
    });
  }

  async getTemplates(tenantId: string) {
    return this.prisma.notificationTemplate.findMany({
      where: { tenantId },
      orderBy: { type: 'asc' },
    });
  }

  async createTemplate(data: {
    tenantId: string;
    type: string;
    channel: string;
    subject?: string;
    template: string;
  }) {
    return this.prisma.notificationTemplate.create({
      data: {
        tenantId: data.tenantId,
        type: data.type as any,
        channel: data.channel as any,
        subject: data.subject,
        template: data.template,
      },
    });
  }

  async updateTemplate(id: string, tenantId: string, data: { template: string; subject?: string }) {
    return this.prisma.notificationTemplate.update({
      where: { id, tenantId },
      data,
    });
  }
}
