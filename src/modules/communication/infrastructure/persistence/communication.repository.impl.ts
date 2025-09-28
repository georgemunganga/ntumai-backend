import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@common/prisma/prisma.service';
import {
  IMessageRepository,
  ICommunicationTemplateRepository,
  IDeliveryResultRepository,
  ICommunicationUnitOfWork,
  MessageFilter,
  TemplateFilter,
  DeliveryResultFilter,
  SortOptions,
  PaginationOptions,
} from '../../domain/repositories/communication.repository';
import { Message, MessageStatus, MessagePriority } from '../../domain/entities/message.entity';
import { CommunicationTemplate, TemplateType, TemplateCategory } from '../../domain/entities/communication-template.entity';
import { DeliveryResult } from '../../domain/value-objects/delivery-result.vo';
import { MessageRecipient } from '../../domain/value-objects/message-recipient.vo';
import { MessageContent } from '../../domain/value-objects/message-content.vo';
import { CommunicationContext } from '../../domain/value-objects/communication-context.vo';

@Injectable()
export class MessageRepositoryImpl implements IMessageRepository {
  private readonly logger = new Logger(MessageRepositoryImpl.name);

  constructor(private readonly prisma: PrismaService) {}

  async save(message: Message): Promise<Message> {
    try {
      const data = {
        id: message.getId(),
        recipient_type: message.getRecipient().getType(),
        recipient_value: message.getRecipient().getValue(),
        channel: message.getChannel(),
        subject: message.getContent().getSubject(),
        body: message.getContent().getBody(),
        attachments: message.getContent().getAttachments().map(att => ({
          filename: att.filename,
          content: att.content.toString('base64'),
          contentType: att.contentType,
          size: att.size,
        })),
        status: message.getStatus(),
        priority: message.getPriority(),
        retry_count: message.getRetryCount(),
        max_retries: message.getMaxRetries(),
        scheduled_at: message.getScheduledAt(),
        sent_at: message.getSentAt(),
        delivered_at: message.getDeliveredAt(),
        failed_at: message.getFailedAt(),
        context_user_id: message.getContext()?.userId,
        context_session_id: message.getContext()?.sessionId,
        context_request_id: message.getContext()?.requestId,
        context_metadata: message.getContext()?.metadata || {},
        metadata: message.getMetadata(),
        created_at: message.getCreatedAt(),
        updated_at: message.getUpdatedAt(),
      };

      const result = await this.prisma.message.upsert({
        where: { id: message.getId() },
        update: data,
        create: data,
      });

      return this.mapToMessage(result);
    } catch (error) {
      this.logger.error(`Failed to save message ${message.getId()}: ${error.message}`, error.stack);
      throw error;
    }
  }

  async findById(id: string): Promise<Message | null> {
    try {
      const result = await this.prisma.message.findUnique({
        where: { id },
      });

      return result ? this.mapToMessage(result) : null;
    } catch (error) {
      this.logger.error(`Failed to find message ${id}: ${error.message}`, error.stack);
      throw error;
    }
  }

  async findMany(
    filter?: MessageFilter,
    sort?: SortOptions,
    pagination?: PaginationOptions,
  ): Promise<Message[]> {
    try {
      const where = this.buildMessageWhereClause(filter);
      const orderBy = this.buildOrderByClause(sort);
      const skip = pagination?.offset || 0;
      const take = pagination?.limit || 50;

      const results = await this.prisma.message.findMany({
        where,
        orderBy,
        skip,
        take,
      });

      return results.map(result => this.mapToMessage(result));
    } catch (error) {
      this.logger.error(`Failed to find messages: ${error.message}`, error.stack);
      throw error;
    }
  }

  async count(filter?: MessageFilter): Promise<number> {
    try {
      const where = this.buildMessageWhereClause(filter);
      return await this.prisma.message.count({ where });
    } catch (error) {
      this.logger.error(`Failed to count messages: ${error.message}`, error.stack);
      throw error;
    }
  }

  async updateStatus(id: string, status: MessageStatus, metadata?: any): Promise<void> {
    try {
      const updateData: any = {
        status,
        updated_at: new Date(),
      };

      if (status === MessageStatus.SENT) {
        updateData.sent_at = new Date();
      } else if (status === MessageStatus.DELIVERED) {
        updateData.delivered_at = new Date();
      } else if (status === MessageStatus.FAILED) {
        updateData.failed_at = new Date();
      }

      if (metadata) {
        updateData.metadata = metadata;
      }

      await this.prisma.message.update({
        where: { id },
        data: updateData,
      });
    } catch (error) {
      this.logger.error(`Failed to update message status ${id}: ${error.message}`, error.stack);
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await this.prisma.message.delete({
        where: { id },
      });
    } catch (error) {
      this.logger.error(`Failed to delete message ${id}: ${error.message}`, error.stack);
      throw error;
    }
  }

