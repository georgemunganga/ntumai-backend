import {
  IsString,
  IsEmail,
  IsPhoneNumber,
  IsOptional,
  IsEnum,
  IsBoolean,
  IsArray,
  ValidateNested,
  Length,
  Matches,
  IsStrongPassword,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole, NotificationChannel } from '@prisma/client';

export class ChangePasswordDto {
  @ApiProperty({ description: 'Current password' })
  @IsString()
  @Length(1, 128)
  currentPassword: string;

  @ApiProperty({ description: 'New password' })
  @IsStrongPassword({
    minLength: 8,
    minLowercase: 1,
    minUppercase: 1,
    minNumbers: 1,
    minSymbols: 1,
  }, {
    message: 'Password must be at least 8 characters long and contain at least one lowercase letter, one uppercase letter, one number, and one symbol',
  })
  newPassword: string;

  @ApiProperty({ description: 'Confirm new password' })
  @IsString()
  confirmPassword: string;
}

export class ResetPasswordRequestDto {
  @ApiProperty({ description: 'Email address' })
  @IsEmail()
  email: string;
}

export class ResetPasswordDto {
  @ApiProperty({ description: 'Password reset token' })
  @IsString()
  @Length(1, 500)
  token: string;

  @ApiProperty({ description: 'New password' })
  @IsStrongPassword({
    minLength: 8,
    minLowercase: 1,
    minUppercase: 1,
    minNumbers: 1,
    minSymbols: 1,
  }, {
    message: 'Password must be at least 8 characters long and contain at least one lowercase letter, one uppercase letter, one number, and one symbol',
  })
  newPassword: string;

  @ApiProperty({ description: 'Confirm new password' })
  @IsString()
  confirmPassword: string;
}

export class UpdateSecuritySettingsDto {
  @ApiPropertyOptional({ description: 'Enable two-factor authentication' })
  @IsOptional()
  @IsBoolean()
  twoFactorEnabled?: boolean;

  @ApiPropertyOptional({ description: 'Enable login notifications' })
  @IsOptional()
  @IsBoolean()
  loginNotifications?: boolean;

  @ApiPropertyOptional({ description: 'Enable security alerts' })
  @IsOptional()
  @IsBoolean()
  securityAlerts?: boolean;

  @ApiPropertyOptional({ description: 'Session timeout in minutes' })
  @IsOptional()
  @IsString()
  @Matches(/^(15|30|60|120|240|480)$/, {
    message: 'Session timeout must be one of: 15, 30, 60, 120, 240, or 480 minutes',
  })
  sessionTimeout?: string;

  @ApiPropertyOptional({ description: 'Preferred notification channels for security alerts' })
  @IsOptional()
  @IsArray()
  @IsEnum(NotificationChannel, { each: true })
  securityNotificationChannels?: NotificationChannel[];
}

export class ChangeRoleRequestDto {
  @ApiProperty({ description: 'Target role', enum: UserRole })
  @IsEnum(UserRole)
  targetRole: UserRole;

  @ApiProperty({ description: 'Reason for role change' })
  @IsString()
  @Length(10, 500)
  reason: string;

  @ApiPropertyOptional({ description: 'Additional documentation or proof' })
  @IsOptional()
  @IsString()
  @Length(0, 1000)
  documentation?: string;
}

export class ApproveRoleChangeDto {
  @ApiProperty({ description: 'Role change request ID' })
  @IsString()
  requestId: string;

  @ApiProperty({ description: 'Approval decision' })
  @IsBoolean()
  approved: boolean;

  @ApiPropertyOptional({ description: 'Admin comments' })
  @IsOptional()
  @IsString()
  @Length(0, 500)
  comments?: string;
}

export class Enable2FADto {
  @ApiProperty({ description: 'Current password for verification' })
  @IsString()
  @Length(1, 128)
  currentPassword: string;

