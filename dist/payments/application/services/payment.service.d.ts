import type { IPaymentIntentRepository, IPaymentSessionRepository, IPaymentMethodRepository } from '../../domain/repositories/payment.repository.interface';
import { CreatePaymentIntentDto, ConfirmPaymentIntentDto, CollectCashDto } from '../dtos/payment.dto';
import { PricingCalculatorService } from '../../../pricing/application/services/pricing-calculator.service';
import { CashOnDeliveryAdapter } from '../../infrastructure/adapters/cash-on-delivery.adapter';
export declare class PaymentService {
    private readonly intentRepository;
    private readonly sessionRepository;
    private readonly methodRepository;
    private readonly pricingService;
    private readonly codAdapter;
    private adapters;
    constructor(intentRepository: IPaymentIntentRepository, sessionRepository: IPaymentSessionRepository, methodRepository: IPaymentMethodRepository, pricingService: PricingCalculatorService, codAdapter: CashOnDeliveryAdapter);
    private initializeAdapters;
    listAvailableMethods(region?: string, currency?: string): Promise<any[]>;
    createIntent(dto: CreatePaymentIntentDto): Promise<any>;
    confirmIntent(intentId: string, dto: ConfirmPaymentIntentDto): Promise<any>;
    getIntent(intentId: string): Promise<any>;
    getSession(sessionId: string): Promise<any>;
    cancelIntent(intentId: string): Promise<any>;
    collectCash(intentId: string, dto: CollectCashDto): Promise<any>;
    checkMethodAvailability(methodKey: string): Promise<any>;
}
