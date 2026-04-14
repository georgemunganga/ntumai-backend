import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { SupportTicketsService } from './application/services/support-tickets.service';
import { SupportTicketsController } from './presentation/controllers/support-tickets.controller';

@Module({
  imports: [AuthModule],
  controllers: [SupportTicketsController],
  providers: [SupportTicketsService],
  exports: [SupportTicketsService],
})
export class SupportModule {}
