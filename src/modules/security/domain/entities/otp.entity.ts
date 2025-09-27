export type OtpPurpose = 'registration' | 'login' | 'password_reset';

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
  channel: 'sms' | 'email';
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
}
