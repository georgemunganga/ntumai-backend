import { Injectable, Logger, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  IMessageService,
  MessagePayload,
  CommunicationChannel,
  CommunicationResult,
} from '../../communication/interfaces/communication.interface';
import { ISecurityLogger } from '../interfaces/security.interface';

export interface SecurityCommunicationOptions {
  channel: CommunicationChannel;
  fallbackChannel?: CommunicationChannel;
  retryAttempts?: number;
  priority?: 'high' | 'medium' | 'low';
}

export interface OtpDeliveryPayload {
  userId: string;
  recipient: string;
  otpCode: string;
  purpose: string;
  expiryMinutes: number;
  options?: SecurityCommunicationOptions;
}

export interface SecurityAlertPayload {
  userId?: string;
  recipient: string;
  alertType: string;
  message: string;
  metadata?: Record<string, any>;
  options?: SecurityCommunicationOptions;
}

@Injectable()
export class SecurityCommunicationService {
  private readonly logger = new Logger(SecurityCommunicationService.name);
  private readonly defaultOtpChannel: CommunicationChannel;
  private readonly defaultAlertChannel: CommunicationChannel;
  private readonly appName: string;

  constructor(
    @Inject('IMessageService') private readonly messageService: IMessageService,
    @Inject('ISecurityLogger') private readonly securityLogger: ISecurityLogger,
    private readonly configService: ConfigService,
  ) {
    this.defaultOtpChannel = this.configService.get<CommunicationChannel>(
      'DEFAULT_OTP_CHANNEL',
      CommunicationChannel.SMS,
    );
    this.defaultAlertChannel = this.configService.get<CommunicationChannel>(
      'DEFAULT_ALERT_CHANNEL',
      CommunicationChannel.EMAIL,
    );
    this.appName = this.configService.get<string>('APP_NAME', 'NtumaI');
  }

  async sendOtp(payload: OtpDeliveryPayload): Promise<CommunicationResult> {
    const channel = payload.options?.channel || this.defaultOtpChannel;
    const fallbackChannel = payload.options?.fallbackChannel;
    
    this.logger.log(
      `Sending OTP for ${payload.purpose} to ${payload.recipient} via ${channel}`,
    );

    try {
      // Prepare message payload based on channel
      const messagePayload = this.prepareOtpMessage(payload, channel);
      
      // Send primary message
      let result = await this.messageService.sendMessage(
        messagePayload,
        payload.options?.retryAttempts,
      );

      // Log the attempt
      await this.securityLogger.logOtpGeneration(
        payload.userId,
        payload.purpose,
        channel,
        result.success,
        {
          recipient: payload.recipient,
          messageId: result.messageId,
          error: result.error,
        },
      );

      // Try fallback channel if primary failed
      if (!result.success && fallbackChannel && fallbackChannel !== channel) {
        this.logger.warn(
          `Primary OTP delivery failed, trying fallback channel: ${fallbackChannel}`,
        );

        const fallbackPayload = this.prepareOtpMessage(payload, fallbackChannel);
        result = await this.messageService.sendMessage(fallbackPayload);

        await this.securityLogger.logOtpGeneration(
          payload.userId,
          payload.purpose,
          fallbackChannel,
          result.success,
          {
            recipient: payload.recipient,
            messageId: result.messageId,
            error: result.error,
            fallback: true,
          },
        );
      }

      if (result.success) {
        this.logger.log(
          `OTP sent successfully for ${payload.purpose} (messageId: ${result.messageId})`,
        );
      } else {
        this.logger.error(
          `Failed to send OTP for ${payload.purpose}: ${result.error}`,
        );
      }

      return result;
    } catch (error) {
      this.logger.error(`OTP delivery failed for ${payload.purpose}`, error);
      
      await this.securityLogger.logOtpGeneration(
        payload.userId,
        payload.purpose,
        channel,
        false,
        {
          recipient: payload.recipient,
          error: error.message,
        },
      );

      return {
        success: false,
        messageId: null,
        error: error.message,
        provider: channel,
      };
    }
  }

