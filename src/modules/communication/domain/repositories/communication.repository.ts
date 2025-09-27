import { Message, MessageStatus, MessagePriority } from '../entities/message.entity';
import { CommunicationTemplate, TemplateType, TemplateCategory } from '../entities/communication-template.entity';
import { DeliveryResult } from '../value-objects/delivery-result.vo';
import { MessageRecipient } from '../value-objects/message-recipient.vo';

export interface MessageFilters {
  status?: MessageStatus[];
  priority?: MessagePriority[];
  channel?: string[];
  recipientType?: string;
  recipientIdentifier?: string;
  userId?: string;
  sessionId?: string;
  createdAfter?: Date;
  createdBefore?: Date;
  scheduledAfter?: Date;
  scheduledBefore?: Date;
  tags?: string[];
  category?: string;
}

export interface MessageSortOptions {
  field: 'createdAt' | 'updatedAt' | 'priority' | 'scheduledAt';
  direction: 'asc' | 'desc';
}

export interface PaginationOptions {
  page: number;
  limit: number;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface TemplateFilters {
  type?: TemplateType[];
  category?: TemplateCategory[];
  isActive?: boolean;
  isApproved?: boolean;
  name?: string;
  tags?: string[];
  createdAfter?: Date;
  createdBefore?: Date;
}

export interface MessageRepository {
  /**
   * Save a new message or update an existing one
   */
  save(message: Message): Promise<Message>;

  /**
   * Find a message by its ID
   */
  findById(id: string): Promise<Message | null>;

  /**
   * Find messages with filters, sorting, and pagination
   */
  findMany(
    filters?: MessageFilters,
    sort?: MessageSortOptions,
    pagination?: PaginationOptions,
  ): Promise<PaginatedResult<Message>>;

  /**
   * Find messages that should be processed now
   * (queued, scheduled for now, or failed and ready for retry)
   */
  findPendingMessages(
    limit?: number,
    priorityOrder?: boolean,
  ): Promise<Message[]>;

  /**
   * Find messages by recipient
   */
  findByRecipient(
    recipient: MessageRecipient,
    filters?: Partial<MessageFilters>,
    pagination?: PaginationOptions,
  ): Promise<PaginatedResult<Message>>;

  /**
   * Find messages by context (user, session)
   */
  findByContext(
    userId?: string,
    sessionId?: string,
    filters?: Partial<MessageFilters>,
    pagination?: PaginationOptions,
  ): Promise<PaginatedResult<Message>>;

  /**
   * Update message status
   */
  updateStatus(id: string, status: MessageStatus): Promise<void>;

  /**
   * Add delivery result to message
   */
  addDeliveryResult(id: string, result: DeliveryResult): Promise<void>;

  /**
   * Increment retry count
   */
  incrementRetryCount(id: string): Promise<void>;

  /**
   * Delete a message
   */
  delete(id: string): Promise<void>;

  /**
   * Delete messages older than specified date
   */
  deleteOlderThan(date: Date): Promise<number>;

  /**
   * Get message statistics
   */
  getStatistics(
    filters?: Partial<MessageFilters>,
    groupBy?: 'status' | 'channel' | 'priority' | 'date',
  ): Promise<Record<string, number>>;

  /**
   * Count messages matching filters
   */
  count(filters?: MessageFilters): Promise<number>;

  /**
   * Find messages that need retry
   */
  findMessagesForRetry(
    maxRetryCount?: number,
    olderThanMinutes?: number,
  ): Promise<Message[]>;

  /**
   * Find expired messages that should be cancelled
   */
  findExpiredMessages(): Promise<Message[]>;

  /**
   * Bulk update message statuses
   */
  bulkUpdateStatus(
    messageIds: string[],
    status: MessageStatus,
  ): Promise<void>;
}

export interface TemplateRepository {
  /**
   * Save a new template or update an existing one
   */
  save(template: CommunicationTemplate): Promise<CommunicationTemplate>;

  /**
   * Find a template by its ID
   */
  findById(id: string): Promise<CommunicationTemplate | null>;

  /**
   * Find a template by name and type
   */
  findByName(
    name: string,
    type?: TemplateType,
  ): Promise<CommunicationTemplate | null>;

  /**
   * Find templates with filters, sorting, and pagination
   */
  findMany(
    filters?: TemplateFilters,
    sort?: MessageSortOptions,
    pagination?: PaginationOptions,
  ): Promise<PaginatedResult<CommunicationTemplate>>;

  /**
   * Find active templates by type and category
   */
  findActiveTemplates(
    type?: TemplateType,
    category?: TemplateCategory,
  ): Promise<CommunicationTemplate[]>;

  /**
   * Find templates requiring approval
   */
  findPendingApproval(): Promise<CommunicationTemplate[]>;

  /**
   * Update template status (active/inactive)
   */
  updateStatus(id: string, isActive: boolean): Promise<void>;

  /**
   * Approve template
   */
  approve(id: string, approvedBy: string): Promise<void>;

  /**
   * Delete a template
   */
  delete(id: string): Promise<void>;

  /**
   * Count templates matching filters
   */
  count(filters?: TemplateFilters): Promise<number>;

  /**
   * Find template versions
   */
  findVersions(templateId: string): Promise<CommunicationTemplate[]>;

  /**
   * Create new version of template
   */
  createVersion(
    originalId: string,
    newTemplate: CommunicationTemplate,
  ): Promise<CommunicationTemplate>;
}

export interface DeliveryResultRepository {
  /**
   * Save delivery result
   */
  save(messageId: string, result: DeliveryResult): Promise<void>;

  /**
   * Find delivery results for a message
   */
  findByMessageId(messageId: string): Promise<DeliveryResult[]>;

  /**
   * Find delivery results with filters
   */
  findMany(
    filters: {
      messageIds?: string[];
      success?: boolean;
      providerId?: string;
      errorCode?: string;
      deliveredAfter?: Date;
      deliveredBefore?: Date;
    },
    pagination?: PaginationOptions,
  ): Promise<PaginatedResult<DeliveryResult>>;

  /**
   * Get delivery statistics
   */
  getDeliveryStatistics(
    filters?: {
      channel?: string;
      providerId?: string;
      dateFrom?: Date;
      dateTo?: Date;
    },
  ): Promise<{
    totalSent: number;
    totalDelivered: number;
    totalFailed: number;
    deliveryRate: number;
    averageDeliveryTime: number;
    errorBreakdown: Record<string, number>;
  }>;

  /**
   * Delete old delivery results
   */
  deleteOlderThan(date: Date): Promise<number>;
}

/**
 * Unit of Work pattern for managing transactions across repositories
 */
export interface CommunicationUnitOfWork {
  messageRepository: MessageRepository;
  templateRepository: TemplateRepository;
  deliveryResultRepository: DeliveryResultRepository;

  /**
   * Begin a transaction
   */
  begin(): Promise<void>;

  /**
   * Commit the current transaction
   */
  commit(): Promise<void>;

  /**
   * Rollback the current transaction
   */
  rollback(): Promise<void>;

  /**
   * Execute work within a transaction
   */
  withTransaction<T>(work: () => Promise<T>): Promise<T>;
}