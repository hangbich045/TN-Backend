import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateHomepageServiceDto } from './dto/create-homepage-service.dto';
import { UpdateHomepageServiceDto } from './dto/update-homepage-service.dto';
import { ReorderItemsDto } from './dto/reorder-items.dto';

@Injectable()
export class HomepageServiceService {
  constructor(private prisma: PrismaService) {}

  findAll(activeOnly = false) {
    return this.prisma.homepageService.findMany({
      where: activeOnly ? { isActive: true } : undefined,
      orderBy: { order: 'asc' },
    });
  }

  async findOne(id: string) {
    const service = await this.prisma.homepageService.findUnique({ where: { id } });
    if (!service) {
      throw new NotFoundException('Không tìm thấy dịch vụ trang chủ');
    }
    return service;
  }

  async create(dto: CreateHomepageServiceDto) {
    const maxOrder = await this.prisma.homepageService.aggregate({
      _max: { order: true },
    });

    return this.prisma.homepageService.create({
      data: {
        ...dto,
        order: dto.order ?? (maxOrder._max.order ?? -1) + 1,
        isActive: dto.isActive ?? true,
      },
    });
  }

  async update(id: string, dto: UpdateHomepageServiceDto) {
    await this.findOne(id);
    return this.prisma.homepageService.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.homepageService.delete({ where: { id } });
  }

  async reorder(dto: ReorderItemsDto) {
    await this.prisma.$transaction(
      dto.items.map((item) =>
        this.prisma.homepageService.update({
          where: { id: item.id },
          data: { order: item.order },
        }),
      ),
    );

    return this.findAll();
  }
}
