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
var NotificationsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationsService = void 0;
const common_1 = require("@nestjs/common");
const uuid_1 = require("uuid");
const notification_repository_interface_1 = require("../../domain/repositories/notification.repository.interface");
const notification_entity_1 = require("../../domain/entities/notification.entity");
const notifications_gateway_1 = require("../../infrastructure/websocket/notifications.gateway");
let NotificationsService = NotificationsService_1 = class NotificationsService {
    notificationsRepository;
    notificationsGateway;
    logger = new common_1.Logger(NotificationsService_1.name);
    constructor(notificationsRepository, notificationsGateway) {
        this.notificationsRepository = notificationsRepository;
        this.notificationsGateway = notificationsGateway;
    }
    async createNotification(userId, input) {
        const now = input.createdAt ?? new Date();
        const notification = new notification_entity_1.NotificationEntity({
            id: (0, uuid_1.v4)(),
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
    async getUserNotifications(userId, options = {}) {
        const page = Math.max(1, options.page ?? 1);
        const limit = Math.min(Math.max(options.limit ?? 20, 1), 50);
        const skip = (page - 1) * limit;
        const { notifications, total } = await this.notificationsRepository.findByUser(userId, {
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
    async markNotificationAsRead(userId, notificationId) {
        const result = await this.notificationsRepository.markAsRead(userId, notificationId);
        if (!result) {
            throw new common_1.NotFoundException('Notification not found');
        }
        const { notification, updated: wasUpdated } = result;
        if (wasUpdated) {
            this.notificationsGateway.emitNotificationRead(userId, notification);
        }
        return notification;
    }
    async markAllNotificationsAsRead(userId) {
        const updatedCount = await this.notificationsRepository.markAllAsRead(userId);
        if (updatedCount > 0) {
            this.notificationsGateway.emitNotificationsMarkedAsRead(userId);
        }
        return updatedCount;
    }
    async getUnreadCount(userId) {
        return this.notificationsRepository.countUnread(userId);
    }
};
exports.NotificationsService = NotificationsService;
exports.NotificationsService = NotificationsService = NotificationsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(notification_repository_interface_1.NOTIFICATION_REPOSITORY)),
    __param(1, (0, common_1.Inject)((0, common_1.forwardRef)(() => notifications_gateway_1.NotificationsGateway))),
    __metadata("design:paramtypes", [Object, notifications_gateway_1.NotificationsGateway])
], NotificationsService);
//# sourceMappingURL=notifications.service.js.map