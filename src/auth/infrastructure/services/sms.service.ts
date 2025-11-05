import { Injectable, Logger } from '@nestjs/common';
import { SmsProvider } from '../../../communications/infrastructure/providers/sms.provider';

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);

  constructor(private readonly smsProvider: SmsProvider) {}

  async sendOtp(phone: string, otp: string): Promise<void> {
    try {
      await this.smsProvider.sendOtpSms(phone, otp);
      this.logger.log(`OTP SMS sent to ${phone}`);
    } catch (error) {
      this.logger.error(`Failed to send OTP SMS to ${phone}`, error);
      throw error;
    }
  }

  async sendPasswordResetOtp(phone: string, otp: string): Promise<void> {
    try {
      await this.smsProvider.sendPasswordResetSms(phone, otp);
      this.logger.log(`Password reset OTP SMS sent to ${phone}`);
    } catch (error) {
      this.logger.error(
        `Failed to send password reset OTP SMS to ${phone}`,
        error,
      );
      throw error;
    }
  }
}
