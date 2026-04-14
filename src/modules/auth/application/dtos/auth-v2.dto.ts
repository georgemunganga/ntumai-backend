import {
  IsBoolean,
  IsEmail,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

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

  @ApiProperty({
    description: 'Role path the user selected before authentication',
    example: 'vendor_tasker',
    enum: ['customer', 'tasker', 'vendor', 'vendor_tasker'],
    required: false,
  })
  @IsOptional()
  @IsString()
  @IsIn(['customer', 'tasker', 'vendor', 'vendor_tasker'])
  requestedRole?: 'customer' | 'tasker' | 'vendor' | 'vendor_tasker';
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
  @ApiProperty({ example: 'customer', required: false })
  activeRole?: string;
  @ApiProperty({ example: ['customer', 'vendor'], required: false })
  roles?: string[];
  @ApiProperty({
    example: { customer: 'complete', vendor: 'pending' },
    required: false,
  })
  roleStatuses?: Record<string, 'complete' | 'pending'>;
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
  @ApiProperty({ example: 'customer', required: false })
  activeRole?: string;
  @ApiProperty({ example: ['customer', 'vendor'], required: false })
  roles?: string[];
  @ApiProperty({
    example: { customer: 'complete', vendor: 'pending' },
    required: false,
  })
  roleStatuses?: Record<string, 'complete' | 'pending'>;
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
  @ApiProperty({ example: 'customer', required: false })
  activeRole?: string;
  @ApiProperty({ example: ['customer', 'vendor'], required: false })
  roles?: string[];
  @ApiProperty({
    example: { customer: 'complete', vendor: 'pending' },
    required: false,
  })
  roleStatuses?: Record<string, 'complete' | 'pending'>;
  @ApiProperty({
    description: 'User status (e.g., active, pending_kyc, suspended)',
    example: 'active',
  })
  status: string;
}

export class ActivateRoleDto {
  @ApiProperty({
    description: 'Role to add or activate for the authenticated user',
    example: 'customer',
    enum: ['customer', 'tasker', 'vendor'],
  })
  @IsString()
  @IsIn(['customer', 'tasker', 'vendor'])
  role: 'customer' | 'tasker' | 'vendor';
}

export class ActivateRoleResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({
    type: SelectRoleResponseData,
  })
  data: SelectRoleResponseData;
}

export class VendorLocationDto {
  @ApiProperty({ example: -15.3875 })
  @IsNumber()
  latitude: number;

  @ApiProperty({ example: 28.3228 })
  @IsNumber()
  longitude: number;
}

export class CompleteVendorOnboardingDto {
  @ApiProperty({ example: 'Mama Tina Kitchen' })
  @IsString()
  businessName: string;

  @ApiProperty({ example: 'Restaurant' })
  @IsString()
  businessType: string;

  @ApiProperty({ example: 'Fresh meals and drinks delivered daily', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: '123 Leopards Hill Road' })
  @IsString()
  address: string;

  @ApiProperty({ example: 'Lusaka' })
  @IsString()
  city: string;

  @ApiProperty({ example: 'Woodlands', required: false })
  @IsOptional()
  @IsString()
  district?: string;

  @ApiProperty({ enum: ['mobile_money', 'bank'] })
  @IsString()
  @IsIn(['mobile_money', 'bank'])
  payoutMethod: 'mobile_money' | 'bank';

  @ApiProperty({ example: 'mtn', required: false })
  @IsOptional()
  @IsString()
  mobileMoneyProvider?: string;

  @ApiProperty({ example: '0971234567', required: false })
  @IsOptional()
  @IsString()
  mobileMoneyNumber?: string;

  @ApiProperty({ example: 'Mama Tina Kitchen', required: false })
  @IsOptional()
  @IsString()
  accountName?: string;

  @ApiProperty({ example: 'Zanaco', required: false })
  @IsOptional()
  @IsString()
  bankName?: string;

  @ApiProperty({ example: '1234567890', required: false })
  @IsOptional()
  @IsString()
  accountNumber?: string;

  @ApiProperty({ type: VendorLocationDto, required: false })
  @IsOptional()
  @ValidateNested()
  @Type(() => VendorLocationDto)
  locationLatLng?: VendorLocationDto;
}

export class TaskerOnboardingDocumentDto {
  @ApiProperty({ enum: ['drivers_license', 'national_id', 'vehicle_registration'] })
  @IsString()
  @IsIn(['drivers_license', 'national_id', 'vehicle_registration'])
  type: 'drivers_license' | 'national_id' | 'vehicle_registration';

  @ApiProperty({ example: '123456/78/9' })
  @IsString()
  documentNumber: string;

  @ApiProperty({ example: 'pending', enum: ['pending', 'approved', 'rejected'] })
  @IsString()
  @IsIn(['pending', 'approved', 'rejected'])
  status: 'pending' | 'approved' | 'rejected';

  @ApiProperty({ example: '2028-04-01', required: false })
  @IsOptional()
  @IsString()
  expiryDate?: string;
}

export class CompleteTaskerOnboardingDto {
  @ApiProperty({ example: 'George Munganga' })
  @IsString()
  fullName: string;

  @ApiProperty({ example: '123456/78/9' })
  @IsString()
  nrcNumber: string;

  @ApiProperty({ example: '+260971234567' })
  @IsString()
  phoneNumber: string;

