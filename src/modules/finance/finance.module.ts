import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { FinanceService } from './application/services/finance.service';
import { FinanceController } from './presentation/controllers/finance.controller';

@Module({
  imports: [AuthModule, NotificationsModule],
  controllers: [FinanceController],
  providers: [FinanceService],
  exports: [FinanceService],
})
export class FinanceModule {}

