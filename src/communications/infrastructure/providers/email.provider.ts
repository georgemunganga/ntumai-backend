import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import * as handlebars from 'handlebars';
import * as fs from 'fs';
import * as path from 'path';

export interface EmailOptions {
  to: string | string[];
  subject: string;
  template?: string;
  context?: Record<string, any>;
  html?: string;
  text?: string;
  from?: string;
}

@Injectable()
export class EmailProvider {
  private readonly logger = new Logger(EmailProvider.name);
  private transporter: nodemailer.Transporter;
  private templatesCache: Map<string, HandlebarsTemplateDelegate> = new Map();

  constructor(private readonly configService: ConfigService) {
    this.initializeTransporter();
  }

  private initializeTransporter() {
    const host = this.configService.get<string>('SMTP_HOST');
    const port = this.configService.get<number>('SMTP_PORT');
    const secure = this.configService.get<boolean>('SMTP_SECURE', true);
    const user = this.configService.get<string>('SMTP_USER');
    const pass = this.configService.get<string>('SMTP_PASS');

    if (!host || !user || !pass) {
      this.logger.warn(
        'SMTP configuration is incomplete. Email sending will be simulated.',
      );
      return;
    }

    try {
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure,
        auth: {
          user,
          pass,
        },
        tls: {
          rejectUnauthorized: false, // For development - remove in production
        },
      });

      this.logger.log(`Email provider initialized with host: ${host}`);

      // Verify connection
      this.transporter.verify((error, success) => {
        if (error) {
          this.logger.error('SMTP connection verification failed:', error);
        } else {
          this.logger.log('SMTP connection verified successfully');
        }
      });
    } catch (error) {
      this.logger.error('Failed to initialize email transporter:', error);
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
      '../templates',
      `${templateName}.hbs`,
    );

    if (!fs.existsSync(templatePath)) {
      throw new Error(`Template not found: ${templateName}`);
    }

    const templateSource = fs.readFileSync(templatePath, 'utf-8');
    const template = handlebars.compile(templateSource);

    // Cache the compiled template
    this.templatesCache.set(templateName, template);

    return template;
  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      const from =
        options.from ||
        this.configService.get<string>('SMTP_FROM', 'ntumai@greenwebb.tech');

      let html = options.html;
      const text = options.text;

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

      // If no transporter, simulate sending
      if (!this.transporter) {
        this.logger.log(`[SIMULATED] Email sent to: ${options.to}`);
        this.logger.log(`[SIMULATED] Subject: ${options.subject}`);
        if (options.template) {
          this.logger.log(`[SIMULATED] Template: ${options.template}`);
        }
        return true;
      }

      // Send actual email
      const info = await this.transporter.sendMail({
        from: `"Ntumai" <${from}>`,
        to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
        subject: options.subject,
        text,
        html,
      });

      this.logger.log(
        `Email sent successfully to ${options.to}. MessageId: ${info.messageId}`,
      );
      return true;
    } catch (error) {
      this.logger.error(`Failed to send email to ${options.to}:`, error);
      throw error;
    }
  }

  async sendOtpEmail(
    email: string,
    otp: string,
    purpose: string = 'verify',
  ): Promise<void> {
    const expiryMinutes = this.configService.get<number>('OTP_TTL', 600) / 60;

    await this.sendEmail({
      to: email,
      subject: `Your Ntumai Verification Code: ${otp}`,
      template: 'otp-email',
      context: {
        otp,
        purpose,
        expiryMinutes,
      },
    });
  }

  async sendWelcomeEmail(email: string, firstName: string): Promise<void> {
    await this.sendEmail({
      to: email,
      subject: 'Welcome to Ntumai! 🎉',
      template: 'welcome-email',
      context: {
        firstName,
      },
    });
  }

  async sendPasswordResetEmail(email: string, otp: string): Promise<void> {
    const expiryMinutes = this.configService.get<number>('OTP_TTL', 600) / 60;

    await this.sendEmail({
      to: email,
      subject: 'Password Reset Request - Ntumai',
      template: 'password-reset-email',
      context: {
        otp,
        expiryMinutes,
      },
    });
  }

  async sendOrderConfirmationEmail(
    email: string,
    orderDetails: any,
  ): Promise<void> {
    // TODO: Create order confirmation template
    await this.sendEmail({
      to: email,
      subject: `Order Confirmation #${orderDetails.orderId}`,
      html: `<p>Your order has been confirmed. Order ID: ${orderDetails.orderId}</p>`,
    });
  }

  async sendDeliveryNotificationEmail(
    email: string,
    deliveryDetails: any,
  ): Promise<void> {
    // TODO: Create delivery notification template
    await this.sendEmail({
      to: email,
      subject: `Delivery Update - ${deliveryDetails.status}`,
      html: `<p>Your delivery status: ${deliveryDetails.status}</p>`,
    });
  }
}
