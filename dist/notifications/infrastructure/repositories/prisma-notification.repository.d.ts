import { PrismaService } from '../../../shared/database/prisma.service';
import { FindNotificationsOptions, FindNotificationsResult, INotificationRepository } from '../../domain/repositories/notification.repository.interface';
import { NotificationEntity } from '../../domain/entities/notification.entity';
export declare class PrismaNotificationRepository implements INotificationRepository {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    create(notification: NotificationEntity): Promise<NotificationEntity>;
    findById(id: string): Promise<NotificationEntity | null>;
    findByUser(userId: string, options?: FindNotificationsOptions): Promise<FindNotificationsResult>;
    markAsRead(userId: string, notificationId: string): Promise<{
        notification: NotificationEntity;
        updated: boolean;
    } | null>;
    markAllAsRead(userId: string): Promise<number>;
    countUnread(userId: string): Promise<number>;
    private toDomain;
}
