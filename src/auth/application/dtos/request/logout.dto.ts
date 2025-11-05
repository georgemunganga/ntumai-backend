import { IsOptional, IsString, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class LogoutDto {
  @ApiProperty({
    description: 'User ID',
    example: 'clh7x9k2l0000qh8v4g2m1n3p',
  })
  @IsUUID()
  userId: string;

  @ApiProperty({
    description: 'Refresh token to invalidate',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  @IsString()
  refreshToken: string;

  @ApiPropertyOptional({
    description: 'Device ID (optional)',
    example: 'device_android_123456',
  })
  @IsOptional()
  @IsString()
  deviceId?: string;
}
