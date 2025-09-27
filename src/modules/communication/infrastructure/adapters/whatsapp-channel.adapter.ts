import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Twilio } from 'twilio';
import { ICommunicationChannel } from '../../domain/interfaces/communication-domain.interface';
import { MessageRecipient } from '../../domain/value-objects/message-recipient.vo';

export interface WhatsAppChannelConfig {
  accountSid: string;
  authToken: string;
  fromNumber: string; // WhatsApp Business number
  rateLimits: {
    messagesPerSecond: number;
    messagesPerMinute: number;
    messagesPerHour: number;
  };
  retryConfig: {
    maxRetries: number;
    retryDelayMs: number;
  };
  statusCallbackUrl?: string;
  mediaUrl?: string;
}

export interface WhatsAppMessage {
  recipient: string;
  subject?: string; // Not used for WhatsApp but kept for interface compatibility
  body: string;
  attachments?: Array<{
    filename: string;
    content: Buffer;
    contentType: string;
    size: number;
  }>;
  metadata?: {
    messageId: string;
    context: any;
    priority: string;
  };
}

export interface WhatsAppSendResult {
  success: boolean;
  messageId?: string;
  error?: {
    code: string;
    message: string;
    retryAfterMs?: number;
    provider?: string;
  };
}

@Injectable()
export class WhatsAppChannelAdapter implements ICommunicationChannel {
  private readonly logger = new Logger(WhatsAppChannelAdapter.name);
  private twilioClient: Twilio;
  private config: WhatsAppChannelConfig;
  private isHealthy = true;
  private lastHealthCheck = new Date();
  private rateLimitTracker = {
    messagesThisSecond: 0,
    messagesThisMinute: 0,
    messagesThisHour: 0,
    lastSecondReset: Date.now(),
    lastMinuteReset: Date.now(),
    lastHourReset: Date.now(),
  };

  constructor(private readonly configService: ConfigService) {
    this.initializeConfig();
    this.initializeTwilioClient();
    this.startHealthChecks();
  }

  getChannelName(): string {
    return 'whatsapp';
  }

  getProviderId(): string {
    return 'twilio-whatsapp';
  }

  getSupportedRecipientTypes(): string[] {
    return ['phone'];
  }

  getPriority(): number {
    return 3; // Lower number = higher priority (lower than SMS)
  }

  isHealthy(): boolean {
    return this.isHealthy;
  }

  getRateLimits(): { messagesPerSecond: number; messagesPerMinute: number; messagesPerHour: number } {
    return this.config.rateLimits;
  }

  async sendMessage(message: WhatsAppMessage): Promise<WhatsAppSendResult> {
    this.logger.debug(`Sending WhatsApp message to ${message.recipient}`);

    try {
      // Check rate limits
      if (!this.checkRateLimit()) {
        return {
          success: false,
          error: {
            code: 'RATE_LIMIT',
            message: 'Rate limit exceeded',
            retryAfterMs: 60000, // Retry after 1 minute
          },
        };
      }

      // Validate phone number
      if (!this.isValidPhoneNumber(message.recipient)) {
        return {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid phone number format',
          },
        };
      }

      // Check message length (WhatsApp has 4096 character limit)
      if (message.body.length > 4096) {
        return {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Message too long (max 4096 characters)',
          },
        };
      }

      // Prepare WhatsApp message options
      const messageOptions = await this.prepareWhatsAppOptions(message);

      // Send WhatsApp message
      const result = await this.twilioClient.messages.create(messageOptions);

      // Update rate limit tracker
      this.updateRateLimitTracker();

