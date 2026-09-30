import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { HomepageSectionService } from './homepage-section.service';
import { UpdateHomepageSectionDto } from './dto/update-homepage-section.dto';

@Controller('homepage-sections')
export class HomepageSectionController {
  constructor(private readonly homepageSectionService: HomepageSectionService) {}

  @Get()
  getSections() {
    return this.homepageSectionService.getSections();
  }

  @Put()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  updateSections(@Body() dto: UpdateHomepageSectionDto) {
    return this.homepageSectionService.updateSections(dto);
  }
}
