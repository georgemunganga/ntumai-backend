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
exports.MobileMoneyAdapter = void 0;
const common_1 = require("@nestjs/common");
const payment_session_entity_1 = require("../../domain/entities/payment-session.entity");
let MobileMoneyAdapter = class MobileMoneyAdapter {
    config;
    constructor(config) {
        this.config = config;
    }
    async processPayment(params) {
        const providerRef = `mm_${this.config.provider}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const msisdn = params.method_params.msisdn;
        if (!msisdn) {
            return {
                provider_ref: providerRef,
                status: 'failed',
                error_message: 'Phone number (msisdn) is required',
            };
        }
        return {
            provider_ref: providerRef,
            status: 'requires_action',
            next_action: {
                type: payment_session_entity_1.NextActionType.STK_PUSH,
                details: {
                    msisdn,
                    message: `Enter your ${this.config.provider} PIN to complete payment`,
                    expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
                },
            },
        };
    }
    async checkStatus(providerRef) {
        return {
            status: 'processing',
        };
    }
    async refund(providerRef, amount, reason) {
        const refundId = `rf_${Date.now()}`;
        return {
            refund_id: refundId,
            status: 'pending',
        };
    }
    verifyWebhook(payload, signature) {
        return true;
    }
};
exports.MobileMoneyAdapter = MobileMoneyAdapter;
exports.MobileMoneyAdapter = MobileMoneyAdapter = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [Object])
], MobileMoneyAdapter);
//# sourceMappingURL=mobile-money.adapter.js.map