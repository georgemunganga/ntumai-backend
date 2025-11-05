"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var NotificationsGateway_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationsGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const socket_io_1 = require("socket.io");
const common_1 = require("@nestjs/common");
const notifications_service_1 = require("../../application/services/notifications.service");
let NotificationsGateway = NotificationsGateway_1 = class NotificationsGateway {
    notificationsService;
    server;
    logger = new common_1.Logger(NotificationsGateway_1.name);
    userSockets = new Map();
    constructor(notificationsService) {
        this.notificationsService = notificationsService;
    }
    handleConnection(client) {
        this.logger.log(`Client connected to notifications: ${client.id}`);
    }
    handleDisconnect(client) {
        this.logger.log(`Client disconnected from notifications: ${client.id}`);
        this.userSockets.forEach((sockets, userId) => {
            sockets.delete(client.id);
            if (sockets.size === 0) {
                this.userSockets.delete(userId);
            }
        });
    }
    handleSubscribeUser(data, client) {
        const { userId } = data;
        if (!this.userSockets.has(userId)) {
            this.userSockets.set(userId, new Set());
        }
        this.userSockets.get(userId).add(client.id);
        client.join(`user:${userId}`);
        this.logger.log(`Client ${client.id} subscribed to user ${userId} notifications`);
        return {
            success: true,
            message: `Subscribed to notifications for user ${userId}`,
        };
    }
    handleUnsubscribeUser(data, client) {
        const { userId } = data;
        if (this.userSockets.has(userId)) {
            this.userSockets.get(userId).delete(client.id);
        }
        client.leave(`user:${userId}`);
        this.logger.log(`Client ${client.id} unsubscribed from user ${userId} notifications`);
        return {
            success: true,
            message: `Unsubscribed from notifications for user ${userId}`,
        };
    }
    async handleMarkRead(data, client) {
        const { notificationId, userId } = data;
        try {
            await this.notificationsService.markNotificationAsRead(userId, notificationId);
            this.logger.debug(`Notification ${notificationId} marked as read for user ${userId}`);
            return { success: true, message: 'Notification marked as read' };
        }
        catch (error) {
            this.logger.warn(`Failed to mark notification ${notificationId} for user ${userId} as read via websocket: ${error.message}`);
            return {
                success: false,
                message: error.message || 'Failed to mark notification as read',
            };
        }
    }
    emitNotification(userId, notification) {
        this.server.to(`user:${userId}`).emit('notification:new', {
            ...this.serializeNotification(notification),
            timestamp: new Date().toISOString(),
        });
        this.logger.debug(`New notification emitted to user ${userId}`);
    }
    emitNotificationUpdate(userId, notificationId, data) {
        this.server.to(`user:${userId}`).emit('notification:update', {
            notificationId,
            ...data,
            timestamp: new Date().toISOString(),
        });
        this.logger.debug(`Notification update emitted to user ${userId}`);
    }
    emitNotificationDelete(userId, notificationId) {
        this.server.to(`user:${userId}`).emit('notification:delete', {
            notificationId,
            timestamp: new Date().toISOString(),
        });
        this.logger.debug(`Notification deletion emitted to user ${userId}`);
    }
    emitNotificationRead(userId, notification) {
        this.server.to(`user:${userId}`).emit('notification:read', {
            notificationId: notification.id,
            notification: this.serializeNotification(notification),
            timestamp: new Date().toISOString(),
        });
    }
    emitNotificationsMarkedAsRead(userId) {
        this.server.to(`user:${userId}`).emit('notification:read_all', {
            timestamp: new Date().toISOString(),
        });
    }
    broadcastToAll(event, data) {
        this.server.emit(event, {
            ...data,
            timestamp: new Date().toISOString(),
        });
        this.logger.debug(`Broadcast event ${event} to all users`);
    }
    isUserOnline(userId) {
        return (this.userSockets.has(userId) && this.userSockets.get(userId).size > 0);
    }
    getOnlineUsersCount() {
        return this.userSockets.size;
    }
    serializeNotification(notification) {
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
};
exports.NotificationsGateway = NotificationsGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], NotificationsGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('subscribe:user'),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, socket_io_1.Socket]),
    __metadata("design:returntype", void 0)
], NotificationsGateway.prototype, "handleSubscribeUser", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('unsubscribe:user'),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, socket_io_1.Socket]),
    __metadata("design:returntype", void 0)
], NotificationsGateway.prototype, "handleUnsubscribeUser", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('mark:read'),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, socket_io_1.Socket]),
    __metadata("design:returntype", Promise)
], NotificationsGateway.prototype, "handleMarkRead", null);
exports.NotificationsGateway = NotificationsGateway = NotificationsGateway_1 = __decorate([
    (0, websockets_1.WebSocketGateway)({
        namespace: '/notifications',
        cors: {
            origin: '*',
        },
    }),
    __param(0, (0, common_1.Inject)((0, common_1.forwardRef)(() => notifications_service_1.NotificationsService))),
    __metadata("design:paramtypes", [notifications_service_1.NotificationsService])
], NotificationsGateway);
//# sourceMappingURL=notifications.gateway.js.map