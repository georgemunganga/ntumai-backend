import { IPaymentAdapter, ProcessPaymentParams, ProcessPaymentResult } from './payment-adapter.interface';
export declare class CashOnDeliveryAdapter implements IPaymentAdapter {
    processPayment(params: ProcessPaymentParams): Promise<ProcessPaymentResult>;
    checkStatus(providerRef: string): Promise<{
        status: 'processing' | 'succeeded' | 'failed';
        error_message?: string;
    }>;
    collectCash(providerRef: string, collectorId: string, amount: number): Promise<{
        status: 'succeeded' | 'failed';
        error_message?: string;
    }>;
}
