import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface SmsOptions {
  to: string;
  message: string;
}

@Injectable()
export class SmsProvider {
  private readonly logger = new Logger(SmsProvider.name);

  constructor(private readonly configService: ConfigService) {}

  async sendSms(options: SmsOptions): Promise<boolean> {
    const apiKey = this.configService.get<string>('SMS_API_KEY');
    const apiUrl = this.configService.get<string>('SMS_API_URL');

    if (!apiKey || !apiUrl) {
      this.logger.warn(
        'SMS configuration is incomplete. SMS sending will be simulated.',
      );
      this.logger.log(`[SIMULATED] SMS sent to: ${options.to}`);
      this.logger.log(`[SIMULATED] Message: ${options.message}`);
      return true;
    }

    try {
      // TODO: Implement actual SMS provider integration (Twilio, Africa's Talking, etc.)
      this.logger.log(`[SIMULATED] SMS sent to ${options.to}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send SMS to ${options.to}:`, error);
      throw error;
    }
  }

  async sendOtpSms(phone: string, otp: string): Promise<void> {
    const message = `Your Ntumai verification code is: ${otp}. Valid for 10 minutes. Do not share this code.`;
    await this.sendSms({ to: phone, message });
  }

  async sendPasswordResetSms(phone: string, otp: string): Promise<void> {
    const message = `Your Ntumai password reset code is: ${otp}. Valid for 10 minutes.`;
    await this.sendSms({ to: phone, message });
  }

  async sendDeliveryNotificationSms(
    phone: string,
    status: string,
  ): Promise<void> {
    const message = `Ntumai Delivery Update: ${status}`;
    await this.sendSms({ to: phone, message });
  }
}
