import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ISMSService, SMSPayload, CommunicationResult } from '../interfaces/communication.interface';
import { Twilio } from 'twilio';
import * as handlebars from 'handlebars';
import * as fs from 'fs/promises';
import * as path from 'path';

interface SMSTemplate {
  id: string;
  content: string;
  maxLength?: number;
}

@Injectable()
export class SmsService implements ISMSService {
  private readonly logger = new Logger(SmsService.name);
  private twilioClient: Twilio;
  private templates: Map<string, SMSTemplate> = new Map();
  private readonly templatesPath: string;
  private readonly fromPhoneNumber: string;
  private readonly maxSmsLength: number;

  constructor(private readonly configService: ConfigService) {
    this.templatesPath = this.configService.get<string>('SMS_TEMPLATES_PATH', './templates/sms');
    this.fromPhoneNumber = this.configService.get<string>('TWILIO_PHONE_NUMBER')!;
    this.maxSmsLength = this.configService.get<number>('SMS_MAX_LENGTH', 160);
    
    this.initializeTwilioClient();
    this.loadTemplates();
  }

  private initializeTwilioClient(): void {
    const accountSid = this.configService.get<string>('TWILIO_ACCOUNT_SID');
    const authToken = this.configService.get<string>('TWILIO_AUTH_TOKEN');

    if (!accountSid || !authToken) {
      this.logger.error('Twilio credentials not configured');
      return;
    }

    if (!this.fromPhoneNumber) {
      this.logger.error('Twilio phone number not configured');
      return;
    }

    this.twilioClient = new Twilio(accountSid, authToken);
    this.logger.log('Twilio client initialized successfully');
  }

  private async loadTemplates(): Promise<void> {
    try {
      const templatesDir = path.resolve(this.templatesPath);
      
      // Check if templates directory exists
      try {
        await fs.access(templatesDir);
      } catch {
        this.logger.warn(`SMS templates directory not found: ${templatesDir}`);
        return;
      }

      const files = await fs.readdir(templatesDir);
      const templateFiles = files.filter(file => file.endsWith('.json'));

      for (const file of templateFiles) {
        try {
          const filePath = path.join(templatesDir, file);
          const templateData = await fs.readFile(filePath, 'utf-8');
          const template: SMSTemplate = JSON.parse(templateData);
          
          this.templates.set(template.id, template);
          this.logger.log(`Loaded SMS template: ${template.id}`);
        } catch (error) {
          this.logger.error(`Failed to load SMS template ${file}`, error);
        }
      }

      this.logger.log(`Loaded ${this.templates.size} SMS templates`);
    } catch (error) {
      this.logger.error('Failed to load SMS templates', error);
    }
  }

  async sendSMS(payload: SMSPayload): Promise<CommunicationResult> {
    try {
      if (!this.twilioClient) {
        throw new Error('Twilio client not initialized');
      }

      let messageContent = payload.message;

      // Use template if specified
      if (payload.templateId) {
        const template = this.templates.get(payload.templateId);
        if (!template) {
          throw new Error(`SMS template not found: ${payload.templateId}`);
        }

        messageContent = this.compileTemplate(template.content, payload.templateData || {});
        
        // Check template-specific length limit
        const maxLength = template.maxLength || this.maxSmsLength;
        if (messageContent.length > maxLength) {
          this.logger.warn(`SMS message exceeds template max length (${maxLength}): ${messageContent.length}`);
        }
      } else if (payload.templateData) {
        // Apply template data to content even without template
        messageContent = this.compileTemplate(payload.message, payload.templateData);
      }

      // Validate message length
      if (messageContent.length > this.maxSmsLength) {
        this.logger.warn(`SMS message exceeds max length (${this.maxSmsLength}): ${messageContent.length}`);
      }

      // Validate phone number format (E.164)
      if (!this.isValidPhoneNumber(payload.phoneNumber)) {
        throw new Error(`Invalid phone number format: ${payload.phoneNumber}`);
      }

      const message = await this.twilioClient.messages.create({
        body: messageContent,
        from: this.fromPhoneNumber,
        to: payload.phoneNumber,
      });

      this.logger.log(`SMS sent successfully to ${payload.phoneNumber} (messageId: ${message.sid})`);
      
      return {
        success: true,
        messageId: message.sid,
        provider: 'Twilio',
      };
    } catch (error) {
      this.logger.error(`Failed to send SMS to ${payload.phoneNumber}`, error);
      
      return {
        success: false,
        messageId: null,
        error: error.message,
        provider: 'Twilio',
      };
    }
  }

