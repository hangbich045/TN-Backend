import { Injectable, Logger } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(private readonly mailerService: MailerService) { }

  async sendVerificationEmail(to: string, otp: string) {
    const subject = 'Mã xác thực tài khoản LHUMedia';
    const html = `
      <div style="font-family:Arial,sans-serif; background:#f9f9f9; padding:20px; border-radius:8px; max-width:600px; margin:auto;">
        <h2 style="color:#222;">Xác thực tài khoản LHUMedia</h2>
        <p>Chào bạn,</p>
        <p>Mã OTP xác thực tài khoản của bạn là: <b style="color:#d9534f; font-size:1.2em;">${otp}</b>. Mã này có hiệu lực trong <b>15 phút</b>.</p>
        <p style="font-size:0.9em; color:#555;">Nếu bạn không yêu cầu đăng ký, vui lòng bỏ qua email này.</p>
        <hr style="border:none; border-top:1px solid #eee; margin:20px 0;"/>
        <p style="font-size:0.8em; color:#999;">LHUMedia – Hệ thống quản lý studio</p>
      </div>`;
    try {
      await this.mailerService.sendMail({
        to,
        subject,
        html,
      });
      this.logger.log(`Verification email sent to ${to}`);
    } catch (error) {
      this.logger.error('Failed to send verification email', error);
      throw error;
    }
  }

  async sendForgotPasswordEmail(to: string, otp: string) {
    const subject = 'Đặt lại mật khẩu LHUMedia';
    const html = `
      <div style="font-family:Arial,sans-serif; background:#f9f9f9; padding:20px; border-radius:8px; max-width:600px; margin:auto;">
        <h2 style="color:#222;">Yêu cầu đặt lại mật khẩu LHUMedia</h2>
        <p>Chào bạn,</p>
        <p>Bạn đã yêu cầu đặt lại mật khẩu cho tài khoản LHUMedia của mình.</p>
        <p>Mã OTP xác thực đặt lại mật khẩu của bạn là: <b style="color:#2b6cb0; font-size:1.2em;">${otp}</b>. Mã này có hiệu lực trong <b>15 phút</b>.</p>
        <p style="font-size:0.9em; color:#555;">Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email này để bảo mật tài khoản.</p>
        <hr style="border:none; border-top:1px solid #eee; margin:20px 0;"/>
        <p style="font-size:0.8em; color:#999;">LHUMedia – Hệ thống quản lý studio</p>
      </div>`;
    try {
      await this.mailerService.sendMail({
        to,
        subject,
        html,
      });
      this.logger.log(`Forgot password email sent to ${to}`);
    } catch (error) {
      this.logger.error('Failed to send forgot password email', error);
      throw error;
    }
  }
}
