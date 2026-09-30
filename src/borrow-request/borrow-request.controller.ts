import { Controller, Post, Get, Put, Param, Body, UseGuards, Request, ForbiddenException } from '@nestjs/common';
import { BorrowRequestService } from './borrow-request.service';
import { CreateBorrowRequestDto } from './dto/create-borrow-request.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';

@Controller('borrow-requests')
@UseGuards(JwtAuthGuard, RolesGuard)
export class BorrowRequestController {
  constructor(private readonly borrowRequestService: BorrowRequestService) {}

  @Post()
  create(@Request() req: any, @Body() dto: CreateBorrowRequestDto) {
    return this.borrowRequestService.create(req.user.id, dto);
  }

  @Get()
  findAll(@Request() req: any) {
    return this.borrowRequestService.findAll(req.user.role, req.user.id);
  }

  @Get(':id')
  async findOne(@Request() req: any, @Param('id') id: string) {
    const request = await this.borrowRequestService.findOne(id);
    if (req.user.role !== Role.ADMIN && request.userId !== req.user.id) {
      throw new ForbiddenException('Bạn không có quyền xem yêu cầu này');
    }
    return request;
  }

  @Put(':id/approve')
  @Roles(Role.ADMIN)
  approve(@Param('id') id: string, @Body() body: { adminNote?: string }) {
    return this.borrowRequestService.approve(id, body);
  }

  @Put(':id/reject')
  @Roles(Role.ADMIN)
  reject(@Param('id') id: string, @Body() body: { rejectReason: string; adminNote?: string }) {
    return this.borrowRequestService.reject(id, body);
  }

  @Put(':id/return')
  @Roles(Role.ADMIN)
  return(@Param('id') id: string) {
    return this.borrowRequestService.return(id);
  }
}
