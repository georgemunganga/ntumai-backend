import { IsString, MinLength, Matches, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { BaseOtpDto } from './base';

/**
 * Data Transfer Object for password reset completion
 * Used to set a new password after successful OTP verification
 */
export class ResetPasswordDto extends BaseOtpDto {
  @ApiProperty({
    description: 'New secure password - must contain at least 8 characters with uppercase, lowercase, number and special character',
    example: 'NewSecure123!',
    minLength: 8,
    maxLength: 128,
    pattern: '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$',
    format: 'password'
  })
  @IsString({ message: 'Password must be a string' })
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @MaxLength(128, { message: 'Password must not exceed 128 characters' })
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
    {
      message: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
    }
  )
  newPassword: string;

  @ApiProperty({
    description: 'Unique request identifier from the forgot password request - used to validate the password reset session',
    example: 'pwd_reset_clh7x9k2l0000qh8v4g2m1n3p',
    pattern: '^[a-zA-Z0-9_-]+$'
  })
  @IsString({ message: 'Request ID must be a string' })
  declare requestId: string; // Override to make required
}