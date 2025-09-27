import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IEmailService, EmailPayload, CommunicationResult } from '../interfaces/communication.interface';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';
import * as handlebars from 'handlebars';
import * as fs from 'fs/promises';
import * as path from 'path';

interface EmailTemplate {
  id: string;
  subject: string;
  htmlContent: string;
  textContent?: string;
}

@Injectable()
export class EmailService implements IEmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: Transporter;
  private templates: Map<string, EmailTemplate> = new Map();
  private readonly templatesPath: string;

  constructor(private readonly configService: ConfigService) {
    this.templatesPath = this.configService.get<string>('EMAIL_TEMPLATES_PATH', './templates/email');
    this.initializeTransporter();
    this.loadTemplates();
  }

  private initializeTransporter(): void {
    const smtpConfig = {
      host: this.configService.get<string>('SMTP_HOST'),
      port: this.configService.get<number>('SMTP_PORT', 587),
      secure: this.configService.get<boolean>('SMTP_SECURE', false),
      auth: {
        user: this.configService.get<string>('SMTP_USER'),
        pass: this.configService.get<string>('SMTP_PASS'),
      },
      tls: {
        rejectUnauthorized: this.configService.get<boolean>('SMTP_TLS_REJECT_UNAUTHORIZED', true),
      },
    };

    this.transporter = nodemailer.createTransporter(smtpConfig);
    
    // Verify connection
    this.transporter.verify((error, success) => {
      if (error) {
        this.logger.error('SMTP connection failed', error);
      } else {
        this.logger.log('SMTP connection established successfully');
      }
    });
  }

  private async loadTemplates(): Promise<void> {
    try {
      const templatesDir = path.resolve(this.templatesPath);
      
      // Check if templates directory exists
      try {
        await fs.access(templatesDir);
      } catch {
        this.logger.warn(`Templates directory not found: ${templatesDir}`);
        return;
      }

      const files = await fs.readdir(templatesDir);
      const templateFiles = files.filter(file => file.endsWith('.json'));

      for (const file of templateFiles) {
        try {
          const filePath = path.join(templatesDir, file);
          const templateData = await fs.readFile(filePath, 'utf-8');
          const template: EmailTemplate = JSON.parse(templateData);
          
          this.templates.set(template.id, template);
          this.logger.log(`Loaded email template: ${template.id}`);
        } catch (error) {
          this.logger.error(`Failed to load template ${file}`, error);
        }
      }

      this.logger.log(`Loaded ${this.templates.size} email templates`);
    } catch (error) {
      this.logger.error('Failed to load email templates', error);
    }
  }

  async sendEmail(payload: EmailPayload): Promise<CommunicationResult> {
    try {
      let subject = payload.subject;
      let htmlContent = payload.content;
      let textContent: string | undefined;

      // Use template if specified
      if (payload.templateId) {
        const template = this.templates.get(payload.templateId);
        if (!template) {
          throw new Error(`Email template not found: ${payload.templateId}`);
        }

        subject = this.compileTemplate(template.subject, payload.templateData || {});
        htmlContent = this.compileTemplate(template.htmlContent, payload.templateData || {});
        
        if (template.textContent) {
          textContent = this.compileTemplate(template.textContent, payload.templateData || {});
        }
      } else if (payload.templateData) {
        // Apply template data to content even without template
        htmlContent = this.compileTemplate(payload.content, payload.templateData);
        if (payload.subject) {
          subject = this.compileTemplate(payload.subject, payload.templateData);
        }
      }

      const mailOptions = {
        from: this.configService.get<string>('SMTP_FROM_EMAIL'),
        to: payload.to,
        cc: payload.cc,
        bcc: payload.bcc,
        subject,
        html: htmlContent,
        text: textContent,
        attachments: payload.attachments?.map(attachment => ({
          filename: attachment.filename,
          content: attachment.content,
          contentType: attachment.contentType,
        })),
      };

      const info = await this.transporter.sendMail(mailOptions);
      
      this.logger.log(`Email sent successfully to ${payload.to} (messageId: ${info.messageId})`);
      
      return {
        success: true,
        messageId: info.messageId,
        provider: 'SMTP',
      };
    } catch (error) {
      this.logger.error(`Failed to send email to ${payload.to}`, error);
      
      return {
        success: false,
        messageId: null,
        error: error.message,
        provider: 'SMTP',
      };
    }
  }

  async sendBulkEmails(
    payloads: EmailPayload[],
    batchSize: number = 10,
  ): Promise<CommunicationResult[]> {
    const results: CommunicationResult[] = [];
    
    this.logger.log(`Sending ${payloads.length} emails in batches of ${batchSize}`);

    for (let i = 0; i < payloads.length; i += batchSize) {
      const batch = payloads.slice(i, i + batchSize);
      
      const batchPromises = batch.map(payload => 
        this.sendEmail(payload).catch(error => ({
          success: false,
          messageId: null,
          error: error.message,
          provider: 'SMTP',
        } as CommunicationResult))
      );

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);

      // Small delay between batches to avoid overwhelming SMTP server
      if (i + batchSize < payloads.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    const successCount = results.filter(r => r.success).length;
    this.logger.log(`Bulk email sending completed: ${successCount}/${results.length} successful`);

    return results;
  }

  async getDeliveryStatus(messageId: string): Promise<any> {
    // Note: Basic SMTP doesn't provide delivery status tracking
    // This would need to be implemented with a service like SendGrid, AWS SES, etc.
    this.logger.warn('Delivery status tracking not available with basic SMTP');
    return {
      messageId,
      status: 'sent',
      note: 'Delivery status tracking not available with basic SMTP',
    };
  }

  async validateEmailAddress(email: string): Promise<boolean> {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      return true;
    } catch (error) {
      this.logger.error('SMTP connection test failed', error);
      return false;
    }
  }

  async reloadTemplates(): Promise<void> {
    this.templates.clear();
    await this.loadTemplates();
  }

  getAvailableTemplates(): string[] {
    return Array.from(this.templates.keys());
  }

  getTemplate(templateId: string): EmailTemplate | undefined {
    return this.templates.get(templateId);
  }

  private compileTemplate(template: string, data: Record<string, any>): string {
    try {
      const compiledTemplate = handlebars.compile(template);
      return compiledTemplate(data);
    } catch (error) {
      this.logger.error('Template compilation failed', error);
      return template; // Return original template if compilation fails
    }
  }

  // Utility method to create common email templates
  async createDefaultTemplates(): Promise<void> {
    const defaultTemplates: EmailTemplate[] = [
      {
        id: 'otp-verification',
        subject: 'Your OTP Code - {{appName}}',
        htmlContent: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>OTP Verification</h2>
            <p>Hello {{userName}},</p>
            <p>Your OTP code is: <strong style="font-size: 24px; color: #007bff;">{{otpCode}}</strong></p>
            <p>This code will expire in {{expiryMinutes}} minutes.</p>
            <p>If you didn't request this code, please ignore this email.</p>
            <hr>
            <p style="color: #666; font-size: 12px;">This is an automated message from {{appName}}.</p>
          </div>
        `,
        textContent: 'Hello {{userName}}, Your OTP code is: {{otpCode}}. This code will expire in {{expiryMinutes}} minutes.',
      },
      {
        id: 'welcome',
        subject: 'Welcome to {{appName}}!',
        htmlContent: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Welcome to {{appName}}!</h2>
            <p>Hello {{userName}},</p>
            <p>Thank you for joining {{appName}}. We're excited to have you on board!</p>
            <p>Get started by exploring our features and services.</p>
            <p>If you have any questions, feel free to contact our support team.</p>
            <hr>
            <p style="color: #666; font-size: 12px;">Best regards,<br>The {{appName}} Team</p>
          </div>
        `,
        textContent: 'Welcome to {{appName}}! Hello {{userName}}, Thank you for joining {{appName}}. We\'re excited to have you on board!',
      },
      {
        id: 'password-reset',
        subject: 'Password Reset Request - {{appName}}',
        htmlContent: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Password Reset Request</h2>
            <p>Hello {{userName}},</p>
            <p>We received a request to reset your password. Click the button below to reset it:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="{{resetLink}}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">Reset Password</a>
            </div>
            <p>This link will expire in {{expiryHours}} hours.</p>
            <p>If you didn't request this reset, please ignore this email.</p>
            <hr>
            <p style="color: #666; font-size: 12px;">This is an automated message from {{appName}}.</p>
          </div>
        `,
        textContent: 'Password Reset Request: Hello {{userName}}, Click this link to reset your password: {{resetLink}}. This link will expire in {{expiryHours}} hours.',
      },
    ];

    try {
      const templatesDir = path.resolve(this.templatesPath);
      
      // Create templates directory if it doesn't exist
      try {
        await fs.mkdir(templatesDir, { recursive: true });
      } catch {
        // Directory might already exist
      }

      for (const template of defaultTemplates) {
        const filePath = path.join(templatesDir, `${template.id}.json`);
        await fs.writeFile(filePath, JSON.stringify(template, null, 2));
        this.templates.set(template.id, template);
      }

      this.logger.log(`Created ${defaultTemplates.length} default email templates`);
    } catch (error) {
      this.logger.error('Failed to create default templates', error);
    }
  }
}