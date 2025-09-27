import { Injectable, Logger } from '@nestjs/common';
import { Message, MessageStatus, MessagePriority } from '../../domain/entities/message.entity';
import { CommunicationTemplate } from '../../domain/entities/communication-template.entity';
import { MessageRecipient } from '../../domain/value-objects/message-recipient.vo';
import { MessageContent } from '../../domain/value-objects/message-content.vo';
import { CommunicationContext } from '../../domain/value-objects/communication-context.vo';
import { DeliveryResult, CommunicationError } from '../../domain/value-objects/delivery-result.vo';
import { CommunicationDomainService } from '../../domain/services/communication-domain.service';
import {
  MessageRepository,
  TemplateRepository,
  CommunicationUnitOfWork,
} from '../../domain/repositories/communication.repository';
import {
  ICommunicationChannel,
  CommunicationChannel,
} from '../../domain/interfaces/communication-domain.interface';
import { v4 as uuidv4 } from 'uuid';

export interface SendMessageRequest {
  recipient: {
    type: 'email' | 'phone';
    identifier: string;
  };
  content?: {
    subject?: string;
    body: string;
    attachments?: Array<{
      filename: string;
      content: Buffer;
      contentType: string;
    }>;
  };
  templateId?: string;
  templateVariables?: Record<string, any>;
  channel?: string;
  priority?: MessagePriority;
  context: {
    userId?: string;
    sessionId?: string;
    requestId?: string;
    metadata?: Record<string, any>;
  };
  scheduling?: {
    scheduledAt?: Date;
    expiresAt?: Date;
  };
  options?: {
    trackingEnabled?: boolean;
    deliveryReceiptRequested?: boolean;
    tags?: string[];
    category?: string;
  };
}

export interface SendMessageResponse {
  messageId: string;
  status: MessageStatus;
  estimatedDeliveryTime?: Date;
  selectedChannel: string;
}

export interface BulkSendRequest {
  recipients: Array<{
    type: 'email' | 'phone';
    identifier: string;
    templateVariables?: Record<string, any>;
  }>;
  templateId: string;
  channel?: string;
  priority?: MessagePriority;
  context: {
    userId?: string;
    sessionId?: string;
    requestId?: string;
    metadata?: Record<string, any>;
  };
  scheduling?: {
    scheduledAt?: Date;
    expiresAt?: Date;
  };
  options?: {
    trackingEnabled?: boolean;
    deliveryReceiptRequested?: boolean;
    tags?: string[];
    category?: string;
  };
}

export interface BulkSendResponse {
  batchId: string;
  messageIds: string[];
  totalMessages: number;
  estimatedCompletionTime?: Date;
}

@Injectable()
export class MessageOrchestrationService {
  private readonly logger = new Logger(MessageOrchestrationService.name);

  constructor(
    private readonly domainService: CommunicationDomainService,
    private readonly unitOfWork: CommunicationUnitOfWork,
    private readonly communicationChannels: ICommunicationChannel[],
  ) {}

  async sendMessage(request: SendMessageRequest): Promise<SendMessageResponse> {
    this.logger.debug(`Sending message to ${request.recipient.identifier}`);

    try {
      return await this.unitOfWork.withTransaction(async () => {
        // 1. Create recipient value object
        const recipient = MessageRecipient.create(
          request.recipient.type,
          request.recipient.identifier,
        );

        // 2. Validate recipient
        const isValidRecipient = await this.domainService.validateRecipient(recipient);
        if (!isValidRecipient) {
          throw new Error(`Invalid recipient: ${request.recipient.identifier}`);
        }

        // 3. Create communication context
        const context = CommunicationContext.create(
          request.context.userId,
          request.context.sessionId,
          request.context.requestId || uuidv4(),
          request.context.metadata,
        );

        // 4. Prepare message content
        let content: MessageContent;
        if (request.templateId) {
          content = await this.renderTemplate(
            request.templateId,
            request.templateVariables || {},
          );
        } else if (request.content) {
          const attachments = request.content.attachments?.map(att => ({
            filename: att.filename,
            content: att.content,
            contentType: att.contentType,
            size: att.content.length,
          })) || [];

          content = MessageContent.create(
            request.content.body,
            request.content.subject,
            attachments,
          );
        } else {
          throw new Error('Either content or templateId must be provided');
        }

        // 5. Select optimal communication channel
        const availableChannels = this.getAvailableChannels();
        const selectedChannel = await this.domainService.selectOptimalChannel(
          recipient,
          availableChannels,
        );

        // 6. Create message entity
        const messageId = uuidv4();
        const message = Message.create(
          messageId,
          recipient,
          content,
          context,
          selectedChannel.name,
          request.priority || MessagePriority.NORMAL,
          {
            templateId: request.templateId,
            templateVariables: request.templateVariables,
            scheduledAt: request.scheduling?.scheduledAt,
            expiresAt: request.scheduling?.expiresAt,
            tags: request.options?.tags,
            category: request.options?.category,
            trackingEnabled: request.options?.trackingEnabled,
            deliveryReceiptRequested: request.options?.deliveryReceiptRequested,
          },
        );

        // 7. Queue the message
        message.queue();

        // 8. Save to repository
        await this.unitOfWork.messageRepository.save(message);

        // 9. Attempt immediate delivery if not scheduled
        if (!message.isScheduled()) {
          await this.processMessage(message, selectedChannel);
        }

        return {
          messageId: message.id,
          status: message.status,
          selectedChannel: selectedChannel.name,
          estimatedDeliveryTime: this.calculateEstimatedDeliveryTime(
            selectedChannel,
            message.priority,
          ),
        };
      });
    } catch (error) {
      this.logger.error(`Failed to send message: ${error.message}`, error.stack);
      throw error;
    }
  }

