import { Injectable } from '@nestjs/common';
import {
  IPaymentAdapter,
  ProcessPaymentParams,
  ProcessPaymentResult,
} from './payment-adapter.interface';
import { NextActionType } from '../../domain/entities/payment-session.entity';

@Injectable()
export class CashOnDeliveryAdapter implements IPaymentAdapter {
  async processPayment(
    params: ProcessPaymentParams,
  ): Promise<ProcessPaymentResult> {
    // COD doesn't process immediately, requires rider collection
    return {
      provider_ref: `cod_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      status: 'requires_action',
      next_action: {
        type: NextActionType.NONE,
        details: {
          message: 'Cash will be collected by rider upon delivery',
          amount: params.amount,
          currency: params.currency,
        },
      },
    };
  }

  async checkStatus(providerRef: string): Promise<{
    status: 'processing' | 'succeeded' | 'failed';
    error_message?: string;
  }> {
    // COD status is managed internally, not by external provider
    return {
      status: 'processing',
    };
  }

  /**
   * Mark cash as collected (called by rider)
   */
  async collectCash(
    providerRef: string,
    collectorId: string,
    amount: number,
  ): Promise<{
    status: 'succeeded' | 'failed';
    error_message?: string;
  }> {
    // In real implementation, you'd:
    // 1. Verify collector is assigned rider
    // 2. Log collection event
    // 3. Update accounting records

    return {
      status: 'succeeded',
    };
  }
}
