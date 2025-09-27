import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { UserEntity } from '../../domain/entities/user.entity';
import { UserRepositoryInterface } from '../../domain/repositories/user.repository.interface';
import { UserProfile, UserSettings, UserStats } from '../../domain/value-objects';
import { UserVerificationService } from '../../domain/services/user-verification.service';
import { RoleManagementService } from '../../domain/services/role-management.service';
import { UserStatisticsService } from '../../domain/services/user-statistics.service';
import { UserRole, UserStatus, LoyaltyTier, Theme, Language, Currency } from '@prisma/client';

export interface UpdateProfileRequest {
  firstName?: string;
  lastName?: string;
  dateOfBirth?: Date;
  gender?: string;
  bio?: string;
  website?: string;
  socialLinks?: Record<string, string>;
  alternateEmail?: string;
  alternatePhone?: string;
  emergencyContact?: Record<string, any>;
  deliveryInstructions?: string;
}

export interface UpdateSettingsRequest {
  preferredLanguage?: Language;
  preferredCurrency?: Currency;
  timezone?: string;
  theme?: Theme;
  emailNotifications?: boolean;
  smsNotifications?: boolean;
  pushNotifications?: boolean;
  marketingEmails?: boolean;
  orderUpdates?: boolean;
  promotionalOffers?: boolean;
  profileVisibility?: string;
  showOnlineStatus?: boolean;
  twoFactorEnabled?: boolean;
  loginNotifications?: boolean;
}

export interface ProfileCompletionResult {
  isComplete: boolean;
  completionPercentage: number;
  missingFields: string[];
  recommendations: string[];
}

export interface UserProfileSummary {
  id: string;
  email: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  currentRole: UserRole;
  status: UserStatus;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  profileCompletion: ProfileCompletionResult;
  loyaltyTier: LoyaltyTier;
  totalOrders: number;
  loyaltyPoints: number;
  createdAt: Date;
  lastLoginAt?: Date;
}

@Injectable()
export class ProfileManagementService {
  constructor(
    private readonly userRepository: UserRepositoryInterface,
    private readonly userVerificationService: UserVerificationService,
    private readonly roleManagementService: RoleManagementService,
    private readonly userStatisticsService: UserStatisticsService,
  ) {}

  async getUserProfile(userId: string): Promise<UserEntity> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async updateProfile(userId: string, updateData: UpdateProfileRequest): Promise<UserEntity> {
    const user = await this.getUserProfile(userId);

    // Validate alternate email if provided
    if (updateData.alternateEmail && updateData.alternateEmail !== user.alternateEmail) {
      const existingUser = await this.userRepository.findByEmail(updateData.alternateEmail);
      if (existingUser && existingUser.id !== userId) {
        throw new ConflictException('Alternate email already in use');
      }
    }

    // Validate alternate phone if provided
    if (updateData.alternatePhone && updateData.alternatePhone !== user.alternatePhone) {
      const existingUser = await this.userRepository.findByPhone(updateData.alternatePhone);
      if (existingUser && existingUser.id !== userId) {
        throw new ConflictException('Alternate phone already in use');
      }
    }

    // Update user profile
    const updatedUser = user.updateProfile({
      firstName: updateData.firstName,
      lastName: updateData.lastName,
      dateOfBirth: updateData.dateOfBirth,
      gender: updateData.gender,
      bio: updateData.bio,
      website: updateData.website,
      socialLinks: updateData.socialLinks,
      alternateEmail: updateData.alternateEmail,
      alternatePhone: updateData.alternatePhone,
      emergencyContact: updateData.emergencyContact,
      deliveryInstructions: updateData.deliveryInstructions,
    });

    return await this.userRepository.update(userId, updatedUser);
  }

  async updateSettings(userId: string, settingsData: UpdateSettingsRequest): Promise<UserEntity> {
    const user = await this.getUserProfile(userId);

    const updatedUser = user.updateSettings({
      preferredLanguage: settingsData.preferredLanguage,
      preferredCurrency: settingsData.preferredCurrency,
      timezone: settingsData.timezone,
      theme: settingsData.theme,
      emailNotifications: settingsData.emailNotifications,
      smsNotifications: settingsData.smsNotifications,
      pushNotifications: settingsData.pushNotifications,
      marketingEmails: settingsData.marketingEmails,
      orderUpdates: settingsData.orderUpdates,
      promotionalOffers: settingsData.promotionalOffers,
      profileVisibility: settingsData.profileVisibility,
      showOnlineStatus: settingsData.showOnlineStatus,
      twoFactorEnabled: settingsData.twoFactorEnabled,
      loginNotifications: settingsData.loginNotifications,
    });

    return await this.userRepository.update(userId, updatedUser);
  }

