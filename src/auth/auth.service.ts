import { Injectable, BadRequestException, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { MailService } from '../mail/mail.service';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { CreateUserByAdminDto } from './dto/create-user-by-admin.dto';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { Role } from '@prisma/client';
import { CloudinaryService } from '../cloudinary/cloudinary.service';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private cloudinaryService: CloudinaryService,
    private mailService: MailService,
  ) {}

  async register(dto: RegisterDto) {
    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [{ email: dto.email }, { employeeCode: dto.employeeCode }],
      },
    });
    if (existingUser) {
      throw new BadRequestException('Email hoặc Mã nhân viên đã tồn tại');
    }
    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const usersCount = await this.prisma.user.count();
    const role: Role = usersCount === 0 ? Role.ADMIN : Role.USER;
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const tokenExpires = new Date(Date.now() + 15 * 60 * 1000);
    const user = await this.prisma.user.create({
      data: {
        fullName: dto.fullName,
        email: dto.email,
        password: hashedPassword,
        employeeCode: dto.employeeCode,
        avatarUrl: dto.avatar || null,
        role: role,
        isActive: false,
        verificationToken: otp,
        tokenExpiresAt: tokenExpires,
      },
    });
    await this.mailService.sendVerificationEmail(user.email, otp);
    const { password, ...result } = user;
    return result;
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user) {
      throw new UnauthorizedException('Email hoặc Mật khẩu không chính xác');
    }
    const isPasswordValid = await bcrypt.compare(dto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Email hoặc Mật khẩu không chính xác');
    }

    if (!user.isActive) {
      if (!user.verificationToken) {
        throw new ForbiddenException('Tài khoản của bạn đã bị khóa hoặc vô hiệu hóa. Vui lòng liên hệ Admin.');
      }
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const tokenExpires = new Date(Date.now() + 15 * 60 * 1000);
      await this.prisma.user.update({
        where: { id: user.id },
        data: { verificationToken: otp, tokenExpiresAt: tokenExpires },
      });
      await this.mailService.sendVerificationEmail(user.email, otp);
      throw new ForbiddenException({
        statusCode: 403,
        requiresActivation: true,
        email: user.email,
        message:
          'Tài khoản của bạn chưa được kích hoạt. Mã OTP xác thực đã được gửi về Email.',
      });
    }

    const payload = { sub: user.id, email: user.email, role: user.role };
    return {
      accessToken: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        employeeCode: user.employeeCode,
        avatarUrl: user.avatarUrl,
      },
    };
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new BadRequestException('Người dùng không tồn tại');
    }
    const { password, ...result } = user;
    return result;
  }

  async updateProfile(userId: string, dto: { fullName: string; employeeCode: string }) {
    const existing = await this.prisma.user.findFirst({
      where: { employeeCode: dto.employeeCode, NOT: { id: userId } },
    });
    if (existing) {
      throw new BadRequestException('Mã nhân viên này đã thuộc về người dùng khác');
    }
    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { fullName: dto.fullName, employeeCode: dto.employeeCode },
    });
    const { password, ...result } = updated;
    return result;
  }

  async uploadAvatar(userId: string, file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Vui lòng chọn ảnh đại diện để tải lên');
    }
    const uploadResult = await this.cloudinaryService.uploadFile(file);
    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { avatarUrl: uploadResult.secure_url },
    });
    return { avatarUrl: updated.avatarUrl };
  }

  async verify(email: string, otp: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new BadRequestException('Người dùng không tồn tại');
    }
    if (user.verificationToken !== otp) {
      throw new BadRequestException('Mã OTP không hợp lệ');
    }
    if (user.tokenExpiresAt && user.tokenExpiresAt < new Date()) {
      throw new BadRequestException('Mã OTP đã hết hạn');
    }
    await this.prisma.user.update({
      where: { id: user.id },
      data: { isActive: true, verificationToken: null, tokenExpiresAt: null },
    });
    const payload = { sub: user.id, email: user.email, role: user.role };
    const accessToken = this.jwtService.sign(payload);
    const { password, ...result } = user;
    return { accessToken, user: result };
  }
  // Resend OTP for users who haven't activated
  async resendOtp(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new BadRequestException('Người dùng không tồn tại');
    }
    if (user.isActive) {
      throw new BadRequestException('Tài khoản đã kích hoạt, không cần gửi OTP');
    }
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const tokenExpires = new Date(Date.now() + 15 * 60 * 1000);
    await this.prisma.user.update({
      where: { id: user.id },
      data: { verificationToken: otp, tokenExpiresAt: tokenExpires },
    });
    await this.mailService.sendVerificationEmail(user.email, otp);
    return { message: 'OTP đã được gửi lại' };
  }

  async forgotPassword(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user || !user.isActive) {
      throw new BadRequestException('Email không tồn tại hoặc chưa kích hoạt');
    }
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const tokenExpires = new Date(Date.now() + 15 * 60 * 1000);
    await this.prisma.user.update({
      where: { id: user.id },
      data: { verificationToken: otp, tokenExpiresAt: tokenExpires },
    });
    await this.mailService.sendForgotPasswordEmail(user.email, otp);
    return { message: 'Đã gửi mã OTP đặt lại mật khẩu về email của bạn.' };
  }

  async resetPassword(dto: { email: string; otp: string; newPassword: string }) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user) {
      throw new BadRequestException('Người dùng không tồn tại');
    }
    if (user.verificationToken !== dto.otp) {
      throw new BadRequestException('Mã OTP không hợp lệ');
    }
    if (user.tokenExpiresAt && user.tokenExpiresAt < new Date()) {
      throw new BadRequestException('Mã OTP đã hết hạn');
    }
    const hashedPassword = await bcrypt.hash(dto.newPassword, 10);
    const updatedUser = await this.prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        verificationToken: null,
        tokenExpiresAt: null,
      },
    });

    const payload = { sub: updatedUser.id, email: updatedUser.email, role: updatedUser.role };
    const accessToken = this.jwtService.sign(payload);

    return {
      message: 'Đặt lại mật khẩu thành công!',
      accessToken,
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        fullName: updatedUser.fullName,
        role: updatedUser.role,
        employeeCode: updatedUser.employeeCode,
        avatarUrl: updatedUser.avatarUrl,
      },
    };
  }

  async createUserByAdmin(dto: CreateUserByAdminDto) {
    const existingUser = await this.prisma.user.findFirst({
      where: { email: dto.email },
    });
    if (existingUser) {
      throw new BadRequestException('Email đã tồn tại');
    }

    // Auto-generate employeeCode since it is unique and required by Prisma
    const employeeCode = `EMP${Date.now().toString().slice(-6)}${Math.floor(1000 + Math.random() * 9000)}`;

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.user.create({
      data: {
        fullName: dto.name,
        email: dto.email,
        password: hashedPassword,
        employeeCode,
        role: dto.role,
        phone: dto.phone || null,
        isActive: true, // Admin-created accounts are active immediately
      },
    });

    const { password, ...result } = user;
    return result;
  }
}
