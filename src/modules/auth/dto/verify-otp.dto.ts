import { BaseOtpDto } from './base';

export class VerifyOtpDto extends BaseOtpDto {
  // Inherits all fields from BaseOtpDto:
  // - phoneNumber, email, countryCode (from BaseContactDto)
  // - otp, requestId (from BaseOtpDto)
}