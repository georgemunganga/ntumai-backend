export type OtpPurpose = 'registration' | 'login' | 'password_reset';

export interface GenerateOtpOptions {
  identifier: string;
  purpose: OtpPurpose;
  expiryMinutes?: number;
  codeLength?: number;
  alphanumeric?: boolean;
  countryCode?: string;
  maxAttempts?: number;
  resendCooldownSeconds?: number;
}

export interface ValidateOtpOptions {
  identifier?: string;
  code: string;
  requestId?: string;
  challengeId?: string;
  purpose?: OtpPurpose;
}

export interface OtpDeliveryStatus {
  sent: boolean;
  channel: 'sms' | 'email';
  error?: string;
}

export interface GenerateOtpResult {
  otpId: string;
  expiresAt: Date;
  deliveryStatus: OtpDeliveryStatus;
  resendAvailableAt: Date;
  maxAttempts: number;
}

export interface ValidateOtpResult {
  isValid: boolean;
  attemptsRemaining: number;
  isExpired: boolean;
  isLocked: boolean;
  challengeId?: string;
  identifier?: string;
  purpose?: OtpPurpose;
}

export type Otp = any;
