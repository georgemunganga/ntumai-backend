import { IPaymentIntentRepository, IPaymentSessionRepository, IPaymentMethodRepository } from '../../domain/repositories/payment.repository.interface';
import { PaymentIntent } from '../../domain/entities/payment-intent.entity';
import { PaymentSession, PaymentMethod } from '../../domain/entities/payment-session.entity';
export declare class InMemoryPaymentIntentRepository implements IPaymentIntentRepository {
    private intents;
    create(intent: PaymentIntent): Promise<PaymentIntent>;
    findById(id: string): Promise<PaymentIntent | null>;
    findByClientSecret(clientSecret: string): Promise<PaymentIntent | null>;
    update(id: string, updates: Partial<PaymentIntent>): Promise<PaymentIntent>;
    findByReference(reference: any): Promise<PaymentIntent[]>;
}
export declare class InMemoryPaymentSessionRepository implements IPaymentSessionRepository {
    private sessions;
    create(session: PaymentSession): Promise<PaymentSession>;
    findById(id: string): Promise<PaymentSession | null>;
    findByIntentId(intentId: string): Promise<PaymentSession[]>;
    update(id: string, updates: Partial<PaymentSession>): Promise<PaymentSession>;
}
export declare class InMemoryPaymentMethodRepository implements IPaymentMethodRepository {
    private methods;
    constructor();
    create(method: PaymentMethod): Promise<PaymentMethod>;
    findByKey(methodKey: string): Promise<PaymentMethod | null>;
    findAll(): Promise<PaymentMethod[]>;
    findAvailable(filters?: {
        region?: string;
        currency?: string;
    }): Promise<PaymentMethod[]>;
    update(methodKey: string, updates: Partial<PaymentMethod>): Promise<PaymentMethod>;
    delete(methodKey: string): Promise<void>;
    private seedDefaultMethods;
}
