import { Module } from '@nestjs/common';
import { BorrowRequestService } from './borrow-request.service';
import { BorrowRequestController } from './borrow-request.controller';

@Module({
  controllers: [BorrowRequestController],
  providers: [BorrowRequestService],
  exports: [BorrowRequestService],
})
export class BorrowRequestModule {}
