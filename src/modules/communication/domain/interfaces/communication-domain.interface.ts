// Domain interfaces following DDD principles

export interface CommunicationChannel {
  readonly name: string;
  readonly isActive: boolean;
  readonly priority: number;
}

export interface MessageRecipient {
  readonly identifier: string; // email or phone number
  readonly type: 'email' | 'phone';
  readonly isValid: boolean;
}

export interface MessageContent {
  readonly subject?: string;
  readonly body: string;
  readonly templateId?: string;
  readonly templateData?: Record<string, any>;
  readonly attachments?: MessageAttachment[];
}

export interface MessageAttachment {
  readonly filename: string;
  readonly content: Buffer | string;
  readonly contentType: string;
  readonly size: number;
}

export interface CommunicationContext {
  readonly userId?: string;
  readonly sessionId?: string;
  readonly requestId: string;
  readonly timestamp: Date;
  readonly metadata?: Record<string, any>;
}

export interface DeliveryResult {
  readonly success: boolean;
  readonly messageId?: string;
  readonly providerId?: string;
  readonly deliveredAt: Date;
  readonly error?: CommunicationError;
  readonly retryCount: number;
}

export interface CommunicationError {
  readonly code: string;
  readonly message: string;
  readonly isRetryable: boolean;
  readonly details?: Record<string, any>;
}

// Domain Services
export interface ICommunicationDomainService {
  validateRecipient(recipient: MessageRecipient): Promise<boolean>;
  selectOptimalChannel(recipient: MessageRecipient, availableChannels: CommunicationChannel[]): Promise<CommunicationChannel>;
  calculateRetryStrategy(error: CommunicationError, attemptCount: number): Promise<{ shouldRetry: boolean; delayMs: number }>;
}

// Repository interfaces
export interface ICommunicationRepository {
  saveDeliveryResult(result: DeliveryResult, context: CommunicationContext): Promise<void>;
  getDeliveryHistory(recipient: MessageRecipient, limit?: number): Promise<DeliveryResult[]>;
  getFailedMessages(retryable: boolean): Promise<Array<{ content: MessageContent; recipient: MessageRecipient; context: CommunicationContext }>>;
}

// Application Service interfaces
export interface IEmailDomainService {
  sendEmail(recipient: MessageRecipient, content: MessageContent, context: CommunicationContext): Promise<DeliveryResult>;
  sendBulkEmails(messages: Array<{ recipient: MessageRecipient; content: MessageContent }>, context: CommunicationContext): Promise<DeliveryResult[]>;
}

export interface ISMSDomainService {
  sendSMS(recipient: MessageRecipient, content: MessageContent, context: CommunicationContext): Promise<DeliveryResult>;
  sendBulkSMS(messages: Array<{ recipient: MessageRecipient; content: MessageContent }>, context: CommunicationContext): Promise<DeliveryResult[]>;
}

export interface IWhatsAppDomainService {
  sendWhatsApp(recipient: MessageRecipient, content: MessageContent, context: CommunicationContext): Promise<DeliveryResult>;
}

// Template management
export interface ITemplateRepository {
  getTemplate(templateId: string, channel: string): Promise<MessageTemplate | null>;
  saveTemplate(template: MessageTemplate): Promise<void>;
  listTemplates(channel?: string): Promise<MessageTemplate[]>;
}

export interface MessageTemplate {
  readonly id: string;
  readonly name: string;
  readonly channel: string;
  readonly subject?: string;
  readonly content: string;
  readonly variables: string[];
  readonly isActive: boolean;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

// Event interfaces for domain events
export interface CommunicationDomainEvent {
  readonly eventId: string;
  readonly eventType: string;
  readonly occurredAt: Date;
  readonly aggregateId: string;
  readonly data: Record<string, any>;
}

export interface MessageSentEvent extends CommunicationDomainEvent {
  readonly eventType: 'MessageSent';
  readonly data: {
    recipient: MessageRecipient;
    channel: string;
    messageId: string;
    deliveredAt: Date;
  };
}

export interface MessageFailedEvent extends CommunicationDomainEvent {
  readonly eventType: 'MessageFailed';
  readonly data: {
    recipient: MessageRecipient;
    channel: string;
    error: CommunicationError;
    retryCount: number;
  };
}