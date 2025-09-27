export enum CommunicationChannel {
  EMAIL = 'email',
  SMS = 'sms',
  WHATSAPP = 'whatsapp',
}

export interface MessageAttachment {
  filename: string;
  content: Buffer | string;
  contentType?: string;
}

export interface MessagePayload {
  userId?: string;
  channel: CommunicationChannel;
  recipient: string;
  subject?: string;
  content: string;
  templateId?: string;
  templateData?: Record<string, any>;
  attachments?: MessageAttachment[];
  mediaUrl?: string;
}

export interface OTPPayload {
  phoneNumber: string;
  code: string;
  expiresAt: Date;
  purpose: 'login' | 'registration' | 'password-reset' | 'verification';
}

export interface EmailPayload {
  to: string;
  subject?: string;
  content: string;
  templateId?: string;
  templateData?: Record<string, any>;
  attachments?: MessageAttachment[];
  from?: string;
  cc?: string[];
  bcc?: string[];
}

export interface SMSPayload {
  phoneNumber: string;
  message: string;
  templateId?: string;
  templateData?: Record<string, any>;
}

export interface WhatsAppPayload {
  phoneNumber: string;
  message: string;
  templateId?: string;
  templateData?: Record<string, any>;
  mediaUrl?: string;
}

export interface CommunicationResult {
  success: boolean;
  messageId: string | null;
  error?: string;
  provider?: string;
  timestamp?: Date;
}

export interface IMessageService {
  sendMessage(payload: MessagePayload, retryAttempts?: number): Promise<CommunicationResult>;
  sendBulkMessages(payloads: MessagePayload[], batchSize?: number): Promise<CommunicationResult[]>;
  getMessageStatus(messageId: string, channel: CommunicationChannel): Promise<any>;
  validateRecipient(recipient: string, channel: CommunicationChannel): Promise<boolean>;
}

export interface IEmailService {
  sendEmail(payload: EmailPayload): Promise<CommunicationResult>;
  sendBulkEmails(payloads: EmailPayload[], batchSize?: number): Promise<CommunicationResult[]>;
  getDeliveryStatus(messageId: string): Promise<any>;
  validateEmailAddress(email: string): Promise<boolean>;
}

export interface ISMSService {
  sendSMS(payload: SMSPayload): Promise<CommunicationResult>;
  sendBulkSMS(payloads: SMSPayload[], batchSize?: number): Promise<CommunicationResult[]>;
  getDeliveryStatus(messageId: string): Promise<any>;
}

export interface IWhatsAppService {
  sendWhatsApp(payload: WhatsAppPayload): Promise<CommunicationResult>;
  sendBulkWhatsApp(payloads: WhatsAppPayload[], batchSize?: number): Promise<CommunicationResult[]>;
  getDeliveryStatus(messageId: string): Promise<any>;
}

export interface IOTPService {
  generateOTP(phoneNumber: string, purpose: OTPPayload['purpose']): Promise<string>;
  validateOTP(phoneNumber: string, code: string, purpose: OTPPayload['purpose']): Promise<boolean>;
  sendOTP(payload: OTPPayload): Promise<CommunicationResult>;
  resendOTP(phoneNumber: string, purpose: OTPPayload['purpose']): Promise<CommunicationResult>;
}

export interface ICommunicationLogger {
  logCommunication(
    userId: string | undefined,
    channel: CommunicationChannel,
    recipient: string,
    success: boolean,
    metadata?: Record<string, any>,
  ): Promise<void>;
  logEmailSent(
    userId: string | undefined,
    recipient: string,
    subject: string,
    success: boolean,
    messageId?: string,
    error?: string,
  ): Promise<void>;
  logSmsSent(
    userId: string | undefined,
    phoneNumber: string,
    success: boolean,
    messageId?: string,
    error?: string,
  ): Promise<void>;
  logWhatsAppSent(
    userId: string | undefined,
    phoneNumber: string,
    success: boolean,
    messageId?: string,
    error?: string,
  ): Promise<void>;
  logTemplateUsage(
    templateId: string,
    channel: CommunicationChannel,
    success: boolean,
    userId?: string,
  ): Promise<void>;
  logBulkCommunication(
    channel: CommunicationChannel,
    totalCount: number,
    successCount: number,
    failureCount: number,
    userId?: string,
  ): Promise<void>;
  getCommunicationLogs(
    userId?: string,
    channel?: CommunicationChannel,
    startDate?: Date,
    endDate?: Date,
    limit?: number,
  ): Promise<any[]>;
  getCommunicationStats(
    startDate: Date,
    endDate: Date,
    channel?: CommunicationChannel,
  ): Promise<{
    totalSent: number;
    successful: number;
    failed: number;
    successRate: number;
    byChannel: Record<string, { sent: number; successful: number; failed: number }>;
  }>;
  cleanupOldLogs(daysToKeep?: number): Promise<void>;
}