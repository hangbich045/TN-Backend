import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdateHomepageDto {
  @IsNotEmpty({ message: 'Tiêu đề Hero không được để trống' })
  @IsString()
  heroTitle: string;

  @IsNotEmpty({ message: 'Mô tả Hero không được để trống' })
  @IsString()
  heroDescription: string;

  @IsNotEmpty({ message: 'URL Video Hero không được để trống' })
  @IsString()
  heroVideoUrl: string;

  @IsOptional()
  @IsString()
  heroPosterUrl?: string;

  @IsNotEmpty({ message: 'Nội dung giới thiệu không được để trống' })
  @IsString()
  aboutContent: string;

  @IsNotEmpty({ message: 'Thông tin liên hệ không được để trống' })
  @IsString()
  contactInfo: string;
}
