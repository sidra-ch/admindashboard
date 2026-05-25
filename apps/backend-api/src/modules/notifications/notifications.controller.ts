import { Controller, Get, Post, Patch, Body, Param, Query } from '@nestjs/common';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
export class NotificationsController {
  constructor(private notificationsService: NotificationsService) {}

  @Get()
  async getNotifications(
    @Query('tenantId') tenantId: string,
    @Query('userId') userId?: string,
    @Query('unreadOnly') unreadOnly?: string,
  ) {
    return this.notificationsService.getNotifications(
      tenantId,
      userId,
      unreadOnly === 'true',
    );
  }

  @Patch(':id/read')
  async markAsRead(@Param('id') id: string, @Query('tenantId') tenantId: string) {
    return this.notificationsService.markAsRead(id, tenantId);
  }

  @Patch('read-all')
  async markAllAsRead(@Query('tenantId') tenantId: string, @Query('userId') userId?: string) {
    return this.notificationsService.markAllAsRead(tenantId, userId);
  }

  @Get('templates')
  async getTemplates(@Query('tenantId') tenantId: string) {
    return this.notificationsService.getTemplates(tenantId);
  }

  @Post('templates')
  async createTemplate(
    @Body()
    body: {
      tenantId: string;
      type: string;
      channel: string;
      subject?: string;
      template: string;
    },
  ) {
    return this.notificationsService.createTemplate(body);
  }

  @Patch('templates/:id')
  async updateTemplate(
    @Param('id') id: string,
    @Query('tenantId') tenantId: string,
    @Body() body: { template: string; subject?: string },
  ) {
    return this.notificationsService.updateTemplate(id, tenantId, body);
  }
}
