import { Injectable, Inject } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  ChangePasswordUseCase,
  ChangePasswordCommand,
  ChangePasswordResult,
  ForgotPasswordUseCase,
  ForgotPasswordCommand,
  ForgotPasswordResult,
  ResetPasswordUseCase,
  ResetPasswordCommand,
  ResetPasswordResult,
} from '../use-cases';
import { UserRepository } from '../../domain/repositories';
import { UserManagementDomainService } from '../../domain/services';
import { Password, Email } from '../../domain/value-objects';
import { PasswordChangedEvent } from '../../domain/events';

export interface NotificationService {
  sendPasswordResetEmail(email: string, resetToken: string): Promise<void>;
  sendPasswordChangedNotification(email: string): Promise<void>;
}

@Injectable()
export class PasswordManagementService
{
  constructor(
    private readonly userRepository: UserRepository,
    private readonly userManagementService: UserManagementDomainService,
    private readonly eventEmitter: EventEmitter2,
    @Inject('NOTIFICATION_SERVICE') private readonly notificationService: NotificationService,
  ) {}

  async changePassword(
    command: ChangePasswordCommand,
  ): Promise<ChangePasswordResult> {
    try {
      // Find user
      const user = await this.userRepository.findById(command.userId);
      if (!user) {
        return {
          success: false,
          message: 'User not found',
        };
      }

      // Validate current password
      const isCurrentPasswordValid = await user.validatePassword(command.currentPassword);

      if (!isCurrentPasswordValid) {
        return {
          success: false,
          message: 'Current password is incorrect',
        };
      }

      // Create new password and change it
      const newPassword = await Password.create(command.newPassword);
      await user.changePassword(newPassword);

      // Save user
      await this.userRepository.save(user);

      // Send notification
      await this.notificationService.sendPasswordChangedNotification(
        user.email.value,
      );

      // Emit domain event
      const event = new PasswordChangedEvent({
        userId: user.id,
        occurredAt: new Date(),
      });
      this.eventEmitter.emit('password.changed', event);

      return {
        success: true,
        message: 'Password changed successfully',
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Password change failed',
      };
    }
  }

  async forgotPassword(
    command: ForgotPasswordCommand,
  ): Promise<ForgotPasswordResult> {
    try {
      // Validate that email is provided
      if (!command.email) {
        return {
          success: true,
          message: 'Password reset email sent',
        };
      }

      // Find user by email
      const user = await this.userRepository.findByEmail(Email.create(command.email));
      
      // Always return success for security (don't reveal if email exists)
      if (!user) {
        return {
          success: true,
          message: 'Password reset email sent',
        };
      }
      
      // Generate reset token
      const resetToken = this.userManagementService.generateResetToken(user.id);
      
      // Create password reset token in database
      await this.userRepository.createPasswordResetToken(
        user.id,
        resetToken.token,
        resetToken.expiresAt
      );
      
      // Send reset email
      await this.notificationService.sendPasswordResetEmail(user.email.value, resetToken.token);
      
      return {
        success: true,
        message: 'Password reset email sent',
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to process forgot password request',
      };
    }
  }

  async resetPassword(
    command: ResetPasswordCommand,
  ): Promise<ResetPasswordResult> {
    try {
      // Find user by reset token (using otp as token)
      const user = await this.userRepository.findByResetToken(command.otp);
      
      if (!user) {
        return {
          success: false,
          message: 'Invalid or expired reset token',
        };
      }
      
      // Reset password
      const newPassword = await Password.create(command.newPassword);
      await user.changePassword(newPassword);
      
      // Save user and clear refresh tokens
      await this.userRepository.save(user);
      user.clearAllRefreshTokens();
      
      // Delete the used password reset token
      await this.userRepository.deletePasswordResetToken(command.otp);
      
      // Send notification
      await this.notificationService.sendPasswordChangedNotification(user.email.value);
      
      return {
        success: true,
        message: 'Password reset successfully',
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to reset password',
      };
    }
  }
}