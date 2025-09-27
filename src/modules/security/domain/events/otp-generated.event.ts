import { DomainEvent } from './domain-event.base';
import { OtpPurpose } from '../entities/otp.entity';

export interface OtpGeneratedEventData {
  otpId: string;
  identifier: string;
  purpose: OtpPurpose;
  expiresAt: Date;
}

export class OtpGeneratedEvent extends DomainEvent {
  constructor(private readonly data: OtpGeneratedEventData) {
    super('OtpGenerated');
  }

  getAggregateId(): string {
    return this.data.otpId;
  }

  getEventData(): OtpGeneratedEventData {
    return this.data;
  }

  get otpId(): string {
    return this.data.otpId;
  }

  get identifier(): string {
    return this.data.identifier;
  }

  get purpose(): OtpPurpose {
    return this.data.purpose;
  }

  get expiresAt(): Date {
    return this.data.expiresAt;
  }
}