  async findPendingMessages(limit?: number): Promise<Message[]> {
    try {
      const results = await this.prisma.message.findMany({
        where: {
          status: MessageStatus.PENDING,
          OR: [
            { scheduled_at: null },
            { scheduled_at: { lte: new Date() } },
          ],
        },
        orderBy: [
          { priority: 'asc' },
          { created_at: 'asc' },
        ],
        take: limit || 100,
      });

      return results.map(result => this.mapToMessage(result));
    } catch (error) {
      this.logger.error(`Failed to find pending messages: ${error.message}`, error.stack);
      throw error;
    }
  }

  async findFailedMessages(limit?: number): Promise<Message[]> {
    try {
      const results = await this.prisma.message.findMany({
        where: {
          status: MessageStatus.FAILED,
          retry_count: { lt: this.prisma.message.fields.max_retries },
        },
        orderBy: [
          { priority: 'asc' },
          { failed_at: 'asc' },
        ],
        take: limit || 50,
      });

      return results.map(result => this.mapToMessage(result));
    } catch (error) {
      this.logger.error(`Failed to find failed messages: ${error.message}`, error.stack);
      throw error;
    }
  }

  private buildMessageWhereClause(filter?: MessageFilter): any {
    if (!filter) return {};

    const where: any = {};

    if (filter.status) {
      where.status = filter.status;
    }

    if (filter.channel) {
      where.channel = filter.channel;
    }

    if (filter.recipientType) {
      where.recipient_type = filter.recipientType;
    }

    if (filter.priority) {
      where.priority = filter.priority;
    }

    if (filter.userId) {
      where.context_user_id = filter.userId;
    }

    if (filter.createdAfter || filter.createdBefore) {
      where.created_at = {};
      if (filter.createdAfter) {
        where.created_at.gte = filter.createdAfter;
      }
      if (filter.createdBefore) {
        where.created_at.lte = filter.createdBefore;
      }
    }

    return where;
  }

  private buildOrderByClause(sort?: SortOptions): any {
    if (!sort) {
      return [{ created_at: 'desc' }];
    }

    const orderBy: any = {};
    orderBy[sort.field] = sort.direction;
    return [orderBy];
  }

  private mapToMessage(data: any): Message {
    const recipient = MessageRecipient.create(data.recipient_type, data.recipient_value);
    const attachments = (data.attachments || []).map(att => ({
      filename: att.filename,
      content: Buffer.from(att.content, 'base64'),
      contentType: att.contentType,
      size: att.size,
    }));
    const content = MessageContent.create(data.body, data.subject, attachments);
    const context = data.context_user_id ? CommunicationContext.create(
      data.context_user_id,
      data.context_session_id,
      data.context_request_id,
      data.context_metadata,
    ) : undefined;

    const message = Message.create(
      recipient,
      data.channel,
      content,
      data.priority,
      data.scheduled_at,
      context,
      data.metadata,
    );

    // Set internal state
    message['id'] = data.id;
    message['status'] = data.status;
    message['retryCount'] = data.retry_count;
    message['maxRetries'] = data.max_retries;
    message['sentAt'] = data.sent_at;
    message['deliveredAt'] = data.delivered_at;
    message['failedAt'] = data.failed_at;
    message['createdAt'] = data.created_at;
    message['updatedAt'] = data.updated_at;

    return message;
  }
}

@Injectable()
export class CommunicationTemplateRepositoryImpl implements ICommunicationTemplateRepository {
  private readonly logger = new Logger(CommunicationTemplateRepositoryImpl.name);

  constructor(private readonly prisma: PrismaService) {}

  async save(template: CommunicationTemplate): Promise<CommunicationTemplate> {
    try {
      const data = {
        id: template.getId(),
        name: template.getName(),
        type: template.getType(),
        category: template.getCategory(),
        subject: template.getSubject(),
        body: template.getBody(),
        variables: template.getVariables(),
        attachments: template.getAttachments().map(att => ({
          filename: att.filename,
          content: att.content.toString('base64'),
          contentType: att.contentType,
          size: att.size,
        })),
        is_active: template.isActive(),
        is_approved: template.isApproved(),
        version: template.getVersion(),
        metadata: template.getMetadata(),
        created_at: template.getCreatedAt(),
        updated_at: template.getUpdatedAt(),
      };

      const result = await this.prisma.communicationTemplate.upsert({
        where: { id: template.getId() },
        update: data,
        create: data,
      });

      return this.mapToTemplate(result);
    } catch (error) {
      this.logger.error(`Failed to save template ${template.getId()}: ${error.message}`, error.stack);
      throw error;
    }
  }

