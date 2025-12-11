import { Notification as PrismaNotification } from '@prisma/client';

export class NotificationEntity {
  id: string;
  userId: string;
  type: string;
  title: string;
  body: string;
  data?: any;
  isRead: boolean;

  constructor(data: Partial<NotificationEntity>) {
    Object.assign(this, data);
  }
}
