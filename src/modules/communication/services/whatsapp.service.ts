import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IWhatsAppService, WhatsAppPayload, CommunicationResult } from '../interfaces/communication.interface';
import { Twilio } from 'twilio';
import * as handlebars from 'handlebars';
import * as fs from 'fs/promises';
import * as path from 'path';

interface WhatsAppTemplate {
  id: string;
  content: string;
  mediaSupported?: boolean;
  templateName?: string; // Twilio approved template name
}

@Injectable()
export class WhatsAppService implements IWhatsAppService {
  private readonly logger = new Logger(WhatsAppService.name);
  private twilioClient: Twilio;
  private templates: Map<string, WhatsAppTemplate> = new Map();
  private readonly templatesPath: string;
  private readonly fromWhatsAppNumber: string;
  private readonly maxMessageLength: number;

  constructor(private readonly configService: ConfigService) {
    this.templatesPath = this.configService.get<string>('WHATSAPP_TEMPLATES_PATH', './templates/whatsapp');
    this.fromWhatsAppNumber = this.configService.get<string>('TWILIO_WHATSAPP_NUMBER')!;
    this.maxMessageLength = this.configService.get<number>('WHATSAPP_MAX_LENGTH', 4096);
    
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

    if (!this.fromWhatsAppNumber) {
      this.logger.error('Twilio WhatsApp number not configured');
      return;
    }

    this.twilioClient = new Twilio(accountSid, authToken);
    this.logger.log('Twilio WhatsApp client initialized successfully');
  }

  private async loadTemplates(): Promise<void> {
    try {
      const templatesDir = path.resolve(this.templatesPath);
      
      // Check if templates directory exists
      try {
        await fs.access(templatesDir);
      } catch {
        this.logger.warn(`WhatsApp templates directory not found: ${templatesDir}`);
        return;
      }

      const files = await fs.readdir(templatesDir);
      const templateFiles = files.filter(file => file.endsWith('.json'));

      for (const file of templateFiles) {
        try {
          const filePath = path.join(templatesDir, file);
          const templateData = await fs.readFile(filePath, 'utf-8');
          const template: WhatsAppTemplate = JSON.parse(templateData);
          
          this.templates.set(template.id, template);
          this.logger.log(`Loaded WhatsApp template: ${template.id}`);
        } catch (error) {
          this.logger.error(`Failed to load WhatsApp template ${file}`, error);
        }
      }

      this.logger.log(`Loaded ${this.templates.size} WhatsApp templates`);
    } catch (error) {
      this.logger.error('Failed to load WhatsApp templates', error);
    }
  }

  async sendWhatsApp(payload: WhatsAppPayload): Promise<CommunicationResult> {
    try {
      if (!this.twilioClient) {
        throw new Error('Twilio client not initialized');
      }

      let messageContent = payload.message;
      let templateName: string | undefined;

      // Use template if specified
      if (payload.templateId) {
        const template = this.templates.get(payload.templateId);
        if (!template) {
          throw new Error(`WhatsApp template not found: ${payload.templateId}`);
        }

        messageContent = this.compileTemplate(template.content, payload.templateData || {});
        templateName = template.templateName;
      } else if (payload.templateData) {
        // Apply template data to content even without template
        messageContent = this.compileTemplate(payload.message, payload.templateData);
      }

      // Validate message length
      if (messageContent.length > this.maxMessageLength) {
        this.logger.warn(`WhatsApp message exceeds max length (${this.maxMessageLength}): ${messageContent.length}`);
      }

      // Validate phone number format (E.164)
      if (!this.isValidPhoneNumber(payload.phoneNumber)) {
        throw new Error(`Invalid phone number format: ${payload.phoneNumber}`);
      }

      const messageOptions: any = {
        body: messageContent,
        from: this.fromWhatsAppNumber,
        to: `whatsapp:${payload.phoneNumber}`,
      };

      // Add media if provided
      if (payload.mediaUrl) {
        messageOptions.mediaUrl = [payload.mediaUrl];
      }

      // Use approved template if available
      if (templateName) {
        messageOptions.contentSid = templateName;
      }

      const message = await this.twilioClient.messages.create(messageOptions);

      this.logger.log(`WhatsApp message sent successfully to ${payload.phoneNumber} (messageId: ${message.sid})`);
      
      return {
        success: true,
        messageId: message.sid,
        provider: 'Twilio WhatsApp',
      };
    } catch (error) {
      this.logger.error(`Failed to send WhatsApp message to ${payload.phoneNumber}`, error);
      
      return {
        success: false,
        messageId: null,
        error: error.message,
        provider: 'Twilio WhatsApp',
      };
    }
  }

