import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsEmail, IsPhoneNumber } from 'class-validator';

/**
 * Base DTO for contact information (email/phone)
 */
export abstract class BaseContactDto {
  @ApiProperty({
    description: 'Phone number with country code',
    example: '+1234567890',
    required: false,
  })
  @IsOptional()
  @IsPhoneNumber()
  phoneNumber?: string;

  @ApiProperty({
    description: 'Email address',
    example: 'user@example.com',
    required: false,
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({
    description: 'Country code',
    example: 'US',
    required: false,
  })
  @IsOptional()
  @IsString()
  countryCode?: string;
}