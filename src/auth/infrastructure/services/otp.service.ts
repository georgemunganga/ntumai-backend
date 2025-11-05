import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OtpCode } from '../../domain/value-objects/otp-code.vo';
import { EmailService } from './email.service';
import { SmsService } from './sms.service';

@Injectable()
export class OtpService {
  private readonly logger = new Logger(OtpService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly emailService: EmailService,
    private readonly smsService: SmsService,
  ) {}

  generateOtp(): OtpCode {
    return OtpCode.generate();
  }

  async sendOtpViaEmail(email: string, otp: OtpCode): Promise<void> {
    try {
      await this.emailService.sendOtp(email, otp.getValue());
      this.logger.log(`OTP sent to email: ${email}`);
    } catch (error) {
      this.logger.error(`Failed to send OTP to email: ${email}`, error);
      throw error;
    }
  }

  async sendOtpViaSms(phone: string, otp: OtpCode): Promise<void> {
    try {
      await this.smsService.sendOtp(phone, otp.getValue());
      this.logger.log(`OTP sent to phone: ${phone}`);
    } catch (error) {
      this.logger.error(`Failed to send OTP to phone: ${phone}`, error);
      throw error;
    }
  }

  getOtpTtl(): number {
    return this.configService.get<number>('otp.ttl') || 600;
  }

  getOtpResendDelay(): number {
    return this.configService.get<number>('otp.resendDelay') || 60;
  }

  getOtpMaxAttempts(): number {
    return this.configService.get<number>('otp.maxAttempts') || 5;
  }

  calculateExpiryDate(): Date {
    const ttl = this.getOtpTtl();
    return new Date(Date.now() + ttl * 1000);
  }

  calculateResendDate(): Date {
    const delay = this.getOtpResendDelay();
    return new Date(Date.now() + delay * 1000);
  }
}
