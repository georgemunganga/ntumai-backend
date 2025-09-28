import { Injectable, Logger } from '@nestjs/common';
import { MessageRecipient } from '../value-objects/message-recipient.vo';
import { CommunicationError, DeliveryResult } from '../value-objects/delivery-result.vo';
import { CommunicationContext } from '../value-objects/communication-context.vo';
import { ICommunicationDomainService, CommunicationChannel } from '../interfaces/communication-domain.interface';

export interface RetryStrategy {
  shouldRetry: boolean;
  delayMs: number;
  maxAttempts: number;
}

@Injectable()
export class CommunicationDomainService implements ICommunicationDomainService {
  private readonly logger = new Logger(CommunicationDomainService.name);

  // Business rules for retry strategies
  private readonly retryStrategies = new Map<string, RetryStrategy>([
    ['NETWORK_ERROR', { shouldRetry: true, delayMs: 1000, maxAttempts: 3 }],
    ['RATE_LIMIT_ERROR', { shouldRetry: true, delayMs: 5000, maxAttempts: 5 }],
    ['PROVIDER_ERROR', { shouldRetry: true, delayMs: 2000, maxAttempts: 3 }],
    ['AUTHENTICATION_ERROR', { shouldRetry: false, delayMs: 0, maxAttempts: 0 }],
    ['VALIDATION_ERROR', { shouldRetry: false, delayMs: 0, maxAttempts: 0 }],
  ]);

  // Channel priority configuration (higher number = higher priority)
  private readonly channelPriorities = new Map<string, number>([
    ['email', 1],
    ['sms', 2],
    ['whatsapp', 3],
    ['push', 4],
  ]);

  async validateRecipient(recipient: MessageRecipient): Promise<boolean> {
    try {
      // Basic validation is already done in the value object constructor
      if (!recipient.isValid) {
        this.logger.warn(`Invalid recipient: ${recipient.toString()}`);
        return false;
      }

      // Additional business rules can be added here
      // For example: check against blacklist, verify domain reputation, etc.
      
      if (recipient.type === 'email') {
        return this.validateEmailRecipient(recipient);
      } else if (recipient.type === 'phone') {
        return this.validatePhoneRecipient(recipient);
      }

      return true;
    } catch (error) {
      this.logger.error(`Error validating recipient ${recipient.toString()}:`, error);
      return false;
    }
  }

  async selectOptimalChannel(
    recipient: MessageRecipient,
    availableChannels: CommunicationChannel[],
  ): Promise<CommunicationChannel> {
    // Filter active channels
    const activeChannels = availableChannels.filter(channel => channel.isActive);
    
    if (activeChannels.length === 0) {
      throw new Error('No active communication channels available');
    }

    // Filter channels compatible with recipient type
    const compatibleChannels = activeChannels.filter(channel => 
      this.isChannelCompatible(channel, recipient)
    );

    if (compatibleChannels.length === 0) {
      throw new Error(`No compatible channels available for recipient type: ${recipient.type}`);
    }

    // Sort by priority (highest first) and select the best one
    const sortedChannels = compatibleChannels.sort((a, b) => {
      const priorityA = this.channelPriorities.get(a.name.toLowerCase()) || 0;
      const priorityB = this.channelPriorities.get(b.name.toLowerCase()) || 0;
      
      // First sort by channel priority
      if (priorityA !== priorityB) {
        return priorityB - priorityA;
      }
      
      // Then by configured priority
      return b.priority - a.priority;
    });

    const selectedChannel = sortedChannels[0];
    this.logger.debug(`Selected channel '${selectedChannel.name}' for recipient ${recipient.toString()}`);
    
    return selectedChannel;
  }

  async calculateRetryStrategy(
    error: CommunicationError,
    attemptCount: number,
  ): Promise<{ shouldRetry: boolean; delayMs: number }> {
    const strategy = this.retryStrategies.get(error.code) || {
      shouldRetry: false,
      delayMs: 0,
      maxAttempts: 0,
    };

    // Check if we've exceeded max attempts
    if (attemptCount >= strategy.maxAttempts) {
      this.logger.warn(`Max retry attempts (${strategy.maxAttempts}) exceeded for error: ${error.code}`);
      return { shouldRetry: false, delayMs: 0 };
    }

    if (!strategy.shouldRetry) {
      return { shouldRetry: false, delayMs: 0 };
    }

    // Calculate exponential backoff delay
    const baseDelay = strategy.delayMs;
    const exponentialDelay = baseDelay * Math.pow(2, attemptCount - 1);
    
    // Add jitter to prevent thundering herd
    const jitter = Math.random() * 0.1 * exponentialDelay;
    const finalDelay = Math.min(exponentialDelay + jitter, 30000); // Max 30 seconds

    // Handle rate limit specific delay
    if (error.code === 'RATE_LIMIT_ERROR') {
      const retryAfter = error.getDetail<number>('retryAfterMs');
      if (retryAfter && retryAfter > finalDelay) {
        return { shouldRetry: true, delayMs: retryAfter };
      }
    }

    this.logger.debug(`Retry strategy for ${error.code}: delay=${finalDelay}ms, attempt=${attemptCount}`);
    return { shouldRetry: true, delayMs: Math.round(finalDelay) };
  }

  // Domain business rules for recipient validation
  private async validateEmailRecipient(recipient: MessageRecipient): Promise<boolean> {
    const email = recipient.identifier;
    
    // Check for common disposable email domains
    const disposableDomains = [
      '10minutemail.com',
      'tempmail.org',
      'guerrillamail.com',
      'mailinator.com',
    ];
    
    const domain = email.split('@')[1]?.toLowerCase();
    if (disposableDomains.includes(domain)) {
      this.logger.warn(`Disposable email domain detected: ${domain}`);
      return false;
    }

    // Additional email validation rules can be added here
    // For example: MX record validation, domain reputation check, etc.
    
    return true;
  }

  private async validatePhoneRecipient(recipient: MessageRecipient): Promise<boolean> {
    const phone = recipient.identifier;
    
    // Basic E.164 format validation is already done in value object
    // Additional business rules can be added here
    // For example: check against do-not-call lists, validate carrier, etc.
    
    // Validate phone number length (E.164 allows 7-15 digits after country code)
    const digitsOnly = phone.replace(/[^\d]/g, '');
    if (digitsOnly.length < 8 || digitsOnly.length > 16) {
      this.logger.warn(`Invalid phone number length: ${phone}`);
      return false;
    }
    
    return true;
  }

  private isChannelCompatible(channel: CommunicationChannel, recipient: MessageRecipient): boolean {
    const channelName = channel.name.toLowerCase();
    
    switch (recipient.type) {
      case 'email':
        return channelName === 'email';
      case 'phone':
        return ['sms', 'whatsapp', 'voice'].includes(channelName);
      default:
        return false;
    }
  }

  // Helper method to create standard communication errors
  createNetworkError(message: string, details?: Record<string, any>): CommunicationError {
    return CommunicationError.networkError(message, details);
  }

  createValidationError(message: string, details?: Record<string, any>): CommunicationError {
    return CommunicationError.validationError(message, details);
  }

  createRateLimitError(message: string, retryAfterMs?: number): CommunicationError {
    return CommunicationError.rateLimitError(message, retryAfterMs);
  }

  createProviderError(message: string, providerCode?: string): CommunicationError {
    return CommunicationError.providerError(message, providerCode);
  }
}