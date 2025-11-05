import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  ValidateIf,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum OtpPurposeDto {
  LOGIN = 'login',
  REGISTER = 'register',
  PASSWORD_RESET = 'password_reset',
}

export class OtpRequestDto {
  @ApiProperty({
    description: 'Purpose of the OTP request',
    enum: OtpPurposeDto,
    example: 'login',
  })
  @IsEnum(OtpPurposeDto)
  purpose: OtpPurposeDto;

  @ApiPropertyOptional({
    description: 'Email address (use email OR phone, not both)',
    example: 'user@example.com',
  })
  @ValidateIf((o) => !o.phone)
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({
    description: 'Phone number (local/national part)',
    example: '972827372',
  })
  @ValidateIf((o) => !o.email)
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({
    description: 'Country code with + prefix (required if phone is provided)',
    example: '+260',
  })
  @ValidateIf((o) => !!o.phone)
  @IsString()
  @IsOptional()
  countryCode?: string;
}
