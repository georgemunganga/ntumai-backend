import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsIn, IsOptional } from 'class-validator';

export class SwitchRoleDto {
  @ApiProperty({
    description: 'Target role to switch to',
    example: 'customer',
    enum: ['customer', 'rider', 'vendor'],
  })
  @IsString()
  @IsIn(['customer', 'rider', 'vendor'], {
    message: 'Target role must be one of: customer, rider, vendor',
  })
  targetRole: string;

  @ApiProperty({
    description: 'OTP code for role switching verification (if required)',
    example: '123456',
    required: false,
  })
  @IsOptional()
  @IsString()
  otpCode?: string;

  @ApiProperty({
    description: 'Phone number for OTP verification (if required)',
    example: '+1234567890',
    required: false,
  })
  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @ApiProperty({
    description: 'Email for OTP verification (if required)',
    example: 'user@example.com',
    required: false,
  })
  @IsOptional()
  @IsString()
  email?: string;
}