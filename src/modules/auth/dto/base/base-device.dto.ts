import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

/**
 * Base DTO for device tracking and analytics
 */
export abstract class BaseDeviceDto {
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

  @ApiProperty({
    description: 'Device platform',
    example: 'ios',
    required: false,
  })
  @IsOptional()
  @IsString()
  platform?: string;

  @ApiProperty({
    description: 'App version',
    example: '1.0.0',
    required: false,
  })
  @IsOptional()
  @IsString()
  appVersion?: string;
}