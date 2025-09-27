import { Injectable, Logger } from '@nestjs/common';
import { OtpService } from '../services/otp.service';
import { SecurityCommunicationService } from '../services/security-communication.service';
import { SecurityLogger } from '../services/security-logger.service';
import { CommunicationChannel } from '../../communication/interfaces/communication.interface';

export interface KycVerificationStep {
  stepId: string;
  stepName: string;
  requiresOtp: boolean;
  completed: boolean;
  metadata?: Record<string, any>;
}

export interface KycSession {
  sessionId: string;
  userId: string;
  currentStep: number;
  steps: KycVerificationStep[];
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  createdAt: Date;
  expiresAt: Date;
}

/**
 * Example service showing how KycModule would integrate with SecurityModule
 * This demonstrates OTP usage for sensitive KYC verification steps
 */
@Injectable()
export class KycIntegrationExample {
  private readonly logger = new Logger(KycIntegrationExample.name);

  constructor(
    private readonly otpService: OtpService,
    private readonly securityCommunication: SecurityCommunicationService,
    private readonly securityLogger: SecurityLogger,
  ) {}

  /**
   * Example: Start KYC Process with Phone Verification
   */
  async startKycVerification(
    userId: string,
    phoneNumber: string,
    email: string,
  ): Promise<{
    success: boolean;
    message: string;
    sessionId?: string;
    otpId?: string;
  }> {
    try {
      // Create KYC session (would be stored in database)
      const kycSession: KycSession = {
        sessionId: `kyc_${Date.now()}_${userId}`,
        userId,
        currentStep: 0,
        status: 'IN_PROGRESS',
        steps: [
          {
            stepId: 'phone_verification',
            stepName: 'Phone Number Verification',
            requiresOtp: true,
            completed: false,
          },
          {
            stepId: 'identity_document',
            stepName: 'Identity Document Upload',
            requiresOtp: false,
            completed: false,
          },
          {
            stepId: 'address_verification',
            stepName: 'Address Verification',
            requiresOtp: true,
            completed: false,
          },
          {
            stepId: 'final_verification',
            stepName: 'Final KYC Verification',
            requiresOtp: true,
            completed: false,
          },
        ],
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      };

      // Generate OTP for phone verification
      const otpResult = await this.otpService.generateOtp({
        identifier: phoneNumber || email,
        userId,
        purpose: 'KYC_PHONE_VERIFICATION',
        expiryMinutes: 10,
        metadata: {
          sessionId: kycSession.sessionId,
          step: 'phone_verification',
          phoneNumber,
        },
      });

      if (!otpResult.success) {
        return {
          success: false,
          message: 'Failed to generate KYC verification OTP',
        };
      }

      // Send OTP via SMS
      const deliveryResult = await this.securityCommunication.sendKycOtp(
        userId,
        phoneNumber,
        otpResult.otpCode,
      );

      if (!deliveryResult.success) {
        return {
          success: false,
          message: 'Failed to send KYC verification OTP',
        };
      }

      // Log KYC initiation
      await this.securityLogger.logSecurityEvent(
        userId,
        'KYC_VERIFICATION_STARTED',
        true,
        {
          sessionId: kycSession.sessionId,
          phoneNumber,
          email,
        },
      );

      return {
        success: true,
        message: 'KYC verification started. Please verify your phone number.',
        sessionId: kycSession.sessionId,
        otpId: otpResult.otpId,
      };
    } catch (error) {
      this.logger.error('KYC verification initiation failed', error);
      return {
        success: false,
        message: 'Internal server error',
      };
    }
  }

  /**
   * Example: Verify Phone Number Step
   */
  async verifyPhoneNumber(
    sessionId: string,
    otpId: string,
    otpCode: string,
    userId: string,
  ): Promise<{
    success: boolean;
    message: string;
    nextStep?: string;
  }> {
    try {
      // Verify OTP
      const verificationResult = await this.otpService.validateOtp({
        otpId,
        code: otpCode,
        userId,
      });

      if (!verificationResult.success) {
        await this.securityLogger.logSecurityEvent(
          userId,
          'KYC_PHONE_VERIFICATION_FAILED',
          false,
          {
            sessionId,
            otpId,
            reason: verificationResult.error,
          },
        );

        return {
          success: false,
          message: verificationResult.error || 'Invalid OTP',
        };
      }

      // Update KYC session (would update in database)
      // Mark phone verification as completed

      // Log successful phone verification
      await this.securityLogger.logSecurityEvent(
        userId,
        'KYC_PHONE_VERIFICATION_SUCCESS',
        true,
        {
          sessionId,
          otpId,
          timestamp: new Date().toISOString(),
        },
      );

      return {
        success: true,
        message: 'Phone number verified successfully',
        nextStep: 'identity_document',
      };
    } catch (error) {
      this.logger.error('Phone verification failed', error);
      return {
        success: false,
        message: 'Internal server error',
      };
    }
  }

