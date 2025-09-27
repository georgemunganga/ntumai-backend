import { DomainEvent } from './domain-event.base';
import { OtpPurpose } from '../entities/otp.entity';

export interface OtpValidatedEventData {
  otpId: string;
  identifier: string;
  purpose: OtpPurpose;
  validatedAt: Date;
}

export class OtpValidatedEvent extends DomainEvent {
  constructor(private readonly data: OtpValidatedEventData) {
    super('OtpValidated');
  }

  getAggregateId(): string {
    return this.data.otpId;
  }

  getEventData(): OtpValidatedEventData {
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

  get validatedAt(): Date {
    return this.data.validatedAt;
  }
}