      this.logger.debug(`WhatsApp message sent successfully to ${message.recipient}`);
      return {
        success: true,
        messageId: result.sid,
      };
    } catch (error) {
      this.logger.error(`Failed to send WhatsApp message to ${message.recipient}: ${error.message}`, error.stack);
      return this.handleSendError(error);
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      // Test Twilio connection by fetching account info
      await this.twilioClient.api.accounts(this.config.accountSid).fetch();
      this.isHealthy = true;
      this.lastHealthCheck = new Date();
      return true;
    } catch (error) {
      this.logger.error(`WhatsApp channel health check failed: ${error.message}`);
      this.isHealthy = false;
      this.lastHealthCheck = new Date();
      return false;
    }
  }

  async getChannelStatus(): Promise<{
    isHealthy: boolean;
    lastHealthCheck: Date;
    rateLimitStatus: any;
    configuration: Partial<WhatsAppChannelConfig>;
  }> {
    return {
      isHealthy: this.isHealthy,
      lastHealthCheck: this.lastHealthCheck,
      rateLimitStatus: {
        messagesThisSecond: this.rateLimitTracker.messagesThisSecond,
        messagesThisMinute: this.rateLimitTracker.messagesThisMinute,
        messagesThisHour: this.rateLimitTracker.messagesThisHour,
      },
      configuration: {
        fromNumber: this.config.fromNumber,
        rateLimits: this.config.rateLimits,
        statusCallbackUrl: this.config.statusCallbackUrl,
        mediaUrl: this.config.mediaUrl,
      },
    };
  }

  async validatePhoneNumber(phoneNumber: string): Promise<{
    isValid: boolean;
    formattedNumber?: string;
    carrier?: string;
    type?: string;
  }> {
    try {
      const lookup = await this.twilioClient.lookups.v1
        .phoneNumbers(phoneNumber)
        .fetch({ type: ['carrier'] });

      return {
        isValid: true,
        formattedNumber: lookup.phoneNumber,
        carrier: lookup.carrier?.name,
        type: lookup.carrier?.type,
      };
    } catch (error) {
      this.logger.warn(`Phone number validation failed for ${phoneNumber}: ${error.message}`);
      return {
        isValid: false,
      };
    }
  }

  async getMessageStatus(messageSid: string): Promise<{
    status: string;
    errorCode?: string;
    errorMessage?: string;
    dateCreated?: Date;
    dateSent?: Date;
    dateUpdated?: Date;
  }> {
    try {
      const message = await this.twilioClient.messages(messageSid).fetch();
      
      return {
        status: message.status,
        errorCode: message.errorCode?.toString(),
        errorMessage: message.errorMessage,
        dateCreated: message.dateCreated,
        dateSent: message.dateSent,
        dateUpdated: message.dateUpdated,
      };
    } catch (error) {
      this.logger.error(`Failed to get message status for ${messageSid}: ${error.message}`);
      throw error;
    }
  }

  async sendTemplateMessage(templateName: string, recipient: string, parameters: Record<string, any>): Promise<WhatsAppSendResult> {
    this.logger.debug(`Sending WhatsApp template message '${templateName}' to ${recipient}`);

    try {
      // Check rate limits
      if (!this.checkRateLimit()) {
        return {
          success: false,
          error: {
            code: 'RATE_LIMIT',
            message: 'Rate limit exceeded',
            retryAfterMs: 60000,
          },
        };
      }

      // Validate phone number
      if (!this.isValidPhoneNumber(recipient)) {
        return {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid phone number format',
          },
        };
      }

      const messageOptions = {
        from: `whatsapp:${this.config.fromNumber}`,
        to: `whatsapp:${this.formatPhoneNumber(recipient)}`,
        contentSid: templateName, // For approved WhatsApp templates
        contentVariables: JSON.stringify(parameters),
      };

      if (this.config.statusCallbackUrl) {
        messageOptions['statusCallback'] = this.config.statusCallbackUrl;
      }

      const result = await this.twilioClient.messages.create(messageOptions);

      this.updateRateLimitTracker();

      this.logger.debug(`WhatsApp template message sent successfully to ${recipient}`);
      return {
        success: true,
        messageId: result.sid,
      };
    } catch (error) {
      this.logger.error(`Failed to send WhatsApp template message to ${recipient}: ${error.message}`, error.stack);
      return this.handleSendError(error);
    }
  }

  async sendMediaMessage(recipient: string, mediaUrl: string, caption?: string): Promise<WhatsAppSendResult> {
    this.logger.debug(`Sending WhatsApp media message to ${recipient}`);

    try {
      // Check rate limits
      if (!this.checkRateLimit()) {
        return {
          success: false,
          error: {
            code: 'RATE_LIMIT',
            message: 'Rate limit exceeded',
            retryAfterMs: 60000,
          },
        };
      }

      // Validate phone number
      if (!this.isValidPhoneNumber(recipient)) {
        return {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid phone number format',
          },
        };
      }

      const messageOptions: any = {
        from: `whatsapp:${this.config.fromNumber}`,
        to: `whatsapp:${this.formatPhoneNumber(recipient)}`,
        mediaUrl: [mediaUrl],
      };

      if (caption) {
        messageOptions.body = caption;
      }

      if (this.config.statusCallbackUrl) {
        messageOptions.statusCallback = this.config.statusCallbackUrl;
      }

      const result = await this.twilioClient.messages.create(messageOptions);

      this.updateRateLimitTracker();

      this.logger.debug(`WhatsApp media message sent successfully to ${recipient}`);
      return {
        success: true,
        messageId: result.sid,
      };
    } catch (error) {
      this.logger.error(`Failed to send WhatsApp media message to ${recipient}: ${error.message}`, error.stack);
      return this.handleSendError(error);
    }
  }

  private initializeConfig(): void {
    this.config = {
      accountSid: this.configService.get<string>('TWILIO_ACCOUNT_SID', ''),
      authToken: this.configService.get<string>('TWILIO_AUTH_TOKEN', ''),
      fromNumber: this.configService.get<string>('TWILIO_WHATSAPP_FROM_NUMBER', ''),
      rateLimits: {
        messagesPerSecond: this.configService.get<number>('WHATSAPP_RATE_LIMIT_PER_SECOND', 1),
        messagesPerMinute: this.configService.get<number>('WHATSAPP_RATE_LIMIT_PER_MINUTE', 20),
        messagesPerHour: this.configService.get<number>('WHATSAPP_RATE_LIMIT_PER_HOUR', 500),
      },
      retryConfig: {
        maxRetries: this.configService.get<number>('WHATSAPP_MAX_RETRIES', 3),
        retryDelayMs: this.configService.get<number>('WHATSAPP_RETRY_DELAY_MS', 2000),
      },
      statusCallbackUrl: this.configService.get<string>('WHATSAPP_STATUS_CALLBACK_URL'),
      mediaUrl: this.configService.get<string>('WHATSAPP_MEDIA_URL'),
    };

    // Validate required configuration
    if (!this.config.accountSid || !this.config.authToken) {
      this.logger.error('Twilio credentials not configured for WhatsApp');
      this.isHealthy = false;
    }

    if (!this.config.fromNumber) {
      this.logger.error('TWILIO_WHATSAPP_FROM_NUMBER must be configured');
      this.isHealthy = false;
    }
  }

  private initializeTwilioClient(): void {
    if (!this.config.accountSid || !this.config.authToken) {
      this.logger.warn('Twilio client not initialized due to missing credentials');
      return;
    }

    this.twilioClient = new Twilio(this.config.accountSid, this.config.authToken);
  }

  private async prepareWhatsAppOptions(message: WhatsAppMessage): Promise<any> {
    const options: any = {
      from: `whatsapp:${this.config.fromNumber}`,
      to: `whatsapp:${this.formatPhoneNumber(message.recipient)}`,
      body: message.body,
    };

    // Add status callback if configured
    if (this.config.statusCallbackUrl) {
      options.statusCallback = this.config.statusCallbackUrl;
    }

    // Handle attachments (media)
    if (message.attachments && message.attachments.length > 0) {
      // WhatsApp supports media attachments
      const mediaUrls = [];
      
      for (const attachment of message.attachments) {
        // For now, we'll assume media URLs are provided
        // In a real implementation, you'd upload the attachment to a CDN first
        if (this.config.mediaUrl) {
          mediaUrls.push(`${this.config.mediaUrl}/${attachment.filename}`);
        }
      }
      
      if (mediaUrls.length > 0) {
        options.mediaUrl = mediaUrls;
      }
    }

    return options;
  }

  private checkRateLimit(): boolean {
    const now = Date.now();

    // Reset counters if time windows have passed
    if (now - this.rateLimitTracker.lastSecondReset >= 1000) {
      this.rateLimitTracker.messagesThisSecond = 0;
      this.rateLimitTracker.lastSecondReset = now;
    }

    if (now - this.rateLimitTracker.lastMinuteReset >= 60000) {
      this.rateLimitTracker.messagesThisMinute = 0;
      this.rateLimitTracker.lastMinuteReset = now;
    }

    if (now - this.rateLimitTracker.lastHourReset >= 3600000) {
      this.rateLimitTracker.messagesThisHour = 0;
      this.rateLimitTracker.lastHourReset = now;
    }

    // Check limits
    return (
      this.rateLimitTracker.messagesThisSecond < this.config.rateLimits.messagesPerSecond &&
      this.rateLimitTracker.messagesThisMinute < this.config.rateLimits.messagesPerMinute &&
      this.rateLimitTracker.messagesThisHour < this.config.rateLimits.messagesPerHour
    );
  }

  private updateRateLimitTracker(): void {
    this.rateLimitTracker.messagesThisSecond++;
    this.rateLimitTracker.messagesThisMinute++;
    this.rateLimitTracker.messagesThisHour++;
  }

  private handleSendError(error: any): WhatsAppSendResult {
    // Map Twilio error codes to our error types
    const twilioErrorCode = error.code;
    
    if (twilioErrorCode === 20003 || twilioErrorCode === 20404) {
      return {
        success: false,
        error: {
          code: 'AUTHENTICATION_ERROR',
          message: 'Twilio authentication failed',
          provider: 'twilio-whatsapp',
        },
      };
    }

    if (twilioErrorCode === 21211 || twilioErrorCode === 21614) {
      return {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid phone number',
        },
      };
    }

    if (twilioErrorCode === 63016) {
      return {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'WhatsApp template not approved',
        },
      };
    }

    if (twilioErrorCode === 63017) {
      return {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'WhatsApp message outside allowed window',
        },
      };
    }

    if (twilioErrorCode === 20429) {
      return {
        success: false,
        error: {
          code: 'RATE_LIMIT_ERROR',
          message: 'Too many requests',
          retryAfterMs: 60000,
        },
      };
    }

    if (error.status >= 500) {
      return {
        success: false,
        error: {
          code: 'PROVIDER_ERROR',
          message: 'Twilio WhatsApp service error',
          provider: 'twilio-whatsapp',
        },
      };
    }

    if (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT') {
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: 'Network connection error',
        },
      };
    }

    // Default error
    return {
      success: false,
      error: {
        code: 'UNKNOWN_ERROR',
        message: error.message || 'Unknown WhatsApp sending error',
      },
    };
  }

  private isValidPhoneNumber(phoneNumber: string): boolean {
    // Basic E.164 format validation
    const e164Regex = /^\+[1-9]\d{1,14}$/;
    return e164Regex.test(phoneNumber);
  }

  private formatPhoneNumber(phoneNumber: string): string {
    // Ensure phone number is in E.164 format
    if (phoneNumber.startsWith('+')) {
      return phoneNumber;
    }
    
    // Add + if missing (assuming it's already in international format)
    if (phoneNumber.match(/^[1-9]\d{10,14}$/)) {
      return `+${phoneNumber}`;
    }
    
    return phoneNumber; // Return as-is if we can't format it
  }

  private startHealthChecks(): void {
    // Perform health check every 5 minutes
    setInterval(async () => {
      await this.healthCheck();
    }, 5 * 60 * 1000);

    // Initial health check
    setTimeout(() => {
      this.healthCheck();
    }, 1000);
  }
}