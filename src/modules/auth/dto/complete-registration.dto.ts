import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, MinLength, MaxLength, Matches, IsEnum } from 'class-validator';
import { BaseOtpDto } from './base';

export enum UserRole {
  CUSTOMER = 'CUSTOMER',
  DRIVER = 'DRIVER',
  VENDOR = 'VENDOR',
}

/**
 * Data Transfer Object for completing user registration after OTP verification
 * Used to finalize account creation with personal details and credentials
 */
export class CompleteRegistrationDto extends BaseOtpDto {
  @ApiProperty({
    description: 'User\'s first name - must be between 2-50 characters, letters only',
    example: 'John',
    minLength: 2,
    maxLength: 50,
    pattern: '^[a-zA-Z\\s\\-\']+$'
  })
  @IsString({ message: 'First name must be a string' })
  @MinLength(2, { message: 'First name must be at least 2 characters long' })
  @MaxLength(50, { message: 'First name must not exceed 50 characters' })
  @Matches(/^[a-zA-Z\s\-']+$/, { message: 'First name can only contain letters, spaces, hyphens, and apostrophes' })
  firstName: string;

  @ApiProperty({
    description: 'User\'s last name - must be between 2-50 characters, letters only',
    example: 'Doe',
    minLength: 2,
    maxLength: 50,
    pattern: '^[a-zA-Z\\s\\-\']+$'
  })
  @IsString({ message: 'Last name must be a string' })
  @MinLength(2, { message: 'Last name must be at least 2 characters long' })
  @MaxLength(50, { message: 'Last name must not exceed 50 characters' })
  @Matches(/^[a-zA-Z\s\-']+$/, { message: 'Last name can only contain letters, spaces, hyphens, and apostrophes' })
  lastName: string;

  @ApiProperty({
    description: 'User role in the system - determines access permissions and available features',
    enum: UserRole,
    enumName: 'UserRole',
    example: UserRole.CUSTOMER,
    required: false,
    examples: {
      customer: {
        value: UserRole.CUSTOMER,
        description: 'Regular customer who can place orders and make purchases'
      },
      driver: {
        value: UserRole.DRIVER,
        description: 'Delivery driver who can accept and fulfill delivery requests'
      },
      vendor: {
        value: UserRole.VENDOR,
        description: 'Business vendor who can list products and manage inventory'
      }
    }
  })
  @IsOptional()
  @IsEnum(UserRole, { message: 'Role must be one of: CUSTOMER, DRIVER, VENDOR' })
  role?: UserRole;
}