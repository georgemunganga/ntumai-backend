import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsEmail, IsPhoneNumber } from 'class-validator';

export class VerifyOtpDto {
  @ApiProperty({
    description: 'Phone number with country code',
    example: '+1234567890',
    required: false,
  })
  @IsOptional()
  @IsPhoneNumber()
  phoneNumber?: string;

  @ApiProperty({
    description: 'Email address',
    example: 'user@example.com',
    required: false,
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({
    description: 'OTP code',
    example: '123456',
  })
  @IsString()
  otp: string;

  @ApiProperty({
    description: 'Request ID from registration',
    example: 'req-123',
    required: false,
  })
  @IsOptional()
  @IsString()
  requestId?: string;
}