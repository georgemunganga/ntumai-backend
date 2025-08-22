import { IsEmail, IsNotEmpty, IsString, MinLength, IsPhoneNumber, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({
    description: 'User first name',
    example: 'John',
  })
  @IsString({ message: 'First name must be a string' })
  @IsNotEmpty({ message: 'First name is required' })
  firstName: string;

  @ApiProperty({
    description: 'User last name',
    example: 'Doe',
  })
  @IsString({ message: 'Last name must be a string' })
  @IsNotEmpty({ message: 'Last name is required' })
  lastName: string;

  @ApiProperty({
    description: 'User email address',
    example: 'user@example.com',
  })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string;

  @ApiProperty({
    description: 'User password',
    example: 'password123',
    minLength: 6,
  })
  @IsString({ message: 'Password must be a string' })
  @IsNotEmpty({ message: 'Password is required' })
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  password: string;

  @ApiProperty({
    description: 'User phone number',
    example: '+1234567890',
  })
  @IsPhoneNumber(undefined, { message: 'Please provide a valid phone number' })
  @IsNotEmpty({ message: 'Phone number is required' })
  phone: string;

  @ApiPropertyOptional({
    description: 'User role',
    example: 'CUSTOMER',
    enum: ['CUSTOMER', 'DRIVER', 'VENDOR'],
    default: 'CUSTOMER',
  })
  @IsOptional()
  @IsString({ message: 'Role must be a string' })
  role?: string = 'CUSTOMER';
}