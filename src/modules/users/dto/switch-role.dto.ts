import { ApiProperty } from '@nestjs/swagger';
<<<<<<< HEAD
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { UserRole } from '@prisma/client';
=======
import { IsOptional, IsString, Matches } from 'class-validator';

const TARGET_ROLES = ['customer', 'driver', 'rider', 'vendor', 'admin'] as const;
>>>>>>> main

export class SwitchRoleDto {
  @ApiProperty({
    description: 'The target role to switch to',
    enum: TARGET_ROLES,
    example: 'customer',
  })
  @IsString()
  @Matches(/^(customer|driver|rider|vendor|admin)$/i, {
    message: 'Target role must be one of: customer, driver, rider, vendor, admin',
  })
  targetRole: string;

  @ApiProperty({
    description: 'OTP code for verification (required for driver or vendor roles)',
    example: '123456',
    required: false,
  })
  @IsOptional()
  @IsString()
  otpCode?: string;

  @ApiProperty({
    description: 'Phone number for verification',
    example: '+1234567890',
    required: false,
  })
  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @ApiProperty({
    description: 'Email for verification',
    example: 'user@example.com',
    required: false,
  })
  @IsOptional()
  @IsString()
  email?: string;
<<<<<<< HEAD
=======

  @ApiProperty({
    description: 'OTP request identifier returned when the OTP was generated',
    example: 'otp-request-id-123',
    required: false,
  })
  @IsOptional()
  @IsString()
  requestId?: string;
>>>>>>> main
}
