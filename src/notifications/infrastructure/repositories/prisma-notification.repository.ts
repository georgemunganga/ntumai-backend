import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../shared/database/prisma.service';
import {
  FindNotificationsOptions,
  FindNotificationsResult,
  INotificationRepository,
} from '../../domain/repositories/notification.repository.interface';
import { NotificationEntity } from '../../domain/entities/notification.entity';
import { Notification } from '@prisma/client';

@Injectable()
export class PrismaNotificationRepository implements INotificationRepository {
  private readonly logger = new Logger(PrismaNotificationRepository.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(notification: NotificationEntity): Promise<NotificationEntity> {
    const created = await this.prisma.notification.create({
      data: {
        id: notification.id,
        userId: notification.userId,
        title: notification.title,
        message: notification.message,
        type: notification.type,
        isRead: notification.isRead,
        createdAt: notification.createdAt,
        updatedAt: notification.updatedAt,
      },
    });

    return this.toDomain(created);
  }

  async findById(id: string): Promise<NotificationEntity | null> {
    const notification = await this.prisma.notification.findUnique({
      where: { id },
    });

    return notification ? this.toDomain(notification) : null;
  }

  async findByUser(
    userId: string,
    options: FindNotificationsOptions = {},
  ): Promise<FindNotificationsResult> {
    const { skip = 0, take = 20, includeRead = true } = options;

    const [items, total] = await this.prisma.$transaction([
      this.prisma.notification.findMany({
        where: {
          userId,
          ...(includeRead ? {} : { isRead: false }),
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      this.prisma.notification.count({
        where: {
          userId,
          ...(includeRead ? {} : { isRead: false }),
        },
      }),
    ]);

    return {
      notifications: items.map((item) => this.toDomain(item)),
      total,
    };
  }

  async markAsRead(
    userId: string,
    notificationId: string,
  ): Promise<{ notification: NotificationEntity; updated: boolean } | null> {
    const existing = await this.prisma.notification.findFirst({
      where: { id: notificationId, userId },
    });

    if (!existing) {
      this.logger.debug(
        `Notification ${notificationId} not found for user ${userId} when marking as read`,
      );
      return null;
    }

    if (existing.isRead) {
      return {
        notification: this.toDomain(existing),
        updated: false,
      };
    }

    const updated = await this.prisma.notification.update({
      where: { id: notificationId },
      data: {
        isRead: true,
        updatedAt: new Date(),
      },
    });

    return {
      notification: this.toDomain(updated),
      updated: true,
    };
  }

  async markAllAsRead(userId: string): Promise<number> {
    const result = await this.prisma.notification.updateMany({
      where: {
        userId,
        isRead: false,
      },
      data: {
        isRead: true,
        updatedAt: new Date(),
      },
    });

    return result.count;
  }

  async countUnread(userId: string): Promise<number> {
    return this.prisma.notification.count({
      where: { userId, isRead: false },
    });
  }

  private toDomain(notification: Notification): NotificationEntity {
    return new NotificationEntity({
      id: notification.id,
      userId: notification.userId,
      title: notification.title,
      message: notification.message,
      type: notification.type,
      isRead: notification.isRead,
      createdAt: notification.createdAt,
      updatedAt: notification.updatedAt,
    });
  }
}
