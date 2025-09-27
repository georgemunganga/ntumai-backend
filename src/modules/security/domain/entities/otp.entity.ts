import { randomUUID, createHash } from 'crypto';
import { DomainEvent } from '../events/domain-event.base';
import { OtpGeneratedEvent } from '../events/otp-generated.event';
import { OtpValidatedEvent } from '../events/otp-validated.event';
import { OtpExpiredEvent } from '../events/otp-expired.event';

export type OtpPurpose =
  | 'registration'
  | 'login'
  | 'password-reset'
  | 'password_reset'
  | 'transaction'
  | 'kyc'
  | 'mfa';

export interface GenerateOtpOptions {
  identifier: string;
  purpose: OtpPurpose;
  expiryMinutes?: number;
  codeLength?: number;
  alphanumeric?: boolean;
  countryCode?: string;
}

export interface ValidateOtpOptions {
  identifier: string;
  code: string;
  requestId?: string;
  purpose?: OtpPurpose;
}

export interface OtpDeliveryStatus {
  sent: boolean;
  channel: 'sms' | 'email' | 'unknown';
  error?: string;
}

export interface GenerateOtpResult {
  otpId: string;
  expiresAt: Date;
  deliveryStatus: OtpDeliveryStatus;
}

export interface ValidateOtpResult {
  isValid: boolean;
  attemptsRemaining: number;
  isExpired: boolean;
  attemptsExceeded?: boolean;
  error?: string;
}

interface OtpPersistence {
  id: string;
  identifier: string;
  purpose: OtpPurpose;
  hashedCode: string;
  expiresAt: Date;
  maxAttempts: number;
  attempts: number;
  isUsed: boolean;
  createdAt: Date;
  updatedAt: Date;
  verifiedAt?: Date | null;
}

export class Otp {
  private readonly _domainEvents: DomainEvent[] = [];
  private _plainCode?: string;
  private _verifiedAt?: Date | null;

  private constructor(
    private readonly props: {
      id: string;
      identifier: string;
      purpose: OtpPurpose;
      hashedCode: string;
      expiresAt: Date;
      maxAttempts: number;
      attempts: number;
      isUsed: boolean;
      createdAt: Date;
      updatedAt: Date;
    }
  ) {}

  static async create(
    identifier: string,
    purpose: OtpPurpose,
    expiryMinutes: number,
    maxAttempts: number,
    options?: { length?: number; alphanumeric?: boolean }
  ): Promise<Otp> {
    const length = options?.length ?? 6;
    const alphanumeric = options?.alphanumeric ?? false;
    const plainCode = Otp.generateCode(length, alphanumeric);
    const hashedCode = await Otp.hashCode(plainCode);

    const now = new Date();
    const expiresAt = new Date(now.getTime() + expiryMinutes * 60 * 1000);

    const otp = new Otp({
      id: randomUUID(),
      identifier,
      purpose,
      hashedCode,
      expiresAt,
      maxAttempts,
      attempts: 0,
      isUsed: false,
      createdAt: now,
      updatedAt: now,
    });

    otp._plainCode = plainCode;
    otp.addDomainEvent(
      new OtpGeneratedEvent({
        otpId: otp.id,
        identifier,
        purpose,
        expiresAt,
      })
    );

    return otp;
  }

  static fromPersistence(data: {
    id: string;
    requestId?: string;
    identifier?: string;
    phoneNumber?: string;
    purpose: OtpPurpose;
    type?: string;
    otp: string;
    hashedCode?: string;
    expiresAt: Date;
    maxAttempts: number;
    attempts: number;
    isUsed?: boolean;
    isVerified?: boolean;
    createdAt: Date;
    updatedAt: Date;
    verifiedAt?: Date | null;
  }): Otp {
    const otp = new Otp({
      id: data.requestId ?? data.id,
      identifier: data.identifier ?? data.phoneNumber ?? 'unknown',
      purpose: data.purpose,
      hashedCode: data.hashedCode ?? data.otp,
      expiresAt: new Date(data.expiresAt),
      maxAttempts: data.maxAttempts,
      attempts: data.attempts,
      isUsed: data.isUsed ?? data.isVerified ?? false,
      createdAt: new Date(data.createdAt),
      updatedAt: new Date(data.updatedAt),
    });

    otp._verifiedAt = data.verifiedAt ?? null;
    return otp;
  }

