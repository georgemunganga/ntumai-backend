import { BaseOtpDto } from './base';

/**
 * Data Transfer Object for OTP verification
 * Used to verify One-Time Password sent via SMS or email during registration or authentication
 * 
 * Inherits all fields from BaseOtpDto:
 * - phoneNumber, email, countryCode (from BaseContactDto)
 * - otp, requestId (from BaseOtpDto)
 */
export class VerifyOtpDto extends BaseOtpDto {
  // All validation and documentation is inherited from BaseOtpDto
  // This ensures consistent OTP verification across all authentication flows
}