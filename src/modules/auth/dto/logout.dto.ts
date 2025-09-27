import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsNotEmpty, IsUUID } from 'class-validator';

/**
 * Data Transfer Object for user logout operations
 * Supports both single device and all devices logout with proper token invalidation
 */
export class LogoutDto {
  @ApiProperty({
    description: 'Unique user identifier (UUID) - identifies the user session to terminate',
    example: 'clh7x9k2l0000qh8v4g2m1n3p',
    format: 'uuid'
  })
  @IsString({ message: 'User ID must be a string' })
  @IsNotEmpty({ message: 'User ID is required' })
  @IsUUID(4, { message: 'User ID must be a valid UUID' })
  userId: string;

  @ApiProperty({
    description: 'JWT refresh token to invalidate (optional) - if provided, only this specific token will be invalidated',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjbGg3eDlrMmwwMDAwcWg4djRnMm0xbjNwIiwiaWF0IjoxNjg5NzY5MjAwLCJleHAiOjE2OTIzNjEyMDB9.signature',
    required: false,
    format: 'jwt',
    pattern: '^[A-Za-z0-9-_]+\\.[A-Za-z0-9-_]+\\.[A-Za-z0-9-_]*$'
  })
  @IsOptional()
  @IsString({ message: 'Refresh token must be a string' })
  refreshToken?: string;

  @ApiProperty({
    description: 'Unique device identifier (optional) - if provided, logout will be performed only for this specific device',
    example: 'device_clh7x9k2l0000qh8v4g2m1n3p',
    required: false,
    pattern: '^[a-zA-Z0-9_-]+$'
  })
  @IsOptional()
  @IsString({ message: 'Device ID must be a string' })
  deviceId?: string;
}