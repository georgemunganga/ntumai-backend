import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { ICommunicationChannel } from '../../domain/interfaces/communication-domain.interface';
import { CommunicationError } from '../../domain/value-objects/delivery-result.vo';

export interface EmailChannelConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
  from: {
    name: string;
    address: string;
  };
  rateLimits: {
    messagesPerSecond: number;
    messagesPerMinute: number;
    messagesPerHour: number;
  };
  retryConfig: {
    maxRetries: number;
    retryDelayMs: number;
  };
}

export interface EmailMessage {
  recipient: string;
  subject?: string;
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

export interface EmailSendResult {
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
export class EmailChannelAdapter implements ICommunicationChannel {
  private readonly logger = new Logger(EmailChannelAdapter.name);
  private transporter: nodemailer.Transporter;
  private config: EmailChannelConfig;
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
    this.initializeTransporter();
    this.startHealthChecks();
  }

  getChannelName(): string {
    return 'email';
  }

  getProviderId(): string {
    return 'smtp';
  }

  getSupportedRecipientTypes(): string[] {
    return ['email'];
  }

  getPriority(): number {
    return 1; // Lower number = higher priority
  }

  isHealthy(): boolean {
    return this.isHealthy;
  }

  getRateLimits(): { messagesPerSecond: number; messagesPerMinute: number; messagesPerHour: number } {
    return this.config.rateLimits;
  }

  async sendMessage(message: EmailMessage): Promise<EmailSendResult> {
    this.logger.debug(`Sending email to ${message.recipient}`);

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

      // Validate email address
      if (!this.isValidEmail(message.recipient)) {
        return {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid email address',
          },
        };
      }

      // Prepare email options
      const mailOptions = await this.prepareMailOptions(message);

      // Send email
      const result = await this.transporter.sendMail(mailOptions);

      // Update rate limit tracker
      this.updateRateLimitTracker();

      this.logger.debug(`Email sent successfully to ${message.recipient}`);
      return {
        success: true,
        messageId: result.messageId,
      };
    } catch (error) {
      this.logger.error(`Failed to send email to ${message.recipient}: ${error.message}`, error.stack);
      return this.handleSendError(error);
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      // Verify SMTP connection
      await this.transporter.verify();
      this.isHealthy = true;
      this.lastHealthCheck = new Date();
      return true;
    } catch (error) {
      this.logger.error(`Email channel health check failed: ${error.message}`);
      this.isHealthy = false;
      this.lastHealthCheck = new Date();
      return false;
    }
  }

  async getChannelStatus(): Promise<{
    isHealthy: boolean;
    lastHealthCheck: Date;
    rateLimitStatus: any;
    configuration: Partial<EmailChannelConfig>;
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
        host: this.config.host,
        port: this.config.port,
        secure: this.config.secure,
        from: this.config.from,
        rateLimits: this.config.rateLimits,
      },
    };
  }

  private initializeConfig(): void {
    this.config = {
      host: this.configService.get<string>('SMTP_HOST', 'localhost'),
      port: this.configService.get<number>('SMTP_PORT', 587),
      secure: this.configService.get<boolean>('SMTP_SECURE', false),
      auth: {
        user: this.configService.get<string>('SMTP_USER', ''),
        pass: this.configService.get<string>('SMTP_PASS', ''),
      },
      from: {
        name: this.configService.get<string>('SMTP_FROM_NAME', 'Application'),
        address: this.configService.get<string>('SMTP_FROM_ADDRESS', 'noreply@example.com'),
      },
      rateLimits: {
        messagesPerSecond: this.configService.get<number>('SMTP_RATE_LIMIT_PER_SECOND', 5),
        messagesPerMinute: this.configService.get<number>('SMTP_RATE_LIMIT_PER_MINUTE', 100),
        messagesPerHour: this.configService.get<number>('SMTP_RATE_LIMIT_PER_HOUR', 1000),
      },
      retryConfig: {
        maxRetries: this.configService.get<number>('SMTP_MAX_RETRIES', 3),
        retryDelayMs: this.configService.get<number>('SMTP_RETRY_DELAY_MS', 1000),
      },
    };
  }

  private initializeTransporter(): void {
    this.transporter = nodemailer.createTransporter({
      host: this.config.host,
      port: this.config.port,
      secure: this.config.secure,
      auth: this.config.auth.user ? this.config.auth : undefined,
      pool: true, // Use connection pooling
      maxConnections: 5,
      maxMessages: 100,
      rateDelta: 1000, // 1 second
      rateLimit: this.config.rateLimits.messagesPerSecond,
    });

    // Handle transporter events
    this.transporter.on('error', (error) => {
      this.logger.error(`SMTP transporter error: ${error.message}`);
      this.isHealthy = false;
    });

    this.transporter.on('idle', () => {
      this.logger.debug('SMTP transporter is idle');
    });
  }

  private async prepareMailOptions(message: EmailMessage): Promise<nodemailer.SendMailOptions> {
    const attachments = message.attachments?.map(att => ({
      filename: att.filename,
      content: att.content,
      contentType: att.contentType,
    })) || [];

    return {
      from: `${this.config.from.name} <${this.config.from.address}>`,
      to: message.recipient,
      subject: message.subject || 'No Subject',
      html: message.body,
      text: this.stripHtml(message.body), // Fallback plain text
      attachments,
      headers: {
        'X-Message-ID': message.metadata?.messageId || '',
        'X-Priority': this.mapPriorityToHeader(message.metadata?.priority),
      },
    };
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

  private handleSendError(error: any): EmailSendResult {
    // Map different types of errors to appropriate error codes
    if (error.code === 'EAUTH' || error.responseCode === 535) {
      return {
        success: false,
        error: {
          code: 'AUTHENTICATION_ERROR',
          message: 'SMTP authentication failed',
          provider: 'smtp',
        },
      };
    }

    if (error.code === 'ECONNECTION' || error.code === 'ETIMEDOUT') {
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: 'Failed to connect to SMTP server',
        },
      };
    }

    if (error.responseCode >= 400 && error.responseCode < 500) {
      return {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: error.response || 'Invalid email data',
        },
      };
    }

    if (error.responseCode >= 500) {
      return {
        success: false,
        error: {
          code: 'PROVIDER_ERROR',
          message: error.response || 'SMTP server error',
          provider: 'smtp',
        },
      };
    }

    // Default error
    return {
      success: false,
      error: {
        code: 'UNKNOWN_ERROR',
        message: error.message || 'Unknown email sending error',
      },
    };
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  }

  private mapPriorityToHeader(priority?: string): string {
    switch (priority?.toLowerCase()) {
      case 'urgent':
        return '1 (Highest)';
      case 'high':
        return '2 (High)';
      case 'normal':
        return '3 (Normal)';
      case 'low':
        return '4 (Low)';
      default:
        return '3 (Normal)';
    }
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