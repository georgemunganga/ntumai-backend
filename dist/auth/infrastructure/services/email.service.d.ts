import { EmailProvider } from '../../../communications/infrastructure/providers/email.provider';
export declare class EmailService {
    private readonly emailProvider;
    private readonly logger;
    constructor(emailProvider: EmailProvider);
    sendOtp(email: string, otp: string): Promise<void>;
    sendPasswordResetOtp(email: string, otp: string): Promise<void>;
}
