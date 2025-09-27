import { User } from '../../domain/entities/user.entity';

// Base command for OTP operations
export interface BaseOtpCommand {
  phoneNumber?: string;
  email?: string;
  countryCode?: string;
  deviceId?: string;
  deviceType?: string;
}

// OTP Generation Commands
export interface GenerateRegistrationOtpCommand extends BaseOtpCommand {
  // Inherits contact and device info
}

export interface GenerateLoginOtpCommand extends BaseOtpCommand {
  // Inherits contact and device info
}

export interface GeneratePasswordResetOtpCommand extends BaseOtpCommand {
  // Inherits contact info
}

// OTP Verification Commands
export interface VerifyOtpCommand extends BaseOtpCommand {
  otp: string;
  requestId?: string;
}

export interface CompleteRegistrationCommand extends VerifyOtpCommand {
  firstName: string;
  lastName: string;
  role?: string;
}

export interface CompletePasswordResetCommand extends VerifyOtpCommand {
  newPassword: string;
  requestId: string; // Required for password reset
}

// Results
export interface OtpGenerationResult {
  success: boolean;
  message: string;
  requestId: string;
  expiresAt?: Date;
}

export interface OtpVerificationResult {
  success: boolean;
  message: string;
  isValid: boolean;
}

export interface AuthenticationResult {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface RegistrationResult extends AuthenticationResult {
  isNewUser: true;
}

export interface LoginResult extends AuthenticationResult {
  isNewUser: false;
}

export interface PasswordResetResult {
  success: boolean;
  message: string;
}

/**
 * Consolidated OTP Management Use Case
 * Handles all OTP-related operations to reduce code duplication
 */
export abstract class OtpManagementUseCase {
  // OTP Generation
  abstract generateRegistrationOtp(command: GenerateRegistrationOtpCommand): Promise<OtpGenerationResult>;
  abstract generateLoginOtp(command: GenerateLoginOtpCommand): Promise<OtpGenerationResult>;
  abstract generatePasswordResetOtp(command: GeneratePasswordResetOtpCommand): Promise<OtpGenerationResult>;
  
  // OTP Verification
  abstract verifyOtp(command: VerifyOtpCommand): Promise<OtpVerificationResult>;
  
  // Complete Operations
  abstract completeRegistration(command: CompleteRegistrationCommand): Promise<RegistrationResult>;
  abstract completeLogin(command: VerifyOtpCommand): Promise<LoginResult>;
  abstract completePasswordReset(command: CompletePasswordResetCommand): Promise<PasswordResetResult>;
}