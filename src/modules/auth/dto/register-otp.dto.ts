import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsEmail, IsPhoneNumber } from 'class-validator';

export class RegisterOtpDto {
  @ApiProperty({
    description: 'Phone number for registration',
    example: '+1234567890',
    required: false,
  })
  @IsOptional()
  @IsPhoneNumber()
  phoneNumber?: string;

  @ApiProperty({
    description: 'Email address for registration',
    example: 'user@example.com',
    required: false,
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({
    description: 'Country code',
    example: 'US',
  })
  @IsString()
  countryCode: string;

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