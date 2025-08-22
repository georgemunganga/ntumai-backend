import { DomainEvent } from './domain-event.base';
import { UserRoleEnum } from '../value-objects';

export interface UserRegisteredEventData {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRoleEnum;
  occurredAt: Date;
}

export class UserRegisteredEvent extends DomainEvent {
  public readonly userId: string;
  public readonly email: string;
  public readonly firstName: string;
  public readonly lastName: string;
  public readonly role: UserRoleEnum;

  constructor(data: UserRegisteredEventData) {
    super('UserRegistered', data.occurredAt);
    this.userId = data.userId;
    this.email = data.email;
    this.firstName = data.firstName;
    this.lastName = data.lastName;
    this.role = data.role;
  }

  getAggregateId(): string {
    return this.userId;
  }

  getEventData(): Record<string, any> {
    return {
      userId: this.userId,
      email: this.email,
      firstName: this.firstName,
      lastName: this.lastName,
      role: this.role,
      occurredAt: this.occurredAt,
    };
  }
}