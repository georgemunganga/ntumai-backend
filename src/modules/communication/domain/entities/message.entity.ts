import { MessageRecipient } from '../value-objects/message-recipient.vo';
import { MessageContent } from '../value-objects/message-content.vo';
import { CommunicationContext } from '../value-objects/communication-context.vo';
import { DeliveryResult } from '../value-objects/delivery-result.vo';

export enum MessageStatus {
  DRAFT = 'draft',
  QUEUED = 'queued',
  SENDING = 'sending',
  SENT = 'sent',
  DELIVERED = 'delivered',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

export enum MessagePriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent',
}

export interface MessageMetadata {
  templateId?: string;
  templateVariables?: Record<string, any>;
  scheduledAt?: Date;
  expiresAt?: Date;
  tags?: string[];
  category?: string;
  trackingEnabled?: boolean;
  deliveryReceiptRequested?: boolean;
}

export class Message {
  private constructor(
    public readonly id: string,
    public readonly recipient: MessageRecipient,
    public readonly content: MessageContent,
    public readonly context: CommunicationContext,
    public readonly channel: string,
    public readonly priority: MessagePriority,
    public readonly metadata: MessageMetadata,
    private _status: MessageStatus,
    private _createdAt: Date,
    private _updatedAt: Date,
    private _deliveryResults: DeliveryResult[] = [],
    private _retryCount: number = 0,
  ) {}

  static create(
    id: string,
    recipient: MessageRecipient,
    content: MessageContent,
    context: CommunicationContext,
    channel: string,
    priority: MessagePriority = MessagePriority.NORMAL,
    metadata: MessageMetadata = {},
  ): Message {
    const now = new Date();
    return new Message(
      id,
      recipient,
      content,
      context,
      channel,
      priority,
      metadata,
      MessageStatus.DRAFT,
      now,
      now,
    );
  }

  static fromPersistence(
    id: string,
    recipient: MessageRecipient,
    content: MessageContent,
    context: CommunicationContext,
    channel: string,
    priority: MessagePriority,
    metadata: MessageMetadata,
    status: MessageStatus,
    createdAt: Date,
    updatedAt: Date,
    deliveryResults: DeliveryResult[] = [],
    retryCount: number = 0,
  ): Message {
    return new Message(
      id,
      recipient,
      content,
      context,
      channel,
      priority,
      metadata,
      status,
      createdAt,
      updatedAt,
      deliveryResults,
      retryCount,
    );
  }

