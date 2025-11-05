import { NotificationsService } from '../../application/services/notifications.service';
import { NotificationResponseDto } from '../../application/dtos/notification-response.dto';
export declare class NotificationsController {
    private readonly notificationsService;
    constructor(notificationsService: NotificationsService);
    getNotifications(req: any, page?: string, limit?: string, includeRead?: string): Promise<{
        success: boolean;
        data: {
            notifications: NotificationResponseDto[];
            meta: {
                page: number;
                limit: number;
                total: number;
                hasMore: boolean;
            };
            unreadCount: number;
        };
    }>;
    markNotificationAsRead(req: any, notificationId: string): Promise<{
        success: boolean;
        data: {
            notification: NotificationResponseDto;
        };
    }>;
    markAllNotificationsAsRead(req: any): Promise<{
        success: boolean;
        data: {
            updated: number;
        };
    }>;
    getUnreadCount(req: any): Promise<{
        success: boolean;
        data: {
            unreadCount: number;
        };
    }>;
    private mapNotification;
}
