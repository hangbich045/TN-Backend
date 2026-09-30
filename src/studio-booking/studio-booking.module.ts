import { Module } from '@nestjs/common';
import { StudioBookingService } from './studio-booking.service';
import { StudioBookingController } from './studio-booking.controller';

@Module({
  controllers: [StudioBookingController],
  providers: [StudioBookingService],
  exports: [StudioBookingService],
})
export class StudioBookingModule {}
