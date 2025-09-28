import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Data Transfer Object for user registration
 * Supports traditional email/password registration and OTP completion flows
 */
export class RegisterDto {
  @ApiPropertyOptional({
    description: 'Registration token returned from /auth/otp/verify when completing OTP-based signup',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  @IsOptional()
  @IsString({ message: 'Registration token must be a string' })
  registrationToken?: string;

  @ApiProperty({
    description: 'User first name - must be between 2-50 characters',
    example: 'John',
    minLength: 2,
    maxLength: 50,
    pattern: '^[a-zA-Z\\s]+$',
  })
  @IsString({ message: 'First name must be a string' })
  @IsNotEmpty({ message: 'First name is required' })
  @MinLength(2, { message: 'First name must be at least 2 characters long' })
  @Matches(/^[a-zA-Z\s]+$/, { message: 'First name can only contain letters and spaces' })
  firstName: string;

  @ApiProperty({
    description: 'User last name - must be between 2-50 characters',
    example: 'Doe',
    minLength: 2,
    maxLength: 50,
    pattern: '^[a-zA-Z\\s]+$',
  })
  @IsString({ message: 'Last name must be a string' })
  @IsNotEmpty({ message: 'Last name is required' })
  @MinLength(2, { message: 'Last name must be at least 2 characters long' })
  @Matches(/^[a-zA-Z\s]+$/, { message: 'Last name can only contain letters and spaces' })
  lastName: string;

  @ApiPropertyOptional({
    description: 'Valid email address for account verification and communication',
    example: 'john.doe@example.com',
    format: 'email',
    uniqueItems: true,
  })
  @ValidateIf((dto) => !dto.registrationToken)
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  email?: string;

  @ApiProperty({
    description: 'Strong password with minimum 8 characters, including uppercase, lowercase, number and special character',
    example: 'SecurePass123!',
    minLength: 8,
    maxLength: 128,
    pattern: '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]',
    format: 'password',
  })
  @ValidateIf((dto) => !dto.registrationToken || typeof dto.password === 'string')
  @IsString({ message: 'Password must be a string' })
  @ValidateIf((dto) => !dto.registrationToken)
  @IsNotEmpty({ message: 'Password is required' })
  @ValidateIf((dto) => !dto.registrationToken || typeof dto.password === 'string')
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @ValidateIf((dto) => !dto.registrationToken || typeof dto.password === 'string')
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
    message: 'Password must contain at least one uppercase letter, one lowercase letter, one number and one special character',
  })
  password?: string;

  @ApiProperty({
    description: 'International phone number in E.164 format for SMS verification and communication',
    example: '+260972827372',
    pattern: '^\\+[1-9]\\d{1,14}$',
    uniqueItems: true
  })
  @ValidateIf((dto) => !dto.registrationToken)
  @IsPhoneNumber(undefined, { message: 'Please provide a valid phone number in international format' })
  @IsNotEmpty({ message: 'Phone number is required' })
  phone?: string;

  @ApiPropertyOptional({
    description: 'User role determining access permissions and features available',
    example: 'CUSTOMER',
    enum: ['CUSTOMER', 'DRIVER', 'VENDOR'],
    default: 'CUSTOMER',
    enumName: 'UserRole',
  })
  @IsOptional()
  @IsString({ message: 'Role must be a string' })
  role?: string = 'CUSTOMER';
}
