import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from '../../../../shared/infrastructure/prisma.service';
import { NotificationsGateway } from '../../infrastructure/websocket/notifications.gateway';
import { RegisterDeviceDto } from '../dtos/notification.dto';

type NotificationKind = 'ORDER_UPDATE' | 'DELIVERY_UPDATE' | 'PROMOTION' | 'SYSTEM' | 'CHAT';
type NotificationMetadata = Record<string, unknown> | null | undefined;

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

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

  async registerDevice(userId: string, input: RegisterDeviceDto) {
    const pushTokenModel = (this.prisma as any).pushToken;
    const now = new Date();

    await pushTokenModel.updateMany({
      where: {
        deviceId: input.deviceId,
        userId: { not: userId },
      },
      data: {
        isActive: false,
        updatedAt: now,
      },
    });

    await pushTokenModel.upsert({
      where: {
        userId_deviceId: {
          userId,
          deviceId: input.deviceId,
        },
      },
      create: {
        userId,
        deviceId: input.deviceId,
        platform: input.platform,
        pushToken: input.pushToken,
        isActive: true,
        lastSeen: now,
      },
      update: {
        platform: input.platform,
        pushToken: input.pushToken,
        isActive: true,
        lastSeen: now,
        updatedAt: now,
      },
    });

    const notificationModel = (this.prisma as any).notification;
    const unreadCount = await notificationModel.count({
      where: { userId, isRead: false },
    });

    return {
      success: true,
      data: {
        success: true,
        unreadCount,
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
    void this.dispatchPushNotification(input.userId, payload);

    return payload;
  }

  private async dispatchPushNotification(
    userId: string,
    notification: {
      title: string;
      message: string;
      type: 'order_update' | 'delivery' | 'promotion' | 'system' | 'chat';
      metadata?: NotificationMetadata;
    },
  ) {
    try {
      const pushTokenModel = (this.prisma as any).pushToken;
      const tokens = await pushTokenModel.findMany({
        where: { userId, isActive: true },
        select: {
          id: true,
          pushToken: true,
        },
      });

      const expoTokens = tokens.filter((entry: any) =>
        typeof entry.pushToken === 'string' &&
        (entry.pushToken.startsWith('ExponentPushToken[') ||
          entry.pushToken.startsWith('ExpoPushToken[')),
      );

      if (!expoTokens.length) {
        return;
      }

      const body = JSON.stringify(
        expoTokens.map((entry: any) => ({
          to: entry.pushToken,
          title: notification.title,
          body: notification.message,
          sound: 'default',
          data: {
            type: notification.type,
            ...(notification.metadata ?? {}),
          },
        })),
      );

      const response = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body,
      });

      if (!response.ok) {
        this.logger.warn(
          `Expo push request failed with status ${response.status} for user ${userId}`,
        );
        return;
      }

      const payload = (await response.json()) as {
        data?: Array<{ status?: string; details?: { error?: string } }>;
      };

      const invalidTokenIds = expoTokens
        .map((entry: any, index: number) => ({
          id: entry.id as string,
          result: payload.data?.[index],
        }))
        .filter(
          ({ result }) =>
            result?.status === 'error' &&
            result.details?.error === 'DeviceNotRegistered',
        )
        .map(({ id }) => id);

      if (invalidTokenIds.length) {
        await pushTokenModel.updateMany({
          where: { id: { in: invalidTokenIds } },
          data: {
            isActive: false,
            updatedAt: new Date(),
          },
        });
      }
    } catch (error) {
      this.logger.warn(
        `Push delivery failed for user ${userId}: ${
          error instanceof Error ? error.message : 'unknown error'
        }`,
      );
    }
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
