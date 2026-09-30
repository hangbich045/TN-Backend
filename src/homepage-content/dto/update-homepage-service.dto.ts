import { IsBoolean, IsIn, IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';
import { HOMEPAGE_SERVICE_ICONS } from '../homepage.defaults';

export class UpdateHomepageServiceDto {
  @IsOptional()
  @IsNotEmpty({ message: 'Tiêu đề dịch vụ không được để trống' })
  @IsString()
  title?: string;

  @IsOptional()
  @IsNotEmpty({ message: 'Mô tả dịch vụ không được để trống' })
  @IsString()
  description?: string;

  @IsOptional()
  @IsIn(HOMEPAGE_SERVICE_ICONS, { message: 'Icon không hợp lệ' })
  icon?: string;

  @IsOptional()
  @IsNotEmpty({ message: 'Màu sắc không được để trống' })
  @IsString()
  color?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
