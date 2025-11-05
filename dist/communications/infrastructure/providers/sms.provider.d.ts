import { ConfigService } from '@nestjs/config';
export interface SmsOptions {
    to: string;
    message: string;
}
export declare class SmsProvider {
    private readonly configService;
    private readonly logger;
    constructor(configService: ConfigService);
    sendSms(options: SmsOptions): Promise<boolean>;
    sendOtpSms(phone: string, otp: string): Promise<void>;
    sendPasswordResetSms(phone: string, otp: string): Promise<void>;
    sendDeliveryNotificationSms(phone: string, status: string): Promise<void>;
}
