import { NotificationType } from '@prisma/client';
import type { INotificationRepository } from '../../domain/repositories/notification.repository.interface';
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
export declare class NotificationsService {
    private readonly notificationsRepository;
    private readonly notificationsGateway;
    private readonly logger;
    constructor(notificationsRepository: INotificationRepository, notificationsGateway: NotificationsGateway);
    createNotification(userId: string, input: CreateNotificationInput): Promise<NotificationEntity>;
    getUserNotifications(userId: string, options?: GetNotificationsOptions): Promise<NotificationsResult>;
    markNotificationAsRead(userId: string, notificationId: string): Promise<NotificationEntity>;
    markAllNotificationsAsRead(userId: string): Promise<number>;
    getUnreadCount(userId: string): Promise<number>;
}