  @ApiProperty({ example: 'Motorcycle' })
  @IsString()
  vehicleType: string;

  @ApiProperty({ example: 'ABC 1234' })
  @IsString()
  plateNumber: string;

  @ApiProperty({ type: [TaskerOnboardingDocumentDto] })
  @ValidateNested({ each: true })
  @Type(() => TaskerOnboardingDocumentDto)
  documents: TaskerOnboardingDocumentDto[];
}

export class CompleteRoleOnboardingResponseData {
  @ApiProperty({
    type: CurrentUserResponseUser,
  })
  user: CurrentUserResponseUser;
}

export class CompleteRoleOnboardingResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({
    type: CompleteRoleOnboardingResponseData,
  })
  data: CompleteRoleOnboardingResponseData;
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

// ==================== Profile Addresses ====================

export class AuthAddressDto {
  @ApiProperty({ example: 'addr_123' })
  id: string;

  @ApiProperty({ example: 'home', enum: ['home', 'work', 'other'] })
  type: 'home' | 'work' | 'other';

  @ApiProperty({ example: 'Home', required: false })
  label?: string;

  @ApiProperty({ example: '123 Leopards Hill Road' })
  street: string;

  @ApiProperty({ example: 'Lusaka' })
  city: string;

  @ApiProperty({ example: 'Lusaka Province' })
  state: string;

  @ApiProperty({ example: '10101', required: false })
  zipCode?: string;

  @ApiProperty({ example: 'Zambia' })
  country: string;

  @ApiProperty({
    example: { latitude: -15.3875, longitude: 28.3228 },
    required: false,
  })
  coordinates?: {
    latitude: number;
    longitude: number;
  };

  @ApiProperty({ example: true })
  isDefault: boolean;
}

export class ProfileAddressesResponseData {
  @ApiProperty({ type: [AuthAddressDto] })
  addresses: AuthAddressDto[];
}

export class ProfileAddressesResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ type: ProfileAddressesResponseData })
  data: ProfileAddressesResponseData;
}

export class CreateAddressDto {
  @ApiProperty({ example: 'home', enum: ['home', 'work', 'other'] })
  @IsString()
  @IsIn(['home', 'work', 'other'])
  type: 'home' | 'work' | 'other';

  @ApiProperty({ example: 'Home', required: false })
  @IsOptional()
  @IsString()
  label?: string;

  @ApiProperty({ example: '123 Leopards Hill Road' })
  @IsString()
  street: string;

  @ApiProperty({ example: 'Lusaka' })
  @IsString()
  city: string;

  @ApiProperty({ example: 'Lusaka Province' })
  @IsString()
  state: string;

  @ApiProperty({ example: '10101', required: false })
  @IsOptional()
  @IsString()
  zipCode?: string;

  @ApiProperty({ example: 'Zambia', required: false })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiProperty({ example: true, required: false })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;

  @ApiProperty({ example: -15.3875, required: false })
  @IsOptional()
  @IsNumber()
  latitude?: number;

  @ApiProperty({ example: 28.3228, required: false })
  @IsOptional()
  @IsNumber()
  longitude?: number;
}

export class UpdateAddressDto {
  @ApiProperty({ example: 'home', enum: ['home', 'work', 'other'], required: false })
  @IsOptional()
  @IsString()
  @IsIn(['home', 'work', 'other'])
  type?: 'home' | 'work' | 'other';

  @ApiProperty({ example: 'Home', required: false })
  @IsOptional()
  @IsString()
  label?: string;

  @ApiProperty({ example: '123 Leopards Hill Road', required: false })
  @IsOptional()
  @IsString()
  street?: string;

  @ApiProperty({ example: 'Lusaka', required: false })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiProperty({ example: 'Lusaka Province', required: false })
  @IsOptional()
  @IsString()
  state?: string;

  @ApiProperty({ example: '10101', required: false })
  @IsOptional()
  @IsString()
  zipCode?: string;

  @ApiProperty({ example: 'Zambia', required: false })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiProperty({ example: true, required: false })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;

  @ApiProperty({ example: -15.3875, required: false })
  @IsOptional()
  @IsNumber()
  latitude?: number;

  @ApiProperty({ example: 28.3228, required: false })
  @IsOptional()
  @IsNumber()
  longitude?: number;
}

// ==================== Refresh / Logout ====================

export class RefreshTokenDto {
  @ApiProperty({
    description: 'Refresh token returned by OTP verify or role selection',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  @IsString()
  refreshToken: string;

  @ApiProperty({
    description: 'Unique device identifier for security',
    example: 'device-uuid-12345',
    required: false,
  })
  @IsOptional()
  @IsString()
  deviceId?: string;
}

export class RefreshTokenResponseData {
  @ApiProperty({ example: 'new-access-token' })
  accessToken: string;

  @ApiProperty({ example: 'new-refresh-token' })
  refreshToken: string;

  @ApiProperty({ example: 3600 })
  expiresIn: number;
}

export class RefreshTokenResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ type: RefreshTokenResponseData })
  data: RefreshTokenResponseData;
}

export class LogoutDto {
  @ApiProperty({
    description: 'Refresh token to revoke',
    required: false,
  })
  @IsOptional()
  @IsString()
  refreshToken?: string;

  @ApiProperty({
    description: 'When true, revoke all active refresh tokens for the user',
    required: false,
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  allDevices?: boolean;
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
