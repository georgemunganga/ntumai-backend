import { IsEmail, IsOptional, IsString, IsPhoneNumber, ValidateIf } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * Data Transfer Object for password reset request
 * Supports both email and phone number based password reset flows
 */
export class ForgotPasswordDto {
  @ApiProperty({
    description: 'International phone number in E.164 format for SMS-based password reset',
    example: '+260972827372',
    required: false,
    pattern: '^\\+[1-9]\\d{1,14}$',
    format: 'phone'
  })
  @IsOptional()
  @ValidateIf((o) => !o.email || o.phoneNumber)
  @IsPhoneNumber(undefined, { message: 'Please provide a valid phone number in international format' })
  phoneNumber?: string;

  @ApiProperty({
    description: 'ISO 3166-1 alpha-2 country code (required when using phone number)',
    example: 'ZM',
    required: false,
    pattern: '^[A-Z]{2}$',
    minLength: 2,
    maxLength: 2
  })
  @IsOptional()
  @ValidateIf((o) => o.phoneNumber)
  @IsString({ message: 'Country code must be a string' })
  countryCode?: string;

  @ApiProperty({
    description: 'Valid email address for email-based password reset',
    example: 'john.doe@example.com',
    required: false,
    format: 'email'
  })
  @IsOptional()
  @ValidateIf((o) => !o.phoneNumber || o.email)
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email?: string;
}