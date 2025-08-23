import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { BaseOtpDto } from './base';

export class ResetPasswordDto extends BaseOtpDto {
  @ApiProperty({
    description: 'New password',
    example: 'NewPassword123!',
  })
  @IsString()
  @MinLength(8)
  newPassword: string;

  @ApiProperty({
    description: 'Request ID from forgot password (required for reset)',
    example: 'req-123',
  })
  @IsString()
  declare requestId: string; // Override to make required
}