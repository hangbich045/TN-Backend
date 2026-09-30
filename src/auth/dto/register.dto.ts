import { IsEmail, IsNotEmpty, IsString, MinLength, IsOptional } from 'class-validator';

export class RegisterDto {
  @IsNotEmpty({ message: 'Họ tên không được để trống' })
  @IsString({ message: 'Họ tên phải là chuỗi ký tự' })
  fullName: string;

  @IsNotEmpty({ message: 'Email không được để trống' })
  @IsEmail({}, { message: 'Email không đúng định dạng' })
  email: string;

  @IsNotEmpty({ message: 'Mật khẩu không được để trống' })
  @MinLength(6, { message: 'Mật khẩu phải dài ít nhất 6 ký tự' })
  password: string;

  @IsNotEmpty({ message: 'Mã nhân viên không được để trống' })
  @IsString({ message: 'Mã nhân viên phải là chuỗi ký tự' })
  employeeCode: string;

  @IsOptional()
  @IsString({ message: 'Ảnh đại diện phải là chuỗi ký tự' })
  avatar?: string;
}
