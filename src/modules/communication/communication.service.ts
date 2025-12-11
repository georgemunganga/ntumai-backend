import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class CommunicationService {
  constructor(private readonly mailerService: MailerService) {}

  async sendEmail(to: string, subject: string, text: string, html?: string): Promise<void> {
    await this.mailerService.sendMail({
      to,
      subject,
      text,
      html,
    });
  }

  async sendOtp(to: string, otp: string): Promise<void> {
    // In a real application, this would use a service like Twilio or Vonage for SMS
    // For now, we simulate by sending an email
    const subject = 'Your Ntumai Verification Code (OTP)';
    const text = `Your One-Time Password (OTP) for Ntumai is: ${otp}. Do not share this code.`;
    const html = `
      <p>Your One-Time Password (OTP) for Ntumai is:</p>
      <h2 style="color: #007bff;">${otp}</h2>
      <p>This code is valid for 5 minutes. Do not share this code with anyone.</p>
    `;
    
    // Assuming 'to' is an email address for this simulation
    await this.sendEmail(to, subject, text, html);
  }

  async sendNotification(to: string, title: string, body: string): Promise<void> {
    // In a real application, this would use a service like Firebase Cloud Messaging (FCM)
    // For now, we simulate by sending an email
    const subject = `Ntumai Notification: ${title}`;
    const text = body;
    const html = `<p><strong>${title}</strong></p><p>${body}</p>`;

    // Assuming 'to' is an email address for this simulation
    await this.sendEmail(to, subject, text, html);
  }
}
