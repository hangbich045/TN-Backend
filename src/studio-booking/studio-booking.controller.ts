import { Controller, Post, Get, Put, Param, Body, Query, UseGuards, Request } from '@nestjs/common';
import { StudioBookingService } from './studio-booking.service';
import { CreateStudioBookingDto } from './dto/create-studio-booking.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';

@Controller('studio-bookings')
@UseGuards(JwtAuthGuard, RolesGuard)
export class StudioBookingController {
  constructor(private readonly studioBookingService: StudioBookingService) {}

  @Post()
  create(@Request() req: any, @Body() dto: CreateStudioBookingDto) {
    return this.studioBookingService.create(req.user.id, dto);
  }

  @Get()
  findAll(
    @Request() req: any,
    @Query('mine') mine?: string,
    @Query('calendar') calendar?: string,
  ) {
    const isMine = mine === 'true';
    const isCalendar = calendar === 'true';
    return this.studioBookingService.findAll({
      mine: isMine,
      userId: req.user.id,
      role: req.user.role,
      calendar: isCalendar,
    });
  }

  @Put(':id/approve')
  @Roles(Role.ADMIN)
  approve(@Param('id') id: string, @Body() body: { force?: boolean; adminNote?: string }) {
    return this.studioBookingService.approve(id, body);
  }

  @Put(':id/reject')
  @Roles(Role.ADMIN)
  reject(@Param('id') id: string, @Body() body: { rejectReason: string; adminNote?: string }) {
    return this.studioBookingService.reject(id, body);
  }
}
