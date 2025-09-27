export interface OtpPayload {
  identifier: string; // phone number or email
  code: string;
  purpose: 'login' | 'registration' | 'password-reset' | 'kyc' | 'transaction' | 'mfa';
  expiresAt: Date;
  attempts?: number;
  maxAttempts?: number;
}

export interface OtpGenerationOptions {
  length?: number;
  expiryMinutes?: number;
  maxAttempts?: number;
  alphanumeric?: boolean;
}

export interface OtpValidationResult {
  isValid: boolean;
  isExpired?: boolean;
  attemptsExceeded?: boolean;
  remainingAttempts?: number;
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
  generateOtp(identifier: string, purpose: OtpPayload['purpose'], options?: OtpGenerationOptions): Promise<string>;
  validateOtp(identifier: string, code: string, purpose: OtpPayload['purpose']): Promise<OtpValidationResult>;
  resendOtp(identifier: string, purpose: OtpPayload['purpose']): Promise<string>;
  invalidateOtp(identifier: string, purpose: OtpPayload['purpose']): Promise<void>;
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