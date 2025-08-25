import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

export class LogoutDto {
  @ApiProperty({
    description: 'User ID',
    example: 'user-123',
  })
  @IsString()
  userId: string;

  @ApiProperty({
    description: 'Refresh token (optional)',
    example: 'refresh-token-123',
    required: false,
  })
  @IsOptional()
  @IsString()
  refreshToken?: string;

  @ApiProperty({
    description: 'Device ID (optional)',
    example: 'device-123',
    required: false,
  })
  @IsOptional()
  @IsString()
  deviceId?: string;
}