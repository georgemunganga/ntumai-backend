import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, MinLength } from 'class-validator';
import { BaseOtpDto } from './base';

export class CompleteRegistrationDto extends BaseOtpDto {
  @ApiProperty({
    description: 'First name',
    example: 'John',
  })
  @IsString()
  firstName: string;

  @ApiProperty({
    description: 'Last name',
    example: 'Doe',
  })
  @IsString()
  lastName: string;

  @ApiProperty({
    description: 'User password',
    example: 'Password123!',
  })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty({
    description: 'User role',
    example: 'CUSTOMER',
    enum: ['CUSTOMER', 'DRIVER', 'VENDOR'],
    required: false,
  })
  @IsOptional()
  @IsString()
  role?: string;
}