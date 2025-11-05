import { Injectable } from '@nestjs/common';
import {
  IPaymentIntentRepository,
  IPaymentSessionRepository,
  IPaymentMethodRepository,
} from '../../domain/repositories/payment.repository.interface';
import { PaymentIntent } from '../../domain/entities/payment-intent.entity';
import {
  PaymentSession,
  PaymentMethod,
  PaymentMethodType,
} from '../../domain/entities/payment-session.entity';

@Injectable()
export class InMemoryPaymentIntentRepository
  implements IPaymentIntentRepository
{
  private intents: Map<string, PaymentIntent> = new Map();

  async create(intent: PaymentIntent): Promise<PaymentIntent> {
    this.intents.set(intent.id, intent);
    return intent;
  }

  async findById(id: string): Promise<PaymentIntent | null> {
    return this.intents.get(id) || null;
  }

  async findByClientSecret(
    clientSecret: string,
  ): Promise<PaymentIntent | null> {
    return (
      Array.from(this.intents.values()).find(
        (i) => i.client_secret === clientSecret,
      ) || null
    );
  }

  async update(
    id: string,
    updates: Partial<PaymentIntent>,
  ): Promise<PaymentIntent> {
    const existing = this.intents.get(id);
    if (!existing) {
      throw new Error('Payment intent not found');
    }

    const updated = Object.assign(
      Object.create(Object.getPrototypeOf(existing)),
      existing,
      updates,
      { updated_at: new Date() },
    );

    this.intents.set(id, updated);
    return updated;
  }

  async findByReference(reference: any): Promise<PaymentIntent[]> {
    return Array.from(this.intents.values()).filter((intent) => {
      if (
        reference.delivery_id &&
        intent.reference.delivery_id === reference.delivery_id
      ) {
        return true;
      }
      if (
        reference.marketplace_order_id &&
        intent.reference.marketplace_order_id === reference.marketplace_order_id
      ) {
        return true;
      }
      return false;
    });
  }
}

@Injectable()
export class InMemoryPaymentSessionRepository
  implements IPaymentSessionRepository
{
  private sessions: Map<string, PaymentSession> = new Map();

  async create(session: PaymentSession): Promise<PaymentSession> {
    this.sessions.set(session.id, session);
    return session;
  }

  async findById(id: string): Promise<PaymentSession | null> {
    return this.sessions.get(id) || null;
  }

  async findByIntentId(intentId: string): Promise<PaymentSession[]> {
    return Array.from(this.sessions.values()).filter(
      (s) => s.intent_id === intentId,
    );
  }

  async update(
    id: string,
    updates: Partial<PaymentSession>,
  ): Promise<PaymentSession> {
    const existing = this.sessions.get(id);
    if (!existing) {
      throw new Error('Payment session not found');
    }

    const updated = Object.assign(
      Object.create(Object.getPrototypeOf(existing)),
      existing,
      updates,
      { updated_at: new Date() },
    );

    this.sessions.set(id, updated);
    return updated;
  }
}

@Injectable()
export class InMemoryPaymentMethodRepository
  implements IPaymentMethodRepository
{
  private methods: Map<string, PaymentMethod> = new Map();

  constructor() {
    this.seedDefaultMethods();
  }

  async create(method: PaymentMethod): Promise<PaymentMethod> {
    this.methods.set(method.method, method);
    return method;
  }

  async findByKey(methodKey: string): Promise<PaymentMethod | null> {
    return this.methods.get(methodKey) || null;
  }

  async findAll(): Promise<PaymentMethod[]> {
    return Array.from(this.methods.values());
  }

  async findAvailable(filters?: {
    region?: string;
    currency?: string;
  }): Promise<PaymentMethod[]> {
    let results = Array.from(this.methods.values()).filter((m) =>
      m.isAvailable(),
    );

    if (filters?.region) {
      results = results.filter((m) => m.supportsRegion(filters.region!));
    }

    if (filters?.currency) {
      results = results.filter((m) => m.supportsCurrency(filters.currency!));
    }

    return results;
  }

  async update(
    methodKey: string,
    updates: Partial<PaymentMethod>,
  ): Promise<PaymentMethod> {
    const existing = this.methods.get(methodKey);
    if (!existing) {
      throw new Error('Payment method not found');
    }

    const updated = Object.assign(
      Object.create(Object.getPrototypeOf(existing)),
      existing,
      updates,
      { updated_at: new Date() },
    );

    this.methods.set(methodKey, updated);
    return updated;
  }

  async delete(methodKey: string): Promise<void> {
    this.methods.delete(methodKey);
  }

  private seedDefaultMethods(): void {
    // Cash on Delivery
    const cod = PaymentMethod.create({
      method: 'cash_on_delivery',
      type: PaymentMethodType.CASH_ON_DELIVERY,
      display_name: 'Cash on Delivery',
      currency: ['ZMW', 'USD'],
      regions: ['ZM-LSK', 'ZM-COP', 'ZM-NDO'],
      capabilities: {
        capture: false,
        refund: false,
        partial_refund: false,
        requires_redirect: false,
        stk_push: false,
        qr: false,
        three_ds: false,
      },
      fields: [],
    });

    // Airtel Money
    const airtel = PaymentMethod.create({
      method: 'mobile_money:airtel_zm',
      type: PaymentMethodType.MOBILE_MONEY,
      display_name: 'Airtel Money',
      currency: ['ZMW'],
      regions: ['ZM-LSK', 'ZM-COP', 'ZM-NDO'],
      capabilities: {
        capture: false,
        refund: true,
        partial_refund: true,
        requires_redirect: false,
        stk_push: true,
        qr: false,
        three_ds: false,
      },
      fields: [
        {
          name: 'msisdn',
          label: 'Phone Number',
          type: 'string',
          required: true,
          placeholder: '+260972827372',
        },
      ],
    });

    // MTN Mobile Money
    const mtn = PaymentMethod.create({
      method: 'mobile_money:mtn_zm',
      type: PaymentMethodType.MOBILE_MONEY,
      display_name: 'MTN Mobile Money',
      currency: ['ZMW'],
      regions: ['ZM-LSK', 'ZM-COP', 'ZM-NDO'],
      capabilities: {
        capture: false,
        refund: true,
        partial_refund: true,
        requires_redirect: false,
        stk_push: true,
        qr: false,
        three_ds: false,
      },
      fields: [
        {
          name: 'msisdn',
          label: 'Phone Number',
          type: 'string',
          required: true,
          placeholder: '+260962827372',
        },
      ],
    });

    // Wallet
    const wallet = PaymentMethod.create({
      method: 'wallet',
      type: PaymentMethodType.WALLET,
      display_name: 'Wallet Balance',
      currency: ['ZMW', 'USD'],
      regions: ['ZM-LSK', 'ZM-COP', 'ZM-NDO'],
      capabilities: {
        capture: false,
        refund: true,
        partial_refund: true,
        requires_redirect: false,
        stk_push: false,
        qr: false,
        three_ds: false,
      },
      fields: [],
    });

    this.methods.set(cod.method, cod);
    this.methods.set(airtel.method, airtel);
    this.methods.set(mtn.method, mtn);
    this.methods.set(wallet.method, wallet);
  }
}
