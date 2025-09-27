import {
  IsString,
  IsEmail,
  IsPhoneNumber,
  IsOptional,
  IsDateString,
  IsEnum,
  IsBoolean,
  IsNumber,
  IsUrl,
  IsObject,
  ValidateNested,
  IsArray,
  Min,
  Max,
  Length,
  Matches,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  UserRole,
  UserStatus,
  LoyaltyTier,
  Theme,
  Language,
  Currency,
  NotificationChannel,
} from '@prisma/client';

export class UpdateProfileDto {
  @ApiPropertyOptional({ description: 'User first name' })
  @IsOptional()
  @IsString()
  @Length(1, 50)
  firstName?: string;

  @ApiPropertyOptional({ description: 'User last name' })
  @IsOptional()
  @IsString()
  @Length(1, 50)
  lastName?: string;

  @ApiPropertyOptional({ description: 'User email address' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ description: 'User phone number' })
  @IsOptional()
  @IsPhoneNumber()
  phone?: string;

  @ApiPropertyOptional({ description: 'Date of birth' })
  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @ApiPropertyOptional({ description: 'User gender' })
  @IsOptional()
  @IsString()
  @IsEnum(['MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY'])
  gender?: string;

  @ApiPropertyOptional({ description: 'User bio' })
  @IsOptional()
  @IsString()
  @Length(0, 500)
  bio?: string;

  @ApiPropertyOptional({ description: 'User website URL' })
  @IsOptional()
  @IsUrl()
  website?: string;

  @ApiPropertyOptional({ description: 'Social media links' })
  @IsOptional()
  @IsObject()
  socialLinks?: Record<string, string>;

  @ApiPropertyOptional({ description: 'Alternate email address' })
  @IsOptional()
  @IsEmail()
  alternateEmail?: string;

  @ApiPropertyOptional({ description: 'Alternate phone number' })
  @IsOptional()
  @IsPhoneNumber()
  alternatePhone?: string;

  @ApiPropertyOptional({ description: 'Emergency contact information' })
  @IsOptional()
  @IsObject()
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };

  @ApiPropertyOptional({ description: 'Preferred language', enum: Language })
  @IsOptional()
  @IsEnum(Language)
  preferredLanguage?: Language;

  @ApiPropertyOptional({ description: 'Preferred currency', enum: Currency })
  @IsOptional()
  @IsEnum(Currency)
  preferredCurrency?: Currency;

  @ApiPropertyOptional({ description: 'User timezone' })
  @IsOptional()
  @IsString()
  timezone?: string;

  @ApiPropertyOptional({ description: 'UI theme preference', enum: Theme })
  @IsOptional()
  @IsEnum(Theme)
  theme?: Theme;

  @ApiPropertyOptional({ description: 'Delivery instructions' })
  @IsOptional()
  @IsString()
  @Length(0, 500)
  deliveryInstructions?: string;
}

export class UpdateSettingsDto {
  @ApiPropertyOptional({ description: 'Email notifications enabled' })
  @IsOptional()
  @IsBoolean()
  emailNotifications?: boolean;

  @ApiPropertyOptional({ description: 'SMS notifications enabled' })
  @IsOptional()
  @IsBoolean()
  smsNotifications?: boolean;

  @ApiPropertyOptional({ description: 'Push notifications enabled' })
  @IsOptional()
  @IsBoolean()
  pushNotifications?: boolean;

  @ApiPropertyOptional({ description: 'Marketing emails enabled' })
  @IsOptional()
  @IsBoolean()
  marketingEmails?: boolean;

  @ApiPropertyOptional({ description: 'Order updates enabled' })
  @IsOptional()
  @IsBoolean()
  orderUpdates?: boolean;

  @ApiPropertyOptional({ description: 'Promotional offers enabled' })
  @IsOptional()
  @IsBoolean()
  promotionalOffers?: boolean;

  @ApiPropertyOptional({ description: 'Security alerts enabled' })
  @IsOptional()
  @IsBoolean()
  securityAlerts?: boolean;

