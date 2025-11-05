import { Injectable, Logger } from '@nestjs/common';
import { EmailProvider } from '../../../communications/infrastructure/providers/email.provider';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(private readonly emailProvider: EmailProvider) {}

  async sendOtp(email: string, otp: string): Promise<void> {
    try {
      await this.emailProvider.sendOtpEmail(email, otp, 'verify');
      this.logger.log(`OTP email sent to ${email}`);
    } catch (error) {
      this.logger.error(`Failed to send OTP email to ${email}`, error);
      throw error;
    }
  }

  async sendPasswordResetOtp(email: string, otp: string): Promise<void> {
    try {
      await this.emailProvider.sendPasswordResetEmail(email, otp);
      this.logger.log(`Password reset OTP email sent to ${email}`);
    } catch (error) {
      this.logger.error(
        `Failed to send password reset OTP email to ${email}`,
        error,
      );
      throw error;
    }
  }
}
