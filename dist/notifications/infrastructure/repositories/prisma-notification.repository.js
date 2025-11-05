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
var PrismaNotificationRepository_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrismaNotificationRepository = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../shared/database/prisma.service");
const notification_entity_1 = require("../../domain/entities/notification.entity");
let PrismaNotificationRepository = PrismaNotificationRepository_1 = class PrismaNotificationRepository {
    prisma;
    logger = new common_1.Logger(PrismaNotificationRepository_1.name);
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(notification) {
        const created = await this.prisma.notification.create({
            data: {
                id: notification.id,
                userId: notification.userId,
                title: notification.title,
                message: notification.message,
                type: notification.type,
                isRead: notification.isRead,
                createdAt: notification.createdAt,
                updatedAt: notification.updatedAt,
            },
        });
        return this.toDomain(created);
    }
    async findById(id) {
        const notification = await this.prisma.notification.findUnique({
            where: { id },
        });
        return notification ? this.toDomain(notification) : null;
    }
    async findByUser(userId, options = {}) {
        const { skip = 0, take = 20, includeRead = true } = options;
        const [items, total] = await this.prisma.$transaction([
            this.prisma.notification.findMany({
                where: {
                    userId,
                    ...(includeRead ? {} : { isRead: false }),
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take,
            }),
            this.prisma.notification.count({
                where: {
                    userId,
                    ...(includeRead ? {} : { isRead: false }),
                },
            }),
        ]);
        return {
            notifications: items.map((item) => this.toDomain(item)),
            total,
        };
    }
    async markAsRead(userId, notificationId) {
        const existing = await this.prisma.notification.findFirst({
            where: { id: notificationId, userId },
        });
        if (!existing) {
            this.logger.debug(`Notification ${notificationId} not found for user ${userId} when marking as read`);
            return null;
        }
        if (existing.isRead) {
            return {
                notification: this.toDomain(existing),
                updated: false,
            };
        }
        const updated = await this.prisma.notification.update({
            where: { id: notificationId },
            data: {
                isRead: true,
                updatedAt: new Date(),
            },
        });
        return {
            notification: this.toDomain(updated),
            updated: true,
        };
    }
    async markAllAsRead(userId) {
        const result = await this.prisma.notification.updateMany({
            where: {
                userId,
                isRead: false,
            },
            data: {
                isRead: true,
                updatedAt: new Date(),
            },
        });
        return result.count;
    }
    async countUnread(userId) {
        return this.prisma.notification.count({
            where: { userId, isRead: false },
        });
    }
    toDomain(notification) {
        return new notification_entity_1.NotificationEntity({
            id: notification.id,
            userId: notification.userId,
            title: notification.title,
            message: notification.message,
            type: notification.type,
            isRead: notification.isRead,
            createdAt: notification.createdAt,
            updatedAt: notification.updatedAt,
        });
    }
};
exports.PrismaNotificationRepository = PrismaNotificationRepository;
exports.PrismaNotificationRepository = PrismaNotificationRepository = PrismaNotificationRepository_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PrismaNotificationRepository);
//# sourceMappingURL=prisma-notification.repository.js.map