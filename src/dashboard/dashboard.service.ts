import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EquipmentStatus, RequestStatus, Role } from '@prisma/client';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) { }

  async getStats() {
    // Current totals (independent of filters)
    const [
      totalEquipmentAgg,
      availableEquipmentAgg,
      maintenanceEquipmentAgg,
      pendingBorrows,
      pendingBookings,
      totalUsers,
    ] = await Promise.all([
      this.prisma.equipment.aggregate({ _sum: { quantity: true } }),
      this.prisma.equipment.aggregate({ _sum: { availableQuantity: true } }),
      this.prisma.equipment.aggregate({
        _sum: { quantity: true },
        where: { status: EquipmentStatus.MAINTENANCE },
      }),
      this.prisma.borrowRequest.count({ where: { status: RequestStatus.PENDING } }),
      this.prisma.studioBooking.count({ where: { status: RequestStatus.PENDING } }),
      this.prisma.user.count(),
    ]);

    const total = totalEquipmentAgg._sum.quantity || 0;
    const available = availableEquipmentAgg._sum.availableQuantity || 0;
    const maintenance = maintenanceEquipmentAgg._sum.quantity || 0;
    const borrowed = Math.max(0, total - available - maintenance);

    return {
      equipment: {
        total,
        available,
        borrowed,
        maintenance,
      },
      requests: {
        pendingBorrows,
        pendingBookings,
      },
      users: {
        total: totalUsers,
      },
    };
  }

  async getReports(query: { range?: string; startDate?: string; endDate?: string }) {
    let start = new Date();
    const end = new Date();

    const range = query.range || 'month';

    if (range === 'week') {
      start.setDate(end.getDate() - 7);
      start.setHours(0, 0, 0, 0);
    } else if (range === 'month') {
      start.setDate(end.getDate() - 30);
      start.setHours(0, 0, 0, 0);
    } else if (range === 'year') {
      start.setFullYear(end.getFullYear(), 0, 1); // Jan 1st
      start.setHours(0, 0, 0, 0);
    } else if (range === 'custom' && query.startDate && query.endDate) {
      start = new Date(query.startDate);
      start.setHours(0, 0, 0, 0);
      end.setTime(new Date(query.endDate).getTime());
      end.setHours(23, 59, 59, 999);
    } else {
      // Default to 30 days
      start.setDate(end.getDate() - 30);
      start.setHours(0, 0, 0, 0);
    }





    // Fetch valid borrow requests in range
    const borrows = await this.prisma.borrowRequest.findMany({
      where: {
        status: { in: [RequestStatus.APPROVED, RequestStatus.RETURNED] },
        createdAt: { gte: start, lte: end },
      },
    });

    // Fetch valid studio bookings in range
    const bookings = await this.prisma.studioBooking.findMany({
      where: {
        status: { in: [RequestStatus.APPROVED, RequestStatus.RETURNED] },
        startTime: { gte: start, lte: end },
      },
    });

    // 1. Group bookings and borrows by day in range
    const chartDataMap: { [key: string]: { date: string; borrows: number; bookings: number } } = {};

    // Initialize map for all dates in range to show smooth time series
    const tempDate = new Date(start);
    while (tempDate <= end) {
      const label = `${tempDate.getDate()}/${tempDate.getMonth() + 1}`;
      chartDataMap[label] = { date: label, borrows: 0, bookings: 0 };
      tempDate.setDate(tempDate.getDate() + 1);
    }

    // Populate borrows count
    borrows.forEach((b) => {
      const dateLabel = `${b.createdAt.getDate()}/${b.createdAt.getMonth() + 1}`;
      if (chartDataMap[dateLabel]) {
        chartDataMap[dateLabel].borrows += 1;
      }
    });

    // Populate bookings count
    bookings.forEach((b) => {
      const dateLabel = `${b.startTime.getDate()}/${b.startTime.getMonth() + 1}`;
      if (chartDataMap[dateLabel]) {
        chartDataMap[dateLabel].bookings += 1;
      }
    });

    const chartData = Object.values(chartDataMap);

    // 2. Calculate top 5 most used equipment
    const equipmentUsageMap: { [id: string]: number } = {};
    borrows.forEach((b) => {
      b.equipments.forEach((eq) => {
        equipmentUsageMap[eq.equipmentId] = (equipmentUsageMap[eq.equipmentId] || 0) + eq.quantity;
      });
    });

    const sortedUsage = Object.entries(equipmentUsageMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    const topEquipment = await Promise.all(
      sortedUsage.map(async ([eqId, count]) => {
        const details = await this.prisma.equipment.findUnique({
          where: { id: eqId },
          select: { name: true, code: true, category: true, image: true },
        });
        return {
          id: eqId,
          count,
          name: details?.name || 'Không xác định',
          code: details?.code || 'N/A',
          category: details?.category || 'N/A',
          image: details?.image || '',
        };
      })
    );

    // 3. Studio utilization rate
    // Operating hours per day: 10 hours (08:00 - 18:00)
    const diffMs = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
    const totalOperatingHours = diffDays * 10;

    let occupiedHours = 0;
    bookings.forEach((b) => {
      const durationMs = new Date(b.endTime).getTime() - new Date(b.startTime).getTime();
      occupiedHours += durationMs / (1000 * 60 * 60);
    });

    const utilizationRate = Math.min(
      100,
      Math.round((occupiedHours / totalOperatingHours) * 100)
    );

    return {
      borrowsCount: borrows.length,
      bookingsCount: bookings.length,
      topEquipment,
      utilizationRate,
      chartData,
    };
  }

  async getUsers() {
    return this.prisma.user.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        fullName: true,
        email: true,
        employeeCode: true,
        role: true,
        avatarUrl: true,
        createdAt: true,
      },
    });
  }

  async updateRole(adminId: string, targetUserId: string, newRole: Role) {
  if (adminId === targetUserId) {
    throw new BadRequestException('Bạn không thể tự thay đổi quyền hạn của chính mình');
  }

  const user = await this.prisma.user.findUnique({
    where: { id: targetUserId },
  });

  if (!user) {
    throw new BadRequestException('Không tìm thấy người dùng');
  }

  return this.prisma.user.update({
    where: { id: targetUserId },
    data: { role: newRole },
    select: {
      id: true,
      fullName: true,
      email: true,
      role: true,
    },
  });
}

  async deleteUser(adminId: string, targetUserId: string) {
    if (adminId === targetUserId) {
      throw new BadRequestException('Bạn không thể tự xóa tài khoản của chính mình');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: targetUserId },
    });

    if (!user) {
      throw new BadRequestException('Không tìm thấy người dùng');
    }

    return this.prisma.user.update({
      where: { id: targetUserId },
      data: { isActive: false },
    });
  }
}
