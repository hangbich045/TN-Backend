import { IsString, IsInt, Min, IsEnum, IsOptional } from 'class-validator';
import { EquipmentStatus } from '@prisma/client';
import { Type } from 'class-transformer';

export class UpdateEquipmentDto {
  @IsOptional()
  @IsString({ message: 'Mã thiết bị phải là chuỗi' })
  code?: string;

  @IsOptional()
  @IsString({ message: 'Tên thiết bị phải là chuỗi' })
  name?: string;

  @IsOptional()
  @IsString({ message: 'Danh mục phải là chuỗi' })
  category?: string;

  @IsOptional()
  @IsString({ message: 'Mô tả thiết bị phải là chuỗi' })
  description?: string;

  @IsOptional()
  @IsString({ message: 'Hình ảnh phải là chuỗi' })
  image?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Số lượng phải là số nguyên' })
  @Min(0, { message: 'Số lượng phải lớn hơn hoặc bằng 0' })
  quantity?: number;

  @IsOptional()
  @IsEnum(EquipmentStatus, { message: 'Trạng thái không hợp lệ' })
  status?: EquipmentStatus;
}
