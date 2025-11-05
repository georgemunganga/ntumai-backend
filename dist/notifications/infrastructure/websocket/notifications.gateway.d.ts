import { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { NotificationsService } from '../../application/services/notifications.service';
import { NotificationEntity } from '../../domain/entities/notification.entity';
export declare class NotificationsGateway implements OnGatewayConnection, OnGatewayDisconnect {
    private readonly notificationsService;
    server: Server;
    private readonly logger;
    private userSockets;
    constructor(notificationsService: NotificationsService);
    handleConnection(client: Socket): void;
    handleDisconnect(client: Socket): void;
    handleSubscribeUser(data: {
        userId: string;
    }, client: Socket): {
        success: boolean;
        message: string;
    };
    handleUnsubscribeUser(data: {
        userId: string;
    }, client: Socket): {
        success: boolean;
        message: string;
    };
    handleMarkRead(data: {
        notificationId: string;
        userId: string;
    }, client: Socket): Promise<{
        success: boolean;
        message: any;
    }>;
    emitNotification(userId: string, notification: NotificationEntity): void;
    emitNotificationUpdate(userId: string, notificationId: string, data: any): void;
    emitNotificationDelete(userId: string, notificationId: string): void;
    emitNotificationRead(userId: string, notification: NotificationEntity): void;
    emitNotificationsMarkedAsRead(userId: string): void;
    broadcastToAll(event: string, data: any): void;
    isUserOnline(userId: string): boolean;
    getOnlineUsersCount(): number;
    private serializeNotification;
}
