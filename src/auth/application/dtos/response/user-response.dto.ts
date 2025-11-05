import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';

export class UserResponseDto {
  @ApiProperty({ example: 'clh7x9k2l0000qh8v4g2m1n3p' })
  id: string;

  @ApiProperty({ example: 'user@example.com', required: false })
  email?: string;

  @ApiProperty({ example: '+260972827372', required: false })
  phone?: string;

  @ApiProperty({ example: 'John' })
  firstName: string;

  @ApiProperty({ example: 'Doe' })
  lastName: string;

  @ApiProperty({ enum: UserRole, example: 'CUSTOMER' })
  role: UserRole;

  @ApiProperty({ example: true })
  isEmailVerified: boolean;

  @ApiProperty({ example: true })
  isPhoneVerified: boolean;

  @ApiProperty({ example: '2025-01-10T10:30:00Z' })
  createdAt: Date;

  @ApiProperty({ example: '2025-01-15T10:30:00Z' })
  updatedAt: Date;
}

export class TokensResponseDto {
  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' })
  accessToken: string;

  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' })
  refreshToken: string;

  @ApiProperty({ example: 3600 })
  expiresIn: number;

  @ApiProperty({ example: 'Bearer', default: 'Bearer' })
  tokenType: string = 'Bearer';
}

export class OtpRequestResponseDto {
  @ApiProperty({ example: 'a5c1d19e-0f4b-4c26-91d5-2f25b1d83c2e' })
  challengeId: string;

  @ApiProperty({ example: '2025-01-15T10:35:00Z' })
  expiresAt: Date;

  @ApiProperty({ example: '2025-01-15T10:31:00Z' })
  resendAvailableAt: Date;

  @ApiProperty({ example: 5 })
  attemptsAllowed: number;
}

export class OtpVerifyExistingUserResponseDto {
  @ApiProperty({ type: UserResponseDto })
  user: UserResponseDto;

  @ApiProperty({ type: TokensResponseDto })
  tokens: TokensResponseDto;
}

export class OtpVerifyNewUserResponseDto {
  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' })
  registrationToken: string;

  @ApiProperty({ example: 600 })
  expiresIn: number;
}

export class RegisterResponseDto {
  @ApiProperty({ type: UserResponseDto })
  user: UserResponseDto;

  @ApiProperty({ type: TokensResponseDto })
  tokens: TokensResponseDto;
}
