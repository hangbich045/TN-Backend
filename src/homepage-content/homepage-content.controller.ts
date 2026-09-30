import {
  Controller,
  Get,
  Put,
  Post,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { HomepageContentService } from './homepage-content.service';
import { UpdateHomepageDto } from './dto/update-homepage.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';
import { FileInterceptor } from '@nestjs/platform-express';
import { CloudinaryService } from '../cloudinary/cloudinary.service';

@Controller('homepage-content')
export class HomepageContentController {
  constructor(
    private readonly homepageContentService: HomepageContentService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  @Get()
  getContent() {
    return this.homepageContentService.getContent();
  }

  @Put()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  updateContent(@Body() dto: UpdateHomepageDto) {
    return this.homepageContentService.updateContent(dto);
  }

  @Post('video')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @UseInterceptors(FileInterceptor('file'))
  async uploadVideo(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Vui lòng chọn tệp video');
    }

    const allowedExtensions = ['.mp4', '.webm'];
    const filename = file.originalname.toLowerCase();
    const hasAllowedExtension = allowedExtensions.some((ext) =>
      filename.endsWith(ext),
    );
    const allowedMimeTypes = ['video/mp4', 'video/webm'];
    const hasAllowedMime = allowedMimeTypes.includes(file.mimetype);

    if (!hasAllowedExtension || !hasAllowedMime) {
      throw new BadRequestException('Chỉ chấp nhận tệp video định dạng MP4 hoặc WebM');
    }

    const maxSizeBytes = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSizeBytes) {
      throw new BadRequestException('Tệp video vượt quá dung lượng tối đa cho phép (50MB)');
    }

    const result = await this.cloudinaryService.uploadFile(file, {
      resource_type: 'video',
    });
    return {
      url: result.secure_url,
    };
  }

  @Post('poster')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @UseInterceptors(FileInterceptor('file'))
  async uploadPoster(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Vui lòng chọn tệp hình ảnh làm ảnh chờ (Poster)');
    }

    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
    const filename = file.originalname.toLowerCase();
    const hasAllowedExtension = allowedExtensions.some((ext) =>
      filename.endsWith(ext),
    );
    const isImageMime = file.mimetype.startsWith('image/');

    if (!hasAllowedExtension || !isImageMime) {
      throw new BadRequestException('Chỉ chấp nhận tệp hình ảnh định dạng JPG, JPEG, PNG hoặc WEBP');
    }

    const maxSizeBytes = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSizeBytes) {
      throw new BadRequestException('Tệp ảnh vượt quá dung lượng tối đa cho phép (10MB)');
    }

    const result = await this.cloudinaryService.uploadFile(file, {
      resource_type: 'image',
    });
    return {
      url: result.secure_url,
    };
  }
}
