import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';

export class RegisterDto {
  @ApiPropertyOptional({
    description:
      'Registration token from OTP verification (for OTP-first flow)',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  @IsOptional()
  @IsString()
  registrationToken?: string;

  @ApiProperty({
    description: 'First name',
    example: 'Amina',
  })
  @IsString()
  @MinLength(1)
  firstName: string;

  @ApiProperty({
    description: 'Last name',
    example: 'Tembo',
  })
  @IsString()
  @MinLength(1)
  lastName: string;

  @ApiProperty({
    description:
      'Password (minimum 8 characters, must include uppercase, lowercase, number, and special character)',
    example: 'SecurePass123!',
  })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty({
    description: 'User role',
    enum: UserRole,
    example: 'CUSTOMER',
  })
  @IsEnum(UserRole)
  role: UserRole;

  @ApiPropertyOptional({
    description: 'Email (for non-OTP registration flow)',
    example: 'user@example.com',
  })
  @ValidateIf((o) => !o.registrationToken && !o.phoneNumber)
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({
    description: 'Phone number (for non-OTP registration flow)',
    example: '+260972827372',
  })
  @ValidateIf((o) => !o.registrationToken && !o.email)
  @IsString()
  @IsOptional()
  phoneNumber?: string;

  @ApiPropertyOptional({
    description: 'Country code (required if phoneNumber is provided)',
    example: 'ZM',
  })
  @ValidateIf((o) => !!o.phoneNumber)
  @IsString()
  @IsOptional()
  countryCode?: string;
}
