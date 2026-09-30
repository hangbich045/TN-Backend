import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { RolesGuard } from './roles.guard';
import { Roles } from './roles.decorator';
import { Role } from '@prisma/client';
import { CreateUserByAdminDto } from './dto/create-user-by-admin.dto';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class AdminUserController {
  constructor(private readonly authService: AuthService) {}

  @Post('users')
  async createUser(@Body() dto: CreateUserByAdminDto) {
    return this.authService.createUserByAdmin(dto);
  }
}
