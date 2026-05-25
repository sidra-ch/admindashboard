import { Controller, Get, Post, Patch, Body, Param, Query } from '@nestjs/common';
import { TasksService } from './tasks.service';

@Controller('tasks')
export class TasksController {
  constructor(private tasksService: TasksService) {}

  @Get()
  async getTasks(
    @Query('tenantId') tenantId: string,
    @Query('assignedToId') assignedToId?: string,
    @Query('status') status?: string,
  ) {
    return this.tasksService.getTasks(tenantId, assignedToId, status);
  }

  @Post()
  async createTask(
    @Body()
    body: {
      tenantId: string;
      assignedToId?: string;
      carId?: string;
      rentalId?: string;
      type: string;
      title: string;
      description?: string;
      priority?: number;
      dueAt?: string;
    },
  ) {
    return this.tasksService.createTask(body);
  }

  @Patch(':id')
  async updateTask(
    @Param('id') id: string,
    @Query('tenantId') tenantId: string,
    @Body() body: { status?: string; assignedToId?: string; completedAt?: string },
  ) {
    return this.tasksService.updateTask(id, tenantId, body);
  }

  @Patch(':id/complete')
  async completeTask(@Param('id') id: string, @Query('tenantId') tenantId: string) {
    return this.tasksService.completeTask(id, tenantId);
  }
}
