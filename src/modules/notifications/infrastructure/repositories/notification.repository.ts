import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../shared/infrastructure/prisma.service';
import { NotificationEntity } from '../../domain/entities/notification.entity';
import { Notification as PrismaNotification } from '@prisma/client';

@Injectable()
export class NotificationRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<NotificationEntity | null> {
    const notification = await this.prisma.notification.findUnique({ where: { id } });
    return notification ? this.toDomain(notification) : null;
  }

  async findByUserId(userId: string): Promise<NotificationEntity[]> {
    const notifications = await this.prisma.notification.findMany({ where: { userId } });
    return notifications.map(this.toDomain);
  }

  async save(notification: NotificationEntity): Promise<NotificationEntity> {
    const saved = await this.prisma.notification.upsert({
      where: { id: notification.id || 'non-existent-id' },
      update: { ...notification },
      create: { ...notification },
    });
    return this.toDomain(saved);
  }

  private toDomain(raw: PrismaNotification): NotificationEntity {
    return new NotificationEntity(raw);
  }
}
