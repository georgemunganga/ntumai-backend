import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsNotEmpty, Matches, IsEnum } from 'class-validator';
import { BaseContactDto } from './base';

export enum DeviceType {
  MOBILE = 'mobile',
  WEB = 'web',
  TABLET = 'tablet',
  DESKTOP = 'desktop'
}

/**
 * Data Transfer Object for OTP registration request
 * Used to initiate user registration process with phone or email verification
 */
export class RegisterOtpDto extends BaseContactDto {
  @ApiProperty({
    description: 'ISO 3166-1 alpha-2 country code (required for registration and phone number validation)',
    example: 'ZM',
    pattern: '^[A-Z]{2}$',
    minLength: 2,
    maxLength: 2
  })
  @IsString({ message: 'Country code must be a string' })
  @IsNotEmpty({ message: 'Country code is required for registration' })
  @Matches(/^[A-Z]{2}$/, { message: 'Country code must be a valid 2-letter ISO country code' })
  declare countryCode: string; // Override to make required

  @ApiProperty({
    description: 'Unique device identifier for security tracking and analytics - helps prevent fraud and unauthorized registrations',
    example: 'device_clh7x9k2l0000qh8v4g2m1n3p',
    required: false,
    pattern: '^[a-zA-Z0-9_-]+$'
  })
  @IsOptional()
  @IsString({ message: 'Device ID must be a string' })
  deviceId?: string;

  @ApiProperty({
    description: 'Type of device used for registration - helps with responsive UI and security policies',
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