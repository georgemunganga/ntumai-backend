import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, Matches } from 'class-validator';

export enum DeviceType {
  MOBILE = 'mobile',
  WEB = 'web',
  TABLET = 'tablet',
  DESKTOP = 'desktop'
}

export enum Platform {
  IOS = 'ios',
  ANDROID = 'android',
  WEB = 'web',
  WINDOWS = 'windows',
  MACOS = 'macos',
  LINUX = 'linux'
}

/**
 * Base DTO for device information and analytics
 * Provides comprehensive device tracking for security and user experience optimization
 */
export abstract class BaseDeviceDto {
  @ApiProperty({
    description: 'Unique device identifier for security tracking and analytics - helps prevent unauthorized access and fraud detection',
    example: 'device_clh7x9k2l0000qh8v4g2m1n3p',
    required: false,
    pattern: '^[a-zA-Z0-9_-]+$'
  })
  @IsOptional()
  @IsString({ message: 'Device ID must be a string' })
  deviceId?: string;

  @ApiProperty({
    description: 'Type of device used for the request - helps with responsive UI and security policies',
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

  @ApiProperty({
    description: 'Operating system or platform of the device - used for platform-specific features and compatibility',
    enum: Platform,
    enumName: 'Platform',
    example: Platform.IOS,
    required: false,
    examples: {
      ios: {
        value: Platform.IOS,
        description: 'Apple iOS devices (iPhone, iPad)'
      },
      android: {
        value: Platform.ANDROID,
        description: 'Android devices'
      },
      web: {
        value: Platform.WEB,
        description: 'Web browsers'
      },
      windows: {
        value: Platform.WINDOWS,
        description: 'Microsoft Windows'
      },
      macos: {
        value: Platform.MACOS,
        description: 'Apple macOS'
      },
      linux: {
        value: Platform.LINUX,
        description: 'Linux distributions'
      }
    }
  })
  @IsOptional()
  @IsEnum(Platform, { message: 'Platform must be one of: ios, android, web, windows, macos, linux' })
  platform?: Platform;

  @ApiProperty({
    description: 'Application version number in semantic versioning format (major.minor.patch) - used for feature compatibility and debugging',
    example: '1.2.3',
    required: false,
    pattern: '^\\d+\\.\\d+\\.\\d+(-[a-zA-Z0-9]+)?$'
  })
  @IsOptional()
  @IsString({ message: 'App version must be a string' })
  @Matches(/^\d+\.\d+\.\d+(-[a-zA-Z0-9]+)?$/, { message: 'App version must follow semantic versioning format (e.g., 1.2.3 or 1.2.3-beta)' })
  appVersion?: string;
}