  @ApiPropertyOptional({ description: 'Phone number for SMS 2FA' })
  @IsOptional()
  @IsPhoneNumber()
  phoneNumber?: string;

  @ApiProperty({ description: '2FA method' })
  @IsEnum(['SMS', 'EMAIL', 'AUTHENTICATOR_APP'])
  method: string;
}

export class Verify2FADto {
  @ApiProperty({ description: '2FA verification code' })
  @IsString()
  @Matches(/^\d{6}$/, {
    message: '2FA code must be exactly 6 digits',
  })
  code: string;

  @ApiPropertyOptional({ description: 'Backup code (if primary method fails)' })
  @IsOptional()
  @IsString()
  @Length(8, 16)
  backupCode?: string;
}

export class Disable2FADto {
  @ApiProperty({ description: 'Current password for verification' })
  @IsString()
  @Length(1, 128)
  currentPassword: string;

  @ApiProperty({ description: '2FA verification code' })
  @IsString()
  @Matches(/^\d{6}$/, {
    message: '2FA code must be exactly 6 digits',
  })
  code: string;

  @ApiProperty({ description: 'Reason for disabling 2FA' })
  @IsString()
  @Length(10, 200)
  reason: string;
}

export class RequestAccountDeletionDto {
  @ApiProperty({ description: 'Current password for verification' })
  @IsString()
  @Length(1, 128)
  currentPassword: string;

  @ApiProperty({ description: 'Reason for account deletion' })
  @IsString()
  @Length(10, 500)
  reason: string;

  @ApiPropertyOptional({ description: 'Additional feedback' })
  @IsOptional()
  @IsString()
  @Length(0, 1000)
  feedback?: string;

  @ApiProperty({ description: 'Confirmation phrase: "DELETE MY ACCOUNT"' })
  @IsString()
  @Matches(/^DELETE MY ACCOUNT$/, {
    message: 'You must type exactly "DELETE MY ACCOUNT" to confirm',
  })
  confirmationPhrase: string;
}

export class LockAccountDto {
  @ApiProperty({ description: 'User ID to lock' })
  @IsString()
  userId: string;

  @ApiProperty({ description: 'Reason for locking account' })
  @IsString()
  @Length(10, 500)
  reason: string;

  @ApiPropertyOptional({ description: 'Lock duration in hours (0 for indefinite)' })
  @IsOptional()
  @IsString()
  @Matches(/^(0|[1-9]\d{0,2}|[1-7]\d{3}|8760)$/, {
    message: 'Lock duration must be between 0 and 8760 hours (1 year)',
  })
  durationHours?: string;

  @ApiPropertyOptional({ description: 'Admin comments' })
  @IsOptional()
  @IsString()
  @Length(0, 500)
  adminComments?: string;
}

export class UnlockAccountDto {
  @ApiProperty({ description: 'User ID to unlock' })
  @IsString()
  userId: string;

  @ApiProperty({ description: 'Reason for unlocking account' })
  @IsString()
  @Length(10, 500)
  reason: string;

  @ApiPropertyOptional({ description: 'Admin comments' })
  @IsOptional()
  @IsString()
  @Length(0, 500)
  adminComments?: string;
}

export class SecuritySettingsResponseDto {
  @ApiProperty({ description: 'Two-factor authentication enabled' })
  twoFactorEnabled: boolean;

  @ApiProperty({ description: 'Login notifications enabled' })
  loginNotifications: boolean;

  @ApiProperty({ description: 'Security alerts enabled' })
  securityAlerts: boolean;

  @ApiProperty({ description: 'Session timeout in minutes' })
  sessionTimeout: number;

  @ApiProperty({ description: 'Last password change date' })
  lastPasswordChange: Date;

  @ApiProperty({ description: 'Active sessions count' })
  activeSessions: number;

  @ApiProperty({ description: 'Recent login attempts' })
  recentLoginAttempts: Array<{
    timestamp: Date;
    ipAddress: string;
    userAgent: string;
    success: boolean;
    location?: string;
  }>;

