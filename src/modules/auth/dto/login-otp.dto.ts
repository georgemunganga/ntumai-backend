import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsEmail, IsPhoneNumber } from 'class-validator';

export class LoginOtpDto {
  @ApiProperty({
    description: 'Phone number',
    example: '+1234567890',
    required: false,
  })
  @IsOptional()
  @IsPhoneNumber()
  phoneNumber?: string;

  @ApiProperty({
    description: 'Country code',
    example: 'US',
    required: false,
  })
  @IsOptional()
  @IsString()
  countryCode?: string;

  @ApiProperty({
    description: 'Email address',
    example: 'user@example.com',
    required: false,
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({
    description: 'OTP code for login',
    example: '123456',
    required: false,
  })
  @IsOptional()
  @IsString()
  otp?: string;

  @ApiProperty({
    description: 'Device ID for analytics',
    example: 'device-123',
    required: false,
  })
  @IsOptional()
  @IsString()
  deviceId?: string;

  @ApiProperty({
    description: 'Device type for analytics',
    example: 'mobile',
    required: false,
  })
  @IsOptional()
  @IsString()
  deviceType?: string;
}