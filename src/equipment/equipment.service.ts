import { Injectable, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEquipmentDto } from './dto/create-equipment.dto';
import { UpdateEquipmentDto } from './dto/update-equipment.dto';
import { EquipmentStatus } from '@prisma/client';

@Injectable()
export class EquipmentService {
  constructor(private prisma: PrismaService) {}

  async validateCategory(categoryName: string) {
    const category = await this.prisma.equipmentCategory.findUnique({
      where: { name: categoryName },
    });
    if (!category) {
      throw new BadRequestException(`Danh mục '${categoryName}' không hợp lệ hoặc chưa được tạo`);
    }
  }

  async findAll(query: {
    search?: string;
    category?: string;
    status?: EquipmentStatus;
    page?: number;
    limit?: number;
  }) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { code: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    if (query.category) {
      where.category = query.category;
    }

    if (query.status) {
      where.status = query.status;
    }

    const [items, total] = await Promise.all([
      this.prisma.equipment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.equipment.count({ where }),
    ]);

    // Gather unique categories from categories database table
    const categoriesDb = await this.prisma.equipmentCategory.findMany({
      select: { name: true },
    });
    const categories = categoriesDb.map((c) => c.name);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      categories,
    };
  }

  async findOne(id: string) {
    const equipment = await this.prisma.equipment.findUnique({
      where: { id },
    });
    if (!equipment) {
      throw new BadRequestException('Không tìm thấy thiết bị');
    }
    return equipment;
  }

  async create(dto: CreateEquipmentDto) {
    if (dto.status === EquipmentStatus.BORROWED) {
      throw new BadRequestException('Trạng thái Đang mượn chỉ được kích hoạt tự động qua luồng duyệt đơn');
    }
    if (dto.status && dto.status !== EquipmentStatus.AVAILABLE && dto.status !== EquipmentStatus.MAINTENANCE) {
      throw new BadRequestException('Trạng thái không hợp lệ. Chỉ được chọn Sẵn sàng hoặc Bảo trì.');
    }

    await this.validateCategory(dto.category);

    const existing = await this.prisma.equipment.findUnique({
      where: { code: dto.code },
    });
    if (existing) {
      throw new ConflictException('Mã thiết bị đã tồn tại');
    }

    return this.prisma.equipment.create({
      data: {
        ...dto,
        availableQuantity: dto.quantity,
        status: dto.status || EquipmentStatus.AVAILABLE,
      },
    });
  }

  async update(id: string, dto: UpdateEquipmentDto) {
    const equipment = await this.findOne(id);

    if (dto.status === EquipmentStatus.BORROWED && equipment.status !== EquipmentStatus.BORROWED) {
      throw new BadRequestException('Trạng thái Đang mượn chỉ được kích hoạt tự động qua luồng duyệt đơn');
    }

    if (dto.status && dto.status !== EquipmentStatus.AVAILABLE && dto.status !== EquipmentStatus.MAINTENANCE && dto.status !== EquipmentStatus.BORROWED) {
      throw new BadRequestException('Trạng thái không hợp lệ. Chỉ được chọn Sẵn sàng hoặc Bảo trì.');
    }

    if (equipment.status === EquipmentStatus.BORROWED && dto.status !== undefined && dto.status !== EquipmentStatus.BORROWED) {
      throw new BadRequestException('Không thể thay đổi trạng thái khi thiết bị đang được cho mượn');
    }

    if (dto.category) {
      await this.validateCategory(dto.category);
    }

    if (dto.code && dto.code !== equipment.code) {
      const existing = await this.prisma.equipment.findUnique({
        where: { code: dto.code },
      });
      if (existing) {
        throw new ConflictException('Mã thiết bị đã tồn tại');
      }
    }

    const data: any = { ...dto };

    if (dto.quantity !== undefined) {
      const diff = dto.quantity - equipment.quantity;
      const newAvailable = equipment.availableQuantity + diff;
      if (newAvailable < 0) {
        throw new BadRequestException('Số lượng mới không thể nhỏ hơn số lượng đang cho mượn');
      }
      data.availableQuantity = newAvailable;
    }

    return this.prisma.equipment.update({
      where: { id },
      data,
    });
  }

  async delete(id: string) {
    const equipment = await this.findOne(id);
    if (equipment.availableQuantity < equipment.quantity) {
      throw new BadRequestException('Không thể xóa thiết bị đang được cho mượn');
    }
    return this.prisma.equipment.delete({
      where: { id },
    });
  }
}