  async sendBulkWhatsApp(
    payloads: WhatsAppPayload[],
    batchSize: number = 5, // Lower batch size for WhatsApp due to stricter rate limits
  ): Promise<CommunicationResult[]> {
    const results: CommunicationResult[] = [];
    
    this.logger.log(`Sending ${payloads.length} WhatsApp messages in batches of ${batchSize}`);

    for (let i = 0; i < payloads.length; i += batchSize) {
      const batch = payloads.slice(i, i + batchSize);
      
      const batchPromises = batch.map(payload => 
        this.sendWhatsApp(payload).catch(error => ({
          success: false,
          messageId: null,
          error: error.message,
          provider: 'Twilio WhatsApp',
        } as CommunicationResult))
      );

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);

      // Longer delay between batches for WhatsApp rate limits
      if (i + batchSize < payloads.length) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    const successCount = results.filter(r => r.success).length;
    this.logger.log(`Bulk WhatsApp sending completed: ${successCount}/${results.length} successful`);

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
        direction: message.direction,
        numMedia: message.numMedia,
      };
    } catch (error) {
      this.logger.error(`Failed to get WhatsApp delivery status for ${messageId}`, error);
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
      this.logger.error('Twilio WhatsApp connection test failed', error);
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

  getTemplate(templateId: string): WhatsAppTemplate | undefined {
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
      this.logger.error('WhatsApp template compilation failed', error);
      return template; // Return original template if compilation fails
    }
  }

  // Utility method to create common WhatsApp templates
  async createDefaultTemplates(): Promise<void> {
    const defaultTemplates: WhatsAppTemplate[] = [
      {
        id: 'otp-verification',
        content: '🔐 Your {{appName}} verification code is: *{{otpCode}}*\n\nThis code expires in {{expiryMinutes}} minutes.\n\nDo not share this code with anyone.',
        mediaSupported: false,
      },
      {
        id: 'welcome',
        content: '🎉 Welcome to {{appName}}, {{userName}}!\n\nThank you for joining us. We\'re excited to have you on board!\n\nGet started by exploring our features.',
        mediaSupported: true,
      },
      {
        id: 'order-confirmation',
        content: '✅ Order Confirmed!\n\n📦 Order #{{orderNumber}}\n💰 Total: {{amount}} {{currency}}\n📅 Expected delivery: {{deliveryDate}}\n\nTrack your order: {{trackingUrl}}',
        mediaSupported: false,
      },
      {
        id: 'delivery-update',
        content: '🚚 Delivery Update\n\n📦 Order #{{orderNumber}}\n📍 Status: {{status}}\n⏰ Expected: {{estimatedTime}}\n\nYour order is on its way!',
        mediaSupported: false,
      },
      {
        id: 'payment-reminder',
        content: '💳 Payment Reminder\n\n📋 Invoice #{{invoiceNumber}}\n💰 Amount: {{amount}} {{currency}}\n📅 Due: {{dueDate}}\n\nPay now: {{paymentUrl}}',
        mediaSupported: false,
      },
      {
        id: 'appointment-reminder',
        content: '📅 Appointment Reminder\n\n👤 {{customerName}}\n📅 Date: {{appointmentDate}}\n⏰ Time: {{appointmentTime}}\n📍 Location: {{location}}\n\nSee you soon!',
        mediaSupported: false,
      },
      {
        id: 'password-reset',
        content: '🔒 Password Reset\n\nYour {{appName}} password reset code is: *{{resetCode}}*\n\nThis code expires in {{expiryMinutes}} minutes.\n\nIf you didn\'t request this, please ignore.',
        mediaSupported: false,
      },
      {
        id: 'transaction-alert',
        content: '💸 Transaction Alert\n\n💰 Amount: {{amount}} {{currency}}\n📅 Date: {{transactionDate}}\n🏪 Merchant: {{merchantName}}\n\nTransaction ID: {{transactionId}}',
        mediaSupported: false,
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

      this.logger.log(`Created ${defaultTemplates.length} default WhatsApp templates`);
    } catch (error) {
      this.logger.error('Failed to create default WhatsApp templates', error);
    }
  }

  // Get WhatsApp-specific features
  async getApprovedTemplates(): Promise<any[]> {
    try {
      if (!this.twilioClient) {
        throw new Error('Twilio client not initialized');
      }

      // Fetch approved WhatsApp templates from Twilio
      const templates = await this.twilioClient.content.v1.contents.list({
        limit: 50,
      });

      return templates.map(template => ({
        sid: template.sid,
        friendlyName: template.friendlyName,
        language: template.language,
        variables: template.variables,
        types: template.types,
      }));
    } catch (error) {
      this.logger.error('Failed to get approved WhatsApp templates', error);
      return [];
    }
  }

  // Send template message using approved Twilio template
  async sendTemplateMessage(
    phoneNumber: string,
    templateSid: string,
    variables?: Record<string, string>,
  ): Promise<CommunicationResult> {
    try {
      if (!this.twilioClient) {
        throw new Error('Twilio client not initialized');
      }

      const messageOptions: any = {
        contentSid: templateSid,
        from: this.fromWhatsAppNumber,
        to: `whatsapp:${phoneNumber}`,
      };

      if (variables) {
        messageOptions.contentVariables = JSON.stringify(variables);
      }

      const message = await this.twilioClient.messages.create(messageOptions);

      this.logger.log(`WhatsApp template message sent to ${phoneNumber} (messageId: ${message.sid})`);
      
      return {
        success: true,
        messageId: message.sid,
        provider: 'Twilio WhatsApp Template',
      };
    } catch (error) {
      this.logger.error(`Failed to send WhatsApp template message to ${phoneNumber}`, error);
      
      return {
        success: false,
        messageId: null,
        error: error.message,
        provider: 'Twilio WhatsApp Template',
      };
    }
  }
}