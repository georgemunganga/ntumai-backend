import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsEmail, IsPhoneNumber, MinLength } from 'class-validator';

export class CompleteRegistrationDto {
  @ApiProperty({
    description: 'Token ID from OTP verification',
    example: 'token-123',
  })
  @IsString()
  tokenID: string;

  @ApiProperty({
    description: 'User password',
    example: 'Password123!',
  })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty({
    description: 'Phone number',
    example: '+1234567890',
    required: false,
  })
  @IsOptional()
  @IsPhoneNumber()
  phone?: string;

  @ApiProperty({
    description: 'Email address',
    example: 'user@example.com',
    required: false,
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({
    description: 'User type',
    example: 'customer',
    enum: ['customer', 'rider', 'seller'],
  })
  @IsString()
  userType: string;
}