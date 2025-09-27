import { Injectable, Logger } from '@nestjs/common';
import { OtpService } from '../services/otp.service';
import { SecurityCommunicationService } from '../services/security-communication.service';
import { SecurityLogger } from '../services/security-logger.service';
import { CommunicationChannel } from '../../communication/interfaces/communication.interface';

export interface TransactionData {
  transactionId: string;
  userId: string;
  amount: number;
  currency: string;
  recipientAccount?: string;
  recipientName?: string;
  transactionType: 'TRANSFER' | 'PAYMENT' | 'WITHDRAWAL' | 'DEPOSIT';
  description?: string;
}

export interface TransactionLimits {
  dailyLimit: number;
  transactionLimit: number;
  requiresOtpAbove: number;
  requiresMfaAbove: number;
}

/**
 * Example service showing how TransactionModule would integrate with SecurityModule
 * This demonstrates OTP usage for high-value transactions and security monitoring
 */
@Injectable()
export class TransactionIntegrationExample {
  private readonly logger = new Logger(TransactionIntegrationExample.name);

  constructor(
    private readonly otpService: OtpService,
    private readonly securityCommunication: SecurityCommunicationService,
    private readonly securityLogger: SecurityLogger,
  ) {}

  /**
   * Example: Initiate High-Value Transaction with OTP
   */
  async initiateSecureTransaction(
    transactionData: TransactionData,
    userEmail: string,
    userPhone: string,
    transactionLimits: TransactionLimits,
  ): Promise<{
    success: boolean;
    message: string;
    requiresOtp: boolean;
    requiresMfa: boolean;
    otpId?: string;
    transactionId?: string;
  }> {
    try {
      const { amount, currency, transactionType, userId } = transactionData;
      
      // Check if transaction requires OTP
      const requiresOtp = amount >= transactionLimits.requiresOtpAbove;
      const requiresMfa = amount >= transactionLimits.requiresMfaAbove;

      // Log transaction initiation
      await this.securityLogger.logSecurityEvent(
        userId,
        'TRANSACTION_INITIATED',
        true,
        {
          transactionId: transactionData.transactionId,
          amount,
          currency,
          transactionType,
          requiresOtp,
          requiresMfa,
        },
      );

      if (!requiresOtp) {
        // Low-value transaction, proceed without OTP
        return {
          success: true,
          message: 'Transaction can proceed without additional verification',
          requiresOtp: false,
          requiresMfa: false,
          transactionId: transactionData.transactionId,
        };
      }

      // Generate transaction OTP
      const otpResult = await this.otpService.generateOtp({
        identifier: userPhone || userEmail,
        userId,
        purpose: 'TRANSACTION_VERIFICATION',
        expiryMinutes: 3, // Short expiry for transactions
        metadata: {
          transactionId: transactionData.transactionId,
          amount,
          currency,
          transactionType,
          recipientAccount: transactionData.recipientAccount,
        },
      });

      if (!otpResult.success) {
        return {
          success: false,
          message: 'Failed to generate transaction OTP',
          requiresOtp,
          requiresMfa,
        };
      }

      // Send transaction OTP
      const deliveryResult = await this.securityCommunication.sendTransactionOtp(
        userId,
        userPhone, // Primary: SMS for transactions
        otpResult.otpCode,
        `${amount}`,
        currency,
      );

      if (!deliveryResult.success) {
        // Try email as fallback
        const emailResult = await this.securityCommunication.sendTransactionOtp(
          userId,
          userEmail,
          otpResult.otpCode,
          `${amount}`,
          currency,
        );

        if (!emailResult.success) {
          return {
            success: false,
            message: 'Failed to deliver transaction OTP',
            requiresOtp,
            requiresMfa,
          };
        }
      }

      return {
        success: true,
        message: 'Transaction OTP sent. Please verify to proceed.',
        requiresOtp: true,
        requiresMfa,
        otpId: otpResult.otpId,
        transactionId: transactionData.transactionId,
      };
    } catch (error) {
      this.logger.error('Secure transaction initiation failed', error);
      return {
        success: false,
        message: 'Internal server error',
        requiresOtp: false,
        requiresMfa: false,
      };
    }
  }

