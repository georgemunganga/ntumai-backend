import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from '../../../../shared/infrastructure/prisma.service';
import { NotificationsGateway } from '../../infrastructure/websocket/notifications.gateway';

type NotificationKind = 'ORDER_UPDATE' | 'DELIVERY_UPDATE' | 'PROMOTION' | 'SYSTEM' | 'CHAT';
type NotificationMetadata = Record<string, unknown> | null | undefined;

@Injectable()
export class NotificationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsGateway: NotificationsGateway,
  ) {}

  async list(userId: string, limit = 50) {
    const safeLimit = Math.min(Math.max(Number(limit) || 20, 1), 100);
    const notificationModel = (this.prisma as any).notification;

    const [notifications, unreadCount] = await Promise.all([
      notificationModel.findMany({
        where: { userId },
        orderBy: [{ createdAt: 'desc' }],
        take: safeLimit,
      }),
      notificationModel.count({
        where: { userId, isRead: false },
      }),
    ]);

    return {
      success: true,
      data: {
        notifications: notifications.map((notification: any) =>
          this.toPayload(notification),
        ),
        unreadCount,
      },
    };
  }

  async markRead(userId: string, notificationId: string) {
    const notificationModel = (this.prisma as any).notification;
    const notification = await notificationModel.findFirst({
      where: { id: notificationId, userId },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    if (!notification.isRead) {
      await notificationModel.update({
        where: { id: notificationId },
        data: {
          isRead: true,
          updatedAt: new Date(),
        },
      });
    }

    return {
      success: true,
      data: {
        success: true,
        unreadCount: await notificationModel.count({
          where: { userId, isRead: false },
        }),
      },
    };
  }

  async markAllRead(userId: string) {
    const notificationModel = (this.prisma as any).notification;

    await notificationModel.updateMany({
      where: { userId, isRead: false },
      data: {
        isRead: true,
        updatedAt: new Date(),
      },
    });

    return {
      success: true,
      data: {
        success: true,
        unreadCount: 0,
      },
    };
  }

  async remove(userId: string, notificationId: string) {
    const notificationModel = (this.prisma as any).notification;
    const notification = await notificationModel.findFirst({
      where: { id: notificationId, userId },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    await notificationModel.delete({
      where: { id: notificationId },
    });

    return {
      success: true,
      data: {
        success: true,
        unreadCount: await notificationModel.count({
          where: { userId, isRead: false },
        }),
      },
    };
  }

  async createNotification(input: {
    userId: string;
    title: string;
    message: string;
    type: NotificationKind;
    metadata?: NotificationMetadata;
  }) {
    if (!input.userId) {
      throw new BadRequestException('Notification user is required');
    }

    const notificationModel = (this.prisma as any).notification;
    const now = new Date();

    const notification = await notificationModel.create({
      data: {
        id: randomUUID(),
        userId: input.userId,
        title: input.title.trim(),
        message: input.message.trim(),
        type: input.type,
        metadata: input.metadata ?? undefined,
        isRead: false,
        updatedAt: now,
      },
    });

    const unreadCount = await notificationModel.count({
      where: { userId: input.userId, isRead: false },
    });

    const payload = this.toPayload(notification);
    this.notificationsGateway.emitNotificationCreated(
      input.userId,
      payload,
      unreadCount,
    );

    return payload;
  }

  private toPayload(notification: {
    id: string;
    userId: string;
    title: string;
    message: string;
    type: string;
    metadata?: NotificationMetadata;
    isRead: boolean;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      id: notification.id,
      userId: notification.userId,
      title: notification.title,
      message: notification.message,
      type: this.toClientType(notification.type),
      metadata: notification.metadata || null,
      isRead: notification.isRead,
      createdAt: notification.createdAt.toISOString(),
      updatedAt: notification.updatedAt.toISOString(),
    };
  }

  private toClientType(value: string) {
    switch (value) {
      case 'ORDER_UPDATE':
        return 'order_update' as const;
      case 'DELIVERY_UPDATE':
        return 'delivery' as const;
      case 'PROMOTION':
        return 'promotion' as const;
      case 'CHAT':
        return 'chat' as const;
      default:
        return 'system' as const;
    }
  }
}
