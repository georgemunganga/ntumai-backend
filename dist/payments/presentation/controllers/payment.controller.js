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
exports.PaymentController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const payment_service_1 = require("../../application/services/payment.service");
const payment_dto_1 = require("../../application/dtos/payment.dto");
const public_decorator_1 = require("../../../shared/common/decorators/public.decorator");
let PaymentController = class PaymentController {
    paymentService;
    constructor(paymentService) {
        this.paymentService = paymentService;
    }
    async listMethods(region, currency) {
        const methods = await this.paymentService.listAvailableMethods(region, currency);
        return { methods };
    }
    async checkAvailability(method) {
        return this.paymentService.checkMethodAvailability(method);
    }
    async createIntent(dto) {
        return this.paymentService.createIntent(dto);
    }
    async confirmIntent(id, dto) {
        return this.paymentService.confirmIntent(id, dto);
    }
    async getIntent(id) {
        return this.paymentService.getIntent(id);
    }
    async getSession(id) {
        return this.paymentService.getSession(id);
    }
    async cancelIntent(id) {
        return this.paymentService.cancelIntent(id);
    }
    async collectCash(id, dto) {
        return this.paymentService.collectCash(id, dto);
    }
};
exports.PaymentController = PaymentController;
__decorate([
    (0, common_1.Get)('methods'),
    (0, swagger_1.ApiOperation)({
        summary: 'List Available Payment Methods',
        description: 'Get all available payment methods filtered by region and currency. Works independently or with deliveries/marketplace.',
    }),
    (0, swagger_1.ApiQuery)({ name: 'region', required: false, example: 'ZM-LSK' }),
    (0, swagger_1.ApiQuery)({ name: 'currency', required: false, example: 'ZMW' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Payment methods retrieved successfully',
    }),
    __param(0, (0, common_1.Query)('region')),
    __param(1, (0, common_1.Query)('currency')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], PaymentController.prototype, "listMethods", null);
__decorate([
    (0, common_1.Get)('methods/:method/availability'),
    (0, swagger_1.ApiOperation)({
        summary: 'Check Method Availability',
        description: 'Check if a specific payment method is currently available',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Availability status retrieved',
    }),
    __param(0, (0, common_1.Param)('method')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PaymentController.prototype, "checkAvailability", null);
__decorate([
    (0, common_1.Post)('intents'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, swagger_1.ApiOperation)({
        summary: 'Create Payment Intent',
        description: 'Create a payment intent for any amount. Can reference deliveries, marketplace orders, or be standalone.',
    }),
    (0, swagger_1.ApiResponse)({
        status: 201,
        description: 'Payment intent created',
    }),
    (0, swagger_1.ApiResponse)({
        status: 400,
        description: 'Invalid request or expired calc_sig',
    }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [payment_dto_1.CreatePaymentIntentDto]),
    __metadata("design:returntype", Promise)
], PaymentController.prototype, "createIntent", null);
__decorate([
    (0, common_1.Post)('intents/:id/confirm'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({
        summary: 'Confirm Payment Intent',
        description: 'Select payment method and confirm. Creates session and initiates payment flow.',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Payment confirmed, session created',
    }),
    (0, swagger_1.ApiResponse)({
        status: 400,
        description: 'Invalid method or cannot confirm',
    }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, payment_dto_1.ConfirmPaymentIntentDto]),
    __metadata("design:returntype", Promise)
], PaymentController.prototype, "confirmIntent", null);
__decorate([
    (0, common_1.Get)('intents/:id'),
    (0, swagger_1.ApiOperation)({
        summary: 'Get Payment Intent',
        description: 'Get payment intent details with all sessions',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Payment intent retrieved',
    }),
    (0, swagger_1.ApiResponse)({
        status: 404,
        description: 'Payment intent not found',
    }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PaymentController.prototype, "getIntent", null);
__decorate([
    (0, common_1.Get)('sessions/:id'),
    (0, swagger_1.ApiOperation)({
        summary: 'Get Payment Session',
        description: 'Get payment session details including next_action',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Payment session retrieved',
    }),
    (0, swagger_1.ApiResponse)({
        status: 404,
        description: 'Payment session not found',
    }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PaymentController.prototype, "getSession", null);
__decorate([
    (0, common_1.Post)('intents/:id/cancel'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({
        summary: 'Cancel Payment Intent',
        description: 'Cancel a pending payment intent',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Payment intent cancelled',
    }),
    (0, swagger_1.ApiResponse)({
        status: 400,
        description: 'Cannot cancel in current state',
    }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PaymentController.prototype, "cancelIntent", null);
__decorate([
    (0, common_1.Post)('intents/:id/collect-cash'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({
        summary: 'Collect Cash (COD)',
        description: 'Mark cash as collected by rider. Only for cash_on_delivery intents.',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Cash collection recorded',
    }),
    (0, swagger_1.ApiResponse)({
        status: 400,
        description: 'Not a COD intent or amount mismatch',
    }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, payment_dto_1.CollectCashDto]),
    __metadata("design:returntype", Promise)
], PaymentController.prototype, "collectCash", null);
exports.PaymentController = PaymentController = __decorate([
    (0, swagger_1.ApiTags)('Payments'),
    (0, common_1.Controller)('payments'),
    (0, public_decorator_1.Public)(),
    __metadata("design:paramtypes", [payment_service_1.PaymentService])
], PaymentController);
//# sourceMappingURL=payment.controller.js.map