  /**
   * Example: Complete Address Verification Step
   */
  async initiateAddressVerification(
    sessionId: string,
    userId: string,
    phoneNumber: string,
    addressData: {
      street: string;
      city: string;
      state: string;
      zipCode: string;
      country: string;
    },
  ): Promise<{
    success: boolean;
    message: string;
    otpId?: string;
  }> {
    try {
      // Generate OTP for address verification
      const otpResult = await this.otpService.generateOtp({
        identifier: phoneNumber,
        userId,
        purpose: 'KYC_ADDRESS_VERIFICATION',
        expiryMinutes: 15,
        metadata: {
          sessionId,
          step: 'address_verification',
          addressData,
        },
      });

      if (!otpResult.success) {
        return {
          success: false,
          message: 'Failed to generate address verification OTP',
        };
      }

      // Send OTP
      const deliveryResult = await this.securityCommunication.sendKycOtp(
        userId,
        phoneNumber,
        otpResult.otpCode,
      );

      if (!deliveryResult.success) {
        return {
          success: false,
          message: 'Failed to send address verification OTP',
        };
      }

      // Log address verification initiation
      await this.securityLogger.logSecurityEvent(
        userId,
        'KYC_ADDRESS_VERIFICATION_INITIATED',
        true,
        {
          sessionId,
          addressData: {
            city: addressData.city,
            state: addressData.state,
            country: addressData.country,
          }, // Log partial address for privacy
        },
      );

      return {
        success: true,
        message: 'Address verification OTP sent',
        otpId: otpResult.otpId,
      };
    } catch (error) {
      this.logger.error('Address verification initiation failed', error);
      return {
        success: false,
        message: 'Internal server error',
      };
    }
  }

  /**
   * Example: Final KYC Verification
   */
  async completeFinalVerification(
    sessionId: string,
    userId: string,
    email: string,
    phoneNumber: string,
  ): Promise<{
    success: boolean;
    message: string;
    otpId?: string;
  }> {
    try {
      // Generate final verification OTP
      const otpResult = await this.otpService.generateOtp({
        identifier: phoneNumber || email,
        userId,
        purpose: 'KYC_FINAL_VERIFICATION',
        expiryMinutes: 10,
        metadata: {
          sessionId,
          step: 'final_verification',
        },
      });

      if (!otpResult.success) {
        return {
          success: false,
          message: 'Failed to generate final verification OTP',
        };
      }

      // Send OTP via both SMS and Email for final verification
      const smsResult = await this.securityCommunication.sendKycOtp(
        userId,
        phoneNumber,
        otpResult.otpCode,
      );

      const emailResult = await this.securityCommunication.sendKycOtp(
        userId,
        email,
        otpResult.otpCode,
      );

      if (!smsResult.success && !emailResult.success) {
        return {
          success: false,
          message: 'Failed to send final verification OTP',
        };
      }

      // Log final verification initiation
      await this.securityLogger.logSecurityEvent(
        userId,
        'KYC_FINAL_VERIFICATION_INITIATED',
        true,
        {
          sessionId,
          deliveryChannels: {
            sms: smsResult.success,
            email: emailResult.success,
          },
        },
      );

      return {
        success: true,
        message: 'Final verification OTP sent',
        otpId: otpResult.otpId,
      };
    } catch (error) {
      this.logger.error('Final KYC verification initiation failed', error);
      return {
        success: false,
        message: 'Internal server error',
      };
    }
  }

