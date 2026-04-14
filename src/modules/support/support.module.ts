import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { CommunicationsModule } from '../communications/communications.module';
import { SupportTicketsService } from './application/services/support-tickets.service';
import { SupportTicketsController } from './presentation/controllers/support-tickets.controller';

@Module({
  imports: [AuthModule, CommunicationsModule],
  controllers: [SupportTicketsController],
  providers: [SupportTicketsService],
  exports: [SupportTicketsService],
})
export class SupportModule {}