  @ApiPropertyOptional({ description: 'Newsletter subscription enabled' })
  @IsOptional()
  @IsBoolean()
  newsletter?: boolean;

  @ApiPropertyOptional({ description: 'Profile visibility setting' })
  @IsOptional()
  @IsEnum(['PUBLIC', 'PRIVATE', 'FRIENDS_ONLY'])
  profileVisibility?: string;

  @ApiPropertyOptional({ description: 'Show online status' })
  @IsOptional()
  @IsBoolean()
  showOnlineStatus?: boolean;

  @ApiPropertyOptional({ description: 'Two-factor authentication enabled' })
  @IsOptional()
  @IsBoolean()
  twoFactorEnabled?: boolean;

  @ApiPropertyOptional({ description: 'Login notifications enabled' })
  @IsOptional()
  @IsBoolean()
  loginNotifications?: boolean;

  @ApiPropertyOptional({ description: 'Preferred notification channels' })
  @IsOptional()
  @IsArray()
  @IsEnum(NotificationChannel, { each: true })
  preferredNotificationChannels?: NotificationChannel[];
}

export class UserProfileResponseDto {
  @ApiProperty({ description: 'User ID' })
  id: string;

  @ApiProperty({ description: 'User email' })
  email: string;

  @ApiPropertyOptional({ description: 'User phone number' })
  phone?: string;

  @ApiProperty({ description: 'Current user role', enum: UserRole })
  currentRole: UserRole;

  @ApiProperty({ description: 'User status', enum: UserStatus })
  status: UserStatus;

  @ApiPropertyOptional({ description: 'First name' })
  firstName?: string;

  @ApiPropertyOptional({ description: 'Last name' })
  lastName?: string;

  @ApiPropertyOptional({ description: 'Date of birth' })
  dateOfBirth?: Date;

  @ApiPropertyOptional({ description: 'Gender' })
  gender?: string;

  @ApiPropertyOptional({ description: 'Bio' })
  bio?: string;

  @ApiPropertyOptional({ description: 'Website URL' })
  website?: string;

  @ApiPropertyOptional({ description: 'Social media links' })
  socialLinks?: Record<string, string>;

  @ApiPropertyOptional({ description: 'Profile image URL' })
  profileImageUrl?: string;

  @ApiProperty({ description: 'Email verification status' })
  isEmailVerified: boolean;

  @ApiProperty({ description: 'Phone verification status' })
  isPhoneVerified: boolean;

