import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCarCategoryDto } from './dto/create-car-category.dto';
import { UpdateCarCategoryDto } from './dto/update-car-category.dto';

@Injectable()
export class CarCategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(tenantId: string, dto: CreateCarCategoryDto) {
    return this.prisma.carCategory.create({
      data: {
        tenantId,
        ...dto,
      },
    });
  }

  async findAll(tenantId: string) {
    return this.prisma.carCategory.findMany({
      where: { tenantId },
      include: {
        _count: {
          select: { cars: true },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(tenantId: string, id: string) {
    const category = await this.prisma.carCategory.findFirst({
      where: { id, tenantId },
      include: {
        _count: {
          select: { cars: true },
        },
      },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return category;
  }

  async update(tenantId: string, id: string, dto: UpdateCarCategoryDto) {
    await this.findOne(tenantId, id);

    return this.prisma.carCategory.update({
      where: { id },
      data: dto,
    });
  }

  async remove(tenantId: string, id: string) {
    await this.findOne(tenantId, id);

    return this.prisma.carCategory.delete({
      where: { id },
    });
  }
}
