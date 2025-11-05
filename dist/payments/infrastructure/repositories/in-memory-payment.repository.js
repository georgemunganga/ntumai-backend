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
Object.defineProperty(exports, "__esModule", { value: true });
exports.InMemoryPaymentMethodRepository = exports.InMemoryPaymentSessionRepository = exports.InMemoryPaymentIntentRepository = void 0;
const common_1 = require("@nestjs/common");
const payment_session_entity_1 = require("../../domain/entities/payment-session.entity");
let InMemoryPaymentIntentRepository = class InMemoryPaymentIntentRepository {
    intents = new Map();
    async create(intent) {
        this.intents.set(intent.id, intent);
        return intent;
    }
    async findById(id) {
        return this.intents.get(id) || null;
    }
    async findByClientSecret(clientSecret) {
        return (Array.from(this.intents.values()).find((i) => i.client_secret === clientSecret) || null);
    }
    async update(id, updates) {
        const existing = this.intents.get(id);
        if (!existing) {
            throw new Error('Payment intent not found');
        }
        const updated = Object.assign(Object.create(Object.getPrototypeOf(existing)), existing, updates, { updated_at: new Date() });
        this.intents.set(id, updated);
        return updated;
    }
    async findByReference(reference) {
        return Array.from(this.intents.values()).filter((intent) => {
            if (reference.delivery_id &&
                intent.reference.delivery_id === reference.delivery_id) {
                return true;
            }
            if (reference.marketplace_order_id &&
                intent.reference.marketplace_order_id === reference.marketplace_order_id) {
                return true;
            }
            return false;
        });
    }
};
exports.InMemoryPaymentIntentRepository = InMemoryPaymentIntentRepository;
exports.InMemoryPaymentIntentRepository = InMemoryPaymentIntentRepository = __decorate([
    (0, common_1.Injectable)()
], InMemoryPaymentIntentRepository);
let InMemoryPaymentSessionRepository = class InMemoryPaymentSessionRepository {
    sessions = new Map();
    async create(session) {
        this.sessions.set(session.id, session);
        return session;
    }
    async findById(id) {
        return this.sessions.get(id) || null;
    }
    async findByIntentId(intentId) {
        return Array.from(this.sessions.values()).filter((s) => s.intent_id === intentId);
    }
    async update(id, updates) {
        const existing = this.sessions.get(id);
        if (!existing) {
            throw new Error('Payment session not found');
        }
        const updated = Object.assign(Object.create(Object.getPrototypeOf(existing)), existing, updates, { updated_at: new Date() });
        this.sessions.set(id, updated);
        return updated;
    }
};
exports.InMemoryPaymentSessionRepository = InMemoryPaymentSessionRepository;
exports.InMemoryPaymentSessionRepository = InMemoryPaymentSessionRepository = __decorate([
    (0, common_1.Injectable)()
], InMemoryPaymentSessionRepository);
let InMemoryPaymentMethodRepository = class InMemoryPaymentMethodRepository {
    methods = new Map();
    constructor() {
        this.seedDefaultMethods();
    }
    async create(method) {
        this.methods.set(method.method, method);
        return method;
    }
    async findByKey(methodKey) {
        return this.methods.get(methodKey) || null;
    }
    async findAll() {
        return Array.from(this.methods.values());
    }
    async findAvailable(filters) {
        let results = Array.from(this.methods.values()).filter((m) => m.isAvailable());
        if (filters?.region) {
            results = results.filter((m) => m.supportsRegion(filters.region));
        }
        if (filters?.currency) {
            results = results.filter((m) => m.supportsCurrency(filters.currency));
        }
        return results;
    }
    async update(methodKey, updates) {
        const existing = this.methods.get(methodKey);
        if (!existing) {
            throw new Error('Payment method not found');
        }
        const updated = Object.assign(Object.create(Object.getPrototypeOf(existing)), existing, updates, { updated_at: new Date() });
        this.methods.set(methodKey, updated);
        return updated;
    }
    async delete(methodKey) {
        this.methods.delete(methodKey);
    }
    seedDefaultMethods() {
        const cod = payment_session_entity_1.PaymentMethod.create({
            method: 'cash_on_delivery',
            type: payment_session_entity_1.PaymentMethodType.CASH_ON_DELIVERY,
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
        const airtel = payment_session_entity_1.PaymentMethod.create({
            method: 'mobile_money:airtel_zm',
            type: payment_session_entity_1.PaymentMethodType.MOBILE_MONEY,
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
        const mtn = payment_session_entity_1.PaymentMethod.create({
            method: 'mobile_money:mtn_zm',
            type: payment_session_entity_1.PaymentMethodType.MOBILE_MONEY,
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
        const wallet = payment_session_entity_1.PaymentMethod.create({
            method: 'wallet',
            type: payment_session_entity_1.PaymentMethodType.WALLET,
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
};
exports.InMemoryPaymentMethodRepository = InMemoryPaymentMethodRepository;
exports.InMemoryPaymentMethodRepository = InMemoryPaymentMethodRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], InMemoryPaymentMethodRepository);
//# sourceMappingURL=in-memory-payment.repository.js.map