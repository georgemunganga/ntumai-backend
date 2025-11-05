"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CashOnDeliveryAdapter = void 0;
const common_1 = require("@nestjs/common");
const payment_session_entity_1 = require("../../domain/entities/payment-session.entity");
let CashOnDeliveryAdapter = class CashOnDeliveryAdapter {
    async processPayment(params) {
        return {
            provider_ref: `cod_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            status: 'requires_action',
            next_action: {
                type: payment_session_entity_1.NextActionType.NONE,
                details: {
                    message: 'Cash will be collected by rider upon delivery',
                    amount: params.amount,
                    currency: params.currency,
                },
            },
        };
    }
    async checkStatus(providerRef) {
        return {
            status: 'processing',
        };
    }
    async collectCash(providerRef, collectorId, amount) {
        return {
            status: 'succeeded',
        };
    }
};
exports.CashOnDeliveryAdapter = CashOnDeliveryAdapter;
exports.CashOnDeliveryAdapter = CashOnDeliveryAdapter = __decorate([
    (0, common_1.Injectable)()
], CashOnDeliveryAdapter);
//# sourceMappingURL=cash-on-delivery.adapter.js.map