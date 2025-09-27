import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, Length, Matches, IsEnum } from 'class-validator';
import { BaseContactDto } from './base';

export enum DeviceType {
  MOBILE = 'mobile',
  WEB = 'web',
  TABLET = 'tablet',
  DESKTOP = 'desktop'
}

/**
 * Data Transfer Object for OTP-based login operations
 * Supports both OTP request and OTP verification for secure authentication
 */
export class LoginOtpDto extends BaseContactDto {
  @ApiProperty({
    description: 'One-Time Password (OTP) - 6 digit numeric code for login verification (required for login completion)',
    example: '123456',
    required: false,
    minLength: 6,
    maxLength: 6,
    pattern: '^[0-9]{6}$',
    format: 'string'
  })
  @IsOptional()
  @IsString({ message: 'OTP must be a string' })
  @Length(6, 6, { message: 'OTP must be exactly 6 digits' })
  @Matches(/^[0-9]{6}$/, { message: 'OTP must contain only 6 numeric digits' })
  otp?: string;

  @ApiProperty({
    description: 'Unique device identifier for security tracking and analytics - helps prevent unauthorized access',
    example: 'device_clh7x9k2l0000qh8v4g2m1n3p',
    required: false,
    pattern: '^[a-zA-Z0-9_-]+$'
  })
  @IsOptional()
  @IsString({ message: 'Device ID must be a string' })
  deviceId?: string;

  @ApiProperty({
    description: 'Type of device used for login - helps with responsive UI and security policies',
    enum: DeviceType,
    enumName: 'DeviceType',
    example: DeviceType.MOBILE,
    required: false,
    examples: {
      mobile: {
        value: DeviceType.MOBILE,
        description: 'Mobile phone or smartphone'
      },
      web: {
        value: DeviceType.WEB,
        description: 'Web browser on any device'
      },
      tablet: {
        value: DeviceType.TABLET,
        description: 'Tablet device'
      },
      desktop: {
        value: DeviceType.DESKTOP,
        description: 'Desktop computer'
      }
    }
  })
  @IsOptional()
  @IsEnum(DeviceType, { message: 'Device type must be one of: mobile, web, tablet, desktop' })
  deviceType?: DeviceType;
}