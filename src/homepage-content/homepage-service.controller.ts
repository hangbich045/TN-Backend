import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { HomepageServiceService } from './homepage-service.service';
import { CreateHomepageServiceDto } from './dto/create-homepage-service.dto';
import { UpdateHomepageServiceDto } from './dto/update-homepage-service.dto';
import { ReorderItemsDto } from './dto/reorder-items.dto';
import { HOMEPAGE_SERVICE_ICONS } from './homepage.defaults';

@Controller('homepage-services')
export class HomepageServiceController {
  constructor(private readonly homepageServiceService: HomepageServiceService) {}

  @Get()
  findAll(@Query('activeOnly') activeOnly?: string) {
    return this.homepageServiceService.findAll(activeOnly === 'true');
  }

  @Get('icons')
  getIcons() {
    return HOMEPAGE_SERVICE_ICONS;
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  findOne(@Param('id') id: string) {
    return this.homepageServiceService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  create(@Body() dto: CreateHomepageServiceDto) {
    return this.homepageServiceService.create(dto);
  }

  @Put('reorder')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  reorder(@Body() dto: ReorderItemsDto) {
    return this.homepageServiceService.reorder(dto);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  update(@Param('id') id: string, @Body() dto: UpdateHomepageServiceDto) {
    return this.homepageServiceService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  remove(@Param('id') id: string) {
    return this.homepageServiceService.remove(id);
  }
}
