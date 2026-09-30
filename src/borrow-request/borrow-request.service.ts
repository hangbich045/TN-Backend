import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBorrowRequestDto } from './dto/create-borrow-request.dto';
import { RequestStatus, EquipmentStatus, Role } from '@prisma/client';

@Injectable()
export class BorrowRequestService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateBorrowRequestDto) {
    if (new Date(dto.borrowDate) >= new Date(dto.returnDate)) {
      throw new BadRequestException('Ngày trả phải sau ngày mượn');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) {
      throw new BadRequestException('Không tìm thấy người dùng');
    }

    for (const item of dto.equipments) {
      const equipment = await this.prisma.equipment.findUnique({
        where: { id: item.equipmentId },
      });

      if (!equipment) {
        throw new BadRequestException(`Không tìm thấy thiết bị với ID: ${item.equipmentId}`);
      }

      if (equipment.status === EquipmentStatus.MAINTENANCE) {
        throw new BadRequestException(`Thiết bị ${equipment.name} đang được bảo trì`);
      }

      if (equipment.availableQuantity < item.quantity) {
        throw new BadRequestException(
          `Không đủ số lượng cho thiết bị ${equipment.name}. Còn lại: ${equipment.availableQuantity}, Yêu cầu: ${item.quantity}`
        );
      }
    }

    const isCollaborator = user.role === Role.COLLABORATOR;
    const status = isCollaborator ? RequestStatus.APPROVED : RequestStatus.PENDING;

    if (isCollaborator) {
      for (const item of dto.equipments) {
        const equipment = await this.prisma.equipment.findUnique({
          where: { id: item.equipmentId },
        });

        if (equipment) {
          const newAvailable = equipment.availableQuantity - item.quantity;
          const newStatus = newAvailable === 0 ? EquipmentStatus.BORROWED : equipment.status;

          await this.prisma.equipment.update({
            where: { id: item.equipmentId },
            data: {
              availableQuantity: newAvailable,
              status: newStatus,
            },
          });
        }
      }
    }

    return this.prisma.borrowRequest.create({
      data: {
        userId,
        purpose: dto.purpose,
        borrowDate: new Date(dto.borrowDate),
        returnDate: new Date(dto.returnDate),
        status,
        equipments: dto.equipments,
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            employeeCode: true,
          },
        },
      },
    });
  }

  async findAll(role: string, userId: string) {
    const where = role === 'ADMIN' ? {} : { userId };

    const requests = await this.prisma.borrowRequest.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            employeeCode: true,
            avatarUrl: true,
          },
        },
      },
    });

    const enrichedRequests = await Promise.all(
      requests.map(async (request) => {
        const enrichedEquipments = await Promise.all(
          request.equipments.map(async (eq) => {
            const equipment = await this.prisma.equipment.findUnique({
              where: { id: eq.equipmentId },
              select: { id: true, name: true, code: true, category: true, image: true },
            });
            return {
              ...eq,
              details: equipment,
            };
          })
        );
        return {
          ...request,
          equipments: enrichedEquipments,
        };
      })
    );

    return enrichedRequests;
  }

  async findOne(id: string) {
    const request = await this.prisma.borrowRequest.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            employeeCode: true,
          },
        },
      },
    });

    if (!request) {
      throw new BadRequestException('Không tìm thấy yêu cầu mượn thiết bị');
    }

    const enrichedEquipments = await Promise.all(
      request.equipments.map(async (eq) => {
        const equipment = await this.prisma.equipment.findUnique({
          where: { id: eq.equipmentId },
        });
        return {
          ...eq,
          details: equipment,
        };
      })
    );

    return {
      ...request,
      equipments: enrichedEquipments,
    };
  }

  async approve(id: string, body?: { adminNote?: string }) {
    const request = await this.findOne(id);
    if (request.status !== RequestStatus.PENDING) {
      throw new BadRequestException('Yêu cầu phải ở trạng thái CHỜ DUYỆT mới có thể phê duyệt');
    }

    for (const item of request.equipments) {
      const equipment = await this.prisma.equipment.findUnique({
        where: { id: item.equipmentId },
      });

      if (!equipment || equipment.availableQuantity < item.quantity) {
        throw new BadRequestException(
          `Không đủ số lượng cho thiết bị ${equipment?.name || 'không xác định'}. Chỉ còn: ${equipment?.availableQuantity || 0}`
        );
      }
    }

    for (const item of request.equipments) {
      const equipment = await this.prisma.equipment.findUnique({
        where: { id: item.equipmentId },
      });

      if (equipment) {
        const newAvailable = equipment.availableQuantity - item.quantity;
        const newStatus = newAvailable === 0 ? EquipmentStatus.BORROWED : equipment.status;

        await this.prisma.equipment.update({
          where: { id: item.equipmentId },
          data: {
            availableQuantity: newAvailable,
            status: newStatus,
          },
        });
      }
    }

    return this.prisma.borrowRequest.update({
      where: { id },
      data: { 
        status: RequestStatus.APPROVED,
        adminNote: body?.adminNote ? body.adminNote.trim() : null
      },
    });
  }

  async reject(id: string, body: { rejectReason: string; adminNote?: string }) {
    const request = await this.findOne(id);
    if (request.status !== RequestStatus.PENDING) {
      throw new BadRequestException('Yêu cầu phải ở trạng thái CHỜ DUYỆT mới có thể từ chối');
    }

    if (!body.rejectReason || body.rejectReason.trim() === '') {
      throw new BadRequestException('Lý do từ chối không được để trống');
    }

    if (body.rejectReason.length > 500) {
      throw new BadRequestException('Lý do từ chối không được vượt quá 500 ký tự');
    }

    return this.prisma.borrowRequest.update({
      where: { id },
      data: {
        status: RequestStatus.REJECTED,
        rejectReason: body.rejectReason.trim(),
        adminNote: body.adminNote ? body.adminNote.trim() : null
      },
    });
  }

  async return(id: string) {
    const request = await this.findOne(id);
    if (request.status !== RequestStatus.APPROVED) {
      throw new BadRequestException('Yêu cầu phải được PHÊ DUYỆT trước khi trả thiết bị');
    }

    for (const item of request.equipments) {
      const equipment = await this.prisma.equipment.findUnique({
        where: { id: item.equipmentId },
      });

      if (equipment) {
        const newAvailable = Math.min(equipment.quantity, equipment.availableQuantity + item.quantity);
        const newStatus = newAvailable > 0 && equipment.status === EquipmentStatus.BORROWED 
          ? EquipmentStatus.AVAILABLE 
          : equipment.status;

        await this.prisma.equipment.update({
          where: { id: item.equipmentId },
          data: {
            availableQuantity: newAvailable,
            status: newStatus,
          },
        });
      }
    }

    return this.prisma.borrowRequest.update({
      where: { id },
      data: { status: RequestStatus.RETURNED },
    });
  }
}