  async sendSecurityAlert(payload: SecurityAlertPayload): Promise<CommunicationResult> {
    const channel = payload.options?.channel || this.defaultAlertChannel;
    
    this.logger.log(
      `Sending security alert (${payload.alertType}) to ${payload.recipient} via ${channel}`,
    );

    try {
      const messagePayload = this.prepareAlertMessage(payload, channel);
      
      const result = await this.messageService.sendMessage(
        messagePayload,
        payload.options?.retryAttempts,
      );

      // Log the security alert
      await this.securityLogger.logSecurityEvent(
        payload.userId,
        `SECURITY_ALERT_${payload.alertType.toUpperCase()}`,
        result.success,
        {
          recipient: payload.recipient,
          channel,
          messageId: result.messageId,
          error: result.error,
          ...payload.metadata,
        },
      );

      if (result.success) {
        this.logger.log(
          `Security alert sent successfully (messageId: ${result.messageId})`,
        );
      } else {
        this.logger.error(
          `Failed to send security alert: ${result.error}`,
        );
      }

      return result;
    } catch (error) {
      this.logger.error(`Security alert delivery failed`, error);
      
      await this.securityLogger.logSecurityEvent(
        payload.userId,
        `SECURITY_ALERT_${payload.alertType.toUpperCase()}`,
        false,
        {
          recipient: payload.recipient,
          channel,
          error: error.message,
          ...payload.metadata,
        },
      );

      return {
        success: false,
        messageId: null,
        error: error.message,
        provider: channel,
      };
    }
  }

  async sendLoginOtp(
    userId: string,
    recipient: string,
    otpCode: string,
    channel?: CommunicationChannel,
  ): Promise<CommunicationResult> {
    return this.sendOtp({
      userId,
      recipient,
      otpCode,
      purpose: 'LOGIN',
      expiryMinutes: this.configService.get<number>('OTP_LOGIN_EXPIRY_MINUTES', 5),
      options: {
        channel: channel || CommunicationChannel.SMS,
        fallbackChannel: CommunicationChannel.EMAIL,
        priority: 'high',
      },
    });
  }

  async sendTransactionOtp(
    userId: string,
    recipient: string,
    otpCode: string,
    transactionAmount: string,
    currency: string,
  ): Promise<CommunicationResult> {
    return this.sendOtp({
      userId,
      recipient,
      otpCode,
      purpose: 'TRANSACTION',
      expiryMinutes: this.configService.get<number>('OTP_TRANSACTION_EXPIRY_MINUTES', 3),
      options: {
        channel: CommunicationChannel.SMS,
        fallbackChannel: CommunicationChannel.EMAIL,
        priority: 'high',
      },
    });
  }

  async sendKycOtp(
    userId: string,
    recipient: string,
    otpCode: string,
  ): Promise<CommunicationResult> {
    return this.sendOtp({
      userId,
      recipient,
      otpCode,
      purpose: 'KYC_VERIFICATION',
      expiryMinutes: this.configService.get<number>('OTP_KYC_EXPIRY_MINUTES', 10),
      options: {
        channel: CommunicationChannel.SMS,
        fallbackChannel: CommunicationChannel.EMAIL,
        priority: 'medium',
      },
    });
  }

  async sendPasswordResetOtp(
    userId: string,
    recipient: string,
    otpCode: string,
  ): Promise<CommunicationResult> {
    return this.sendOtp({
      userId,
      recipient,
      otpCode,
      purpose: 'PASSWORD_RESET',
      expiryMinutes: this.configService.get<number>('OTP_PASSWORD_RESET_EXPIRY_MINUTES', 15),
      options: {
        channel: CommunicationChannel.EMAIL,
        fallbackChannel: CommunicationChannel.SMS,
        priority: 'high',
      },
    });
  }

