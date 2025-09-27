export interface MessagePayload {
  to: string;
  subject?: string;
  content: string;
  templateId?: string;
  templateData?: Record<string, any>;
}

export interface OTPPayload {
  phoneNumber: string;
  code: string;
  expiresAt: Date;
  purpose: 'login' | 'registration' | 'password-reset' | 'verification';
}

export interface EmailPayload extends MessagePayload {
  from?: string;
  cc?: string[];
  bcc?: string[];
  attachments?: Array<{
    filename: string;
    content: Buffer | string;
    contentType?: string;
  }>;
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
  messageId?: string;
  error?: string;
  provider?: string;
  timestamp: Date;
}

export interface IMessageService {
  sendMessage(payload: MessagePayload): Promise<CommunicationResult>;
}

export interface IEmailService extends IMessageService {
  sendEmail(payload: EmailPayload): Promise<CommunicationResult>;
  sendBulkEmails(payloads: EmailPayload[]): Promise<CommunicationResult[]>;
}

export interface ISMSService extends IMessageService {
  sendSMS(payload: SMSPayload): Promise<CommunicationResult>;
  sendBulkSMS(payloads: SMSPayload[]): Promise<CommunicationResult[]>;
}

export interface IWhatsAppService extends IMessageService {
  sendWhatsApp(payload: WhatsAppPayload): Promise<CommunicationResult>;
}

export interface IOTPService {
  generateOTP(phoneNumber: string, purpose: OTPPayload['purpose']): Promise<string>;
  validateOTP(phoneNumber: string, code: string, purpose: OTPPayload['purpose']): Promise<boolean>;
  sendOTP(payload: OTPPayload): Promise<CommunicationResult>;
  resendOTP(phoneNumber: string, purpose: OTPPayload['purpose']): Promise<CommunicationResult>;
}

export interface ICommunicationLogger {
  logMessage(type: string, payload: any, result: CommunicationResult): Promise<void>;
  getMessageHistory(phoneNumber?: string, email?: string): Promise<any[]>;
}