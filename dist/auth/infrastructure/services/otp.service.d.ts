import { ConfigService } from '@nestjs/config';
import { OtpCode } from '../../domain/value-objects/otp-code.vo';
import { EmailService } from './email.service';
import { SmsService } from './sms.service';
export declare class OtpService {
    private readonly configService;
    private readonly emailService;
    private readonly smsService;
    private readonly logger;
    constructor(configService: ConfigService, emailService: EmailService, smsService: SmsService);
    generateOtp(): OtpCode;
    sendOtpViaEmail(email: string, otp: OtpCode): Promise<void>;
    sendOtpViaSms(phone: string, otp: OtpCode): Promise<void>;
    getOtpTtl(): number;
    getOtpResendDelay(): number;
    getOtpMaxAttempts(): number;
    calculateExpiryDate(): Date;
    calculateResendDate(): Date;
}
