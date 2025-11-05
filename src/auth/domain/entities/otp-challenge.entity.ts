import { IdentifierType, OtpPurpose } from '@prisma/client';
import { OtpCode } from '../value-objects/otp-code.vo';
import { BadRequestException } from '@nestjs/common';

export interface OtpChallengeProps {
  id: string;
  challengeId: string;
  identifier: string;
  identifierType: IdentifierType;
  otpCodeHash: string;
  purpose: OtpPurpose;
  attempts: number;
  maxAttempts: number;
  expiresAt: Date;
  resendAvailableAt: Date;
  isVerified: boolean;
  verifiedAt?: Date;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}

export class OtpChallengeEntity {
  private props: OtpChallengeProps;

  constructor(props: OtpChallengeProps) {
    this.props = props;
  }

  get id(): string {
    return this.props.id;
  }

  get challengeId(): string {
    return this.props.challengeId;
  }

  get identifier(): string {
    return this.props.identifier;
  }

  get identifierType(): IdentifierType {
    return this.props.identifierType;
  }

  get otpCodeHash(): string {
    return this.props.otpCodeHash;
  }

  get purpose(): OtpPurpose {
    return this.props.purpose;
  }

  get attempts(): number {
    return this.props.attempts;
  }

  get maxAttempts(): number {
    return this.props.maxAttempts;
  }

  get expiresAt(): Date {
    return this.props.expiresAt;
  }

  get resendAvailableAt(): Date {
    return this.props.resendAvailableAt;
  }

  get isVerified(): boolean {
    return this.props.isVerified;
  }

  get verifiedAt(): Date | undefined {
    return this.props.verifiedAt;
  }

  get ipAddress(): string | undefined {
    return this.props.ipAddress;
  }

  get userAgent(): string | undefined {
    return this.props.userAgent;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  isExpired(): boolean {
    return new Date() > this.props.expiresAt;
  }

  canResend(): boolean {
    return new Date() >= this.props.resendAvailableAt;
  }

  hasAttemptsLeft(): boolean {
    return this.props.attempts < this.props.maxAttempts;
  }

  incrementAttempts(): void {
    if (!this.hasAttemptsLeft()) {
      throw new BadRequestException('Maximum OTP attempts exceeded');
    }
    this.props.attempts += 1;
  }

  async verify(otpCode: OtpCode): Promise<boolean> {
    if (this.isExpired()) {
      throw new BadRequestException('OTP has expired');
    }

    if (!this.hasAttemptsLeft()) {
      throw new BadRequestException('Maximum OTP attempts exceeded');
    }

    this.incrementAttempts();

    const isValid = await otpCode.verify(this.props.otpCodeHash);

    if (isValid) {
      this.markAsVerified();
    }

    return isValid;
  }

  markAsVerified(): void {
    this.props.isVerified = true;
    this.props.verifiedAt = new Date();
  }

  toJSON() {
    return {
      id: this.id,
      challengeId: this.challengeId,
      identifier: this.identifier,
      identifierType: this.identifierType,
      purpose: this.purpose,
      attempts: this.attempts,
      maxAttempts: this.maxAttempts,
      expiresAt: this.expiresAt,
      resendAvailableAt: this.resendAvailableAt,
      isVerified: this.isVerified,
      verifiedAt: this.verifiedAt,
      createdAt: this.createdAt,
    };
  }
}
