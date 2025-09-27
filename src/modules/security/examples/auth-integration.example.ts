import { Injectable, Logger } from '@nestjs/common';
import { OtpService } from '../services/otp.service';
import { PasswordService } from '../services/password.service';
import { TokenService } from '../services/token.service';
import { SecurityCommunicationService } from '../services/security-communication.service';
import { SecurityLogger } from '../services/security-logger.service';
import { CommunicationChannel } from '../../communication/interfaces/communication.interface';

/**
 * Example service showing how AuthModule would integrate with SecurityModule
 * This demonstrates the clean separation of concerns and reusability
 */
@Injectable()
export class AuthIntegrationExample {
  private readonly logger = new Logger(AuthIntegrationExample.name);

  constructor(
    private readonly otpService: OtpService,
    private readonly passwordService: PasswordService,
    private readonly tokenService: TokenService,
    private readonly securityCommunication: SecurityCommunicationService,
    private readonly securityLogger: SecurityLogger,
  ) {}

  /**
   * Example: User Login with OTP
   */
  async loginWithOtp(email: string, phoneNumber: string): Promise<{
    success: boolean;
    message: string;
    otpId?: string;
  }> {
    try {
      // Generate OTP using SecurityModule
      const otpResult = await this.otpService.generateOtp({
        identifier: phoneNumber ?? email,
        userId: 'temp-user-id', // Would be actual user ID
        purpose: 'LOGIN',
        expiryMinutes: 5,
        metadata: { email, phoneNumber },
      });

      if (!otpResult.success) {
        return {
          success: false,
          message: 'Failed to generate OTP',
        };
      }

      // Send OTP via SecurityCommunicationService
      const deliveryResult = await this.securityCommunication.sendLoginOtp(
        'temp-user-id',
        phoneNumber, // Primary: SMS
        otpResult.otpCode,
        CommunicationChannel.SMS,
      );

      if (!deliveryResult.success) {
        // Try email as fallback
        const emailResult = await this.securityCommunication.sendLoginOtp(
          'temp-user-id',
          email,
          otpResult.otpCode,
          CommunicationChannel.EMAIL,
        );

        if (!emailResult.success) {
          return {
            success: false,
            message: 'Failed to deliver OTP via SMS or Email',
          };
        }
      }

      return {
        success: true,
        message: 'OTP sent successfully',
        otpId: otpResult.otpId,
      };
    } catch (error) {
      this.logger.error('Login OTP generation failed', error);
      return {
        success: false,
        message: 'Internal server error',
      };
    }
  }

  /**
   * Example: Verify Login OTP and Generate Tokens
   */
  async verifyLoginOtp(otpId: string, otpCode: string, userId: string): Promise<{
    success: boolean;
    message: string;
    tokens?: { accessToken: string; refreshToken: string };
  }> {
    try {
      // Verify OTP using SecurityModule
      const verificationResult = await this.otpService.validateOtp({
        otpId,
        code: otpCode,
        userId,
      });

      if (!verificationResult.success) {
        // Log failed attempt
        await this.securityLogger.logLoginAttempt(
          userId,
          false,
          'INVALID_OTP',
          { otpId, reason: verificationResult.error },
        );

        return {
          success: false,
          message: verificationResult.error || 'Invalid OTP',
        };
      }

      // Generate tokens using SecurityModule
      const tokenResult = await this.tokenService.generateTokens({
        userId,
        email: 'user@example.com', // Would come from user data
        roles: ['USER'],
      });

      if (!tokenResult.success) {
        return {
          success: false,
          message: 'Failed to generate authentication tokens',
        };
      }

      // Log successful login
      await this.securityLogger.logLoginAttempt(
        userId,
        true,
        'OTP_SUCCESS',
        { otpId, tokenId: tokenResult.tokenId },
      );

      return {
        success: true,
        message: 'Login successful',
        tokens: {
          accessToken: tokenResult.accessToken,
          refreshToken: tokenResult.refreshToken,
        },
      };
    } catch (error) {
      this.logger.error('OTP verification failed', error);
      return {
        success: false,
        message: 'Internal server error',
      };
    }
  }