  async sendBulkMessages(request: BulkSendRequest): Promise<BulkSendResponse> {
    this.logger.debug(`Sending bulk messages to ${request.recipients.length} recipients`);

    try {
      return await this.unitOfWork.withTransaction(async () => {
        const batchId = uuidv4();
        const messageIds: string[] = [];

        // Get template once for all messages
        const template = await this.unitOfWork.templateRepository.findById(
          request.templateId,
        );
        if (!template) {
          throw new Error(`Template not found: ${request.templateId}`);
        }

        // Process each recipient
        for (const recipientData of request.recipients) {
          try {
            const messageRequest: SendMessageRequest = {
              recipient: recipientData,
              templateId: request.templateId,
              templateVariables: recipientData.templateVariables,
              channel: request.channel,
              priority: request.priority,
              context: {
                ...request.context,
                metadata: {
                  ...request.context.metadata,
                  batchId,
                },
              },
              scheduling: request.scheduling,
              options: request.options,
            };

            const response = await this.sendMessage(messageRequest);
            messageIds.push(response.messageId);
          } catch (error) {
            this.logger.warn(
              `Failed to queue message for recipient ${recipientData.identifier}: ${error.message}`,
            );
            // Continue with other recipients
          }
        }

        return {
          batchId,
          messageIds,
          totalMessages: messageIds.length,
          estimatedCompletionTime: this.calculateBulkCompletionTime(
            messageIds.length,
            request.priority,
          ),
        };
      });
    } catch (error) {
      this.logger.error(`Failed to send bulk messages: ${error.message}`, error.stack);
      throw error;
    }
  }

  async processMessage(
    message: Message,
    channel: CommunicationChannel,
  ): Promise<void> {
    this.logger.debug(`Processing message ${message.id} via ${channel.name}`);

    try {
      // Mark as sending
      message.markAsSending();
      await this.unitOfWork.messageRepository.save(message);

      // Find the communication channel implementation
      const channelImpl = this.communicationChannels.find(
        impl => impl.getChannelName().toLowerCase() === channel.name.toLowerCase(),
      );

      if (!channelImpl) {
        throw new Error(`No implementation found for channel: ${channel.name}`);
      }

      // Send the message
      const result = await channelImpl.sendMessage({
        recipient: message.recipient.identifier,
        subject: message.content.subject,
        body: message.content.body,
        attachments: message.content.attachments,
        metadata: {
          messageId: message.id,
          context: message.context.toJSON(),
          priority: message.priority,
        },
      });

      // Handle result
      if (result.success) {
        const deliveryResult = DeliveryResult.success(
          result.messageId || message.id,
          channel.providerId || channel.name,
          new Date(),
          message.retryCount,
        );
        
        message.markAsSent(deliveryResult);
        this.logger.debug(`Message ${message.id} sent successfully`);
      } else {
        const error = this.createErrorFromResult(result);
        const deliveryResult = DeliveryResult.failure(
          error,
          message.retryCount,
        );
        
        message.markAsFailed(deliveryResult);
        
        // Check if retry is needed
        await this.handleRetryLogic(message, error);
      }

      await this.unitOfWork.messageRepository.save(message);
    } catch (error) {
      this.logger.error(
        `Failed to process message ${message.id}: ${error.message}`,
        error.stack,
      );

      const communicationError = this.domainService.createNetworkError(
        error.message,
        { originalError: error.name },
      );
      
      const deliveryResult = DeliveryResult.failure(
        communicationError,
        message.retryCount,
      );
      
      message.markAsFailed(deliveryResult);
      await this.handleRetryLogic(message, communicationError);
      await this.unitOfWork.messageRepository.save(message);
    }
  }

