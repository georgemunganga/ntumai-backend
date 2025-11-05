"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = () => ({
    port: parseInt(process.env.PORT || '3000', 10),
    nodeEnv: process.env.NODE_ENV || 'development',
    database: {
        url: process.env.DATABASE_URL || '',
    },
    jwt: {
        access: {
            secret: process.env.JWT_ACCESS_SECRET ||
                'default-access-secret-change-in-production',
            ttl: parseInt(process.env.JWT_ACCESS_TTL || '3600', 10),
        },
        refresh: {
            secret: process.env.JWT_REFRESH_SECRET ||
                'default-refresh-secret-change-in-production',
            ttl: parseInt(process.env.JWT_REFRESH_TTL || '604800', 10),
        },
        registration: {
            secret: process.env.JWT_REGISTRATION_SECRET ||
                'default-registration-secret-change-in-production',
            ttl: parseInt(process.env.JWT_REGISTRATION_TTL || '600', 10),
        },
    },
    otp: {
        ttl: parseInt(process.env.OTP_TTL_SEC || '600', 10),
        resendDelay: parseInt(process.env.OTP_RESEND_DELAY_SEC || '60', 10),
        maxAttempts: parseInt(process.env.OTP_MAX_ATTEMPTS || '5', 10),
    },
    smtp: {
        host: process.env.SMTP_HOST || 'localhost',
        port: parseInt(process.env.SMTP_PORT || '587', 10),
        user: process.env.SMTP_USER || '',
        pass: process.env.SMTP_PASS || '',
        from: process.env.SMTP_FROM || 'noreply@ntumai.com',
    },
    sms: {
        apiKey: process.env.SMS_PROVIDER_API_KEY || '',
        url: process.env.SMS_PROVIDER_URL || '',
    },
});
//# sourceMappingURL=configuration.js.map