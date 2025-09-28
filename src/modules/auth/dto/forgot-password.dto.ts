import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString, Matches, ValidateIf } from 'class-validator';

/**
 * Data Transfer Object for password reset request
 * Supports both email and split phone number based password reset flows
 */
export class ForgotPasswordDto {
  @ApiPropertyOptional({
    description: 'Phone number without country code for SMS-based password reset',
    example: '972827372',
    pattern: '^\\d{5,15}$',
  })
  @ValidateIf((o) => !o.email)
  @IsNotEmpty({ message: 'Phone number is required when email is not provided' })
  @Matches(/^\d{5,15}$/, { message: 'Phone number must be between 5 and 15 digits' })
  @IsString({ message: 'Phone number must be a string of digits' })
  phone?: string;

  @ApiPropertyOptional({
    description: 'International dialling code prefixed with + (required with phone when email is not provided)',
    example: '+260',
    pattern: '^\\+?\\d{1,4}$',
  })
  @ValidateIf((o) => !o.email && !!o.phone)
  @IsNotEmpty({ message: 'Country code is required when using phone reset' })
  @Matches(/^\+?\d{1,4}$/, { message: 'Country code must include digits and may start with +' })
  @IsString({ message: 'Country code must be a string' })
  countryCode?: string;

  @ApiPropertyOptional({
    description: 'Valid email address for email-based password reset',
    example: 'john.doe@example.com',
    format: 'email',
  })
  @IsOptional()
  @ValidateIf((o) => !!o.email)
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email?: string;
}
