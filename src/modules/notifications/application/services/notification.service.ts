import { Injectable } from '@nestjs/common';
import { NotificationRepository } from '../../infrastructure/repositories/notification.repository';
import { NotificationEntity } from '../../domain/entities/notification.entity';

@Injectable()
export class NotificationService {
  constructor(private readonly notificationRepository: NotificationRepository) {}

  async findById(id: string): Promise<NotificationEntity | null> {
    return this.notificationRepository.findById(id);
  }

  async findByUserId(userId: string): Promise<NotificationEntity[]> {
    return this.notificationRepository.findByUserId(userId);
  }

  async create(data: Partial<NotificationEntity>): Promise<NotificationEntity> {
    const notification = new NotificationEntity(data);
    return this.notificationRepository.save(notification);
  }

  async markAsRead(id: string): Promise<NotificationEntity> {
    const notification = await this.notificationRepository.findById(id);
    if (!notification) {
      throw new Error('Notification not found');
    }
    notification.isRead = true;
    return this.notificationRepository.save(notification);
  }
}
