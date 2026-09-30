import { Controller, Get, Put, Delete, Param, Body, UseGuards, Request, Query } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';

@Controller('dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('stats')
  getStats() {
    return this.dashboardService.getStats();
  }

  @Get('reports')
  getReports(
    @Query('range') range?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ) {
    return this.dashboardService.getReports({ range, startDate, endDate });
  }

  @Get('users')
  getUsers() {
    return this.dashboardService.getUsers();
  }

  @Put('users/:id/role')
  updateRole(
    @Request() req: any,
    @Param('id') id: string,
    @Body('role') newRole: Role
  ) {
    return this.dashboardService.updateRole(req.user.id, id, newRole);
  }

  @Delete('users/:id')
  deleteUser(@Request() req: any, @Param('id') id: string) {
    return this.dashboardService.deleteUser(req.user.id, id);
  }
}
