import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { HomepageGalleryService } from './homepage-gallery.service';
import { CreateHomepageGalleryDto } from './dto/create-homepage-gallery.dto';
import { UpdateHomepageGalleryDto } from './dto/update-homepage-gallery.dto';
import { ReorderItemsDto } from './dto/reorder-items.dto';

@Controller('homepage-gallery')
export class HomepageGalleryController {
  constructor(
    private readonly homepageGalleryService: HomepageGalleryService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  @Get()
  findAll(@Query('activeOnly') activeOnly?: string) {
    return this.homepageGalleryService.findAll(activeOnly === 'true');
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  findOne(@Param('id') id: string) {
    return this.homepageGalleryService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  create(@Body() dto: CreateHomepageGalleryDto) {
    return this.homepageGalleryService.create(dto);
  }

  @Post('upload')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @UseInterceptors(FileInterceptor('file'))
  async uploadImage(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Vui lòng chọn tệp hình ảnh');
    }

    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
    const filename = file.originalname.toLowerCase();
    const hasAllowedExtension = allowedExtensions.some((ext) =>
      filename.endsWith(ext),
    );
    const isImageMime = file.mimetype.startsWith('image/');

    if (!hasAllowedExtension || !isImageMime) {
      throw new BadRequestException(
        'Chỉ chấp nhận tệp hình ảnh định dạng JPG, JPEG, PNG hoặc WEBP',
      );
    }

    const maxSizeBytes = 10 * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      throw new BadRequestException(
        'Tệp ảnh vượt quá dung lượng tối đa cho phép (10MB)',
      );
    }

    const result = await this.cloudinaryService.uploadFile(file, {
      resource_type: 'image',
    });

    return { url: result.secure_url };
  }

  @Put('reorder')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  reorder(@Body() dto: ReorderItemsDto) {
    return this.homepageGalleryService.reorder(dto);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  update(@Param('id') id: string, @Body() dto: UpdateHomepageGalleryDto) {
    return this.homepageGalleryService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  remove(@Param('id') id: string) {
    return this.homepageGalleryService.remove(id);
  }
}
