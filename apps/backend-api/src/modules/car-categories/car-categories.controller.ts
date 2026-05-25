import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantId } from '../auth/decorators/tenant-id.decorator';
import { CarCategoriesService } from './car-categories.service';
import { CreateCarCategoryDto } from './dto/create-car-category.dto';
import { UpdateCarCategoryDto } from './dto/update-car-category.dto';

@Controller('car-categories')
@UseGuards(JwtAuthGuard)
export class CarCategoriesController {
  constructor(private readonly carCategoriesService: CarCategoriesService) {}

  @Post()
  create(@TenantId() tenantId: string, @Body() dto: CreateCarCategoryDto) {
    return this.carCategoriesService.create(tenantId, dto);
  }

  @Get()
  findAll(@TenantId() tenantId: string) {
    return this.carCategoriesService.findAll(tenantId);
  }

  @Get(':id')
  findOne(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.carCategoriesService.findOne(tenantId, id);
  }

  @Patch(':id')
  update(@TenantId() tenantId: string, @Param('id') id: string, @Body() dto: UpdateCarCategoryDto) {
    return this.carCategoriesService.update(tenantId, id, dto);
  }

  @Delete(':id')
  remove(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.carCategoriesService.remove(tenantId, id);
  }
}
