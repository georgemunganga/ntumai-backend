import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { DeliveriesModule } from '../deliveries/deliveries.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { ChatService } from './application/services/chat.service';
import { ChatGateway } from './infrastructure/websocket/chat.gateway';
import { ChatController } from './presentation/controllers/chat.controller';

@Module({
  imports: [AuthModule, DeliveriesModule, NotificationsModule],
  controllers: [ChatController],
  providers: [ChatService, ChatGateway],
  exports: [ChatService, ChatGateway],
})
export class ChatModule {}
