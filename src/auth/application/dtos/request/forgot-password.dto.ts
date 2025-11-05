import { IsEmail, IsOptional, IsString, ValidateIf } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class ForgotPasswordDto {
  @ApiPropertyOptional({
    description: 'Email address',
    example: 'user@example.com',
  })
  @ValidateIf((o) => !o.phoneNumber)
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({
    description: 'Phone number',
    example: '+260972827372',
  })
  @ValidateIf((o) => !o.email)
  @IsString()
  @IsOptional()
  phoneNumber?: string;

  @ApiPropertyOptional({
    description: 'Country code (if phone is provided)',
    example: 'ZM',
  })
  @ValidateIf((o) => !!o.phoneNumber)
  @IsString()
  @IsOptional()
  countryCode?: string;
}

export class ResetPasswordDto {
  @ApiPropertyOptional({
    description: '6-digit OTP code',
    example: '123456',
  })
  @IsString()
  otp: string;

  @ApiPropertyOptional({
    description: 'Request ID from forgot password response',
    example: 'pwd_reset_clh7x9k2l0000qh8v4g2m1n3p',
  })
  @IsString()
  requestId: string;

  @ApiPropertyOptional({
    description: 'New password',
    example: 'NewSecure123!',
  })
  @IsString()
  newPassword: string;

  @ApiPropertyOptional({
    description: 'Email address',
    example: 'user@example.com',
  })
  @ValidateIf((o) => !o.phoneNumber)
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({
    description: 'Phone number',
    example: '+260972827372',
  })
  @ValidateIf((o) => !o.email)
  @IsString()
  @IsOptional()
  phoneNumber?: string;

  @ApiPropertyOptional({
    description: 'Country code (if phone is provided)',
    example: 'ZM',
  })
  @ValidateIf((o) => !!o.phoneNumber)
  @IsString()
  @IsOptional()
  countryCode?: string;
}
