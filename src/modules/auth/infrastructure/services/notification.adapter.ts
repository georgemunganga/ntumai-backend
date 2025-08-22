import { Injectable, Logger } from '@nestjs/common';
import { NotificationService } from '../../application/services/password-management.service';

@Injectable()
export class NotificationAdapter implements NotificationService {
  private readonly logger = new Logger(NotificationAdapter.name);

  async sendPasswordResetEmail(email: string, resetToken: string): Promise<void> {
    // TODO: Implement actual email service integration
    // This could be SendGrid, AWS SES, Nodemailer, etc.
    this.logger.log(`Sending password reset email to ${email} with token: ${resetToken}`);
    
    // Mock implementation for now
    await this.mockEmailSend({
      to: email,
      subject: 'Password Reset Request',
      template: 'password-reset',
      data: {
        resetToken,
        resetUrl: `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`,
      },
    });
  }

  async sendPasswordChangedNotification(email: string): Promise<void> {
    // TODO: Implement actual email service integration
    this.logger.log(`Sending password changed notification to ${email}`);
    
    // Mock implementation for now
    await this.mockEmailSend({
      to: email,
      subject: 'Password Changed Successfully',
      template: 'password-changed',
      data: {
        timestamp: new Date().toISOString(),
      },
    });
  }

  async sendWelcomeEmail(email: string, firstName: string): Promise<void> {
    this.logger.log(`Sending welcome email to ${email}`);
    
    await this.mockEmailSend({
      to: email,
      subject: 'Welcome to NTUMAI!',
      template: 'welcome',
      data: {
        firstName,
      },
    });
  }

  async sendEmailVerification(email: string, verificationToken: string): Promise<void> {
    this.logger.log(`Sending email verification to ${email}`);
    
    await this.mockEmailSend({
      to: email,
      subject: 'Verify Your Email Address',
      template: 'email-verification',
      data: {
        verificationToken,
        verificationUrl: `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`,
      },
    });
  }

  async sendSMS(phoneNumber: string, message: string): Promise<void> {
    // TODO: Implement actual SMS service integration
    // This could be Twilio, AWS SNS, etc.
    this.logger.log(`Sending SMS to ${phoneNumber}: ${message}`);
    
    // Mock implementation for now
    await this.mockSMSSend({
      to: phoneNumber,
      message,
    });
  }

  private async mockEmailSend(emailData: any): Promise<void> {
    // Simulate email sending delay
    await new Promise(resolve => setTimeout(resolve, 100));
    
    this.logger.debug('Email sent successfully', emailData);
  }

  private async mockSMSSend(smsData: any): Promise<void> {
    // Simulate SMS sending delay
    await new Promise(resolve => setTimeout(resolve, 100));
    
    this.logger.debug('SMS sent successfully', smsData);
  }
}