  /**
   * Example: Verify Transaction OTP and Execute
   */
  async verifyAndExecuteTransaction(
    transactionId: string,
    otpId: string,
    otpCode: string,
    userId: string,
    userEmail: string,
  ): Promise<{
    success: boolean;
    message: string;
    transactionStatus?: string;
    transactionReference?: string;
  }> {
    try {
      // Verify transaction OTP
      const verificationResult = await this.otpService.validateOtp({
        otpId,
        code: otpCode,
        userId,
      });

      if (!verificationResult.success) {
        // Log failed transaction verification
        await this.securityLogger.logSecurityEvent(
          userId,
          'TRANSACTION_OTP_VERIFICATION_FAILED',
          false,
          {
            transactionId,
            otpId,
            reason: verificationResult.error,
          },
        );

        return {
          success: false,
          message: verificationResult.error || 'Invalid transaction OTP',
        };
      }

      // Execute transaction (would integrate with actual payment processor)
      const transactionReference = `TXN_${Date.now()}_${userId}`;
      const transactionStatus = 'COMPLETED'; // Simulated successful execution

      // Log successful transaction
      await this.securityLogger.logSecurityEvent(
        userId,
        'TRANSACTION_COMPLETED',
        true,
        {
          transactionId,
          transactionReference,
          otpId,
          completedAt: new Date().toISOString(),
        },
      );

      // Send transaction confirmation
      await this.securityCommunication.sendSecurityAlert({
        userId,
        recipient: userEmail,
        alertType: 'TRANSACTION_COMPLETED',
        message: `Your transaction has been completed successfully.`,
        metadata: {
          transactionId,
          transactionReference,
          completedAt: new Date().toISOString(),
        },
        options: {
          channel: CommunicationChannel.EMAIL,
          priority: 'medium',
        },
      });

      return {
        success: true,
        message: 'Transaction completed successfully',
        transactionStatus,
        transactionReference,
      };
    } catch (error) {
      this.logger.error('Transaction verification and execution failed', error);
      return {
        success: false,
        message: 'Transaction execution failed',
      };
    }
  }

  /**
   * Example: Handle Suspicious Transaction
   */
  async handleSuspiciousTransaction(
    transactionData: TransactionData,
    userEmail: string,
    userPhone: string,
    suspiciousIndicators: {
      riskScore: number;
      reasons: string[];
      ipAddress: string;
      deviceFingerprint?: string;
      location?: string;
    },
  ): Promise<{
    success: boolean;
    message: string;
    action: 'BLOCKED' | 'REQUIRES_ADDITIONAL_VERIFICATION' | 'FLAGGED';
    otpId?: string;
  }> {
    try {
      const { userId, transactionId, amount, currency } = transactionData;
      const { riskScore, reasons, ipAddress } = suspiciousIndicators;

      // Log suspicious transaction
      await this.securityLogger.logSuspiciousActivity(
        userId,
        'SUSPICIOUS_TRANSACTION',
        {
          transactionId,
          amount,
          currency,
          riskScore,
          reasons,
          ipAddress,
          deviceFingerprint: suspiciousIndicators.deviceFingerprint,
          location: suspiciousIndicators.location,
        },
      );

      let action: 'BLOCKED' | 'REQUIRES_ADDITIONAL_VERIFICATION' | 'FLAGGED';
      let otpId: string | undefined;

      if (riskScore >= 80) {
        // High risk - block transaction
        action = 'BLOCKED';
        
        // Send security alert
        await this.securityCommunication.sendSuspiciousActivityAlert(
          userId,
          userEmail,
          'transaction blocked due to high risk',
          {
            transactionId,
            amount,
            currency,
            riskScore,
            reasons,
            blockedAt: new Date().toISOString(),
          },
        );

      } else if (riskScore >= 50) {
        // Medium risk - require additional verification
        action = 'REQUIRES_ADDITIONAL_VERIFICATION';
        
        // Generate additional verification OTP
        const otpResult = await this.otpService.generateOtp({
          identifier: userPhone || userEmail,
          userId,
          purpose: 'SUSPICIOUS_TRANSACTION_VERIFICATION',
          expiryMinutes: 5,
          metadata: {
            transactionId,
            riskScore,
            reasons,
            originalAmount: amount,
            originalCurrency: currency,
          },
        });

        if (otpResult.success) {
          otpId = otpResult.otpId;
          
          // Send verification OTP
          await this.securityCommunication.sendTransactionOtp(
            userId,
            userPhone,
            otpResult.otpCode,
            `${amount}`,
            currency,
          );
        }

        // Send security alert about additional verification
        await this.securityCommunication.sendSuspiciousActivityAlert(
          userId,
          userEmail,
          'transaction requires additional verification',
          {
            transactionId,
            amount,
            currency,
            riskScore,
            reasons,
            additionalVerificationRequired: true,
          },
        );

      } else {
        // Low-medium risk - flag for monitoring
        action = 'FLAGGED';
        
        // Send informational alert
        await this.securityCommunication.sendSecurityAlert({
          userId,
          recipient: userEmail,
          alertType: 'TRANSACTION_FLAGGED',
          message: 'Your recent transaction has been flagged for monitoring.',
          metadata: {
            transactionId,
            amount,
            currency,
            riskScore,
            flaggedAt: new Date().toISOString(),
          },
          options: {
            channel: CommunicationChannel.EMAIL,
            priority: 'low',
          },
        });
      }

      return {
        success: true,
        message: `Transaction ${action.toLowerCase().replace('_', ' ')}`,
        action,
        otpId,
      };
    } catch (error) {
      this.logger.error('Suspicious transaction handling failed', error);
      return {
        success: false,
        message: 'Failed to process suspicious transaction',
        action: 'BLOCKED',
      };
    }
  }

