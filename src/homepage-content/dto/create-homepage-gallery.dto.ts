import { IsBoolean, IsInt, IsNotEmpty, IsOptional, IsString, IsUrl, Min } from 'class-validator';

export class CreateHomepageGalleryDto {
  @IsNotEmpty({ message: 'URL hình ảnh không được để trống' })
  @IsUrl({}, { message: 'URL hình ảnh không hợp lệ' })
  imageUrl: string;

  @IsNotEmpty({ message: 'Tiêu đề hình ảnh không được để trống' })
  @IsString()
  title: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
