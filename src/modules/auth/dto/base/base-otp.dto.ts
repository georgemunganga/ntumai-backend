import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';
import { BaseContactDto } from './base-contact.dto';

/**
 * Base DTO for OTP operations
 */
export abstract class BaseOtpDto extends BaseContactDto {
  @ApiProperty({
    description: 'OTP code',
    example: '123456',
  })
  @IsString()
  otp: string;

  @ApiProperty({
    description: 'Request ID from previous operation',
    example: 'req-123',
    required: false,
  })
  @IsOptional()
  @IsString()
  requestId?: string;
}