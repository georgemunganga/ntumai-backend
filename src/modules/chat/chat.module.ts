import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { DeliveriesModule } from '../deliveries/deliveries.module';
import { ChatService } from './application/services/chat.service';
import { ChatController } from './presentation/controllers/chat.controller';

@Module({
  imports: [AuthModule, DeliveriesModule],
  controllers: [ChatController],
  providers: [ChatService],
  exports: [ChatService],
})
export class ChatModule {}