  async processPendingMessages(limit: number = 100): Promise<number> {
    this.logger.debug(`Processing up to ${limit} pending messages`);

    const pendingMessages = await this.unitOfWork.messageRepository.findPendingMessages(
      limit,
      true, // Priority order
    );

    let processedCount = 0;
    const availableChannels = this.getAvailableChannels();

    for (const message of pendingMessages) {
      try {
        // Skip if message is expired
        if (message.isExpired()) {
          message.cancel();
          await this.unitOfWork.messageRepository.save(message);
          continue;
        }

        // Skip if scheduled for later
        if (message.isScheduled()) {
          continue;
        }

        // Select channel for the message
        const selectedChannel = await this.domainService.selectOptimalChannel(
          message.recipient,
          availableChannels,
        );

        await this.processMessage(message, selectedChannel);
        processedCount++;
      } catch (error) {
        this.logger.error(
          `Failed to process pending message ${message.id}: ${error.message}`,
        );
      }
    }

    this.logger.debug(`Processed ${processedCount} messages`);
    return processedCount;
  }

  private async renderTemplate(
    templateId: string,
    variables: Record<string, any>,
  ): Promise<MessageContent> {
    const template = await this.unitOfWork.templateRepository.findById(templateId);
    if (!template) {
      throw new Error(`Template not found: ${templateId}`);
    }

    return template.render(variables);
  }

  private async handleRetryLogic(
    message: Message,
    error: CommunicationError,
  ): Promise<void> {
    if (!message.canBeRetried()) {
      this.logger.debug(`Message ${message.id} cannot be retried`);
      return;
    }

    const retryStrategy = await this.domainService.calculateRetryStrategy(
      error,
      message.retryCount + 1,
    );

    if (retryStrategy.shouldRetry) {
      message.incrementRetryCount();
      message.queue(); // Re-queue for retry
      
      this.logger.debug(
        `Message ${message.id} queued for retry (attempt ${message.retryCount}) ` +
        `with delay ${retryStrategy.delayMs}ms`,
      );
      
      // In a real implementation, you might want to schedule the retry
      // using a job queue or delay mechanism
    }
  }

  private createErrorFromResult(result: any): CommunicationError {
    if (result.error?.code === 'RATE_LIMIT') {
      return this.domainService.createRateLimitError(
        result.error.message,
        result.error.retryAfterMs,
      );
    }
    
    if (result.error?.code === 'AUTHENTICATION') {
      return CommunicationError.authenticationError(
        result.error.message,
        { provider: result.error.provider },
      );
    }
    
    return this.domainService.createProviderError(
      result.error?.message || 'Unknown provider error',
      result.error?.code,
    );
  }

  private getAvailableChannels(): CommunicationChannel[] {
    return this.communicationChannels.map(impl => ({
      name: impl.getChannelName(),
      isActive: impl.isHealthy(),
      priority: impl.getPriority(),
      providerId: impl.getProviderId(),
      supportedRecipientTypes: impl.getSupportedRecipientTypes(),
      rateLimits: impl.getRateLimits(),
    }));
  }

  private calculateEstimatedDeliveryTime(
    channel: CommunicationChannel,
    priority: MessagePriority,
  ): Date {
    let baseDelayMs = 5000; // 5 seconds base
    
    // Adjust based on priority
    switch (priority) {
      case MessagePriority.URGENT:
        baseDelayMs = 1000;
        break;
      case MessagePriority.HIGH:
        baseDelayMs = 2000;
        break;
      case MessagePriority.NORMAL:
        baseDelayMs = 5000;
        break;
      case MessagePriority.LOW:
        baseDelayMs = 10000;
        break;
    }
    
    return new Date(Date.now() + baseDelayMs);
  }

  private calculateBulkCompletionTime(
    messageCount: number,
    priority?: MessagePriority,
  ): Date {
    const baseTimePerMessage = 100; // 100ms per message
    const priorityMultiplier = priority === MessagePriority.URGENT ? 0.5 : 1;
    const totalTimeMs = messageCount * baseTimePerMessage * priorityMultiplier;
    
    return new Date(Date.now() + totalTimeMs);
  }
}