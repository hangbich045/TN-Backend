import { IsNotEmpty, IsString, IsInt, Min, Max, IsBoolean, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateStudioBookingDto {
  @IsNotEmpty({ message: 'Họ tên không được để trống' })
  @IsString({ message: 'Họ tên phải là chuỗi' })
  fullName: string;

  @IsNotEmpty({ message: 'Số lượng người tham gia không được để trống' })
  @Type(() => Number)
  @IsInt({ message: 'Số lượng người phải là số nguyên' })
  @Min(1, { message: 'Số lượng người tối thiểu là 1' })
  @Max(40, { message: 'Số lượng người tham gia tối đa là 40 người' })
  participants: number;

  @IsNotEmpty({ message: 'Mục đích sử dụng không được để trống' })
  @IsString({ message: 'Mục đích sử dụng phải là chuỗi' })
  @MaxLength(500, { message: 'Mục đích sử dụng không được vượt quá 500 ký tự' })
  purpose: string;

  @IsNotEmpty({ message: 'Vui lòng chọn có hỗ trợ kỹ thuật hay không' })
  @IsBoolean({ message: 'Hỗ trợ kỹ thuật phải là giá trị Boolean' })
  technicalSupport: boolean;

  @IsNotEmpty({ message: 'Thời gian bắt đầu không được để trống' })
  @Type(() => Date)
  startTime: Date;

  @IsNotEmpty({ message: 'Thời gian kết thúc không được để trống' })
  @Type(() => Date)
  endTime: Date;
}
