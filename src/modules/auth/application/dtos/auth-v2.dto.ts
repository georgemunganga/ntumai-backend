import { IsEmail, IsOptional, IsString, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

// ==================== OTP Start Flow ====================

export class StartOtpDto {
  @ApiProperty({
    description: 'User email address (for login/signup)',
    example: 'user@example.com',
    required: false,
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({
    description: 'User phone number (for login/signup)',
    example: '+254712345678',
    required: false,
  })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({
    description: 'Unique device identifier for security',
    example: 'device-uuid-12345',
    required: false,
  })
  @IsOptional()
  @IsString()
  deviceId?: string;
}

export class StartOtpResponseData {
  @ApiProperty({
    description: 'Session ID for OTP verification',
    example: 'otp-session-uuid-12345',
  })
  sessionId: string;
  @ApiProperty({
    description: 'Time until session expires (seconds)',
    example: 300,
  })
  expiresIn: number;
  @ApiProperty({
    description: 'Type of flow initiated',
    example: 'signup',
    enum: ['login', 'signup'],
  })
  flowType: 'login' | 'signup';
  @ApiProperty({
    description: 'Channels where OTP was sent',
    example: ['email', 'sms'],
  })
  channelsSent: string[];
}

export class StartOtpResponseDto {
  @ApiProperty({ example: true })
  success: boolean;
  @ApiProperty({
    type: StartOtpResponseData,
  })
  data: StartOtpResponseData;
}

// ==================== OTP Verification ====================

export class VerifyOtpDto {
  @ApiProperty({
    description: 'Session ID received from start-otp endpoint',
    example: 'otp-session-uuid-12345',
  })
  @IsString()
  sessionId: string;

  @ApiProperty({
    description: 'The 6-digit OTP code received by the user',
    example: '123456',
  })
  @IsString()
  otp: string;

  @ApiProperty({
    description: 'Unique device identifier for security',
    example: 'device-uuid-12345',
    required: false,
  })
  @IsOptional()
  @IsString()
  deviceId?: string;
}

class VerifyOtpResponseUser {
  @ApiProperty({ example: 'uuid-user-123' })
  id: string;
  @ApiProperty({ example: 'user@example.com', required: false })
  email?: string;
  @ApiProperty({ example: '+254712345678', required: false })
  phone?: string;
  @ApiProperty({ example: 'customer', required: false })
  role?: string;
}

export class VerifyOtpResponseData {
  @ApiProperty({
    description: 'Type of flow completed',
    example: 'login',
    enum: ['login', 'signup'],
  })
  flowType: 'login' | 'signup';
  @ApiProperty({
    description: 'True if the user is new and needs to select a role',
    example: false,
  })
  requiresRoleSelection: boolean;
  @ApiProperty({
    description: 'JWT Access Token (present if requiresRoleSelection is false)',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    required: false,
  })
  accessToken?: string;
  @ApiProperty({
    description: 'JWT Refresh Token (present if requiresRoleSelection is false)',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    required: false,
  })
  refreshToken?: string;
  @ApiProperty({
    description: 'Time until access token expires (seconds)',
    example: 900,
    required: false,
  })
  expiresIn?: number;
  @ApiProperty({
    description: 'Token for role selection (present if requiresRoleSelection is true)',
    example: 'onboarding-token-uuid-67890',
    required: false,
  })
  onboardingToken?: string;
  @ApiProperty({
    type: VerifyOtpResponseUser,
  })
  user: VerifyOtpResponseUser;
}

export class VerifyOtpResponseDto {
  @ApiProperty({ example: true })
  success: boolean;
  @ApiProperty({
    type: VerifyOtpResponseData,
  })
  data: VerifyOtpResponseData;
}

// ==================== Role Selection ====================

export class SelectRoleDto {
  @ApiProperty({
    description: 'Onboarding token received from verify-otp endpoint',
    example: 'onboarding-token-uuid-67890',
  })
  @IsString()
  onboardingToken: string;

  @ApiProperty({
    description: 'The role the user is selecting',
    example: 'customer',
    enum: ['customer', 'tasker', 'vendor'],
  })
  @IsString()
  role: 'customer' | 'tasker' | 'vendor';
}

class SelectRoleResponseUser {
  @ApiProperty({ example: 'uuid-user-123' })
  id: string;
  @ApiProperty({ example: 'user@example.com', required: false })
  email?: string;
  @ApiProperty({ example: '+254712345678', required: false })
  phone?: string;
  @ApiProperty({ example: 'customer' })
  role: string;
}

export class SelectRoleResponseData {
  @ApiProperty({
    description: 'JWT Access Token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  accessToken: string;
  @ApiProperty({
    description: 'JWT Refresh Token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  refreshToken: string;
  @ApiProperty({
    description: 'Time until access token expires (seconds)',
    example: 900,
  })
  expiresIn: number;
  @ApiProperty({
    type: SelectRoleResponseUser,
  })
  user: SelectRoleResponseUser;
}

export class SelectRoleResponseDto {
  @ApiProperty({ example: true })
  success: boolean;
  @ApiProperty({
    type: SelectRoleResponseData,
  })
  data: SelectRoleResponseData;
}

// ==================== Get Current User ====================

class CurrentUserResponseUser {
  @ApiProperty({ example: 'uuid-user-123' })
  id: string;
  @ApiProperty({ example: 'user@example.com', required: false })
  email?: string;
  @ApiProperty({ example: '+254712345678', required: false })
  phone?: string;
  @ApiProperty({ example: 'customer', required: false })
  role?: string;
  @ApiProperty({
    description: 'User status (e.g., active, pending_kyc, suspended)',
    example: 'active',
  })
  status: string;
}

export class CurrentUserResponseData {
  @ApiProperty({
    type: CurrentUserResponseUser,
  })
  user: CurrentUserResponseUser;
}

export class CurrentUserResponseDto {
  @ApiProperty({ example: true })
  success: boolean;
  @ApiProperty({
    type: CurrentUserResponseData,
  })
  data: CurrentUserResponseData;
}

// ==================== Error Response ====================

class ErrorResponseData {
  @ApiProperty({ example: 'BAD_REQUEST' })
  code: string;
  @ApiProperty({ example: 'Invalid OTP code' })
  message: string;
  @ApiProperty({ required: false })
  details?: any;
}

export class ErrorResponseDto {
  @ApiProperty({ example: false })
  success: false;
  @ApiProperty({
    type: ErrorResponseData,
  })
  error: ErrorResponseData;
}
