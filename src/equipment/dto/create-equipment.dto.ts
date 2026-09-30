import { IsNotEmpty, IsString, IsInt, Min, IsEnum, IsOptional } from 'class-validator';
import { EquipmentStatus } from '@prisma/client';
import { Type } from 'class-transformer';

export class CreateEquipmentDto {
  @IsNotEmpty({ message: 'Mã thiết bị không được để trống' })
  @IsString({ message: 'Mã thiết bị phải là chuỗi' })
  code: string;

  @IsNotEmpty({ message: 'Tên thiết bị không được để trống' })
  @IsString({ message: 'Tên thiết bị phải là chuỗi' })
  name: string;

  @IsNotEmpty({ message: 'Danh mục không được để trống' })
  @IsString({ message: 'Danh mục phải là chuỗi' })
  category: string;

  @IsNotEmpty({ message: 'Mô tả thiết bị không được để trống' })
  @IsString({ message: 'Mô tả thiết bị phải là chuỗi' })
  description: string;

  @IsNotEmpty({ message: 'Hình ảnh không được để trống' })
  @IsString({ message: 'Hình ảnh phải là chuỗi' })
  image: string;

  @IsNotEmpty({ message: 'Số lượng không được để trống' })
  @Type(() => Number)
  @IsInt({ message: 'Số lượng phải là số nguyên' })
  @Min(0, { message: 'Số lượng phải lớn hơn hoặc bằng 0' })
  quantity: number;

  @IsOptional()
  @IsEnum(EquipmentStatus, { message: 'Trạng thái không hợp lệ' })
  status?: EquipmentStatus;
}
