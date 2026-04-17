import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { NotificationsService } from './application/services/notifications.service';
import { NotificationsGateway } from './infrastructure/websocket/notifications.gateway';
import { NotificationsController } from './presentation/controllers/notifications.controller';

@Module({
  imports: [AuthModule],
  controllers: [NotificationsController],
  providers: [NotificationsService, NotificationsGateway],
  exports: [NotificationsService, NotificationsGateway],
})
export class NotificationsModule {}