  async sendBulkSMS(
    payloads: SMSPayload[],
    batchSize: number = 10,
  ): Promise<CommunicationResult[]> {
    const results: CommunicationResult[] = [];
    
    this.logger.log(`Sending ${payloads.length} SMS messages in batches of ${batchSize}`);

    for (let i = 0; i < payloads.length; i += batchSize) {
      const batch = payloads.slice(i, i + batchSize);
      
      const batchPromises = batch.map(payload => 
        this.sendSMS(payload).catch(error => ({
          success: false,
          messageId: null,
          error: error.message,
          provider: 'Twilio',
        } as CommunicationResult))
      );

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);

      // Small delay between batches to respect rate limits
      if (i + batchSize < payloads.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    const successCount = results.filter(r => r.success).length;
    this.logger.log(`Bulk SMS sending completed: ${successCount}/${results.length} successful`);

    return results;
  }

  async getDeliveryStatus(messageId: string): Promise<any> {
    try {
      if (!this.twilioClient) {
        throw new Error('Twilio client not initialized');
      }

      const message = await this.twilioClient.messages(messageId).fetch();
      
      return {
        messageId: message.sid,
        status: message.status,
        errorCode: message.errorCode,
        errorMessage: message.errorMessage,
        dateCreated: message.dateCreated,
        dateUpdated: message.dateUpdated,
        dateSent: message.dateSent,
        price: message.price,
        priceUnit: message.priceUnit,
      };
    } catch (error) {
      this.logger.error(`Failed to get SMS delivery status for ${messageId}`, error);
      throw error;
    }
  }

  async validatePhoneNumber(phoneNumber: string): Promise<boolean> {
    return this.isValidPhoneNumber(phoneNumber);
  }

  async testConnection(): Promise<boolean> {
    try {
      if (!this.twilioClient) {
        return false;
      }

      // Test by fetching account info
      await this.twilioClient.api.accounts.list({ limit: 1 });
      return true;
    } catch (error) {
      this.logger.error('Twilio connection test failed', error);
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

  getTemplate(templateId: string): SMSTemplate | undefined {
    return this.templates.get(templateId);
  }

  private isValidPhoneNumber(phoneNumber: string): boolean {
    // E.164 format validation
    const phoneRegex = /^\+[1-9]\d{1,14}$/;
    return phoneRegex.test(phoneNumber);
  }

  private compileTemplate(template: string, data: Record<string, any>): string {
    try {
      const compiledTemplate = handlebars.compile(template);
      return compiledTemplate(data);
    } catch (error) {
      this.logger.error('SMS template compilation failed', error);
      return template; // Return original template if compilation fails
    }
  }

  // Utility method to create common SMS templates
  async createDefaultTemplates(): Promise<void> {
    const defaultTemplates: SMSTemplate[] = [
      {
        id: 'otp-verification',
        content: 'Your {{appName}} OTP code is: {{otpCode}}. Valid for {{expiryMinutes}} minutes.',
        maxLength: 160,
      },
      {
        id: 'login-otp',
        content: 'Your login code: {{otpCode}}. Do not share this code with anyone.',
        maxLength: 160,
      },
      {
        id: 'transaction-otp',
        content: 'Transaction OTP: {{otpCode}}. Amount: {{amount}} {{currency}}. Valid for {{expiryMinutes}} min.',
        maxLength: 160,
      },
      {
        id: 'welcome',
        content: 'Welcome to {{appName}}! Your account has been created successfully.',
        maxLength: 160,
      },
      {
        id: 'password-reset',
        content: 'Your {{appName}} password reset code: {{resetCode}}. Valid for {{expiryMinutes}} minutes.',
        maxLength: 160,
      },
      {
        id: 'account-verification',
        content: 'Verify your {{appName}} account with code: {{verificationCode}}',
        maxLength: 160,
      },
      {
        id: 'order-confirmation',
        content: 'Order #{{orderNumber}} confirmed! Total: {{amount}} {{currency}}. Track: {{trackingUrl}}',
        maxLength: 160,
      },
      {
        id: 'delivery-notification',
        content: 'Your order #{{orderNumber}} is out for delivery. Expected: {{deliveryTime}}',
        maxLength: 160,
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

      this.logger.log(`Created ${defaultTemplates.length} default SMS templates`);
    } catch (error) {
      this.logger.error('Failed to create default SMS templates', error);
    }
  }

  // Get SMS pricing information
  async getPricing(country?: string): Promise<any> {
    try {
      if (!this.twilioClient) {
        throw new Error('Twilio client not initialized');
      }

      if (country) {
        const pricing = await this.twilioClient.pricing.v1.messaging.countries(country).fetch();
        return pricing;
      } else {
        const pricing = await this.twilioClient.pricing.v1.messaging.countries.list({ limit: 50 });
        return pricing;
      }
    } catch (error) {
      this.logger.error('Failed to get SMS pricing', error);
      throw error;
    }
  }

  // Get account balance
  async getAccountBalance(): Promise<any> {
    try {
      if (!this.twilioClient) {
        throw new Error('Twilio client not initialized');
      }

      const account = await this.twilioClient.api.accounts.list({ limit: 1 });
      return {
        balance: account[0]?.balance,
        currency: account[0]?.currency,
      };
    } catch (error) {
      this.logger.error('Failed to get account balance', error);
      throw error;
    }
  }
}