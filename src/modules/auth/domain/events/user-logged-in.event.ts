import { DomainEvent } from './domain-event.base';

export interface UserLoggedInEventData {
  userId: string;
  email: string;
  occurredAt: Date;
}

export class UserLoggedInEvent extends DomainEvent {
  public readonly userId: string;
  public readonly email: string;

  constructor(data: UserLoggedInEventData) {
    super('UserLoggedIn', data.occurredAt);
    this.userId = data.userId;
    this.email = data.email;
  }

  getAggregateId(): string {
    return this.userId;
  }

  getEventData(): Record<string, any> {
    return {
      userId: this.userId,
      email: this.email,
      occurredAt: this.occurredAt,
    };
  }
}