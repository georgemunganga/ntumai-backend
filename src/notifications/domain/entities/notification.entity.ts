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

export class NotificationEntity {
  private props: NotificationProps;

  constructor(props: NotificationProps) {
    this.props = props;
  }

  get id(): string {
    return this.props.id;
  }

  get userId(): string {
    return this.props.userId;
  }

  get title(): string {
    return this.props.title;
  }

  get message(): string {
    return this.props.message;
  }

  get type(): NotificationType {
    return this.props.type;
  }

  get isRead(): boolean {
    return this.props.isRead;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  markAsRead(): void {
    if (!this.props.isRead) {
      this.props.isRead = true;
      this.props.updatedAt = new Date();
    }
  }

  toJSON(): NotificationProps {
    return { ...this.props };
  }
}
