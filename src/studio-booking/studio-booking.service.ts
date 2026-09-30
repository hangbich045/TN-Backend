import { Injectable, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateStudioBookingDto } from './dto/create-studio-booking.dto';
import { RequestStatus } from '@prisma/client';

@Injectable()
export class StudioBookingService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateStudioBookingDto) {
    const start = new Date(dto.startTime);
    const end = new Date(dto.endTime);

    if (start >= end) {
      throw new BadRequestException('Thời gian kết thúc phải sau thời gian bắt đầu');
    }

    if (start < new Date()) {
      throw new BadRequestException('Không thể đặt phòng cho thời gian trong quá khứ');
    }

    // Check for overlapping APPROVED bookings only (V2 rules)
    const overlappingApproved = await this.prisma.studioBooking.findFirst({
      where: {
        status: RequestStatus.APPROVED,
        startTime: { lt: end },
        endTime: { gt: start },
      },
    });

    if (overlappingApproved) {
      throw new ConflictException(
        'Khung giờ này đã được phê duyệt cho người dùng khác. Vui lòng chọn khung giờ khác!'
      );
    }

    return this.prisma.studioBooking.create({
      data: {
        userId,
        fullName: dto.fullName,
        participants: dto.participants,
        purpose: dto.purpose,
        technicalSupport: dto.technicalSupport,
        startTime: start,
        endTime: end,
        status: RequestStatus.PENDING,
      },
    });
  }

  async findAll(query: { mine?: boolean; userId?: string; role?: string; calendar?: boolean }) {
    const where: any = {};

    if (query.calendar) {
      if (query.role === 'ADMIN') {
        // Admin calendar: Show APPROVED and PENDING (Hide REJECTED)
        where.status = { in: [RequestStatus.APPROVED, RequestStatus.PENDING] };
      } else {
        // User calendar: Show APPROVED of everyone, and PENDING of themselves only. Hide all REJECTED.
        where.OR = [
          { status: RequestStatus.APPROVED },
          {
            userId: query.userId,
            status: RequestStatus.PENDING,
          },
        ];
      }
    } else {
      // Non-calendar view (e.g. lists, admin request page, history)
      if (query.mine && query.userId) {
        where.userId = query.userId;
      } else if (query.role !== 'ADMIN') {
        // Regular user request history list: only show their own requests
        where.userId = query.userId;
      }
      // Admin request management page: show all
    }

    return this.prisma.studioBooking.findMany({
      where,
      orderBy: { startTime: 'asc' },
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
  }

  async findOne(id: string) {
    const booking = await this.prisma.studioBooking.findUnique({
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
    if (!booking) {
      throw new BadRequestException('Không tìm thấy lịch đặt phòng');
    }
    return booking;
  }

  async approve(id: string, body: { force?: boolean; adminNote?: string }) {
    const booking = await this.findOne(id);
    if (booking.status !== RequestStatus.PENDING) {
      throw new BadRequestException('Lịch đặt phải ở trạng thái CHỜ DUYỆT mới có thể phê duyệt');
    }

    // Find any overlapping PENDING bookings (excluding self)
    const overlappingPending = await this.prisma.studioBooking.findMany({
      where: {
        id: { not: id },
        status: RequestStatus.PENDING,
        startTime: { lt: booking.endTime },
        endTime: { gt: booking.startTime },
      },
    });

    if (overlappingPending.length > 0 && !body.force) {
      return {
        status: 'warning',
        message: `Có ${overlappingPending.length} yêu cầu khác đang chờ duyệt trong cùng khung giờ. Nếu tiếp tục duyệt, các yêu cầu đó sẽ tự động bị từ chối.`,
        overlapsCount: overlappingPending.length,
      };
    }

    // Proceed to approve
    const approved = await this.prisma.studioBooking.update({
      where: { id },
      data: { 
        status: RequestStatus.APPROVED,
        adminNote: body.adminNote ? body.adminNote.trim() : null
      },
    });

    // Auto-reject other pending overlaps
    if (overlappingPending.length > 0) {
      await this.prisma.studioBooking.updateMany({
        where: {
          id: { in: overlappingPending.map((b) => b.id) },
        },
        data: {
          status: RequestStatus.REJECTED,
          rejectReason: 'Khung giờ này đã được phê duyệt cho người dùng khác.',
        },
      });
    }

    return {
      status: 'success',
      data: approved,
    };
  }

  async reject(id: string, body: { rejectReason: string; adminNote?: string }) {
    const booking = await this.findOne(id);
    if (booking.status !== RequestStatus.PENDING) {
      throw new BadRequestException('Lịch đặt phải ở trạng thái CHỜ DUYỆT mới có thể từ chối');
    }

    if (!body.rejectReason || body.rejectReason.trim() === '') {
      throw new BadRequestException('Lý do từ chối không được để trống');
    }

    if (body.rejectReason.length > 500) {
      throw new BadRequestException('Lý do từ chối không được vượt quá 500 ký tự');
    }

    return this.prisma.studioBooking.update({
      where: { id },
      data: {
        status: RequestStatus.REJECTED,
        rejectReason: body.rejectReason.trim(),
        adminNote: body.adminNote ? body.adminNote.trim() : null
      },
    });
  }
}
