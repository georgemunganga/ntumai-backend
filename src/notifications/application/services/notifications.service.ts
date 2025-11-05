import {
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  forwardRef,
} from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { NotificationType } from '@prisma/client';
import type { INotificationRepository } from '../../domain/repositories/notification.repository.interface';
import { NOTIFICATION_REPOSITORY } from '../../domain/repositories/notification.repository.interface';
import { NotificationEntity } from '../../domain/entities/notification.entity';
import { NotificationsGateway } from '../../infrastructure/websocket/notifications.gateway';

export interface CreateNotificationInput {
  title: string;
  message: string;
  type: NotificationType;
  isRead?: boolean;
  createdAt?: Date;
}

export interface GetNotificationsOptions {
  page?: number;
  limit?: number;
  includeRead?: boolean;
}

export interface NotificationsResult {
  notifications: NotificationEntity[];
  meta: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
  unreadCount: number;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @Inject(NOTIFICATION_REPOSITORY)
    private readonly notificationsRepository: INotificationRepository,
    @Inject(forwardRef(() => NotificationsGateway))
    private readonly notificationsGateway: NotificationsGateway,
  ) {}

  async createNotification(
    userId: string,
    input: CreateNotificationInput,
  ): Promise<NotificationEntity> {
    const now = input.createdAt ?? new Date();
    const notification = new NotificationEntity({
      id: uuidv4(),
      userId,
      title: input.title,
      message: input.message,
      type: input.type,
      isRead: Boolean(input.isRead),
      createdAt: now,
      updatedAt: now,
    });

    const created = await this.notificationsRepository.create(notification);

    if (!created.isRead) {
      this.notificationsGateway.emitNotification(userId, created);
    }

    return created;
  }

  async getUserNotifications(
    userId: string,
    options: GetNotificationsOptions = {},
  ): Promise<NotificationsResult> {
    const page = Math.max(1, options.page ?? 1);
    const limit = Math.min(Math.max(options.limit ?? 20, 1), 50);
    const skip = (page - 1) * limit;

    const { notifications, total } =
      await this.notificationsRepository.findByUser(userId, {
        skip,
        take: limit,
        includeRead: options.includeRead ?? true,
      });

    const unreadCount = await this.notificationsRepository.countUnread(userId);

    return {
      notifications,
      meta: {
        page,
        limit,
        total,
        hasMore: skip + notifications.length < total,
      },
      unreadCount,
    };
  }

  async markNotificationAsRead(
    userId: string,
    notificationId: string,
  ): Promise<NotificationEntity> {
    const result = await this.notificationsRepository.markAsRead(
      userId,
      notificationId,
    );

    if (!result) {
      throw new NotFoundException('Notification not found');
    }

    const { notification, updated: wasUpdated } = result;

    if (wasUpdated) {
      this.notificationsGateway.emitNotificationRead(userId, notification);
    }

    return notification;
  }

  async markAllNotificationsAsRead(userId: string): Promise<number> {
    const updatedCount =
      await this.notificationsRepository.markAllAsRead(userId);

    if (updatedCount > 0) {
      this.notificationsGateway.emitNotificationsMarkedAsRead(userId);
    }

    return updatedCount;
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.notificationsRepository.countUnread(userId);
  }
}
