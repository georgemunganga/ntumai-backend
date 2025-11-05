import {
  PaymentSession,
  NextAction,
} from '../../domain/entities/payment-session.entity';

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
  /**
   * Process a payment with the provider
   */
  processPayment(params: ProcessPaymentParams): Promise<ProcessPaymentResult>;

  /**
   * Check payment status with provider
   */
  checkStatus(providerRef: string): Promise<{
    status: 'processing' | 'succeeded' | 'failed';
    error_message?: string;
  }>;

  /**
   * Capture a payment (for two-step methods)
   */
  capture?(
    providerRef: string,
    amount: number,
  ): Promise<{
    status: 'succeeded' | 'failed';
    error_message?: string;
  }>;

  /**
   * Refund a payment
   */
  refund?(
    providerRef: string,
    amount: number,
    reason: string,
  ): Promise<{
    refund_id: string;
    status: 'pending' | 'succeeded' | 'failed';
    error_message?: string;
  }>;

  /**
   * Verify webhook signature
   */
  verifyWebhook?(payload: any, signature: string): boolean;
}

export const PAYMENT_ADAPTER_REGISTRY = Symbol('PAYMENT_ADAPTER_REGISTRY');
