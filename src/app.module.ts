import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MailerModule } from '@nestjs-modules/mailer';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { CloudinaryModule } from './cloudinary/cloudinary.module';
import { EquipmentModule } from './equipment/equipment.module';
import { BorrowRequestModule } from './borrow-request/borrow-request.module';
import { StudioBookingModule } from './studio-booking/studio-booking.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { CategoryModule } from './equipment/category/category.module';
import { HomepageContentModule } from './homepage-content/homepage-content.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MailerModule.forRoot({
      transport: {
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      },
      defaults: {
        from: '"LHU Media" <no-reply@webstu.com>',
      },
    }),
    PrismaModule,
    AuthModule,
    CloudinaryModule,
    EquipmentModule,
    BorrowRequestModule,
    StudioBookingModule,
    DashboardModule,
    CategoryModule,
    HomepageContentModule,
  ],
})
export class AppModule { }
