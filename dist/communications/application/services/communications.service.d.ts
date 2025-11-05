import { EmailProvider } from '../../infrastructure/providers/email.provider';
import { SmsProvider } from '../../infrastructure/providers/sms.provider';
export declare enum CommunicationChannel {
    EMAIL = "email",
    SMS = "sms",
    PUSH = "push",
    IN_APP = "in_app"
}
export interface SendMessageOptions {
    channel: CommunicationChannel;
    recipient: string;
    subject?: string;
    message?: string;
    template?: string;
    context?: Record<string, any>;
}
export declare class CommunicationsService {
    private readonly emailProvider;
    private readonly smsProvider;
    private readonly logger;
    constructor(emailProvider: EmailProvider, smsProvider: SmsProvider);
    sendMessage(options: SendMessageOptions): Promise<boolean>;
    private sendEmailMessage;
    private sendSmsMessage;
    sendOtp(channel: CommunicationChannel, recipient: string, otp: string, purpose?: string): Promise<void>;
    sendWelcome(email: string, firstName: string): Promise<void>;
    sendPasswordReset(channel: CommunicationChannel, recipient: string, otp: string): Promise<void>;
    sendOrderConfirmation(email: string, orderDetails: any): Promise<void>;
    sendDeliveryNotification(channel: CommunicationChannel, recipient: string, deliveryDetails: any): Promise<void>;
    sendMultiChannel(channels: CommunicationChannel[], recipient: string, options: Partial<SendMessageOptions>): Promise<void>;
}