  async getProfileCompletion(userId: string): Promise<ProfileCompletionResult> {
    const user = await this.getUserProfile(userId);
    
    const requiredFields = [
      'firstName',
      'lastName',
      'phone',
      'dateOfBirth',
    ];

    const optionalFields = [
      'bio',
      'website',
      'alternateEmail',
      'emergencyContact',
    ];

    const missingRequired = requiredFields.filter(field => !user[field]);
    const missingOptional = optionalFields.filter(field => !user[field]);
    
    const totalFields = requiredFields.length + optionalFields.length;
    const completedFields = totalFields - missingRequired.length - missingOptional.length;
    const completionPercentage = Math.round((completedFields / totalFields) * 100);
    
    const isComplete = missingRequired.length === 0;
    
    const recommendations = [];
    if (missingRequired.length > 0) {
      recommendations.push('Complete required profile information');
    }
    if (!user.isEmailVerified) {
      recommendations.push('Verify your email address');
    }
    if (!user.isPhoneVerified) {
      recommendations.push('Verify your phone number');
    }
    if (missingOptional.length > 0) {
      recommendations.push('Add optional profile details for better experience');
    }

    return {
      isComplete,
      completionPercentage,
      missingFields: [...missingRequired, ...missingOptional],
      recommendations,
    };
  }

  async getUserProfileSummary(userId: string): Promise<UserProfileSummary> {
    const user = await this.getUserProfile(userId);
    const profileCompletion = await this.getProfileCompletion(userId);

    return {
      id: user.id,
      email: user.email,
      phone: user.phone,
      firstName: user.firstName,
      lastName: user.lastName,
      currentRole: user.currentRole,
      status: user.status,
      isEmailVerified: user.isEmailVerified,
      isPhoneVerified: user.isPhoneVerified,
      profileCompletion,
      loyaltyTier: user.loyaltyTier,
      totalOrders: user.totalOrders,
      loyaltyPoints: user.loyaltyPoints,
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt,
    };
  }

  async deactivateAccount(userId: string, reason?: string): Promise<UserEntity> {
    const user = await this.getUserProfile(userId);
    
    if (user.status === UserStatus.INACTIVE) {
      throw new BadRequestException('Account is already deactivated');
    }

    const deactivatedUser = user.deactivate(reason);
    return await this.userRepository.update(userId, deactivatedUser);
  }

  async reactivateAccount(userId: string): Promise<UserEntity> {
    const user = await this.getUserProfile(userId);
    
    if (user.status === UserStatus.ACTIVE) {
      throw new BadRequestException('Account is already active');
    }

    if (user.status === UserStatus.SUSPENDED || user.status === UserStatus.BANNED) {
      throw new BadRequestException('Cannot reactivate suspended or banned account');
    }

    const reactivatedUser = user.reactivate();
    return await this.userRepository.update(userId, reactivatedUser);
  }

  async deleteAccount(userId: string): Promise<void> {
    const user = await this.getUserProfile(userId);
    
    // Check if user has pending orders or active subscriptions
    const hasActiveOrders = user.totalOrders > user.completedOrders + user.cancelledOrders;
    if (hasActiveOrders) {
      throw new BadRequestException('Cannot delete account with pending orders');
    }

    // Soft delete by marking as deleted
    const deletedUser = user.markAsDeleted();
    await this.userRepository.update(userId, deletedUser);
  }

  async updateLastLogin(userId: string): Promise<void> {
    const user = await this.getUserProfile(userId);
    const updatedUser = user.updateLastLogin();
    await this.userRepository.update(userId, updatedUser);
  }

  async getUsersByRole(role: UserRole, limit?: number, offset?: number): Promise<UserEntity[]> {
    return await this.userRepository.findByRole(role, limit, offset);
  }

  async searchUsers(query: string, filters?: {
    role?: UserRole;
    status?: UserStatus;
    isVerified?: boolean;
  }): Promise<UserEntity[]> {
    return await this.userRepository.search(query, filters);
  }

  async getUserStatistics(userId: string): Promise<any> {
    return await this.userStatisticsService.calculateUserStatistics(userId);
  }

  async bulkUpdateUserStatus(userIds: string[], status: UserStatus): Promise<void> {
    await this.userRepository.bulkUpdateStatus(userIds, status);
  }

  async getRecentlyActiveUsers(limit: number = 50): Promise<UserEntity[]> {
    return await this.userRepository.findRecentlyActive(limit);
  }

  async getUsersWithIncompleteProfiles(): Promise<UserEntity[]> {
    return await this.userRepository.findWithIncompleteProfiles();
  }
}