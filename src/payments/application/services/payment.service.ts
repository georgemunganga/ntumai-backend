import {
  Injectable,
  Inject,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { nanoid } from 'nanoid';
import {
  PAYMENT_INTENT_REPOSITORY,
  PAYMENT_SESSION_REPOSITORY,
  PAYMENT_METHOD_REPOSITORY,
} from '../../domain/repositories/payment.repository.interface';
import type {
  IPaymentIntentRepository,
  IPaymentSessionRepository,
  IPaymentMethodRepository,
} from '../../domain/repositories/payment.repository.interface';
import { PaymentIntent } from '../../domain/entities/payment-intent.entity';
import { PaymentSession } from '../../domain/entities/payment-session.entity';
import {
  CreatePaymentIntentDto,
  ConfirmPaymentIntentDto,
  CollectCashDto,
} from '../dtos/payment.dto';
import { PricingCalculatorService } from '../../../pricing/application/services/pricing-calculator.service';
import { CashOnDeliveryAdapter } from '../../infrastructure/adapters/cash-on-delivery.adapter';
import { MobileMoneyAdapter } from '../../infrastructure/adapters/mobile-money.adapter';

@Injectable()
export class PaymentService {
  private adapters: Map<string, any> = new Map();

  constructor(
    @Inject(PAYMENT_INTENT_REPOSITORY)
    private readonly intentRepository: IPaymentIntentRepository,
    @Inject(PAYMENT_SESSION_REPOSITORY)
    private readonly sessionRepository: IPaymentSessionRepository,
    @Inject(PAYMENT_METHOD_REPOSITORY)
    private readonly methodRepository: IPaymentMethodRepository,
    @Inject(PricingCalculatorService)
    private readonly pricingService: PricingCalculatorService,
    private readonly codAdapter: CashOnDeliveryAdapter,
  ) {
    this.initializeAdapters();
  }

  private initializeAdapters(): void {
    // Register COD adapter
    this.adapters.set('cash_on_delivery', this.codAdapter);

    // Register mobile money adapters (mock)
    this.adapters.set(
      'mobile_money:airtel_zm',
      new MobileMoneyAdapter({
        provider: 'airtel',
        api_key: 'mock_key',
        endpoint: 'https://api.airtel.zm',
      }),
    );

    this.adapters.set(
      'mobile_money:mtn_zm',
      new MobileMoneyAdapter({
        provider: 'mtn',
        api_key: 'mock_key',
        endpoint: 'https://api.mtn.zm',
      }),
    );
  }

  /**
   * List available payment methods
   */
  async listAvailableMethods(
    region?: string,
    currency?: string,
  ): Promise<any[]> {
    const methods = await this.methodRepository.findAvailable({
      region,
      currency,
    });

    return methods.map((m) => ({
      method: m.method,
      type: m.type,
      display_name: m.display_name,
      currency: m.currency,
      regions: m.regions,
      capabilities: m.capabilities,
      availability: m.availability,
      fields: m.fields,
    }));
  }

  /**
   * Create payment intent
   */
  async createIntent(dto: CreatePaymentIntentDto): Promise<any> {
    // Verify calc_sig if provided
    if (dto.calc_sig) {
      // In production, verify the signature matches the amount
      // For now, just check expiry
      const expiresAt = new Date(dto.calc_sig.expires_at);
      if (expiresAt < new Date()) {
        throw new BadRequestException('Pricing signature has expired');
      }
    }

    const intentId = `pay_int_${nanoid(16)}`;
    const clientSecret = `pi_cs_${nanoid(32)}`;

    const intent = PaymentIntent.create({
      id: intentId,
      amount: dto.amount,
      currency: dto.currency,
      client_secret: clientSecret,
      reference: dto.reference || {},
      calc_sig: dto.calc_sig,
      payer: dto.payer,
      metadata: dto.metadata,
    });

    await this.intentRepository.create(intent);

    return {
      id: intent.id,
      status: intent.status,
      client_secret: intent.client_secret,
      amount: intent.amount,
      currency: intent.currency,
    };
  }

  /**
   * Confirm payment intent with method
   */
  async confirmIntent(
    intentId: string,
    dto: ConfirmPaymentIntentDto,
  ): Promise<any> {
    const intent = await this.intentRepository.findById(intentId);
    if (!intent) {
      throw new NotFoundException('Payment intent not found');
    }

    if (!intent.canConfirm()) {
      throw new BadRequestException(
        'Intent cannot be confirmed in current state',
      );
    }

    // Check if method is available
    const method = await this.methodRepository.findByKey(dto.method);
    if (!method || !method.isAvailable()) {
      throw new BadRequestException('Payment method not available');
    }

    // Get adapter
    const adapter = this.adapters.get(dto.method);
    if (!adapter) {
      throw new BadRequestException('Payment adapter not configured');
    }

    // Update intent
    intent.selectMethod(dto.method);
    await this.intentRepository.update(intentId, intent);

    // Create session
    const sessionId = `sess_${nanoid(12)}`;
    const session = PaymentSession.create({
      id: sessionId,
      intent_id: intentId,
      method: dto.method,
    });

    // Process payment with adapter
    try {
      const result = await adapter.processPayment({
        amount: intent.amount,
        currency: intent.currency,
        method_params: dto.method_params,
        return_url: dto.return_url,
        reference: intentId,
      });

      session.provider_ref = result.provider_ref;

      if (result.status === 'succeeded') {
        session.markSucceeded();
        intent.markSucceeded();
      } else if (result.status === 'requires_action') {
        session.next_action = result.next_action || null;
        intent.markRequiresAction();
      } else if (result.status === 'processing') {
        session.markProcessing();
        intent.markProcessing();
      } else if (result.status === 'failed') {
        session.markFailed(result.error_message || 'Payment failed');
        intent.markFailed();
      }

      await this.sessionRepository.create(session);
      await this.intentRepository.update(intentId, intent);

      return {
        intent: {
          id: intent.id,
          status: intent.status,
        },
        session: {
          id: session.id,
          status: session.status,
          next_action: session.next_action,
        },
      };
    } catch (error: any) {
      session.markFailed(error.message);
      intent.markFailed();
      await this.sessionRepository.create(session);
      await this.intentRepository.update(intentId, intent);
      throw error;
    }
  }

  /**
   * Get payment intent
   */
  async getIntent(intentId: string): Promise<any> {
    const intent = await this.intentRepository.findById(intentId);
    if (!intent) {
      throw new NotFoundException('Payment intent not found');
    }

    const sessions = await this.sessionRepository.findByIntentId(intentId);

    return {
      id: intent.id,
      status: intent.status,
      amount: intent.amount,
      currency: intent.currency,
      selected_method: intent.selected_method,
      reference: intent.reference,
      payer: intent.payer,
      sessions: sessions.map((s) => ({
        id: s.id,
        status: s.status,
        method: s.method,
        next_action: s.next_action,
        provider_ref: s.provider_ref,
      })),
      created_at: intent.created_at,
      updated_at: intent.updated_at,
    };
  }

  /**
   * Get payment session
   */
  async getSession(sessionId: string): Promise<any> {
    const session = await this.sessionRepository.findById(sessionId);
    if (!session) {
      throw new NotFoundException('Payment session not found');
    }

    return {
      id: session.id,
      intent_id: session.intent_id,
      method: session.method,
      status: session.status,
      next_action: session.next_action,
      provider_ref: session.provider_ref,
      receipt_url: session.receipt_url,
      error_message: session.error_message,
      created_at: session.created_at,
      updated_at: session.updated_at,
    };
  }

  /**
   * Cancel payment intent
   */
  async cancelIntent(intentId: string): Promise<any> {
    const intent = await this.intentRepository.findById(intentId);
    if (!intent) {
      throw new NotFoundException('Payment intent not found');
    }

    if (!intent.canCancel()) {
      throw new BadRequestException(
        'Intent cannot be cancelled in current state',
      );
    }

    intent.markCancelled();
    await this.intentRepository.update(intentId, intent);

    return {
      id: intent.id,
      status: intent.status,
    };
  }

  /**
   * Collect cash (for COD)
   */
  async collectCash(intentId: string, dto: CollectCashDto): Promise<any> {
    const intent = await this.intentRepository.findById(intentId);
    if (!intent) {
      throw new NotFoundException('Payment intent not found');
    }

    if (intent.selected_method !== 'cash_on_delivery') {
      throw new BadRequestException('This intent is not cash on delivery');
    }

    // Verify amount matches
    if (dto.amount !== intent.amount) {
      throw new BadRequestException(
        'Collection amount does not match intent amount',
      );
    }

    // Mark as succeeded
    intent.markSucceeded();
    intent.metadata = {
      ...intent.metadata,
      collected_by: dto.collector_user_id,
      collected_at: new Date().toISOString(),
      evidence_photo_id: dto.evidence_photo_id,
    };

    await this.intentRepository.update(intentId, intent);

    return {
      id: intent.id,
      status: intent.status,
      message: 'Cash collection recorded successfully',
    };
  }

  /**
   * Check method availability
   */
  async checkMethodAvailability(methodKey: string): Promise<any> {
    const method = await this.methodRepository.findByKey(methodKey);
    if (!method) {
      throw new NotFoundException('Payment method not found');
    }

    return {
      method: method.method,
      available: method.availability.available,
      reason: method.availability.reason,
    };
  }
}
