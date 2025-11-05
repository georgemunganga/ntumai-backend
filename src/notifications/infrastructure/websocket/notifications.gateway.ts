import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Inject, Logger, forwardRef } from '@nestjs/common';
import { NotificationsService } from '../../application/services/notifications.service';
import { NotificationEntity } from '../../domain/entities/notification.entity';

@WebSocketGateway({
  namespace: '/notifications',
  cors: {
    origin: '*',
  },
})
export class NotificationsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(NotificationsGateway.name);
  private userSockets: Map<string, Set<string>> = new Map(); // userId -> Set of socketIds

  constructor(
    @Inject(forwardRef(() => NotificationsService))
    private readonly notificationsService: NotificationsService,
  ) {}

  handleConnection(client: Socket) {
    this.logger.log(`Client connected to notifications: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected from notifications: ${client.id}`);

    // Clean up user socket mapping
    this.userSockets.forEach((sockets, userId) => {
      sockets.delete(client.id);
      if (sockets.size === 0) {
        this.userSockets.delete(userId);
      }
    });
  }

  @SubscribeMessage('subscribe:user')
  handleSubscribeUser(
    @MessageBody() data: { userId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const { userId } = data;

    if (!this.userSockets.has(userId)) {
      this.userSockets.set(userId, new Set());
    }

    this.userSockets.get(userId)!.add(client.id);
    client.join(`user:${userId}`);

    this.logger.log(
      `Client ${client.id} subscribed to user ${userId} notifications`,
    );

    return {
      success: true,
      message: `Subscribed to notifications for user ${userId}`,
    };
  }

  @SubscribeMessage('unsubscribe:user')
  handleUnsubscribeUser(
    @MessageBody() data: { userId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const { userId } = data;

    if (this.userSockets.has(userId)) {
      this.userSockets.get(userId)!.delete(client.id);
    }

    client.leave(`user:${userId}`);

    this.logger.log(
      `Client ${client.id} unsubscribed from user ${userId} notifications`,
    );

    return {
      success: true,
      message: `Unsubscribed from notifications for user ${userId}`,
    };
  }

  @SubscribeMessage('mark:read')
  async handleMarkRead(
    @MessageBody() data: { notificationId: string; userId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const { notificationId, userId } = data;

    try {
      await this.notificationsService.markNotificationAsRead(
        userId,
        notificationId,
      );
      this.logger.debug(
        `Notification ${notificationId} marked as read for user ${userId}`,
      );
      return { success: true, message: 'Notification marked as read' };
    } catch (error: any) {
      this.logger.warn(
        `Failed to mark notification ${notificationId} for user ${userId} as read via websocket: ${error.message}`,
      );
      return {
        success: false,
        message: error.message || 'Failed to mark notification as read',
      };
    }
  }

  // Emit new notification to user
  emitNotification(userId: string, notification: NotificationEntity) {
    this.server.to(`user:${userId}`).emit('notification:new', {
      ...this.serializeNotification(notification),
      timestamp: new Date().toISOString(),
    });

    this.logger.debug(`New notification emitted to user ${userId}`);
  }

  // Emit notification update
  emitNotificationUpdate(userId: string, notificationId: string, data: any) {
    this.server.to(`user:${userId}`).emit('notification:update', {
      notificationId,
      ...data,
      timestamp: new Date().toISOString(),
    });

    this.logger.debug(`Notification update emitted to user ${userId}`);
  }

  // Emit notification deletion
  emitNotificationDelete(userId: string, notificationId: string) {
    this.server.to(`user:${userId}`).emit('notification:delete', {
      notificationId,
      timestamp: new Date().toISOString(),
    });

    this.logger.debug(`Notification deletion emitted to user ${userId}`);
  }

  emitNotificationRead(userId: string, notification: NotificationEntity) {
    this.server.to(`user:${userId}`).emit('notification:read', {
      notificationId: notification.id,
      notification: this.serializeNotification(notification),
      timestamp: new Date().toISOString(),
    });
  }

  emitNotificationsMarkedAsRead(userId: string) {
    this.server.to(`user:${userId}`).emit('notification:read_all', {
      timestamp: new Date().toISOString(),
    });
  }

  // Broadcast to all connected users
  broadcastToAll(event: string, data: any) {
    this.server.emit(event, {
      ...data,
      timestamp: new Date().toISOString(),
    });

    this.logger.debug(`Broadcast event ${event} to all users`);
  }

  // Check if user is online
  isUserOnline(userId: string): boolean {
    return (
      this.userSockets.has(userId) && this.userSockets.get(userId)!.size > 0
    );
  }

  // Get online users count
  getOnlineUsersCount(): number {
    return this.userSockets.size;
  }

  private serializeNotification(notification: NotificationEntity) {
    return {
      id: notification.id,
      userId: notification.userId,
      title: notification.title,
      message: notification.message,
      type: notification.type,
      isRead: notification.isRead,
      createdAt: notification.createdAt.toISOString(),
      updatedAt: notification.updatedAt.toISOString(),
    };
  }
}
