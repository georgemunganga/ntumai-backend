import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, Length, Matches } from 'class-validator';
import { BaseContactDto } from './base-contact.dto';

/**
 * Base DTO for OTP (One-Time Password) operations
 * Extends contact information with OTP verification capabilities
 */
export abstract class BaseOtpDto extends BaseContactDto {
  @ApiProperty({
    description: 'One-Time Password (OTP) - 6 digit numeric code sent via SMS or email',
    example: '123456',
    minLength: 6,
    maxLength: 6,
    pattern: '^[0-9]{6}$',
    format: 'string'
  })
  @IsString({ message: 'OTP must be a string' })
  @Length(6, 6, { message: 'OTP must be exactly 6 digits' })
  @Matches(/^[0-9]{6}$/, { message: 'OTP must contain only 6 numeric digits' })
  otp: string;

  @ApiProperty({
    description: 'Unique request identifier from the initial OTP generation request - used to track and validate OTP sessions',
    example: 'otp_req_clh7x9k2l0000qh8v4g2m1n3p',
    required: false,
    pattern: '^[a-zA-Z0-9_-]+$'
  })
  @IsOptional()
  @IsString({ message: 'Request ID must be a string' })
  requestId?: string;
}