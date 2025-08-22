import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @ApiProperty({
    description: 'Token ID',
    example: 'token-123',
  })
  @IsString()
  tokenid: string;

  @ApiProperty({
    description: 'Current password',
    example: 'CurrentPassword123!',
  })
  @IsString()
  currentPassword: string;

  @ApiProperty({
    description: 'New password',
    example: 'NewPassword123!',
  })
  @IsString()
  @MinLength(8)
  newPassword: string;
}