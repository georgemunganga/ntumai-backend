export interface OtpGenerationOptions {
  length?: number;
  expiryMinutes?: number;
  maxAttempts?: number;
  alphanumeric?: boolean;
}

export interface OtpDeliveryStatus {
  sent: boolean;
  channel: 'sms' | 'email' | 'unknown';
  error?: string;
}

export interface GenerateOtpRequest {
  identifier: string;
  purpose: string;
  userId?: string;
  expiryMinutes?: number;
  maxAttempts?: number;
  options?: OtpGenerationOptions;
  metadata?: Record<string, any>;
}

export interface ResendOtpRequest {
  originalOtpId?: string;
  identifier?: string;
  purpose?: string;
  userId?: string;
  newExpiryMinutes?: number;
  options?: OtpGenerationOptions;
  metadata?: Record<string, any>;
}

export interface OtpOperationResult {
  success: boolean;
  otpId?: string;
  otpCode?: string;
  expiresAt?: Date;
  attemptsRemaining?: number;
  deliveryStatus?: OtpDeliveryStatus;
  metadata?: Record<string, any>;
  error?: string;
}

export interface ValidateOtpRequest {
  otpId?: string;
  identifier?: string;
  purpose?: string;
  code: string;
}

export interface OtpValidationResponse {
  success: boolean;
  error?: string;
  isExpired?: boolean;
  attemptsExceeded?: boolean;
  attemptsRemaining?: number;
}

export interface PasswordValidationOptions {
  minLength?: number;
  requireUppercase?: boolean;
  requireLowercase?: boolean;
  requireNumbers?: boolean;
  requireSpecialChars?: boolean;
  forbiddenPasswords?: string[];
}

export interface PasswordValidationResult {
  isValid: boolean;
  errors: string[];
  strength: 'weak' | 'medium' | 'strong';
}

export interface MfaSetupResult {
  secret: string;
  qrCode?: string;
  backupCodes: string[];
}

export interface TokenPayload {
  userId: string;
  email?: string;
  phoneNumber?: string;
  roles: string[];
  sessionId?: string;
}

export interface TokenOptions {
  expiresIn?: string | number;
  issuer?: string;
  audience?: string;
}

export interface SecurityLogEntry {
  userId?: string;
  action: string;
  resource?: string;
  ipAddress?: string;
  userAgent?: string;
  success: boolean;
  errorMessage?: string;
  metadata?: Record<string, any>;
}

export interface IOtpService {
  generateOtp(request: GenerateOtpRequest): Promise<OtpOperationResult>;
  validateOtp(request: ValidateOtpRequest): Promise<OtpValidationResponse>;
  resendOtp(request: ResendOtpRequest): Promise<OtpOperationResult>;
  invalidateOtp(request: { otpId?: string; identifier?: string; purpose?: string }): Promise<void>;
  cleanupExpiredOtps(): Promise<void>;
}

export interface IPasswordService {
  hashPassword(password: string): Promise<string>;
  validatePassword(password: string, hash: string): Promise<boolean>;
  validatePasswordStrength(password: string, options?: PasswordValidationOptions): PasswordValidationResult;
  generateSecurePassword(length?: number): string;
}

export interface IMfaService {
  setupTotp(userId: string): Promise<MfaSetupResult>;
  verifyTotp(userId: string, token: string): Promise<boolean>;
  generateBackupCodes(userId: string): Promise<string[]>;
  verifyBackupCode(userId: string, code: string): Promise<boolean>;
  disableMfa(userId: string): Promise<void>;
}

export interface ITokenService {
  generateAccessToken(payload: TokenPayload, options?: TokenOptions): Promise<string>;
  generateRefreshToken(payload: TokenPayload, options?: TokenOptions): Promise<string>;
  verifyToken(token: string): Promise<TokenPayload>;
  refreshAccessToken(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }>;
  revokeToken(token: string): Promise<void>;
  revokeAllUserTokens(userId: string): Promise<void>;
}

export interface ISecurityLogger {
  logSecurityEvent(
    userId: string | undefined,
    action: string,
    success: boolean,
    metadata?: Record<string, any>,
  ): Promise<void>;
  logOtpGeneration(
    userId: string,
    purpose: string,
    deliveryMethod: string,
    success: boolean,
    metadata?: Record<string, any>,
  ): Promise<void>;
  logOtpValidation(
    userId: string,
    purpose: string,
    success: boolean,
    metadata?: Record<string, any>,
  ): Promise<void>;
  logPasswordChange(
    userId: string,
    success: boolean,
    metadata?: Record<string, any>,
  ): Promise<void>;
  logPasswordValidation(
    userId: string,
    success: boolean,
    metadata?: Record<string, any>,
  ): Promise<void>;
  logMfaSetup(
    userId: string,
    mfaType: string,
    success: boolean,
    metadata?: Record<string, any>,
  ): Promise<void>;
  logMfaValidation(
    userId: string,
    mfaType: string,
    success: boolean,
    metadata?: Record<string, any>,
  ): Promise<void>;
  logTokenGeneration(
    userId: string,
    tokenType: string,
    success: boolean,
    metadata?: Record<string, any>,
  ): Promise<void>;
  logTokenValidation(
    userId: string,
    tokenType: string,
    success: boolean,
    metadata?: Record<string, any>,
  ): Promise<void>;
  logLoginAttempt(
    userId: string | undefined,
    method: string,
    success: boolean,
    metadata?: Record<string, any>,
  ): Promise<void>;
  logSuspiciousActivity(
    userId: string | undefined,
    activityType: string,
    metadata?: Record<string, any>,
  ): Promise<void>;
  getSecurityLogs(
    userId?: string,
    action?: string,
    startDate?: Date,
    endDate?: Date,
    limit?: number,
  ): Promise<SecurityLogEntry[]>;
  cleanupOldLogs(daysToKeep?: number): Promise<void>;
}