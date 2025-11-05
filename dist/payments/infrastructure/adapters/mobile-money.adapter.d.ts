import { IPaymentAdapter, ProcessPaymentParams, ProcessPaymentResult } from './payment-adapter.interface';
export declare class MobileMoneyAdapter implements IPaymentAdapter {
    private readonly config;
    constructor(config: {
        provider: string;
        api_key: string;
        endpoint: string;
    });
    processPayment(params: ProcessPaymentParams): Promise<ProcessPaymentResult>;
    checkStatus(providerRef: string): Promise<{
        status: 'processing' | 'succeeded' | 'failed';
        error_message?: string;
    }>;
    refund(providerRef: string, amount: number, reason: string): Promise<{
        refund_id: string;
        status: 'pending' | 'succeeded' | 'failed';
        error_message?: string;
    }>;
    verifyWebhook(payload: any, signature: string): boolean;
}
