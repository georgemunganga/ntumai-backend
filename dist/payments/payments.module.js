"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentsModule = void 0;
const common_1 = require("@nestjs/common");
const payment_controller_1 = require("./presentation/controllers/payment.controller");
const payment_service_1 = require("./application/services/payment.service");
const payment_repository_interface_1 = require("./domain/repositories/payment.repository.interface");
const in_memory_payment_repository_1 = require("./infrastructure/repositories/in-memory-payment.repository");
const cash_on_delivery_adapter_1 = require("./infrastructure/adapters/cash-on-delivery.adapter");
const pricing_module_1 = require("../pricing/pricing.module");
let PaymentsModule = class PaymentsModule {
};
exports.PaymentsModule = PaymentsModule;
exports.PaymentsModule = PaymentsModule = __decorate([
    (0, common_1.Module)({
        imports: [pricing_module_1.PricingModule],
        controllers: [payment_controller_1.PaymentController],
        providers: [
            payment_service_1.PaymentService,
            cash_on_delivery_adapter_1.CashOnDeliveryAdapter,
            {
                provide: payment_repository_interface_1.PAYMENT_INTENT_REPOSITORY,
                useClass: in_memory_payment_repository_1.InMemoryPaymentIntentRepository,
            },
            {
                provide: payment_repository_interface_1.PAYMENT_SESSION_REPOSITORY,
                useClass: in_memory_payment_repository_1.InMemoryPaymentSessionRepository,
            },
            {
                provide: payment_repository_interface_1.PAYMENT_METHOD_REPOSITORY,
                useClass: in_memory_payment_repository_1.InMemoryPaymentMethodRepository,
            },
        ],
        exports: [payment_service_1.PaymentService],
    })
], PaymentsModule);
//# sourceMappingURL=payments.module.js.map