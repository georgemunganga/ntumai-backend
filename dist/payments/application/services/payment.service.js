"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentService = void 0;
const common_1 = require("@nestjs/common");
const nanoid_1 = require("nanoid");
const payment_repository_interface_1 = require("../../domain/repositories/payment.repository.interface");
const payment_intent_entity_1 = require("../../domain/entities/payment-intent.entity");
const payment_session_entity_1 = require("../../domain/entities/payment-session.entity");
const pricing_calculator_service_1 = require("../../../pricing/application/services/pricing-calculator.service");
const cash_on_delivery_adapter_1 = require("../../infrastructure/adapters/cash-on-delivery.adapter");
const mobile_money_adapter_1 = require("../../infrastructure/adapters/mobile-money.adapter");
let PaymentService = class PaymentService {
    intentRepository;
    sessionRepository;
    methodRepository;
    pricingService;
    codAdapter;
    adapters = new Map();
    constructor(intentRepository, sessionRepository, methodRepository, pricingService, codAdapter) {
        this.intentRepository = intentRepository;
        this.sessionRepository = sessionRepository;
        this.methodRepository = methodRepository;
        this.pricingService = pricingService;
        this.codAdapter = codAdapter;
        this.initializeAdapters();
    }
    initializeAdapters() {
        this.adapters.set('cash_on_delivery', this.codAdapter);
        this.adapters.set('mobile_money:airtel_zm', new mobile_money_adapter_1.MobileMoneyAdapter({
            provider: 'airtel',
            api_key: 'mock_key',
            endpoint: 'https://api.airtel.zm',
        }));
        this.adapters.set('mobile_money:mtn_zm', new mobile_money_adapter_1.MobileMoneyAdapter({
            provider: 'mtn',
            api_key: 'mock_key',
            endpoint: 'https://api.mtn.zm',
        }));
    }
    async listAvailableMethods(region, currency) {
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
    async createIntent(dto) {
        if (dto.calc_sig) {
            const expiresAt = new Date(dto.calc_sig.expires_at);
            if (expiresAt < new Date()) {
                throw new common_1.BadRequestException('Pricing signature has expired');
            }
        }
        const intentId = `pay_int_${(0, nanoid_1.nanoid)(16)}`;
        const clientSecret = `pi_cs_${(0, nanoid_1.nanoid)(32)}`;
        const intent = payment_intent_entity_1.PaymentIntent.create({
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
    async confirmIntent(intentId, dto) {
        const intent = await this.intentRepository.findById(intentId);
        if (!intent) {
            throw new common_1.NotFoundException('Payment intent not found');
        }
        if (!intent.canConfirm()) {
            throw new common_1.BadRequestException('Intent cannot be confirmed in current state');
        }
        const method = await this.methodRepository.findByKey(dto.method);
        if (!method || !method.isAvailable()) {
            throw new common_1.BadRequestException('Payment method not available');
        }
        const adapter = this.adapters.get(dto.method);
        if (!adapter) {
            throw new common_1.BadRequestException('Payment adapter not configured');
        }
        intent.selectMethod(dto.method);
        await this.intentRepository.update(intentId, intent);
        const sessionId = `sess_${(0, nanoid_1.nanoid)(12)}`;
        const session = payment_session_entity_1.PaymentSession.create({
            id: sessionId,
            intent_id: intentId,
            method: dto.method,
        });
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
            }
            else if (result.status === 'requires_action') {
                session.next_action = result.next_action || null;
                intent.markRequiresAction();
            }
            else if (result.status === 'processing') {
                session.markProcessing();
                intent.markProcessing();
            }
            else if (result.status === 'failed') {
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
        }
        catch (error) {
            session.markFailed(error.message);
            intent.markFailed();
            await this.sessionRepository.create(session);
            await this.intentRepository.update(intentId, intent);
            throw error;
        }
    }
    async getIntent(intentId) {
        const intent = await this.intentRepository.findById(intentId);
        if (!intent) {
            throw new common_1.NotFoundException('Payment intent not found');
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
    async getSession(sessionId) {
        const session = await this.sessionRepository.findById(sessionId);
        if (!session) {
            throw new common_1.NotFoundException('Payment session not found');
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
    async cancelIntent(intentId) {
        const intent = await this.intentRepository.findById(intentId);
        if (!intent) {
            throw new common_1.NotFoundException('Payment intent not found');
        }
        if (!intent.canCancel()) {
            throw new common_1.BadRequestException('Intent cannot be cancelled in current state');
        }
        intent.markCancelled();
        await this.intentRepository.update(intentId, intent);
        return {
            id: intent.id,
            status: intent.status,
        };
    }
    async collectCash(intentId, dto) {
        const intent = await this.intentRepository.findById(intentId);
        if (!intent) {
            throw new common_1.NotFoundException('Payment intent not found');
        }
        if (intent.selected_method !== 'cash_on_delivery') {
            throw new common_1.BadRequestException('This intent is not cash on delivery');
        }
        if (dto.amount !== intent.amount) {
            throw new common_1.BadRequestException('Collection amount does not match intent amount');
        }
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
    async checkMethodAvailability(methodKey) {
        const method = await this.methodRepository.findByKey(methodKey);
        if (!method) {
            throw new common_1.NotFoundException('Payment method not found');
        }
        return {
            method: method.method,
            available: method.availability.available,
            reason: method.availability.reason,
        };
    }
};
exports.PaymentService = PaymentService;
exports.PaymentService = PaymentService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(payment_repository_interface_1.PAYMENT_INTENT_REPOSITORY)),
    __param(1, (0, common_1.Inject)(payment_repository_interface_1.PAYMENT_SESSION_REPOSITORY)),
    __param(2, (0, common_1.Inject)(payment_repository_interface_1.PAYMENT_METHOD_REPOSITORY)),
    __param(3, (0, common_1.Inject)(pricing_calculator_service_1.PricingCalculatorService)),
    __metadata("design:paramtypes", [Object, Object, Object, pricing_calculator_service_1.PricingCalculatorService,
        cash_on_delivery_adapter_1.CashOnDeliveryAdapter])
], PaymentService);
//# sourceMappingURL=payment.service.js.map