  toPersistence(): OtpPersistence {
    return {
      id: this.id,
      identifier: this.identifier,
      purpose: this.purpose,
      hashedCode: this.props.hashedCode,
      expiresAt: this.expiresAt,
      maxAttempts: this.maxAttempts,
      attempts: this.attempts,
      isUsed: this.isUsed,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      verifiedAt: this._verifiedAt ?? null,
    };
  }

  async validate(code: string): Promise<ValidateOtpResult> {
    const now = new Date();

    if (this.isExpired) {
      this.addDomainEvent(
        new OtpExpiredEvent({
          otpId: this.id,
          identifier: this.identifier,
          purpose: this.purpose,
        })
      );

      this.markUsed();
      return { isValid: false, attemptsRemaining: 0, isExpired: true, error: 'OTP expired' };
    }

    if (this.attempts >= this.maxAttempts) {
      return {
        isValid: false,
        attemptsRemaining: 0,
        isExpired: false,
        attemptsExceeded: true,
        error: 'Maximum attempts exceeded',
      };
    }

    const hashedInput = await Otp.hashCode(code.trim());
    const isValid = hashedInput === this.props.hashedCode;

    if (isValid) {
      this.props.attempts += 1;
      this.markUsed();
      this._verifiedAt = now;
      this.props.updatedAt = now;

      this.addDomainEvent(
        new OtpValidatedEvent({
          otpId: this.id,
          identifier: this.identifier,
          purpose: this.purpose,
          validatedAt: now,
        })
      );

      return {
        isValid: true,
        attemptsRemaining: Math.max(this.maxAttempts - this.attempts, 0),
        isExpired: false,
      };
    }

    this.props.attempts += 1;
    this.props.updatedAt = now;

    const attemptsExceeded = this.props.attempts >= this.maxAttempts;
    if (attemptsExceeded) {
      this.markUsed();
    }

    return {
      isValid: false,
      attemptsRemaining: Math.max(this.maxAttempts - this.attempts, 0),
      isExpired: false,
      attemptsExceeded,
      error: 'Invalid OTP code',
    };
  }

  canResend(): boolean {
    return !this.isUsed && !this.isExpired;
  }

  invalidate(): void {
    this.markUsed();
    this.props.updatedAt = new Date();

    this.addDomainEvent(
      new OtpExpiredEvent({
        otpId: this.id,
        identifier: this.identifier,
        purpose: this.purpose,
      })
    );
  }

  get id(): string {
    return this.props.id;
  }

  get identifier(): string {
    return this.props.identifier;
  }

  get purpose(): OtpPurpose {
    return this.props.purpose;
  }

  get expiresAt(): Date {
    return this.props.expiresAt;
  }

  get maxAttempts(): number {
    return this.props.maxAttempts;
  }

  get attempts(): number {
    return this.props.attempts;
  }

  get isUsed(): boolean {
    return this.props.isUsed;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  get verifiedAt(): Date | null | undefined {
    return this._verifiedAt;
  }

  get domainEvents(): DomainEvent[] {
    return [...this._domainEvents];
  }

  clearDomainEvents(): void {
    this._domainEvents.length = 0;
  }

  consumePlainCode(): string | undefined {
    const code = this._plainCode;
    this._plainCode = undefined;
    return code;
  }

  get isExpired(): boolean {
    return this.expiresAt.getTime() < Date.now();
  }

  private addDomainEvent(event: DomainEvent): void {
    this._domainEvents.push(event);
  }

  private markUsed(): void {
    this.props.isUsed = true;
  }

  private static generateCode(length: number, alphanumeric: boolean): string {
    const charset = alphanumeric
      ? '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ'
      : '0123456789';

    let code = '';
    for (let i = 0; i < length; i++) {
      const index = Math.floor(Math.random() * charset.length);
      code += charset[index];
    }
    return code;
  }

  private static async hashCode(code: string): Promise<string> {
    return createHash('sha256').update(code).digest('hex');
  }
}
