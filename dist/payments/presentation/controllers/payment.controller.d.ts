import { PaymentService } from '../../application/services/payment.service';
import { CreatePaymentIntentDto, ConfirmPaymentIntentDto, CollectCashDto } from '../../application/dtos/payment.dto';
export declare class PaymentController {
    private readonly paymentService;
    constructor(paymentService: PaymentService);
    listMethods(region?: string, currency?: string): Promise<any>;
    checkAvailability(method: string): Promise<any>;
    createIntent(dto: CreatePaymentIntentDto): Promise<any>;
    confirmIntent(id: string, dto: ConfirmPaymentIntentDto): Promise<any>;
    getIntent(id: string): Promise<any>;
    getSession(id: string): Promise<any>;
    cancelIntent(id: string): Promise<any>;
    collectCash(id: string, dto: CollectCashDto): Promise<any>;
}