  /**
   * Example: Password Reset Flow
   */
  async initiatePasswordReset(email: string, userId: string): Promise<{
    success: boolean;
    message: string;
    otpId?: string;
  }> {
    try {
      // Generate password reset OTP
      const otpResult = await this.otpService.generateOtp({
        identifier: email,
        userId,
        purpose: 'PASSWORD_RESET',
        expiryMinutes: 15,
        metadata: { email },
      });

      if (!otpResult.success) {
        return {
          success: false,
          message: 'Failed to generate password reset OTP',
        };
      }

      // Send OTP via email (preferred for password reset)
      const deliveryResult = await this.securityCommunication.sendPasswordResetOtp(
        userId,
        email,
        otpResult.otpCode,
      );

      if (!deliveryResult.success) {
        return {
          success: false,
          message: 'Failed to send password reset email',
        };
      }

      return {
        success: true,
        message: 'Password reset OTP sent to your email',
        otpId: otpResult.otpId,
      };
    } catch (error) {
      this.logger.error('Password reset initiation failed', error);
      return {
        success: false,
        message: 'Internal server error',
      };
    }
  }

  /**
   * Example: Complete Password Reset
   */
  async completePasswordReset(
    otpId: string,
    otpCode: string,
    newPassword: string,
    userId: string,
    email: string,
  ): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
      // Verify password reset OTP
      const verificationResult = await this.otpService.validateOtp({
        otpId,
        code: otpCode,
        userId,
      });

      if (!verificationResult.success) {
        return {
          success: false,
          message: verificationResult.error || 'Invalid or expired OTP',
        };
      }

      // Validate new password strength
      const passwordValidation = await this.passwordService.validatePassword(
        newPassword,
        {
          minLength: 8,
          requireUppercase: true,
          requireLowercase: true,
          requireNumbers: true,
          requireSpecialChars: true,
        },
      );

      if (!passwordValidation.isValid) {
        return {
          success: false,
          message: `Password validation failed: ${passwordValidation.errors.join(', ')}`,
        };
      }

      // Hash the new password
      const hashedPassword = await this.passwordService.hashPassword(newPassword);

      // TODO: Update password in database (would be done in actual AuthService)
      // await this.userService.updatePassword(userId, hashedPassword);

      // Send password change confirmation
      await this.securityCommunication.sendPasswordChangeAlert(
        userId,
        email,
        {
          timestamp: new Date().toISOString(),
          method: 'PASSWORD_RESET_OTP',
        },
      );

      // Log password change
      await this.securityLogger.logPasswordChange(
        userId,
        true,
        'PASSWORD_RESET',
        { method: 'OTP_VERIFICATION' },
      );

      return {
        success: true,
        message: 'Password reset successfully',
      };
    } catch (error) {
      this.logger.error('Password reset completion failed', error);
      return {
        success: false,
        message: 'Internal server error',
      };
    }
  }

  /**
   * Example: Detect and Handle Suspicious Activity
   */
  async handleSuspiciousLogin(
    userId: string,
    email: string,
    suspiciousActivity: {
      ipAddress: string;
      userAgent: string;
      location?: string;
      reason: string;
    },
  ): Promise<void> {
    try {
      // Log suspicious activity
      await this.securityLogger.logSuspiciousActivity(
        userId,
        'SUSPICIOUS_LOGIN',
        {
          ...suspiciousActivity,
          timestamp: new Date().toISOString(),
        },
      );

      // Send security alert
      await this.securityCommunication.sendSuspiciousActivityAlert(
        userId,
        email,
        'login attempt',
        {
          ipAddress: suspiciousActivity.ipAddress,
          location: suspiciousActivity.location,
          reason: suspiciousActivity.reason,
          timestamp: new Date().toISOString(),
        },
      );

      this.logger.warn(
        `Suspicious login activity detected for user ${userId}: ${suspiciousActivity.reason}`,
      );
    } catch (error) {
      this.logger.error('Failed to handle suspicious activity', error);
    }
  }
}