  @ApiProperty({ description: 'Account creation date' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update date' })
  updatedAt: Date;

  @ApiPropertyOptional({ description: 'Last login date' })
  lastLoginAt?: Date;

  @ApiProperty({ description: 'Loyalty tier', enum: LoyaltyTier })
  loyaltyTier: LoyaltyTier;

  @ApiProperty({ description: 'Loyalty points' })
  loyaltyPoints: number;

  @ApiProperty({ description: 'Total orders count' })
  totalOrders: number;

  @ApiProperty({ description: 'Total amount spent' })
  totalSpent: number;

  @ApiProperty({ description: 'Profile completion percentage' })
  profileCompletion: number;
}

export class UserSummaryDto {
  @ApiProperty({ description: 'User ID' })
  id: string;

  @ApiProperty({ description: 'User email' })
  email: string;

  @ApiProperty({ description: 'Full name' })
  fullName: string;

  @ApiProperty({ description: 'Current role', enum: UserRole })
  currentRole: UserRole;

  @ApiProperty({ description: 'User status', enum: UserStatus })
  status: UserStatus;

  @ApiPropertyOptional({ description: 'Profile image URL' })
  profileImageUrl?: string;

  @ApiProperty({ description: 'Account creation date' })
  createdAt: Date;

  @ApiProperty({ description: 'Verification status' })
  isVerified: boolean;
}

export class UserStatsDto {
  @ApiProperty({ description: 'Total orders' })
  totalOrders: number;

  @ApiProperty({ description: 'Completed orders' })
  completedOrders: number;

  @ApiProperty({ description: 'Cancelled orders' })
  cancelledOrders: number;

  @ApiProperty({ description: 'Total amount spent' })
  totalSpent: number;

  @ApiProperty({ description: 'Loyalty points' })
  loyaltyPoints: number;

  @ApiProperty({ description: 'Referral count' })
  referralCount: number;

  @ApiProperty({ description: 'Average rating' })
  averageRating: number;

  @ApiProperty({ description: 'Total ratings received' })
  totalRatings: number;

  @ApiProperty({ description: 'Loyalty tier', enum: LoyaltyTier })
  loyaltyTier: LoyaltyTier;

  @ApiProperty({ description: 'Account age in days' })
  accountAge: number;

  @ApiProperty({ description: 'Profile completion percentage' })
  profileCompletion: number;
}

export class SearchUsersDto {
  @ApiPropertyOptional({ description: 'Search query' })
  @IsOptional()
  @IsString()
  @Length(1, 100)
  query?: string;

  @ApiPropertyOptional({ description: 'Filter by role', enum: UserRole })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @ApiPropertyOptional({ description: 'Filter by status', enum: UserStatus })
  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;

  @ApiPropertyOptional({ description: 'Filter by verification status' })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true')
  isVerified?: boolean;

  @ApiPropertyOptional({ description: 'Filter by loyalty tier', enum: LoyaltyTier })
  @IsOptional()
  @IsEnum(LoyaltyTier)
  loyaltyTier?: LoyaltyTier;

  @ApiPropertyOptional({ description: 'Page number', minimum: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Items per page', minimum: 1, maximum: 100, default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @ApiPropertyOptional({ description: 'Sort field' })
  @IsOptional()
  @IsString()
  @IsEnum(['createdAt', 'updatedAt', 'lastLoginAt', 'totalOrders', 'totalSpent', 'loyaltyPoints'])
  sortBy?: string = 'createdAt';

  @ApiPropertyOptional({ description: 'Sort direction' })
  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'desc';
}

export class BulkUpdateUsersDto {
  @ApiProperty({ description: 'User IDs to update' })
  @IsArray()
  @IsString({ each: true })
  userIds: string[];

  @ApiPropertyOptional({ description: 'New status', enum: UserStatus })
  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;

  @ApiPropertyOptional({ description: 'New role', enum: UserRole })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @ApiPropertyOptional({ description: 'Enable/disable account' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class DeactivateAccountDto {
  @ApiProperty({ description: 'Reason for deactivation' })
  @IsString()
  @Length(10, 500)
  reason: string;

  @ApiPropertyOptional({ description: 'Additional feedback' })
  @IsOptional()
  @IsString()
  @Length(0, 1000)
  feedback?: string;
}

export class ReactivateAccountDto {
  @ApiPropertyOptional({ description: 'Reason for reactivation' })
  @IsOptional()
  @IsString()
  @Length(0, 500)
  reason?: string;
}

export class DeleteAccountDto {
  @ApiProperty({ description: 'Current password for verification' })
  @IsString()
  @Length(8, 128)
  currentPassword: string;

  @ApiProperty({ description: 'Reason for deletion' })
  @IsString()
  @Length(10, 500)
  reason: string;

  @ApiPropertyOptional({ description: 'Additional feedback' })
  @IsOptional()
  @IsString()
  @Length(0, 1000)
  feedback?: string;
}

export class UserListResponseDto {
  @ApiProperty({ description: 'List of users' })
  users: UserSummaryDto[];

  @ApiProperty({ description: 'Total count of users' })
  total: number;

  @ApiProperty({ description: 'Current page number' })
  page: number;

  @ApiProperty({ description: 'Items per page' })
  limit: number;

  @ApiProperty({ description: 'Total number of pages' })
  totalPages: number;

  @ApiProperty({ description: 'Has next page' })
  hasNext: boolean;

  @ApiProperty({ description: 'Has previous page' })
  hasPrev: boolean;
}