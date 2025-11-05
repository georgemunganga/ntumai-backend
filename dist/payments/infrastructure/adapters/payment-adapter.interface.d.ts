import { NextAction } from '../../domain/entities/payment-session.entity';
export interface ProcessPaymentParams {
    amount: number;
    currency: string;
    method_params: Record<string, any>;
    return_url?: string;
    reference?: string;
}
export interface ProcessPaymentResult {
    provider_ref: string;
    status: 'processing' | 'requires_action' | 'succeeded' | 'failed';
    next_action?: NextAction;
    error_message?: string;
}
export interface IPaymentAdapter {
    processPayment(params: ProcessPaymentParams): Promise<ProcessPaymentResult>;
    checkStatus(providerRef: string): Promise<{
        status: 'processing' | 'succeeded' | 'failed';
        error_message?: string;
    }>;
    capture?(providerRef: string, amount: number): Promise<{
        status: 'succeeded' | 'failed';
        error_message?: string;
    }>;
    refund?(providerRef: string, amount: number, reason: string): Promise<{
        refund_id: string;
        status: 'pending' | 'succeeded' | 'failed';
        error_message?: string;
    }>;
    verifyWebhook?(payload: any, signature: string): boolean;
}
export declare const PAYMENT_ADAPTER_REGISTRY: unique symbol;
