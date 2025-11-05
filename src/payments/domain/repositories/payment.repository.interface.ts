import { PaymentIntent } from '../entities/payment-intent.entity';
import { PaymentSession } from '../entities/payment-session.entity';
import { PaymentMethod } from '../entities/payment-session.entity';

export interface IPaymentIntentRepository {
  create(intent: PaymentIntent): Promise<PaymentIntent>;
  findById(id: string): Promise<PaymentIntent | null>;
  findByClientSecret(clientSecret: string): Promise<PaymentIntent | null>;
  update(id: string, updates: Partial<PaymentIntent>): Promise<PaymentIntent>;
  findByReference(reference: any): Promise<PaymentIntent[]>;
}

export interface IPaymentSessionRepository {
  create(session: PaymentSession): Promise<PaymentSession>;
  findById(id: string): Promise<PaymentSession | null>;
  findByIntentId(intentId: string): Promise<PaymentSession[]>;
  update(id: string, updates: Partial<PaymentSession>): Promise<PaymentSession>;
}

export interface IPaymentMethodRepository {
  create(method: PaymentMethod): Promise<PaymentMethod>;
  findByKey(methodKey: string): Promise<PaymentMethod | null>;
  findAll(): Promise<PaymentMethod[]>;
  findAvailable(filters?: {
    region?: string;
    currency?: string;
  }): Promise<PaymentMethod[]>;
  update(
    methodKey: string,
    updates: Partial<PaymentMethod>,
  ): Promise<PaymentMethod>;
  delete(methodKey: string): Promise<void>;
}

export const PAYMENT_INTENT_REPOSITORY = Symbol('PAYMENT_INTENT_REPOSITORY');
export const PAYMENT_SESSION_REPOSITORY = Symbol('PAYMENT_SESSION_REPOSITORY');
export const PAYMENT_METHOD_REPOSITORY = Symbol('PAYMENT_METHOD_REPOSITORY');
