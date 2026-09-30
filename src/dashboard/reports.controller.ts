import { Controller, Get, Query, UseGuards, Res } from '@nestjs/common';
import * as express from 'express';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role, RequestStatus } from '@prisma/client';
import * as ExcelJS from 'exceljs';

@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class ReportsController {
  constructor(private readonly prisma: PrismaService) { }

  @Get('export-excel')
  async exportExcel(
    @Res() res: express.Response,
    @Query('range') range?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('month') month?: string,
    @Query('year') year?: string,
  ) {
    let start = new Date();
    let end = new Date();

    if (range === 'month') {
      start = new Date(end.getFullYear(), end.getMonth(), 1);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
    } else if (range === 'year') {
      start = new Date(end.getFullYear(), 0, 1);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
    } else if (range === 'month-year' && month && year) {
      const m = Number(month) - 1;
      const y = Number(year);
      start = new Date(y, m, 1);
      start.setHours(0, 0, 0, 0);
      end = new Date(y, m + 1, 0);
      end.setHours(23, 59, 59, 999);
    } else if (range === 'custom' && startDate && endDate) {
      start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
    } else {
      start = new Date(end.getFullYear(), end.getMonth(), 1);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
    }

    // 1. Fetch dữ liệu Mượn Thiết Bị
    const borrows = await this.prisma.borrowRequest.findMany({
      where: {
        status: { in: [RequestStatus.APPROVED, RequestStatus.RETURNED] },
        createdAt: { gte: start, lte: end },
      },
      include: { user: true },
      orderBy: { createdAt: 'desc' },
    });

    // 2. Fetch dữ liệu Đặt Phòng Studio
    const bookings = await this.prisma.studioBooking.findMany({
      where: {
        status: { in: [RequestStatus.APPROVED, RequestStatus.RETURNED] },
        startTime: { gte: start, lte: end },
      },
      include: { user: true },
      orderBy: { createdAt: 'desc' },
    });

    // Map thông tin chi tiết thiết bị & Tính tổng số lượt mượn từng thiết bị
    const equipmentCountMap = new Map<string, number>();
    const allEquipmentIds = new Set<string>();

    borrows.forEach((b) => {
      b.equipments.forEach((eq) => {
        allEquipmentIds.add(eq.equipmentId);
        const currentCount = equipmentCountMap.get(eq.equipmentId) || 0;
        equipmentCountMap.set(eq.equipmentId, currentCount + (eq.quantity || 1));
      });
    });

    const equipmentDetails = await this.prisma.equipment.findMany({
      where: { id: { in: Array.from(allEquipmentIds) } },
      select: { id: true, name: true, code: true, category: true },
    });
    const equipmentMap = new Map(equipmentDetails.map((eq) => [eq.id, eq]));

    const formatDate = (d: Date) => {
      const pad = (n: number) => n.toString().padStart(2, '0');
      return `${pad(d.getHours())}:${pad(d.getMinutes())} ${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
    };

    const workbook = new ExcelJS.Workbook();

    // Helper Apply Styling chung
    const applySheetStyles = (
      worksheet: ExcelJS.Worksheet,
      headerColorHex: string,
      alignLeftCols: number[] = [],
    ) => {
      // Style Header Row (Dòng 1)
      const headerRow = worksheet.getRow(1);
      headerRow.height = 32;
      headerRow.eachCell((cell) => {
        cell.font = { name: 'Arial', size: 12, bold: true, color: { argb: 'FFFFFF' } };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: headerColorHex },
        };
        cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
        cell.border = {
          top: { style: 'thin', color: { argb: '000000' } },
          left: { style: 'thin', color: { argb: '000000' } },
          bottom: { style: 'medium', color: { argb: '000000' } },
          right: { style: 'thin', color: { argb: '000000' } },
        };
      });

      // Style Data Rows
      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return;

        row.height = 25;
        row.eachCell((cell) => {
          cell.font = { name: 'Arial', size: 10 };
          cell.border = {
            top: { style: 'thin', color: { argb: 'D1D5DB' } },
            left: { style: 'thin', color: { argb: 'D1D5DB' } },
            bottom: { style: 'thin', color: { argb: 'D1D5DB' } },
            right: { style: 'thin', color: { argb: 'D1D5DB' } },
          };
          cell.alignment = { vertical: 'middle', horizontal: 'center' };
        });

        // Căn trái cho các cột text
        alignLeftCols.forEach((colIdx) => {
          const cell = row.getCell(colIdx);
          if (cell) cell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
        });

        // Style Badge Trạng Thái (Cột kế cuối)
        const statusColIdx = worksheet.columns.length - 1;
        const statusCell = row.getCell(statusColIdx);
        if (statusCell && statusCell.value) {
          if (statusCell.value.toString().includes('Đã duyệt')) {
            statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'DCFCE7' } };
            statusCell.font = { name: 'Arial', size: 10, bold: true, color: { argb: '15803D' } };
          } else if (statusCell.value.toString().includes('Đã trả')) {
            statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'E0E7FF' } };
            statusCell.font = { name: 'Arial', size: 10, bold: true, color: { argb: '4338CA' } };
          }
        }
      });
    };

    // ================= SHEET 1: MƯỢN THIẾT BỊ =================
    const sheetDevice = workbook.addWorksheet('Mượn Thiết Bị');
    sheetDevice.columns = [
      { header: 'STT', key: 'stt', width: 6 },
      { header: 'Họ và Tên Người Mượn', key: 'fullName', width: 25 },
      { header: 'Mã NV / SV', key: 'employeeCode', width: 15 },
      { header: 'Danh Sách Thiết Bị Mượn', key: 'items', width: 45 },
      { header: 'Thời Gian Bắt Đầu Mượn', key: 'startTimeStr', width: 22 },
      { header: 'Thời Gian Trả / Kết Thúc', key: 'endTimeStr', width: 22 },
      { header: 'Mục Đích Sử Dụng', key: 'purpose', width: 32 },
      { header: 'Trạng Thái Đơn', key: 'status', width: 16 },
      { header: 'Ngày Tạo Đơn', key: 'createdDateStr', width: 22 },
    ];

    borrows.forEach((b, idx) => {
      const eqList = b.equipments
        .map((eq) => {
          const detail = equipmentMap.get(eq.equipmentId);
          return `${detail?.name || 'Không xác định'} (${detail?.code || eq.equipmentId}) x${eq.quantity}`;
        })
        .join(', ');

      sheetDevice.addRow({
        stt: idx + 1,
        fullName: b.user?.fullName || 'N/A',
        employeeCode: b.user?.employeeCode || 'N/A',
        items: eqList,
        startTimeStr: formatDate(b.borrowDate),
        endTimeStr: formatDate(b.returnDate),
        purpose: b.purpose,
        status: b.status === RequestStatus.APPROVED ? 'Đã duyệt' : 'Đã trả',
        createdDateStr: formatDate(b.createdAt),
      });
    });
    applySheetStyles(sheetDevice, '1F2937', [2, 4, 7]);

    // ================= SHEET 2: ĐẶT PHÒNG STUDIO =================
    const sheetStudio = workbook.addWorksheet('Đặt Phòng Studio');
    sheetStudio.columns = [
      { header: 'STT', key: 'stt', width: 6 },
      { header: 'Họ và Tên Người Đặt', key: 'fullName', width: 25 },
      { header: 'Mã NV / SV', key: 'employeeCode', width: 15 },
      { header: 'Thời Gian Bắt Đầu Mượn', key: 'startTimeStr', width: 22 },
      { header: 'Thời Gian Trả / Kết Thúc', key: 'endTimeStr', width: 22 },
      { header: 'Số Lượng Tham Gia', key: 'participants', width: 18 },
      { header: 'Hỗ Trợ Kỹ Thuật', key: 'technicalSupport', width: 18 },
      { header: 'Mục Đích Sử Dụng', key: 'purpose', width: 32 },
      { header: 'Trạng Thái Đơn', key: 'status', width: 16 },
      { header: 'Ngày Tạo Đơn', key: 'createdDateStr', width: 22 },
    ];

    bookings.forEach((bk, idx) => {
      sheetStudio.addRow({
        stt: idx + 1,
        fullName: bk.fullName || bk.user?.fullName || 'N/A',
        employeeCode: bk.user?.employeeCode || 'N/A',
        startTimeStr: formatDate(bk.startTime),
        endTimeStr: formatDate(bk.endTime),
        participants: bk.participants,
        technicalSupport: bk.technicalSupport ? 'Có' : 'Không',
        purpose: bk.purpose,
        status: bk.status === RequestStatus.APPROVED ? 'Đã duyệt' : 'Đã trả',
        createdDateStr: formatDate(bk.createdAt),
      });
    });
    applySheetStyles(sheetStudio, '0F172A', [2, 8]);

    // ================= SHEET 3: THIẾT BỊ MƯỢN NHIỀU NHẤT =================
    const sheetTopEquipment = workbook.addWorksheet('Thiết Bị Mượn Nhiều Nhất');
    sheetTopEquipment.columns = [
      { header: 'STT (Xếp Hạng)', key: 'rank', width: 15 },
      { header: 'Mã Thiết Bị', key: 'code', width: 20 },
      { header: 'Tên Thiết Bị', key: 'name', width: 35 },
      { header: 'Danh Mục / Loại', key: 'category', width: 25 },
      { header: 'Tổng Số Lượt / Số Lượng Mượn', key: 'totalBorrowed', width: 30 },
    ];

    // Chuyển map thành mảng và sắp xếp giảm dần theo số lượt mượn
    const topEquipments = Array.from(equipmentCountMap.entries())
      .map(([eqId, count]) => {
        const detail = equipmentMap.get(eqId);
        return {
          code: detail?.code || eqId,
          name: detail?.name || 'Chưa xác định',
          category: detail?.category || 'N/A',
          totalBorrowed: count,
        };
      })
      .sort((a, b) => b.totalBorrowed - a.totalBorrowed);

    topEquipments.forEach((item, idx) => {
      sheetTopEquipment.addRow({
        rank: idx + 1,
        code: item.code,
        name: item.name,
        category: item.category,
        totalBorrowed: item.totalBorrowed,
      });
    });
    // Header màu Xanh Rêu Đậm, căn trái tên thiết bị (cột 3)
    applySheetStyles(sheetTopEquipment, '065F46', [3]);

    // Trả file Excel về Client
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="bao-cao-tong-hop-${Date.now()}.xlsx"`,
    );

    await workbook.xlsx.write(res);
    res.end();
  }
}