  async findById(id: string): Promise<CommunicationTemplate | null> {
    try {
      const result = await this.prisma.communicationTemplate.findUnique({
        where: { id },
      });

      return result ? this.mapToTemplate(result) : null;
    } catch (error) {
      this.logger.error(`Failed to find template ${id}: ${error.message}`, error.stack);
      throw error;
    }
  }

  async findByName(name: string): Promise<CommunicationTemplate | null> {
    try {
      const result = await this.prisma.communicationTemplate.findFirst({
        where: { name, is_active: true },
        orderBy: { version: 'desc' },
      });

      return result ? this.mapToTemplate(result) : null;
    } catch (error) {
      this.logger.error(`Failed to find template by name ${name}: ${error.message}`, error.stack);
      throw error;
    }
  }

  async findMany(
    filter?: TemplateFilter,
    sort?: SortOptions,
    pagination?: PaginationOptions,
  ): Promise<CommunicationTemplate[]> {
    try {
      const where = this.buildTemplateWhereClause(filter);
      const orderBy = this.buildOrderByClause(sort);
      const skip = pagination?.offset || 0;
      const take = pagination?.limit || 50;

      const results = await this.prisma.communicationTemplate.findMany({
        where,
        orderBy,
        skip,
        take,
      });

      return results.map(result => this.mapToTemplate(result));
    } catch (error) {
      this.logger.error(`Failed to find templates: ${error.message}`, error.stack);
      throw error;
    }
  }

  async count(filter?: TemplateFilter): Promise<number> {
    try {
      const where = this.buildTemplateWhereClause(filter);
      return await this.prisma.communicationTemplate.count({ where });
    } catch (error) {
      this.logger.error(`Failed to count templates: ${error.message}`, error.stack);
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await this.prisma.communicationTemplate.delete({
        where: { id },
      });
    } catch (error) {
      this.logger.error(`Failed to delete template ${id}: ${error.message}`, error.stack);
      throw error;
    }
  }

  async findActiveTemplates(): Promise<CommunicationTemplate[]> {
    try {
      const results = await this.prisma.communicationTemplate.findMany({
        where: { is_active: true },
        orderBy: [{ name: 'asc' }, { version: 'desc' }],
      });

      return results.map(result => this.mapToTemplate(result));
    } catch (error) {
      this.logger.error(`Failed to find active templates: ${error.message}`, error.stack);
      throw error;
    }
  }

  private buildTemplateWhereClause(filter?: TemplateFilter): any {
    if (!filter) return {};

    const where: any = {};

    if (filter.type) {
      where.type = filter.type;
    }

    if (filter.category) {
      where.category = filter.category;
    }

    if (filter.isActive !== undefined) {
      where.is_active = filter.isActive;
    }

    if (filter.isApproved !== undefined) {
      where.is_approved = filter.isApproved;
    }

    if (filter.name) {
      where.name = { contains: filter.name, mode: 'insensitive' };
    }

    return where;
  }

  private buildOrderByClause(sort?: SortOptions): any {
    if (!sort) {
      return [{ name: 'asc' }, { version: 'desc' }];
    }

    const orderBy: any = {};
    orderBy[sort.field] = sort.direction;
    return [orderBy];
  }

  private mapToTemplate(data: any): CommunicationTemplate {
    const attachments = (data.attachments || []).map(att => ({
      filename: att.filename,
      content: Buffer.from(att.content, 'base64'),
      contentType: att.contentType,
      size: att.size,
    }));

    const template = CommunicationTemplate.create(
      data.name,
      data.type,
      data.category,
      data.subject,
      data.body,
      data.variables,
      attachments,
      data.metadata,
    );

    // Set internal state
    template['id'] = data.id;
    template['isActive'] = data.is_active;
    template['isApproved'] = data.is_approved;
    template['version'] = data.version;
    template['createdAt'] = data.created_at;
    template['updatedAt'] = data.updated_at;

    return template;
  }
}

@Injectable()
export class DeliveryResultRepositoryImpl implements IDeliveryResultRepository {
  private readonly logger = new Logger(DeliveryResultRepositoryImpl.name);

  constructor(private readonly prisma: PrismaService) {}

  async save(result: DeliveryResult): Promise<DeliveryResult> {
    try {
      const data = {
        id: result.getId(),
        message_id: result.getMessageId(),
        provider_id: result.getProviderId(),
        provider_message_id: result.getProviderMessageId(),
        success: result.isSuccess(),
        delivery_timestamp: result.getDeliveryTimestamp(),
        retry_count: result.getRetryCount(),
        error_code: result.getError()?.code,
        error_message: result.getError()?.message,
        error_type: result.getError()?.type,
        error_retry_after_ms: result.getError()?.retryAfterMs,
        metadata: result.getMetadata(),
        created_at: result.getCreatedAt(),
      };

      const dbResult = await this.prisma.deliveryResult.upsert({
        where: { id: result.getId() },
        update: data,
        create: data,
      });

      return this.mapToDeliveryResult(dbResult);
    } catch (error) {
      this.logger.error(`Failed to save delivery result ${result.getId()}: ${error.message}`, error.stack);
      throw error;
    }
  }

