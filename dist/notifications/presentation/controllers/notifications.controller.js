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
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../../../auth/infrastructure/guards/jwt-auth.guard");
const notifications_service_1 = require("../../application/services/notifications.service");
const notification_response_dto_1 = require("../../application/dtos/notification-response.dto");
let NotificationsController = class NotificationsController {
    notificationsService;
    constructor(notificationsService) {
        this.notificationsService = notificationsService;
    }
    async getNotifications(req, page, limit, includeRead) {
        const userId = req.user.userId;
        const parsedPage = page ? Number(page) : undefined;
        const parsedLimit = limit ? Number(limit) : undefined;
        const includeReadValue = includeRead !== undefined ? includeRead === 'true' : undefined;
        const result = await this.notificationsService.getUserNotifications(userId, {
            page: parsedPage,
            limit: parsedLimit,
            includeRead: includeReadValue,
        });
        return {
            success: true,
            data: {
                notifications: result.notifications.map((notification) => this.mapNotification(notification)),
                meta: result.meta,
                unreadCount: result.unreadCount,
            },
        };
    }
    async markNotificationAsRead(req, notificationId) {
        const userId = req.user.userId;
        const notification = await this.notificationsService.markNotificationAsRead(userId, notificationId);
        return {
            success: true,
            data: {
                notification: this.mapNotification(notification),
            },
        };
    }
    async markAllNotificationsAsRead(req) {
        const userId = req.user.userId;
        const updatedCount = await this.notificationsService.markAllNotificationsAsRead(userId);
        return {
            success: true,
            data: {
                updated: updatedCount,
            },
        };
    }
    async getUnreadCount(req) {
        const userId = req.user.userId;
        const count = await this.notificationsService.getUnreadCount(userId);
        return {
            success: true,
            data: {
                unreadCount: count,
            },
        };
    }
    mapNotification(notification) {
        return {
            id: notification.id,
            title: notification.title,
            message: notification.message,
            type: notification.type,
            isRead: notification.isRead,
            createdAt: notification.createdAt,
            updatedAt: notification.updatedAt,
        };
    }
};
exports.NotificationsController = NotificationsController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get notifications for current user' }),
    (0, swagger_1.ApiQuery)({ name: 'page', required: false, type: Number }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false, type: Number }),
    (0, swagger_1.ApiQuery)({
        name: 'includeRead',
        required: false,
        type: Boolean,
        description: 'Include read notifications (default true)',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Notifications retrieved',
        type: notification_response_dto_1.NotificationsListResponseDto,
    }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('limit')),
    __param(3, (0, common_1.Query)('includeRead')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String]),
    __metadata("design:returntype", Promise)
], NotificationsController.prototype, "getNotifications", null);
__decorate([
    (0, common_1.Patch)(':notificationId/read'),
    (0, swagger_1.ApiOperation)({ summary: 'Mark a notification as read' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Notification marked as read',
        type: notification_response_dto_1.NotificationResponseDto,
    }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('notificationId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], NotificationsController.prototype, "markNotificationAsRead", null);
__decorate([
    (0, common_1.Patch)('read-all'),
    (0, swagger_1.ApiOperation)({ summary: 'Mark all notifications as read' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'All notifications marked as read',
    }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], NotificationsController.prototype, "markAllNotificationsAsRead", null);
__decorate([
    (0, common_1.Get)('unread-count'),
    (0, swagger_1.ApiOperation)({ summary: 'Get unread notification count' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Unread notification count retrieved',
    }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], NotificationsController.prototype, "getUnreadCount", null);
exports.NotificationsController = NotificationsController = __decorate([
    (0, swagger_1.ApiTags)('Notifications'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('notifications'),
    __metadata("design:paramtypes", [notifications_service_1.NotificationsService])
], NotificationsController);
//# sourceMappingURL=notifications.controller.js.map