  async sendSuspiciousActivityAlert(
    userId: string,
    recipient: string,
    activityType: string,
    metadata?: Record<string, any>,
  ): Promise<CommunicationResult> {
    return this.sendSecurityAlert({
      userId,
      recipient,
      alertType: 'SUSPICIOUS_ACTIVITY',
      message: `Suspicious ${activityType} activity detected on your account.`,
      metadata: {
        activityType,
        ...metadata,
      },
      options: {
        channel: CommunicationChannel.EMAIL,
        fallbackChannel: CommunicationChannel.SMS,
        priority: 'high',
      },
    });
  }

  async sendPasswordChangeAlert(
    userId: string,
    recipient: string,
    metadata?: Record<string, any>,
  ): Promise<CommunicationResult> {
    return this.sendSecurityAlert({
      userId,
      recipient,
      alertType: 'PASSWORD_CHANGED',
      message: 'Your account password has been successfully changed.',
      metadata,
      options: {
        channel: CommunicationChannel.EMAIL,
        priority: 'medium',
      },
    });
  }

  async sendMfaEnabledAlert(
    userId: string,
    recipient: string,
    mfaType: string,
  ): Promise<CommunicationResult> {
    return this.sendSecurityAlert({
      userId,
      recipient,
      alertType: 'MFA_ENABLED',
      message: `Multi-factor authentication (${mfaType}) has been enabled on your account.`,
      metadata: { mfaType },
      options: {
        channel: CommunicationChannel.EMAIL,
        priority: 'medium',
      },
    });
  }

  private prepareOtpMessage(
    payload: OtpDeliveryPayload,
    channel: CommunicationChannel,
  ): MessagePayload {
    const templateId = this.getOtpTemplateId(payload.purpose, channel);
    const templateData = {
      appName: this.appName,
      otpCode: payload.otpCode,
      expiryMinutes: payload.expiryMinutes,
      purpose: payload.purpose.toLowerCase().replace('_', ' '),
    };

    const basePayload: MessagePayload = {
      userId: payload.userId,
      channel,
      recipient: payload.recipient,
      content: `Your ${this.appName} OTP code is: ${payload.otpCode}. Valid for ${payload.expiryMinutes} minutes.`,
      templateId,
      templateData,
    };

    if (channel === CommunicationChannel.EMAIL) {
      basePayload.subject = `Your ${this.appName} OTP Code`;
    }

    return basePayload;
  }

  private prepareAlertMessage(
    payload: SecurityAlertPayload,
    channel: CommunicationChannel,
  ): MessagePayload {
    const templateId = this.getAlertTemplateId(payload.alertType, channel);
    const templateData = {
      appName: this.appName,
      alertType: payload.alertType,
      message: payload.message,
      timestamp: new Date().toISOString(),
      ...payload.metadata,
    };

    const basePayload: MessagePayload = {
      userId: payload.userId,
      channel,
      recipient: payload.recipient,
      content: payload.message,
      templateId,
      templateData,
    };

    if (channel === CommunicationChannel.EMAIL) {
      basePayload.subject = `${this.appName} Security Alert: ${payload.alertType}`;
    }

    return basePayload;
  }

  private getOtpTemplateId(purpose: string, channel: CommunicationChannel): string {
    const channelPrefix = channel.toLowerCase();
    const purposeMap: Record<string, string> = {
      LOGIN: 'login-otp',
      TRANSACTION: 'transaction-otp',
      KYC_VERIFICATION: 'otp-verification',
      PASSWORD_RESET: 'password-reset',
    };

    return purposeMap[purpose] || 'otp-verification';
  }

  private getAlertTemplateId(alertType: string, channel: CommunicationChannel): string {
    const channelPrefix = channel.toLowerCase();
    const alertMap: Record<string, string> = {
      SUSPICIOUS_ACTIVITY: 'security-alert',
      PASSWORD_CHANGED: 'password-change-alert',
      MFA_ENABLED: 'mfa-enabled-alert',
    };

    return alertMap[alertType] || 'security-alert';
  }
}