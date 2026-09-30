import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateHomepageGalleryDto } from './dto/create-homepage-gallery.dto';
import { UpdateHomepageGalleryDto } from './dto/update-homepage-gallery.dto';
import { ReorderItemsDto } from './dto/reorder-items.dto';

@Injectable()
export class HomepageGalleryService {
  constructor(private prisma: PrismaService) {}

  findAll(activeOnly = false) {
    return this.prisma.homepageGallery.findMany({
      where: activeOnly ? { isActive: true } : undefined,
      orderBy: { order: 'asc' },
    });
  }

  async findOne(id: string) {
    const item = await this.prisma.homepageGallery.findUnique({ where: { id } });
    if (!item) {
      throw new NotFoundException('Không tìm thấy hình ảnh gallery');
    }
    return item;
  }

  async create(dto: CreateHomepageGalleryDto) {
    const maxOrder = await this.prisma.homepageGallery.aggregate({
      _max: { order: true },
    });

    return this.prisma.homepageGallery.create({
      data: {
        ...dto,
        order: dto.order ?? (maxOrder._max.order ?? -1) + 1,
        isActive: dto.isActive ?? true,
      },
    });
  }

  async update(id: string, dto: UpdateHomepageGalleryDto) {
    await this.findOne(id);
    return this.prisma.homepageGallery.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.homepageGallery.delete({ where: { id } });
  }

  async reorder(dto: ReorderItemsDto) {
    await this.prisma.$transaction(
      dto.items.map((item) =>
        this.prisma.homepageGallery.update({
          where: { id: item.id },
          data: { order: item.order },
        }),
      ),
    );

    return this.findAll();
  }
}
