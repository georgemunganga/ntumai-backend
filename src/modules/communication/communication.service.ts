import { Injectable, Logger } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import * as handlebars from 'handlebars';

interface EmailOptions {
  to: string | string[];
  subject: string;
  template?: string;
  context?: Record<string, any>;
  text?: string;
  html?: string;
  from?: string;
}

@Injectable()
export class CommunicationService {
  private readonly logger = new Logger(CommunicationService.name);
  private templatesCache = new Map<string, HandlebarsTemplateDelegate>();

  constructor(
    private readonly mailerService: MailerService,
    private readonly configService: ConfigService,
  ) {
    this.initializeTemplates();
  }

  private initializeTemplates(): void {
    const templateDir = path.join(
      __dirname,
      'infrastructure',
      'templates',
    );
    if (fs.existsSync(templateDir)) {
      const templates = fs.readdirSync(templateDir);
      this.logger.log(`Found ${templates.length} email templates`);
    }
  }

  private getTemplate(templateName: string): HandlebarsTemplateDelegate {
    // Check cache first
    if (this.templatesCache.has(templateName)) {
      return this.templatesCache.get(templateName)!;
    }

    // Load template from file
    const templatePath = path.join(
      __dirname,
      'infrastructure',
      'templates',
      `${templateName}.hbs`,
    );

    if (!fs.existsSync(templatePath)) {
      this.logger.warn(`Template not found: ${templateName}`);
      throw new Error(`Template not found: ${templateName}`);
    }

    const templateSource = fs.readFileSync(templatePath, 'utf-8');
    const template = handlebars.compile(templateSource);

    // Cache the compiled template
    this.templatesCache.set(templateName, template);
    return template;
  }

  async sendEmail(options: EmailOptions): Promise<void> {
    try {
      const from =
        options.from ||
        this.configService.get<string>(
          'MAIL_FROM',
          'ntumai@greenwebb.tech',
        );

      let html = options.html;

      // If template is specified, render it
      if (options.template) {
        const template = this.getTemplate(options.template);
        const context = {
          ...options.context,
          year: new Date().getFullYear(),
          appUrl: this.configService.get<string>(
            'APP_URL',
            'http://localhost:3000',
          ),
        };
        html = template(context);
      }

      // Send email using MailerService
      await this.mailerService.sendMail({
        to: options.to,
        subject: options.subject,
        text: options.text,
        html,
        from,
      });

      this.logger.log(`Email sent successfully to ${options.to}`);
    } catch (error) {
      this.logger.error(`Failed to send email to ${options.to}:`, error);
      throw error;
    }
  }

  async sendOtp(to: string, otp: string, purpose: string = 'verify'): Promise<void> {
    const otpTtl = this.configService.get<number>('OTP_TTL', 600);
    const expiryMinutes = Math.ceil(otpTtl / 60);

    await this.sendEmail({
      to,
      subject: `Your Ntumai Verification Code: ${otp}`,
      template: 'otp-email',
      context: {
        otp,
        purpose,
        expiryMinutes,
      },
    });
  }

  async sendWelcomeEmail(to: string, firstName: string): Promise<void> {
    await this.sendEmail({
      to,
      subject: 'Welcome to Ntumai! 🎉',
      template: 'welcome-email',
      context: {
        firstName,
      },
    });
  }

  async sendPasswordResetEmail(to: string, otp: string): Promise<void> {
    const otpTtl = this.configService.get<number>('OTP_TTL', 600);
    const expiryMinutes = Math.ceil(otpTtl / 60);

    await this.sendEmail({
      to,
      subject: 'Password Reset Request - Ntumai',
      template: 'password-reset-email',
      context: {
        otp,
        expiryMinutes,
      },
    });
  }

  async sendNotification(to: string, title: string, body: string): Promise<void> {
    // In a real application, this would use a service like Firebase Cloud Messaging (FCM)
    // For now, we simulate by sending an email
    const subject = `Ntumai Notification: ${title}`;
    const text = body;
    const html = `<p><strong>${title}</strong></p><p>${body}</p>`;

    // Assuming 'to' is an email address for this simulation
    await this.sendEmail({ to, subject, text, html });
  }
}
