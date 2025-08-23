import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';
import { BaseContactDto } from './base';

export class LoginOtpDto extends BaseContactDto {
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