  @ApiProperty({ description: 'Security notification channels' })
  securityNotificationChannels: NotificationChannel[];

  @ApiProperty({ description: 'Account lock status' })
  isLocked: boolean;

  @ApiPropertyOptional({ description: 'Lock expiry date' })
  lockExpiresAt?: Date;

  @ApiPropertyOptional({ description: 'Lock reason' })
  lockReason?: string;
}

export class RoleChangeRequestResponseDto {
  @ApiProperty({ description: 'Request ID' })
  id: string;

  @ApiProperty({ description: 'User ID' })
  userId: string;

  @ApiProperty({ description: 'Current role', enum: UserRole })
  currentRole: UserRole;

  @ApiProperty({ description: 'Requested role', enum: UserRole })
  requestedRole: UserRole;

  @ApiProperty({ description: 'Request reason' })
  reason: string;

  @ApiPropertyOptional({ description: 'Supporting documentation' })
  documentation?: string;

  @ApiProperty({ description: 'Request status' })
  status: 'PENDING' | 'APPROVED' | 'REJECTED';

  @ApiProperty({ description: 'Request creation date' })
  createdAt: Date;

  @ApiPropertyOptional({ description: 'Admin who processed the request' })
  processedBy?: string;

  @ApiPropertyOptional({ description: 'Processing date' })
  processedAt?: Date;

  @ApiPropertyOptional({ description: 'Admin comments' })
  adminComments?: string;
}

export class TwoFactorSetupResponseDto {
  @ApiProperty({ description: 'Setup successful' })
  success: boolean;

  @ApiPropertyOptional({ description: 'QR code for authenticator app (base64)' })
  qrCode?: string;

  @ApiPropertyOptional({ description: 'Secret key for manual entry' })
  secretKey?: string;

  @ApiProperty({ description: 'Backup codes' })
  backupCodes: string[];

  @ApiProperty({ description: 'Setup instructions' })
  instructions: string[];
}

export class AccountDeletionRequestResponseDto {
  @ApiProperty({ description: 'Deletion request ID' })
  requestId: string;

  @ApiProperty({ description: 'Scheduled deletion date' })
  scheduledDeletionDate: Date;

  @ApiProperty({ description: 'Grace period in days' })
  gracePeriodDays: number;

  @ApiProperty({ description: 'Cancellation instructions' })
  cancellationInstructions: string;

  @ApiProperty({ description: 'Data export availability' })
  dataExportAvailable: boolean;

  @ApiPropertyOptional({ description: 'Data export download URL' })
  dataExportUrl?: string;
}

export class SecurityAuditLogDto {
  @ApiProperty({ description: 'Event ID' })
  id: string;

  @ApiProperty({ description: 'User ID' })
  userId: string;

  @ApiProperty({ description: 'Event type' })
  eventType: string;

  @ApiProperty({ description: 'Event description' })
  description: string;

  @ApiProperty({ description: 'IP address' })
  ipAddress: string;

  @ApiProperty({ description: 'User agent' })
  userAgent: string;

  @ApiPropertyOptional({ description: 'Location' })
  location?: string;

  @ApiProperty({ description: 'Event timestamp' })
  timestamp: Date;

  @ApiProperty({ description: 'Risk level' })
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

  @ApiPropertyOptional({ description: 'Additional metadata' })
  metadata?: Record<string, any>;
}

export class PasswordStrengthResponseDto {
  @ApiProperty({ description: 'Password strength score (0-4)' })
  score: number;

  @ApiProperty({ description: 'Password strength label' })
  strength: 'Very Weak' | 'Weak' | 'Fair' | 'Good' | 'Strong';

  @ApiProperty({ description: 'Feedback messages' })
  feedback: string[];

  @ApiProperty({ description: 'Suggestions for improvement' })
  suggestions: string[];

  @ApiProperty({ description: 'Estimated crack time' })
  crackTime: string;
}