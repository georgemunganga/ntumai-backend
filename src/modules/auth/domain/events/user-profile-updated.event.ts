import { DomainEvent } from './domain-event.base';

export interface UserProfileUpdatedEventData {
  userId: string;
  occurredAt: Date;
}

export class UserProfileUpdatedEvent extends DomainEvent {
  public readonly userId: string;

  constructor(data: UserProfileUpdatedEventData) {
    super('UserProfileUpdated', data.occurredAt);
    this.userId = data.userId;
  }

  getAggregateId(): string {
    return this.userId;
  }

  getEventData(): Record<string, any> {
    return {
      userId: this.userId,
      occurredAt: this.occurredAt,
    };
  }
}