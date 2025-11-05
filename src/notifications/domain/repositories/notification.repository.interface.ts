import { NotificationEntity } from '../entities/notification.entity';

export const NOTIFICATION_REPOSITORY = Symbol('NOTIFICATION_REPOSITORY');

export interface FindNotificationsOptions {
  skip?: number;
  take?: number;
  includeRead?: boolean;
}

export interface FindNotificationsResult {
  notifications: NotificationEntity[];
  total: number;
}

export interface INotificationRepository {
  create(notification: NotificationEntity): Promise<NotificationEntity>;
  findById(id: string): Promise<NotificationEntity | null>;
  findByUser(
    userId: string,
    options?: FindNotificationsOptions,
  ): Promise<FindNotificationsResult>;
  markAsRead(
    userId: string,
    notificationId: string,
  ): Promise<{ notification: NotificationEntity; updated: boolean } | null>;
  markAllAsRead(userId: string): Promise<number>;
  countUnread(userId: string): Promise<number>;
}
