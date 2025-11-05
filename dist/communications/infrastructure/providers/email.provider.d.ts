import { ConfigService } from '@nestjs/config';
export interface EmailOptions {
    to: string | string[];
    subject: string;
    template?: string;
    context?: Record<string, any>;
    html?: string;
    text?: string;
    from?: string;
}
export declare class EmailProvider {
    private readonly configService;
    private readonly logger;
    private transporter;
    private templatesCache;
    constructor(configService: ConfigService);
    private initializeTransporter;
    private getTemplate;
    sendEmail(options: EmailOptions): Promise<boolean>;
    sendOtpEmail(email: string, otp: string, purpose?: string): Promise<void>;
    sendWelcomeEmail(email: string, firstName: string): Promise<void>;
    sendPasswordResetEmail(email: string, otp: string): Promise<void>;
    sendOrderConfirmationEmail(email: string, orderDetails: any): Promise<void>;
    sendDeliveryNotificationEmail(email: string, deliveryDetails: any): Promise<void>;
}
