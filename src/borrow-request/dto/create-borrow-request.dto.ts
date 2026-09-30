import { IsNotEmpty, IsString, IsArray, ValidateNested, IsInt, Min, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';

class BorrowedEquipmentDto {
  @IsNotEmpty({ message: 'Mã thiết bị không được để trống' })
  @IsString()
  equipmentId: string;

  @IsNotEmpty({ message: 'Số lượng không được để trống' })
  @IsInt({ message: 'Số lượng phải là số nguyên' })
  @Min(1, { message: 'Số lượng tối thiểu là 1' })
  quantity: number;
}

export class CreateBorrowRequestDto {
  @IsNotEmpty({ message: 'Danh sách thiết bị không được để trống' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BorrowedEquipmentDto)
  equipments: BorrowedEquipmentDto[];

  @IsNotEmpty({ message: 'Mục đích mượn không được để trống' })
  @IsString({ message: 'Mục đích mượn phải là chuỗi' })
  @MaxLength(500, { message: 'Mục đích mượn không được vượt quá 500 ký tự' })
  purpose: string;

  @IsNotEmpty({ message: 'Ngày giờ mượn không được để trống' })
  @Type(() => Date)
  borrowDate: Date;

  @IsNotEmpty({ message: 'Ngày giờ trả không được để trống' })
  @Type(() => Date)
  returnDate: Date;
}
