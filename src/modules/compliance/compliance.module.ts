import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { ComplianceService } from './application/services/compliance.service';
import { ComplianceController } from './presentation/controllers/compliance.controller';

@Module({
  imports: [AuthModule, NotificationsModule],
  controllers: [ComplianceController],
  providers: [ComplianceService],
  exports: [ComplianceService],
})
export class ComplianceModule {}
