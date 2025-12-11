import { Module } from '@nestjs/common';
import { NotificationController } from './interfaces/controllers/notification.controller';
import { NotificationService } from './application/services/notification.service';
import { NotificationRepository } from './infrastructure/repositories/notification.repository';
import { PrismaService } from '../../shared/infrastructure/prisma.service';

@Module({
  controllers: [NotificationController],
  providers: [NotificationService, NotificationRepository, PrismaService],
  exports: [NotificationService, NotificationRepository],
})
export class NotificationsModule {}
