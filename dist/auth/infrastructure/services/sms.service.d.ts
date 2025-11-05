import { SmsProvider } from '../../../communications/infrastructure/providers/sms.provider';
export declare class SmsService {
    private readonly smsProvider;
    private readonly logger;
    constructor(smsProvider: SmsProvider);
    sendOtp(phone: string, otp: string): Promise<void>;
    sendPasswordResetOtp(phone: string, otp: string): Promise<void>;
}
