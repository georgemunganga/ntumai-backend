declare const _default: () => {
    port: number;
    nodeEnv: string;
    database: {
        url: string;
    };
    jwt: {
        access: {
            secret: string;
            ttl: number;
        };
        refresh: {
            secret: string;
            ttl: number;
        };
        registration: {
            secret: string;
            ttl: number;
        };
    };
    otp: {
        ttl: number;
        resendDelay: number;
        maxAttempts: number;
    };
    smtp: {
        host: string;
        port: number;
        user: string;
        pass: string;
        from: string;
    };
    sms: {
        apiKey: string;
        url: string;
    };
};
export default _default;