  /**
   * Example: Complete KYC Process
   */
  async completeKycVerification(
    sessionId: string,
    otpId: string,
    otpCode: string,
    userId: string,
    email: string,
  ): Promise<{
    success: boolean;
    message: string;
    kycStatus?: string;
  }> {
    try {
      // Verify final OTP
      const verificationResult = await this.otpService.validateOtp({
        otpId,
        code: otpCode,
        userId,
      });

      if (!verificationResult.success) {
        await this.securityLogger.logSecurityEvent(
          userId,
          'KYC_FINAL_VERIFICATION_FAILED',
          false,
          {
            sessionId,
            otpId,
            reason: verificationResult.error,
          },
        );

        return {
          success: false,
          message: verificationResult.error || 'Invalid final verification OTP',
        };
      }

      // Mark KYC as completed (would update in database)
      const kycStatus = 'COMPLETED';

      // Send KYC completion notification
      await this.securityCommunication.sendSecurityAlert({
        userId,
        recipient: email,
        alertType: 'KYC_COMPLETED',
        message: 'Your KYC verification has been completed successfully.',
        metadata: {
          sessionId,
          completedAt: new Date().toISOString(),
        },
        options: {
          channel: CommunicationChannel.EMAIL,
          priority: 'medium',
        },
      });

      // Log KYC completion
      await this.securityLogger.logSecurityEvent(
        userId,
        'KYC_VERIFICATION_COMPLETED',
        true,
        {
          sessionId,
          completedAt: new Date().toISOString(),
          finalStatus: kycStatus,
        },
      );

      return {
        success: true,
        message: 'KYC verification completed successfully',
        kycStatus,
      };
    } catch (error) {
      this.logger.error('KYC completion failed', error);
      return {
        success: false,
        message: 'Internal server error',
      };
    }
  }

  /**
   * Example: Handle KYC Rejection
   */
  async handleKycRejection(
    sessionId: string,
    userId: string,
    email: string,
    rejectionReason: string,
    rejectedStep: string,
  ): Promise<void> {
    try {
      // Send rejection notification
      await this.securityCommunication.sendSecurityAlert({
        userId,
        recipient: email,
        alertType: 'KYC_REJECTED',
        message: `Your KYC verification has been rejected. Reason: ${rejectionReason}`,
        metadata: {
          sessionId,
          rejectedStep,
          rejectionReason,
          rejectedAt: new Date().toISOString(),
        },
        options: {
          channel: CommunicationChannel.EMAIL,
          priority: 'high',
        },
      });

      // Log KYC rejection
      await this.securityLogger.logSecurityEvent(
        userId,
        'KYC_VERIFICATION_REJECTED',
        false,
        {
          sessionId,
          rejectedStep,
          rejectionReason,
          rejectedAt: new Date().toISOString(),
        },
      );

      this.logger.warn(
        `KYC verification rejected for user ${userId}: ${rejectionReason}`,
      );
    } catch (error) {
      this.logger.error('Failed to handle KYC rejection', error);
    }
  }

  /**
   * Example: Resend KYC OTP
   */
  async resendKycOtp(
    originalOtpId: string,
    userId: string,
    recipient: string,
    purpose: string,
  ): Promise<{
    success: boolean;
    message: string;
    newOtpId?: string;
  }> {
    try {
      // Resend OTP using SecurityModule
      const resendResult = await this.otpService.resendOtp({
        originalOtpId,
        userId,
        newExpiryMinutes: 10,
      });

      if (!resendResult.success) {
        return {
          success: false,
          message: resendResult.error || 'Failed to resend OTP',
        };
      }

      // Send new OTP
      const deliveryResult = await this.securityCommunication.sendKycOtp(
        userId,
        recipient,
        resendResult.otpCode,
      );

      if (!deliveryResult.success) {
        return {
          success: false,
          message: 'Failed to deliver resent OTP',
        };
      }

      // Log OTP resend
      await this.securityLogger.logSecurityEvent(
        userId,
        'KYC_OTP_RESENT',
        true,
        {
          originalOtpId,
          newOtpId: resendResult.otpId,
          purpose,
          recipient,
        },
      );

      return {
        success: true,
        message: 'KYC OTP resent successfully',
        newOtpId: resendResult.otpId,
      };
    } catch (error) {
      this.logger.error('KYC OTP resend failed', error);
      return {
        success: false,
        message: 'Internal server error',
      };
    }
  }
}