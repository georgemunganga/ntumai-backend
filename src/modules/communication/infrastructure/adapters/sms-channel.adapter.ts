import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Twilio } from 'twilio';
import { ICommunicationChannel } from '../../domain/interfaces/communication-domain.interface';
import { MessageRecipient } from '../../domain/value-objects/message-recipient.vo';

export interface SmsChannelConfig {
  accountSid: string;
  authToken: string;
  fromNumber: string;
  rateLimits: {
    messagesPerSecond: number;
    messagesPerMinute: number;
    messagesPerHour: number;
  };
  retryConfig: {
    maxRetries: number;
    retryDelayMs: number;
  };
  messagingServiceSid?: string;
  statusCallbackUrl?: string;
}

export interface SmsMessage {
  recipient: string;
  subject?: string; // Not used for SMS but kept for interface compatibility
  body: string;
  attachments?: Array<{
    filename: string;
    content: Buffer;
    contentType: string;
    size: number;
  }>; // Not supported for SMS but kept for interface compatibility
  metadata?: {
    messageId: string;
    context: any;
    priority: string;
  };
}

export interface SmsSendResult {
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
export class SmsChannelAdapter implements ICommunicationChannel {
  private readonly logger = new Logger(SmsChannelAdapter.name);
  private twilioClient: Twilio;
  private config: SmsChannelConfig;
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
    return 'sms';
  }

  getProviderId(): string {
    return 'twilio';
  }

  getSupportedRecipientTypes(): string[] {
    return ['phone'];
  }

  getPriority(): number {
    return 2; // Lower number = higher priority
  }

  isHealthy(): boolean {
    return this.isHealthy;
  }

  getRateLimits(): { messagesPerSecond: number; messagesPerMinute: number; messagesPerHour: number } {
    return this.config.rateLimits;
  }

  async sendMessage(message: SmsMessage): Promise<SmsSendResult> {
    this.logger.debug(`Sending SMS to ${message.recipient}`);

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

      // Check message length (SMS has 160 character limit for single message)
      if (message.body.length > 1600) { // Allow up to 10 SMS segments
        return {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Message too long (max 1600 characters)',
          },
        };
      }

      // Prepare SMS options
      const smsOptions = this.prepareSmsOptions(message);

      // Send SMS
      const result = await this.twilioClient.messages.create(smsOptions);

      // Update rate limit tracker
      this.updateRateLimitTracker();

      this.logger.debug(`SMS sent successfully to ${message.recipient}`);
      return {
        success: true,
        messageId: result.sid,
      };
    } catch (error) {
      this.logger.error(`Failed to send SMS to ${message.recipient}: ${error.message}`, error.stack);
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
      this.logger.error(`SMS channel health check failed: ${error.message}`);
      this.isHealthy = false;
      this.lastHealthCheck = new Date();
      return false;
    }
  }

  async getChannelStatus(): Promise<{
    isHealthy: boolean;
    lastHealthCheck: Date;
    rateLimitStatus: any;
    configuration: Partial<SmsChannelConfig>;
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
        messagingServiceSid: this.config.messagingServiceSid,
        statusCallbackUrl: this.config.statusCallbackUrl,
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

  private initializeConfig(): void {
    this.config = {
      accountSid: this.configService.get<string>('TWILIO_ACCOUNT_SID', ''),
      authToken: this.configService.get<string>('TWILIO_AUTH_TOKEN', ''),
      fromNumber: this.configService.get<string>('TWILIO_FROM_NUMBER', ''),
      rateLimits: {
        messagesPerSecond: this.configService.get<number>('TWILIO_RATE_LIMIT_PER_SECOND', 1),
        messagesPerMinute: this.configService.get<number>('TWILIO_RATE_LIMIT_PER_MINUTE', 30),
        messagesPerHour: this.configService.get<number>('TWILIO_RATE_LIMIT_PER_HOUR', 1000),
      },
      retryConfig: {
        maxRetries: this.configService.get<number>('TWILIO_MAX_RETRIES', 3),
        retryDelayMs: this.configService.get<number>('TWILIO_RETRY_DELAY_MS', 2000),
      },
      messagingServiceSid: this.configService.get<string>('TWILIO_MESSAGING_SERVICE_SID'),
      statusCallbackUrl: this.configService.get<string>('TWILIO_STATUS_CALLBACK_URL'),
    };

    // Validate required configuration
    if (!this.config.accountSid || !this.config.authToken) {
      this.logger.error('Twilio credentials not configured');
      this.isHealthy = false;
    }

    if (!this.config.fromNumber && !this.config.messagingServiceSid) {
      this.logger.error('Either TWILIO_FROM_NUMBER or TWILIO_MESSAGING_SERVICE_SID must be configured');
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

  private prepareSmsOptions(message: SmsMessage): any {
    const options: any = {
      body: message.body,
      to: this.formatPhoneNumber(message.recipient),
    };

    // Use messaging service if configured, otherwise use from number
    if (this.config.messagingServiceSid) {
      options.messagingServiceSid = this.config.messagingServiceSid;
    } else {
      options.from = this.config.fromNumber;
    }

    // Add status callback if configured
    if (this.config.statusCallbackUrl) {
      options.statusCallback = this.config.statusCallbackUrl;
    }

    // Add custom headers for tracking
    if (message.metadata?.messageId) {
      // Twilio doesn't support custom headers for SMS, but we can use the providedFeedback
      // or store the mapping separately
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

  private handleSendError(error: any): SmsSendResult {
    // Map Twilio error codes to our error types
    const twilioErrorCode = error.code;
    
    if (twilioErrorCode === 20003 || twilioErrorCode === 20404) {
      return {
        success: false,
        error: {
          code: 'AUTHENTICATION_ERROR',
          message: 'Twilio authentication failed',
          provider: 'twilio',
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

    if (twilioErrorCode === 21610) {
      return {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Message body is required',
        },
      };
    }

    if (twilioErrorCode === 21617) {
      return {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Message body too long',
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
          message: 'Twilio service error',
          provider: 'twilio',
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
        message: error.message || 'Unknown SMS sending error',
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