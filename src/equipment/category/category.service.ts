import { Injectable, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../../src/prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';

@Injectable()
export class CategoryService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateCategoryDto) {
    const nameLower = dto.name.trim();
    const existing = await this.prisma.equipmentCategory.findUnique({
      where: { name: nameLower },
    });

    if (existing) {
      throw new ConflictException('Danh mục này đã tồn tại');
    }

    return this.prisma.equipmentCategory.create({
      data: { name: nameLower },
    });
  }

  async findAll() {
    return this.prisma.equipmentCategory.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async update(id: string, dto: CreateCategoryDto) {
    const nameLower = dto.name.trim();
    const existing = await this.prisma.equipmentCategory.findUnique({
      where: { name: nameLower },
    });

    if (existing && existing.id !== id) {
      throw new ConflictException('Tên danh mục này đã tồn tại');
    }

    return this.prisma.equipmentCategory.update({
      where: { id },
      data: { name: nameLower },
    });
  }

  async delete(id: string) {
    const category = await this.prisma.equipmentCategory.findUnique({
      where: { id },
    });
    if (!category) {
      throw new BadRequestException('Không tìm thấy danh mục');
    }

    // Check if any equipment uses this category name
    const equipmentCount = await this.prisma.equipment.count({
      where: { category: category.name },
    });

    if (equipmentCount > 0) {
      throw new BadRequestException(
        `Không thể xóa danh mục này do đang có ${equipmentCount} thiết bị sử dụng`
      );
    }

    return this.prisma.equipmentCategory.delete({
      where: { id },
    });
  }
}
