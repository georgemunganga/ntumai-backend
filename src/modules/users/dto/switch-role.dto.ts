import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsString, IsOptional } from 'class-validator';
import { UserRole } from '@prisma/client';

export class SwitchRoleDto {
  @ApiProperty({
    description: 'The target role to switch to',
    enum: UserRole,
    example: UserRole.CUSTOMER,
  })
  @IsEnum(UserRole)
  targetRole: UserRole;

  @ApiProperty({
    description: 'OTP code for verification',
    example: '123456',
  })
  @IsString()
  otpCode: string;

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
}