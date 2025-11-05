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
exports.PricingController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const pricing_calculator_service_1 = require("../../application/services/pricing-calculator.service");
const calculate_price_dto_1 = require("../../application/dtos/calculate-price.dto");
const public_decorator_1 = require("../../../shared/common/decorators/public.decorator");
let PricingController = class PricingController {
    pricingCalculatorService;
    constructor(pricingCalculatorService) {
        this.pricingCalculatorService = pricingCalculatorService;
    }
    async calculatePrice(dto) {
        return this.pricingCalculatorService.calculatePrice(dto);
    }
    async getRateTable(region, vehicle_type) {
        return this.pricingCalculatorService.getRateTable(region, vehicle_type);
    }
    async health() {
        return { status: 'ok' };
    }
    async availability() {
        return { available: true };
    }
};
exports.PricingController = PricingController;
__decorate([
    (0, common_1.Post)('price'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({
        summary: 'Calculate Price',
        description: 'Stateless price calculation with HMAC signature. Returns a signed fare breakdown.',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Price calculated successfully',
        type: calculate_price_dto_1.CalculatePriceResponseDto,
    }),
    (0, swagger_1.ApiResponse)({
        status: 400,
        description: 'Invalid request - validation errors',
    }),
    (0, swagger_1.ApiResponse)({
        status: 404,
        description: 'Rate table not found for region/vehicle combination',
    }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [calculate_price_dto_1.CalculatePriceDto]),
    __metadata("design:returntype", Promise)
], PricingController.prototype, "calculatePrice", null);
__decorate([
    (0, common_1.Get)('config/rates'),
    (0, swagger_1.ApiOperation)({
        summary: 'Get Rate Table',
        description: 'Retrieve rate configuration for a specific region and vehicle type',
    }),
    (0, swagger_1.ApiQuery)({ name: 'region', example: 'ZM-LSK' }),
    (0, swagger_1.ApiQuery)({ name: 'vehicle_type', example: 'motorbike' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Rate table retrieved successfully',
    }),
    (0, swagger_1.ApiResponse)({
        status: 404,
        description: 'Rate table not found',
    }),
    __param(0, (0, common_1.Query)('region')),
    __param(1, (0, common_1.Query)('vehicle_type')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], PricingController.prototype, "getRateTable", null);
__decorate([
    (0, common_1.Get)('health'),
    (0, swagger_1.ApiOperation)({
        summary: 'Health Check',
        description: 'Check if the pricing calculator service is available',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Service is healthy',
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], PricingController.prototype, "health", null);
__decorate([
    (0, common_1.Get)('availability'),
    (0, swagger_1.ApiOperation)({
        summary: 'Availability Check',
        description: 'Check if the pricing calculator is available for calculations',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Service is available',
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], PricingController.prototype, "availability", null);
exports.PricingController = PricingController = __decorate([
    (0, swagger_1.ApiTags)('Pricing Calculator'),
    (0, common_1.Controller)('calc'),
    (0, public_decorator_1.Public)(),
    __metadata("design:paramtypes", [pricing_calculator_service_1.PricingCalculatorService])
], PricingController);
//# sourceMappingURL=pricing.controller.js.map