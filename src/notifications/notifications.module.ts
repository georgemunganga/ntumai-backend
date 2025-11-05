import { Module } from '@nestjs/common';
import { NotificationsGateway } from './infrastructure/websocket/notifications.gateway';
import { NotificationsService } from './application/services/notifications.service';
import { NotificationsController } from './presentation/controllers/notifications.controller';
import { NOTIFICATION_REPOSITORY } from './domain/repositories/notification.repository.interface';
import { PrismaNotificationRepository } from './infrastructure/repositories/prisma-notification.repository';
import { DatabaseModule } from '../shared/database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [NotificationsController],
  providers: [
    NotificationsGateway,
    NotificationsService,
    {
      provide: NOTIFICATION_REPOSITORY,
      useClass: PrismaNotificationRepository,
    },
  ],
  exports: [NotificationsService, NotificationsGateway],
})
export class NotificationsModule {}