  // Getters
  get status(): MessageStatus {
    return this._status;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  get deliveryResults(): DeliveryResult[] {
    return [...this._deliveryResults];
  }

  get retryCount(): number {
    return this._retryCount;
  }

  get latestDeliveryResult(): DeliveryResult | null {
    return this._deliveryResults.length > 0 
      ? this._deliveryResults[this._deliveryResults.length - 1]
      : null;
  }

  // Business methods
  queue(): void {
    this.validateStatusTransition(MessageStatus.QUEUED);
    this._status = MessageStatus.QUEUED;
    this._updatedAt = new Date();
  }

  markAsSending(): void {
    this.validateStatusTransition(MessageStatus.SENDING);
    this._status = MessageStatus.SENDING;
    this._updatedAt = new Date();
  }

  markAsSent(deliveryResult: DeliveryResult): void {
    this.validateStatusTransition(MessageStatus.SENT);
    this._status = MessageStatus.SENT;
    this._deliveryResults.push(deliveryResult);
    this._updatedAt = new Date();
  }

  markAsDelivered(deliveryResult: DeliveryResult): void {
    this.validateStatusTransition(MessageStatus.DELIVERED);
    this._status = MessageStatus.DELIVERED;
    this._deliveryResults.push(deliveryResult);
    this._updatedAt = new Date();
  }

  markAsFailed(deliveryResult: DeliveryResult): void {
    this.validateStatusTransition(MessageStatus.FAILED);
    this._status = MessageStatus.FAILED;
    this._deliveryResults.push(deliveryResult);
    this._updatedAt = new Date();
  }

  cancel(): void {
    this.validateStatusTransition(MessageStatus.CANCELLED);
    this._status = MessageStatus.CANCELLED;
    this._updatedAt = new Date();
  }

  incrementRetryCount(): void {
    this._retryCount++;
    this._updatedAt = new Date();
  }

  // Business rules
  canBeRetried(): boolean {
    return (
      this._status === MessageStatus.FAILED &&
      this._retryCount < this.getMaxRetryCount() &&
      !this.isExpired()
    );
  }

  canBeCancelled(): boolean {
    return [
      MessageStatus.DRAFT,
      MessageStatus.QUEUED,
    ].includes(this._status);
  }

  isExpired(): boolean {
    if (!this.metadata.expiresAt) {
      return false;
    }
    return new Date() > this.metadata.expiresAt;
  }

  isScheduled(): boolean {
    if (!this.metadata.scheduledAt) {
      return false;
    }
    return new Date() < this.metadata.scheduledAt;
  }

  shouldBeProcessedNow(): boolean {
    if (this.isExpired()) {
      return false;
    }
    
    if (this.isScheduled()) {
      return false;
    }

    return [
      MessageStatus.QUEUED,
      MessageStatus.FAILED, // For retry
    ].includes(this._status);
  }

  getProcessingPriority(): number {
    const basePriority = this.getPriorityWeight();
    const agePenalty = this.getAgePenalty();
    const retryBonus = this._retryCount * 10; // Boost retries
    
    return basePriority + agePenalty + retryBonus;
  }

  // Helper methods
  private validateStatusTransition(newStatus: MessageStatus): void {
    const validTransitions = this.getValidTransitions();
    
    if (!validTransitions.includes(newStatus)) {
      throw new Error(
        `Invalid status transition from ${this._status} to ${newStatus}. ` +
        `Valid transitions: ${validTransitions.join(', ')}`
      );
    }
  }

  private getValidTransitions(): MessageStatus[] {
    switch (this._status) {
      case MessageStatus.DRAFT:
        return [MessageStatus.QUEUED, MessageStatus.CANCELLED];
      case MessageStatus.QUEUED:
        return [MessageStatus.SENDING, MessageStatus.CANCELLED];
      case MessageStatus.SENDING:
        return [MessageStatus.SENT, MessageStatus.FAILED];
      case MessageStatus.SENT:
        return [MessageStatus.DELIVERED, MessageStatus.FAILED];
      case MessageStatus.DELIVERED:
        return []; // Terminal state
      case MessageStatus.FAILED:
        return [MessageStatus.QUEUED, MessageStatus.CANCELLED]; // Allow retry
      case MessageStatus.CANCELLED:
        return []; // Terminal state
      default:
        return [];
    }
  }

  private getMaxRetryCount(): number {
    switch (this.priority) {
      case MessagePriority.URGENT:
        return 5;
      case MessagePriority.HIGH:
        return 4;
      case MessagePriority.NORMAL:
        return 3;
      case MessagePriority.LOW:
        return 2;
      default:
        return 3;
    }
  }

  private getPriorityWeight(): number {
    switch (this.priority) {
      case MessagePriority.URGENT:
        return 1000;
      case MessagePriority.HIGH:
        return 100;
      case MessagePriority.NORMAL:
        return 10;
      case MessagePriority.LOW:
        return 1;
      default:
        return 10;
    }
  }

  private getAgePenalty(): number {
    const ageInMinutes = (Date.now() - this._createdAt.getTime()) / (1000 * 60);
    return Math.floor(ageInMinutes); // Older messages get higher priority
  }

  // Serialization
  toJSON() {
    return {
      id: this.id,
      recipient: this.recipient.toJSON(),
      content: this.content.toJSON(),
      context: this.context.toJSON(),
      channel: this.channel,
      priority: this.priority,
      metadata: this.metadata,
      status: this._status,
      createdAt: this._createdAt.toISOString(),
      updatedAt: this._updatedAt.toISOString(),
      deliveryResults: this._deliveryResults.map(result => result.toJSON()),
      retryCount: this._retryCount,
    };
  }
}