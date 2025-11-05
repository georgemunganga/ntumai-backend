import { NotificationType } from '@prisma/client';
export interface NotificationProps {
    id: string;
    userId: string;
    title: string;
    message: string;
    type: NotificationType;
    isRead: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export declare class NotificationEntity {
    private props;
    constructor(props: NotificationProps);
    get id(): string;
    get userId(): string;
    get title(): string;
    get message(): string;
    get type(): NotificationType;
    get isRead(): boolean;
    get createdAt(): Date;
    get updatedAt(): Date;
    markAsRead(): void;
    toJSON(): NotificationProps;
}
