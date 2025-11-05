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
exports.RegisterPaymentMethodDto = exports.CreateRefundDto = exports.CollectCashDto = exports.ConfirmPaymentIntentDto = exports.CreatePaymentIntentDto = exports.PaymentMethodType = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
var PaymentMethodType;
(function (PaymentMethodType) {
    PaymentMethodType["CASH_ON_DELIVERY"] = "cash_on_delivery";
    PaymentMethodType["MOBILE_MONEY"] = "mobile_money";
    PaymentMethodType["CARD"] = "card";
    PaymentMethodType["WALLET"] = "wallet";
    PaymentMethodType["BANK_TRANSFER"] = "bank_transfer";
})(PaymentMethodType || (exports.PaymentMethodType = PaymentMethodType = {}));
class CreatePaymentIntentDto {
    amount;
    currency;
    reference;
    calc_sig;
    payer;
    metadata;
}
exports.CreatePaymentIntentDto = CreatePaymentIntentDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Amount in minor units (e.g., ngwee)',
        example: 6692,
    }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], CreatePaymentIntentDto.prototype, "amount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'ZMW' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreatePaymentIntentDto.prototype, "currency", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Reference to delivery or order',
        example: { delivery_id: 'del_8f3a2' },
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], CreatePaymentIntentDto.prototype, "reference", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Pricing calculator signature',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], CreatePaymentIntentDto.prototype, "calc_sig", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Payer information',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], CreatePaymentIntentDto.prototype, "payer", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Additional metadata',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], CreatePaymentIntentDto.prototype, "metadata", void 0);
class ConfirmPaymentIntentDto {
    method;
    method_params;
    return_url;
}
exports.ConfirmPaymentIntentDto = ConfirmPaymentIntentDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Payment method key',
        example: 'mobile_money:airtel_zm',
    }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ConfirmPaymentIntentDto.prototype, "method", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Method-specific parameters',
        example: { msisdn: '+260972827372' },
    }),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], ConfirmPaymentIntentDto.prototype, "method_params", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Return URL for redirect methods',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ConfirmPaymentIntentDto.prototype, "return_url", void 0);
class CollectCashDto {
    collector_user_id;
    amount;
    evidence_photo_id;
}
exports.CollectCashDto = CollectCashDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Rider/collector user ID' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CollectCashDto.prototype, "collector_user_id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Amount collected in minor units' }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], CollectCashDto.prototype, "amount", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Evidence photo attachment ID' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CollectCashDto.prototype, "evidence_photo_id", void 0);
class CreateRefundDto {
    amount;
    reason;
}
exports.CreateRefundDto = CreateRefundDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Refund amount in minor units' }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], CreateRefundDto.prototype, "amount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Refund reason' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateRefundDto.prototype, "reason", void 0);
class RegisterPaymentMethodDto {
    method;
    type;
    display_name;
    regions;
    currency;
    capabilities;
    adapter_config;
    fields;
}
exports.RegisterPaymentMethodDto = RegisterPaymentMethodDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Method key', example: 'mobile_money:airtel_zm' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RegisterPaymentMethodDto.prototype, "method", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: PaymentMethodType }),
    (0, class_validator_1.IsEnum)(PaymentMethodType),
    __metadata("design:type", String)
], RegisterPaymentMethodDto.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Airtel Money' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RegisterPaymentMethodDto.prototype, "display_name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: [String], example: ['ZM-LSK'] }),
    __metadata("design:type", Array)
], RegisterPaymentMethodDto.prototype, "regions", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: [String], example: ['ZMW'] }),
    __metadata("design:type", Array)
], RegisterPaymentMethodDto.prototype, "currency", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Method capabilities',
    }),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], RegisterPaymentMethodDto.prototype, "capabilities", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Adapter configuration (encrypted)',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], RegisterPaymentMethodDto.prototype, "adapter_config", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Fields to collect from user',
    }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], RegisterPaymentMethodDto.prototype, "fields", void 0);
//# sourceMappingURL=payment.dto.js.map