  async findById(id: string): Promise<DeliveryResult | null> {
    try {
      const result = await this.prisma.deliveryResult.findUnique({
        where: { id },
      });

      return result ? this.mapToDeliveryResult(result) : null;
    } catch (error) {
      this.logger.error(`Failed to find delivery result ${id}: ${error.message}`, error.stack);
      throw error;
    }
  }

  async findByMessageId(messageId: string): Promise<DeliveryResult[]> {
    try {
      const results = await this.prisma.deliveryResult.findMany({
        where: { message_id: messageId },
        orderBy: { created_at: 'desc' },
      });

      return results.map(result => this.mapToDeliveryResult(result));
    } catch (error) {
      this.logger.error(`Failed to find delivery results for message ${messageId}: ${error.message}`, error.stack);
      throw error;
    }
  }

  async findMany(
    filter?: DeliveryResultFilter,
    sort?: SortOptions,
    pagination?: PaginationOptions,
  ): Promise<DeliveryResult[]> {
    try {
      const where = this.buildDeliveryResultWhereClause(filter);
      const orderBy = this.buildOrderByClause(sort);
      const skip = pagination?.offset || 0;
      const take = pagination?.limit || 50;

      const results = await this.prisma.deliveryResult.findMany({
        where,
        orderBy,
        skip,
        take,
      });

      return results.map(result => this.mapToDeliveryResult(result));
    } catch (error) {
      this.logger.error(`Failed to find delivery results: ${error.message}`, error.stack);
      throw error;
    }
  }

  async count(filter?: DeliveryResultFilter): Promise<number> {
    try {
      const where = this.buildDeliveryResultWhereClause(filter);
      return await this.prisma.deliveryResult.count({ where });
    } catch (error) {
      this.logger.error(`Failed to count delivery results: ${error.message}`, error.stack);
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await this.prisma.deliveryResult.delete({
        where: { id },
      });
    } catch (error) {
      this.logger.error(`Failed to delete delivery result ${id}: ${error.message}`, error.stack);
      throw error;
    }
  }

  private buildDeliveryResultWhereClause(filter?: DeliveryResultFilter): any {
    if (!filter) return {};

    const where: any = {};

    if (filter.messageId) {
      where.message_id = filter.messageId;
    }

    if (filter.providerId) {
      where.provider_id = filter.providerId;
    }

    if (filter.success !== undefined) {
      where.success = filter.success;
    }

    if (filter.errorType) {
      where.error_type = filter.errorType;
    }

    if (filter.deliveredAfter || filter.deliveredBefore) {
      where.delivery_timestamp = {};
      if (filter.deliveredAfter) {
        where.delivery_timestamp.gte = filter.deliveredAfter;
      }
      if (filter.deliveredBefore) {
        where.delivery_timestamp.lte = filter.deliveredBefore;
      }
    }

    return where;
  }

  private buildOrderByClause(sort?: SortOptions): any {
    if (!sort) {
      return [{ created_at: 'desc' }];
    }

    const orderBy: any = {};
    orderBy[sort.field] = sort.direction;
    return [orderBy];
  }

  private mapToDeliveryResult(data: any): DeliveryResult {
    const error = data.error_code ? {
      code: data.error_code,
      message: data.error_message,
      type: data.error_type,
      retryAfterMs: data.error_retry_after_ms,
    } : undefined;

    if (data.success) {
      return DeliveryResult.success(
        data.message_id,
        data.provider_id,
        data.provider_message_id,
        data.delivery_timestamp,
        data.retry_count,
        data.metadata,
      );
    } else {
      return DeliveryResult.failure(
        data.message_id,
        data.provider_id,
        error,
        data.retry_count,
        data.metadata,
      );
    }
  }
}

@Injectable()
export class CommunicationUnitOfWorkImpl implements ICommunicationUnitOfWork {
  private readonly logger = new Logger(CommunicationUnitOfWorkImpl.name);

  constructor(
    private readonly prisma: PrismaService,
    public readonly messages: IMessageRepository,
    public readonly templates: ICommunicationTemplateRepository,
    public readonly deliveryResults: IDeliveryResultRepository,
  ) {}

  async executeTransaction<T>(operation: () => Promise<T>): Promise<T> {
    try {
      return await this.prisma.$transaction(async () => {
        return await operation();
      });
    } catch (error) {
      this.logger.error(`Transaction failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  async commit(): Promise<void> {
    // Prisma handles commits automatically with transactions
    // This method is here for interface compatibility
  }

  async rollback(): Promise<void> {
    // Prisma handles rollbacks automatically with transactions
    // This method is here for interface compatibility
  }
}