import { DomainEvent } from './domain-event.base';
import { OtpPurpose } from '../entities/otp.entity';

export interface OtpExpiredEventData {
  otpId: string;
  identifier: string;
  purpose: OtpPurpose;
}

export class OtpExpiredEvent extends DomainEvent {
  constructor(private readonly data: OtpExpiredEventData) {
    super('OtpExpired');
  }

  getAggregateId(): string {
    return this.data.otpId;
  }

  getEventData(): OtpExpiredEventData {
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
}