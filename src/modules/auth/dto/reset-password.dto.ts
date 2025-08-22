import { IsString, IsOptional, IsEmail, IsPhoneNumber, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResetPasswordDto {
  @ApiProperty({
    description: 'Phone number',
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
    description: 'Country code',
    example: 'US',
    required: false,
  })
  @IsOptional()
  @IsString()
  countryCode?: string;

  @ApiProperty({
    description: 'OTP code',
    example: '123456',
  })
  @IsString()
  otp: string;

  @ApiProperty({
    description: 'New password',
    example: 'NewPassword123!',
  })
  @IsString()
  @MinLength(8)
  newPassword: string;

  @ApiProperty({
    description: 'Request ID from forgot password',
    example: 'req-123',
  })
  @IsString()
  requestId: string;
}