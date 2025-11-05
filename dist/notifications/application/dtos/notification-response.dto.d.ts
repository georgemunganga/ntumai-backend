import { NotificationType } from '@prisma/client';
export declare class NotificationResponseDto {
    id: string;
    title: string;
    message: string;
    type: NotificationType;
    isRead: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export declare class NotificationsListMetaDto {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
}
export declare class NotificationsListResponseDto {
    notifications: NotificationResponseDto[];
    meta: NotificationsListMetaDto;
    unreadCount: number;
}
