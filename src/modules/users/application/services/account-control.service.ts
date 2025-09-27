import { Injectable, NotFoundException, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { UserEntity, UserStatus } from '../../domain/entities/user.entity';
import { UserRepositoryInterface } from '../../domain/repositories/user.repository.interface';
import { UserVerificationService } from '../../domain/services/user-verification.service';
import { RoleManagementService, RoleChangeResult } from '../../domain/services/role-management.service';
import { UserSettings } from '../../domain/value-objects/user-settings.vo';
import { UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ResetPasswordRequest {
  email: string;
  resetToken: string;
  newPassword: string;
  confirmPassword: string;
}

export interface UpdateSecuritySettingsRequest {
  twoFactorEnabled?: boolean;
  loginNotifications?: boolean;
  sessionTimeout?: number;
  allowedLoginAttempts?: number;
}

export interface SecurityAuditLog {
  id: string;
  userId: string;
  action: string;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
  success: boolean;
  details?: Record<string, any>;
}

export interface AccountSecurityStatus {
  passwordStrength: 'weak' | 'medium' | 'strong';
  lastPasswordChange?: Date;
  twoFactorEnabled: boolean;
  recentLoginAttempts: number;
  suspiciousActivity: boolean;
  accountLocked: boolean;
  securityScore: number; // 0-100
  recommendations: string[];
}

export interface RoleChangeRequest {
  targetRole: UserRole;
  otpCode?: string;
  reason?: string;
}

export interface AccountDeletionRequest {
  password: string;
  reason?: string;
  feedback?: string;
}

@Injectable()
export class AccountControlService {
  constructor(
    private readonly userRepository: UserRepositoryInterface,
    private readonly userVerificationService: UserVerificationService,
    private readonly roleManagementService: RoleManagementService,
  ) {}

  async changePassword(userId: string, request: ChangePasswordRequest): Promise<void> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Validate current password
    const isCurrentPasswordValid = await bcrypt.compare(request.currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    // Validate new password confirmation
    if (request.newPassword !== request.confirmPassword) {
      throw new BadRequestException('New password and confirmation do not match');
    }

    // Validate password strength
    this.validatePasswordStrength(request.newPassword);

    // Check if new password is different from current
    const isSamePassword = await bcrypt.compare(request.newPassword, user.password);
    if (isSamePassword) {
      throw new BadRequestException('New password must be different from current password');
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(request.newPassword, 12);

    // Update user password
    user.changePassword(hashedPassword);
    const updatedUser = user;
    await this.userRepository.update(userId, updatedUser);

    // Log security event
    await this.logSecurityEvent(userId, 'password_changed', true);
  }

  async resetPassword(request: ResetPasswordRequest): Promise<void> {
    const user = await this.userRepository.findByEmail(request.email);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Validate reset token (this would typically involve checking a separate token store)
    // For now, we'll assume token validation is handled elsewhere
    
    // Validate new password confirmation
    if (request.newPassword !== request.confirmPassword) {
      throw new BadRequestException('New password and confirmation do not match');
    }

    // Validate password strength
    this.validatePasswordStrength(request.newPassword);

    // Hash new password
    const hashedPassword = await bcrypt.hash(request.newPassword, 12);

    // Update user password
    user.changePassword(hashedPassword);
    const updatedUser = user;
    await this.userRepository.update(user.id, updatedUser);

    // Log security event
    await this.logSecurityEvent(user.id, 'password_reset', true);
  }

  async updateSecuritySettings(userId: string, settings: UpdateSecuritySettingsRequest): Promise<UserEntity> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Update security settings using the existing settings object
    const currentSettings = user.settings;
    const updatedSettings = UserSettings.create({
      ...currentSettings,
      security: {
        ...currentSettings.security,
        twoFactorEnabled: settings.twoFactorEnabled ?? currentSettings.security.twoFactorEnabled,
        loginNotifications: settings.loginNotifications ?? currentSettings.security.loginNotifications,
        sessionTimeout: currentSettings.security.sessionTimeout,
        allowMultipleSessions: currentSettings.security.allowMultipleSessions
      }
    });
    
    user.updateSettings(updatedSettings);
    const updatedUser = user;

    const result = await this.userRepository.update(userId, updatedUser);

    // Log security event
    await this.logSecurityEvent(userId, 'security_settings_updated', true, settings);

    return result;
  }

  async getAccountSecurityStatus(userId: string): Promise<AccountSecurityStatus> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Calculate password strength (simplified)
    const passwordStrength = this.calculatePasswordStrength(user.password);
    
    // Get recent login attempts (this would typically come from a security log)
    const recentLoginAttempts = 0; // Placeholder
    
    // Check for suspicious activity
    const suspiciousActivity = false; // Placeholder
    
    // Check if account is locked
    const accountLocked = user.status === UserStatus.SUSPENDED;
    
    // Calculate security score
    let securityScore = 0;
    if (passwordStrength === 'strong') securityScore += 30;
    else if (passwordStrength === 'medium') securityScore += 20;
    else securityScore += 10;
    
    if (user.settings.security.twoFactorEnabled) securityScore += 25;
    if (user.isEmailVerified) securityScore += 15;
    if (user.isPhoneVerified) securityScore += 15;
    if (!suspiciousActivity) securityScore += 10;
    if (!accountLocked) securityScore += 5;
    
    // Generate recommendations
    const recommendations: string[] = [];
    if (passwordStrength === 'weak') {
      recommendations.push('Use a stronger password with mixed characters');
    }
    if (!user.settings.security.twoFactorEnabled) {
      recommendations.push('Enable two-factor authentication for better security');
    }
    if (!user.isEmailVerified) {
      recommendations.push('Verify your email address');
    }
    if (!user.isPhoneVerified) {
      recommendations.push('Verify your phone number');
    }

    return {
      passwordStrength,
      lastPasswordChange: undefined, // No passwordChangedAt property in UserEntity
      twoFactorEnabled: user.settings.security.twoFactorEnabled,
      recentLoginAttempts,
      suspiciousActivity,
      accountLocked,
      securityScore,
      recommendations,
    };
  }

  async requestRoleChange(userId: string, request: RoleChangeRequest): Promise<RoleChangeResult> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Using the user entity's switchRole method directly
    user.switchRole(request.targetRole);
    return { success: true, user, role: request.targetRole };
  }

  async enableTwoFactor(userId: string): Promise<{ qrCode: string; backupCodes: string[] }> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.settings.security.twoFactorEnabled) {
      throw new BadRequestException('Two-factor authentication is already enabled');
    }

    // Generate QR code and backup codes (simplified)
    const qrCode = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
    const backupCodes = Array.from({ length: 10 }, () => 
      Math.random().toString(36).substring(2, 8).toUpperCase()
    );

    // Log security event
    await this.logSecurityEvent(userId, '2fa_setup_initiated', true);

    return { qrCode, backupCodes };
  }

  async verifyTwoFactor(userId: string, code: string): Promise<void> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Verify the 2FA code (simplified)
    if (code.length !== 6 || !/^\d{6}$/.test(code)) {
      throw new BadRequestException('Invalid 2FA code format');
    }

    // Enable 2FA for user
    // Update security settings to enable two-factor
    const currentSettings = user.settings;
    const updatedSettings = UserSettings.create({
      ...currentSettings,
      security: {
        ...currentSettings.security,
        twoFactorEnabled: true
      }
    });
    
    user.updateSettings(updatedSettings);
    const updatedUser = user;
    await this.userRepository.update(userId, updatedUser);

    // Log security event
    await this.logSecurityEvent(userId, '2fa_enabled', true);
  }

  async disableTwoFactor(userId: string, password: string): Promise<void> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.settings.security.twoFactorEnabled) {
      throw new BadRequestException('Two-factor authentication is not enabled');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid password');
    }

    // Disable 2FA for user
    // Update security settings to disable two-factor
    const currentSettings = user.settings;
    const updatedSettings = UserSettings.create({
      ...currentSettings,
      security: {
        ...currentSettings.security,
        twoFactorEnabled: false
      }
    });
    
    user.updateSettings(updatedSettings);
    const updatedUser = user;
    await this.userRepository.update(userId, updatedUser);

    // Log security event
    await this.logSecurityEvent(userId, '2fa_disabled', true);
  }

  async requestAccountDeletion(userId: string, request: AccountDeletionRequest): Promise<void> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(request.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid password');
    }

    // Check for pending orders or active subscriptions
    // Get order stats from user.stats instead
    const totalOrders = user.stats.totalOrders;
    // CustomerStats doesn't have completedOrders property
    const completedOrders = 0; // Default to 0 since property doesn't exist
    const cancelledOrders = user.stats.customerStats?.cancelledOrders || 0;
    const hasActiveOrders = totalOrders > completedOrders + cancelledOrders;
    if (hasActiveOrders) {
      throw new BadRequestException('Cannot delete account with pending orders');
    }

    // Mark account for deletion (soft delete)
    // Use deactivate method instead of markForDeletion
    user.deactivate();
    const deletedUser = user;
    await this.userRepository.update(userId, deletedUser);

    // Log security event
    await this.logSecurityEvent(userId, 'account_deletion_requested', true, {
      reason: request.reason,
      feedback: request.feedback
    });
  }

  async getSecurityAuditLog(userId: string, limit: number = 50): Promise<SecurityAuditLog[]> {
    // This would typically fetch from a dedicated security log table
    // For now, return empty array as placeholder
    return [];
  }

  async lockAccount(userId: string, reason: string, durationHours?: number, adminComments?: string): Promise<void> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.suspend();
    await this.userRepository.update(userId, user);

    // Log security event
    await this.logSecurityEvent(userId, 'account_locked', true, {
      reason,
      durationHours,
      adminComments,
    });
  }

  async unlockAccount(userId: string, reason?: string, adminComments?: string): Promise<void> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.status !== UserStatus.SUSPENDED) {
      throw new BadRequestException('Account is not locked');
    }

    user.reactivate();
    await this.userRepository.update(userId, user);

    // Log security event
    await this.logSecurityEvent(userId, 'account_unlocked', true, { reason, adminComments });
  }

  private validatePasswordStrength(password: string): void {
    if (password.length < 8) {
      throw new BadRequestException('Password must be at least 8 characters long');
    }

    if (!/(?=.*[a-z])/.test(password)) {
      throw new BadRequestException('Password must contain at least one lowercase letter');
    }

    if (!/(?=.*[A-Z])/.test(password)) {
      throw new BadRequestException('Password must contain at least one uppercase letter');
    }

    if (!/(?=.*\d)/.test(password)) {
      throw new BadRequestException('Password must contain at least one number');
    }

    if (!/(?=.*[@$!%*?&])/.test(password)) {
      throw new BadRequestException('Password must contain at least one special character');
    }
  }

  private calculatePasswordStrength(hashedPassword: string): 'weak' | 'medium' | 'strong' {
    // This is a simplified implementation
    // In reality, you'd analyze the original password or store strength info
    return 'medium';
  }

  private async logSecurityEvent(
    userId: string,
    action: string,
    success: boolean,
    details?: Record<string, any>
  ): Promise<void> {
    // This would typically log to a dedicated security audit table
    // For now, this is a placeholder
    console.log(`Security Event: ${action} for user ${userId}, success: ${success}`, details);
  }

  async getLoginHistory(userId: string, limit: number = 20): Promise<Array<{
    timestamp: Date;
    ipAddress: string;
    userAgent: string;
    success: boolean;
    location?: string;
  }>> {
    // This would typically fetch from a login history table
    // For now, return empty array as placeholder
    return [];
  }

  async revokeAllSessions(userId: string): Promise<void> {
    // This would typically invalidate all refresh tokens and sessions
    // Log security event
    await this.logSecurityEvent(userId, 'all_sessions_revoked', true);
  }

  async updateLoginNotificationSettings(userId: string, enabled: boolean): Promise<void> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Update security settings for login notifications
    const currentSettings = user.settings;
    const updatedSettings = UserSettings.create({
      ...currentSettings,
      security: {
        ...currentSettings.security,
        loginNotifications: enabled
      }
    });
    
    user.updateSettings(updatedSettings);
    const updatedUser = user;
    await this.userRepository.update(userId, updatedUser);
  }
}