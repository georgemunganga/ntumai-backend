import { Injectable } from '@nestjs/common';
import {
  IPaymentAdapter,
  ProcessPaymentParams,
  ProcessPaymentResult,
} from './payment-adapter.interface';
import { NextActionType } from '../../domain/entities/payment-session.entity';

/**
 * Mock Mobile Money Adapter (Airtel, MTN, Zamtel)
 * In production, implement actual API integration
 */
@Injectable()
export class MobileMoneyAdapter implements IPaymentAdapter {
  constructor(
    private readonly config: {
      provider: string;
      api_key: string;
      endpoint: string;
    },
  ) {}

  async processPayment(
    params: ProcessPaymentParams,
  ): Promise<ProcessPaymentResult> {
    // Mock implementation - in production, call actual provider API
    const providerRef = `mm_${this.config.provider}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Simulate STK push
    const msisdn = params.method_params.msisdn;
    if (!msisdn) {
      return {
        provider_ref: providerRef,
        status: 'failed',
        error_message: 'Phone number (msisdn) is required',
      };
    }

    // In production:
    // 1. Call provider API to initiate STK push
    // 2. Get transaction reference
    // 3. Return requires_action status

    return {
      provider_ref: providerRef,
      status: 'requires_action',
      next_action: {
        type: NextActionType.STK_PUSH,
        details: {
          msisdn,
          message: `Enter your ${this.config.provider} PIN to complete payment`,
          expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
        },
      },
    };
  }

  async checkStatus(providerRef: string): Promise<{
    status: 'processing' | 'succeeded' | 'failed';
    error_message?: string;
  }> {
    // Mock implementation - in production, query provider API
    // For demo purposes, randomly succeed after "processing"

    // In production:
    // 1. Call provider status API
    // 2. Map provider status to our status
    // 3. Return result

    return {
      status: 'processing',
    };
  }

  async refund(
    providerRef: string,
    amount: number,
    reason: string,
  ): Promise<{
    refund_id: string;
    status: 'pending' | 'succeeded' | 'failed';
    error_message?: string;
  }> {
    // Mock implementation
    const refundId = `rf_${Date.now()}`;

    // In production:
    // 1. Call provider refund API
    // 2. Get refund reference
    // 3. Return status

    return {
      refund_id: refundId,
      status: 'pending',
    };
  }

  verifyWebhook(payload: any, signature: string): boolean {
    // In production:
    // 1. Verify HMAC signature from provider
    // 2. Check timestamp to prevent replay attacks
    // 3. Validate payload structure

    return true; // Mock
  }
}
