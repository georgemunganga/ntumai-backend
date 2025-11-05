import { Injectable, Logger } from '@nestjs/common';
import { EmailProvider } from '../../infrastructure/providers/email.provider';
import { SmsProvider } from '../../infrastructure/providers/sms.provider';

export enum CommunicationChannel {
  EMAIL = 'email',
  SMS = 'sms',
  PUSH = 'push',
  IN_APP = 'in_app',
}

export interface SendMessageOptions {
  channel: CommunicationChannel;
  recipient: string;
  subject?: string;
  message?: string;
  template?: string;
  context?: Record<string, any>;
}

@Injectable()
export class CommunicationsService {
  private readonly logger = new Logger(CommunicationsService.name);

  constructor(
    private readonly emailProvider: EmailProvider,
    private readonly smsProvider: SmsProvider,
  ) {}

  async sendMessage(options: SendMessageOptions): Promise<boolean> {
    try {
      switch (options.channel) {
        case CommunicationChannel.EMAIL:
          return await this.sendEmailMessage(options);

        case CommunicationChannel.SMS:
          return await this.sendSmsMessage(options);

        case CommunicationChannel.PUSH:
          // TODO: Implement push notifications
          this.logger.warn('Push notifications not yet implemented');
          return false;

        case CommunicationChannel.IN_APP:
          // TODO: Implement in-app notifications
          this.logger.warn('In-app notifications not yet implemented');
          return false;

        default:
          throw new Error(
            `Unsupported communication channel: ${options.channel}`,
          );
      }
    } catch (error) {
      this.logger.error(
        `Failed to send message via ${options.channel}:`,
        error,
      );
      throw error;
    }
  }

  private async sendEmailMessage(
    options: SendMessageOptions,
  ): Promise<boolean> {
    if (options.template) {
      await this.emailProvider.sendEmail({
        to: options.recipient,
        subject: options.subject || 'Notification from Ntumai',
        template: options.template,
        context: options.context,
      });
    } else {
      await this.emailProvider.sendEmail({
        to: options.recipient,
        subject: options.subject || 'Notification from Ntumai',
        html: options.message,
      });
    }
    return true;
  }

  private async sendSmsMessage(options: SendMessageOptions): Promise<boolean> {
    await this.smsProvider.sendSms({
      to: options.recipient,
      message: options.message || '',
    });
    return true;
  }

  // Convenience methods for common use cases

  async sendOtp(
    channel: CommunicationChannel,
    recipient: string,
    otp: string,
    purpose: string = 'verify',
  ): Promise<void> {
    if (channel === CommunicationChannel.EMAIL) {
      await this.emailProvider.sendOtpEmail(recipient, otp, purpose);
    } else if (channel === CommunicationChannel.SMS) {
      await this.smsProvider.sendOtpSms(recipient, otp);
    }
  }

  async sendWelcome(email: string, firstName: string): Promise<void> {
    await this.emailProvider.sendWelcomeEmail(email, firstName);
  }

  async sendPasswordReset(
    channel: CommunicationChannel,
    recipient: string,
    otp: string,
  ): Promise<void> {
    if (channel === CommunicationChannel.EMAIL) {
      await this.emailProvider.sendPasswordResetEmail(recipient, otp);
    } else if (channel === CommunicationChannel.SMS) {
      await this.smsProvider.sendPasswordResetSms(recipient, otp);
    }
  }

  async sendOrderConfirmation(email: string, orderDetails: any): Promise<void> {
    await this.emailProvider.sendOrderConfirmationEmail(email, orderDetails);
  }

  async sendDeliveryNotification(
    channel: CommunicationChannel,
    recipient: string,
    deliveryDetails: any,
  ): Promise<void> {
    if (channel === CommunicationChannel.EMAIL) {
      await this.emailProvider.sendDeliveryNotificationEmail(
        recipient,
        deliveryDetails,
      );
    } else if (channel === CommunicationChannel.SMS) {
      await this.smsProvider.sendDeliveryNotificationSms(
        recipient,
        deliveryDetails.status,
      );
    }
  }

  async sendMultiChannel(
    channels: CommunicationChannel[],
    recipient: string,
    options: Partial<SendMessageOptions>,
  ): Promise<void> {
    const promises = channels.map((channel) =>
      this.sendMessage({
        channel,
        recipient,
        ...options,
      } as SendMessageOptions),
    );

    await Promise.allSettled(promises);
  }
}
