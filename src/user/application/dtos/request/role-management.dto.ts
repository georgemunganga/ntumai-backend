import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsObject } from 'class-validator';
import { UserRole } from '@prisma/client';

export class SwitchRoleDto {
  @ApiProperty({ enum: UserRole, example: 'VENDOR' })
  @IsEnum(UserRole)
  targetRole: UserRole;

  @ApiPropertyOptional({ example: '123456' })
  @IsOptional()
  @IsString()
  otpCode?: string;

  @ApiPropertyOptional({ example: '+260972827372' })
  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @ApiPropertyOptional({ example: 'user@example.com' })
  @IsOptional()
  @IsString()
  email?: string;
}

export class RegisterRoleDto {
  @ApiProperty({ enum: UserRole, example: 'DRIVER' })
  @IsEnum(UserRole)
  role: UserRole;

  @ApiPropertyOptional({ example: '123456' })
  @IsOptional()
  @IsString()
  otpCode?: string;

  @ApiPropertyOptional({ example: 'a5c1d19e-...' })
  @IsOptional()
  @IsString()
  challengeId?: string;

  @ApiPropertyOptional({ example: { storeName: 'Tembo Fresh' } })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
