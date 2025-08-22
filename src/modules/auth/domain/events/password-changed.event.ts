import { DomainEvent } from './domain-event.base';

export interface PasswordChangedEventData {
  userId: string;
  occurredAt: Date;
}

export class PasswordChangedEvent extends DomainEvent {
  public readonly userId: string;

  constructor(data: PasswordChangedEventData) {
    super('PasswordChanged', data.occurredAt);
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