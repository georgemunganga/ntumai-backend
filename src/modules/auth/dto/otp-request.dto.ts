import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  ValidateIf,
} from 'class-validator';

export class OtpRequestDto {
  @ApiPropertyOptional({
    description: 'Email address to receive the OTP challenge',
    example: 'john.doe@example.com',
  })
  @ValidateIf((dto) => !dto.phone)
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty({ message: 'Email cannot be empty when provided' })
  email?: string;

  @ApiPropertyOptional({
    description: 'Phone number without the country code',
    example: '972827372',
    pattern: '^\\d{5,15}$',
  })
  @ValidateIf((dto) => !dto.email)
  @IsNotEmpty({ message: 'Phone number is required when email is not supplied' })
  @IsString({ message: 'Phone number must be a string of digits' })
  @Matches(/^\d{5,15}$/, { message: 'Phone number must be between 5 and 15 digits' })
  phone?: string;

  @ApiPropertyOptional({
    description: 'International country code prefixed with +',
    example: '+260',
    pattern: '^\\+?\\d{1,4}$',
  })
  @ValidateIf((dto) => !dto.email)
  @IsNotEmpty({ message: 'Country code is required when using phone login' })
  @IsString({ message: 'Country code must be a string' })
  @Matches(/^\+?\d{1,4}$/, { message: 'Country code must include digits and may start with +' })
  countryCode?: string;

  @ApiProperty({
    description: 'Purpose of the OTP challenge',
    enum: ['login', 'register'],
    example: 'login',
  })
  @IsEnum(['login', 'register'], { message: 'Purpose must be either login or register' })
  purpose: 'login' | 'register';

  @ApiPropertyOptional({
    description: 'Client device identifier used for throttling and analytics',
    example: 'device_android_123456',
  })
  @IsOptional()
  @IsString({ message: 'Device ID must be a string' })
  deviceId?: string;

  @ApiPropertyOptional({
    description: 'Optional device classification',
    example: 'mobile',
  })
  @IsOptional()
  @IsString({ message: 'Device type must be a string' })
  deviceType?: string;

  @ValidateIf((dto) => !dto.email && !dto.phone)
  @IsNotEmpty({ message: 'Either email or phone with countryCode must be provided' })
  contactGuard?: string;
}