  /**
   * Example: Handle Failed Transaction
   */
  async handleFailedTransaction(
    transactionId: string,
    userId: string,
    userEmail: string,
    failureReason: string,
    amount: number,
    currency: string,
  ): Promise<void> {
    try {
      // Log transaction failure
      await this.securityLogger.logSecurityEvent(
        userId,
        'TRANSACTION_FAILED',
        false,
        {
          transactionId,
          amount,
          currency,
          failureReason,
          failedAt: new Date().toISOString(),
        },
      );

      // Send failure notification
      await this.securityCommunication.sendSecurityAlert({
        userId,
        recipient: userEmail,
        alertType: 'TRANSACTION_FAILED',
        message: `Your transaction of ${amount} ${currency} has failed. Reason: ${failureReason}`,
        metadata: {
          transactionId,
          amount,
          currency,
          failureReason,
          failedAt: new Date().toISOString(),
        },
        options: {
          channel: CommunicationChannel.EMAIL,
          priority: 'medium',
        },
      });

      this.logger.warn(
        `Transaction ${transactionId} failed for user ${userId}: ${failureReason}`,
      );
    } catch (error) {
      this.logger.error('Failed transaction handling failed', error);
    }
  }

  /**
   * Example: Daily Transaction Limit Exceeded
   */
  async handleDailyLimitExceeded(
    userId: string,
    userEmail: string,
    currentDailyTotal: number,
    dailyLimit: number,
    attemptedAmount: number,
    currency: string,
  ): Promise<void> {
    try {
      // Log limit exceeded event
      await this.securityLogger.logSecurityEvent(
        userId,
        'DAILY_TRANSACTION_LIMIT_EXCEEDED',
        false,
        {
          currentDailyTotal,
          dailyLimit,
          attemptedAmount,
          currency,
          exceededAt: new Date().toISOString(),
        },
      );

      // Send limit exceeded notification
      await this.securityCommunication.sendSecurityAlert({
        userId,
        recipient: userEmail,
        alertType: 'DAILY_LIMIT_EXCEEDED',
        message: `Your daily transaction limit of ${dailyLimit} ${currency} has been exceeded. Current total: ${currentDailyTotal} ${currency}.`,
        metadata: {
          currentDailyTotal,
          dailyLimit,
          attemptedAmount,
          currency,
          exceededAt: new Date().toISOString(),
        },
        options: {
          channel: CommunicationChannel.EMAIL,
          fallbackChannel: CommunicationChannel.SMS,
          priority: 'high',
        },
      });

      this.logger.warn(
        `Daily transaction limit exceeded for user ${userId}: ${currentDailyTotal}/${dailyLimit} ${currency}`,
      );
    } catch (error) {
      this.logger.error('Daily limit exceeded handling failed', error);
    }
  }

  /**
   * Example: Bulk Transaction Processing with Security Checks
   */
  async processBulkTransactions(
    transactions: TransactionData[],
    userId: string,
    userEmail: string,
    userPhone: string,
  ): Promise<{
    success: boolean;
    message: string;
    requiresOtp: boolean;
    otpId?: string;
    totalAmount: number;
    transactionCount: number;
  }> {
    try {
      const totalAmount = transactions.reduce((sum, txn) => sum + txn.amount, 0);
      const transactionCount = transactions.length;
      const currency = transactions[0]?.currency || 'USD';

      // Log bulk transaction initiation
      await this.securityLogger.logSecurityEvent(
        userId,
        'BULK_TRANSACTION_INITIATED',
        true,
        {
          transactionCount,
          totalAmount,
          currency,
          transactionIds: transactions.map(t => t.transactionId),
        },
      );

      // Bulk transactions always require OTP verification
      const otpResult = await this.otpService.generateOtp({
        identifier: userPhone || userEmail,
        userId,
        purpose: 'BULK_TRANSACTION_VERIFICATION',
        expiryMinutes: 5,
        metadata: {
          transactionCount,
          totalAmount,
          currency,
          transactionIds: transactions.map(t => t.transactionId),
        },
      });

      if (!otpResult.success) {
        return {
          success: false,
          message: 'Failed to generate bulk transaction OTP',
          requiresOtp: true,
          totalAmount,
          transactionCount,
        };
      }

      // Send bulk transaction OTP
      const deliveryResult = await this.securityCommunication.sendTransactionOtp(
        userId,
        userPhone,
        otpResult.otpCode,
        `${totalAmount}`,
        currency,
      );

      if (!deliveryResult.success) {
        return {
          success: false,
          message: 'Failed to deliver bulk transaction OTP',
          requiresOtp: true,
          totalAmount,
          transactionCount,
        };
      }

      return {
        success: true,
        message: `Bulk transaction OTP sent for ${transactionCount} transactions totaling ${totalAmount} ${currency}`,
        requiresOtp: true,
        otpId: otpResult.otpId,
        totalAmount,
        transactionCount,
      };
    } catch (error) {
      this.logger.error('Bulk transaction processing failed', error);
      return {
        success: false,
        message: 'Internal server error',
        requiresOtp: true,
        totalAmount: 0,
        transactionCount: 0,
      };
    }
  }
}