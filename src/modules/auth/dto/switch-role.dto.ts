import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, Matches, ValidateIf } from 'class-validator';

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

  @ApiPropertyOptional({
    description: 'OTP code for role switching verification (if required)',
    example: '123456',
  })
  @IsOptional()
  @IsString()
  otpCode?: string;

  @ApiPropertyOptional({
    description: 'Phone number without country code for OTP verification (if required)',
    example: '972827372',
    pattern: '^\\d{5,15}$',
  })
  @IsOptional()
  @ValidateIf((o) => !!o.phone)
  @Matches(/^\d{5,15}$/, { message: 'Phone number must be between 5 and 15 digits' })
  @IsString({ message: 'Phone number must be a string of digits' })
  phone?: string;

  @ApiPropertyOptional({
    description: 'International dialling code prefixed with + for OTP verification (if required)',
    example: '+260',
    pattern: '^\\+?\\d{1,4}$',
  })
  @ValidateIf((o) => !!o.phone)
  @IsOptional()
  @Matches(/^\+?\d{1,4}$/, { message: 'Country code must include digits and may start with +' })
  @IsString({ message: 'Country code must be a string' })
  countryCode?: string;

  @ApiPropertyOptional({
    description: 'Email for OTP verification (if required)',
    example: 'user@example.com',
  })
  @IsOptional()
  @IsString()
  email?: string;
}
