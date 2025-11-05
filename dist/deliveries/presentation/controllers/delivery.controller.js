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
exports.RiderDeliveryController = exports.DeliveryController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const delivery_service_1 = require("../../application/services/delivery.service");
const create_delivery_dto_1 = require("../../application/dtos/create-delivery.dto");
const jwt_auth_guard_1 = require("../../../auth/infrastructure/guards/jwt-auth.guard");
const public_decorator_1 = require("../../../shared/common/decorators/public.decorator");
let DeliveryController = class DeliveryController {
    deliveryService;
    constructor(deliveryService) {
        this.deliveryService = deliveryService;
    }
    async createDelivery(dto, req) {
        const userId = req.user.userId;
        const userRole = req.user.role || 'customer';
        return this.deliveryService.createDelivery(dto, userId, userRole);
    }
    async attachPricing(id, dto, req) {
        return this.deliveryService.attachPricing(id, dto, req.user.userId);
    }
    async setPaymentMethod(id, dto, req) {
        return this.deliveryService.setPaymentMethod(id, dto, req.user.userId);
    }
    async preflight(id, req) {
        return this.deliveryService.preflight(id, req.user.userId);
    }
    async submitDelivery(id, readyToken, idempotencyKey, req) {
        return this.deliveryService.submitDelivery(id, readyToken, req.user.userId, idempotencyKey);
    }
    async getDelivery(id) {
        return this.deliveryService.getDeliveryById(id);
    }
    async listDeliveries(req, role, page, size) {
        return this.deliveryService.getMyDeliveries(req.user.userId, role || req.user.role || 'customer', page || 1, size || 20);
    }
    async cancelDelivery(id, dto, req) {
        return this.deliveryService.cancelDelivery(id, req.user.userId, dto.reason);
    }
    async getVehicleTypes() {
        return {
            vehicle_types: ['motorbike', 'bicycle', 'walking', 'truck'],
        };
    }
    async getPaymentMethods() {
        return {
            payment_methods: [
                'cash_on_delivery',
                'mobile_money',
                'card',
                'wallet',
                'bank_transfer',
            ],
        };
    }
    async getDeliveryLimits() {
        return this.deliveryService.getConfig();
    }
};
exports.DeliveryController = DeliveryController;
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({
        summary: 'Create Delivery',
        description: 'Create a new delivery order. Works independently or can be linked to marketplace orders via marketplace_order_id.',
    }),
    (0, swagger_1.ApiResponse)({
        status: 201,
        description: 'Delivery created successfully',
    }),
    (0, swagger_1.ApiResponse)({
        status: 400,
        description: 'Invalid request',
    }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_delivery_dto_1.CreateDeliveryDto, Object]),
    __metadata("design:returntype", Promise)
], DeliveryController.prototype, "createDelivery", null);
__decorate([
    (0, common_1.Post)(':id/attach-pricing'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({
        summary: 'Attach Pricing',
        description: 'Attach pricing calculator result with HMAC signature. Verifies signature and TTL.',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Pricing attached successfully',
    }),
    (0, swagger_1.ApiResponse)({
        status: 400,
        description: 'Invalid signature or expired pricing',
    }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_delivery_dto_1.AttachPricingDto, Object]),
    __metadata("design:returntype", Promise)
], DeliveryController.prototype, "attachPricing", null);
__decorate([
    (0, common_1.Post)(':id/set-payment-method'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({
        summary: 'Set Payment Method',
        description: 'Choose payment method for the delivery',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Payment method set successfully',
    }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_delivery_dto_1.SetPaymentMethodDto, Object]),
    __metadata("design:returntype", Promise)
], DeliveryController.prototype, "setPaymentMethod", null);
__decorate([
    (0, common_1.Post)(':id/preflight'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({
        summary: 'Preflight Submit',
        description: 'Verify pricing signature, TTL, and payment availability. Returns short-lived ready_token.',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Preflight successful, ready to submit',
    }),
    (0, swagger_1.ApiResponse)({
        status: 400,
        description: 'Preflight failed - missing pricing or payment method',
    }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], DeliveryController.prototype, "preflight", null);
__decorate([
    (0, common_1.Post)(':id/submit'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({
        summary: 'Submit Delivery',
        description: 'Final submission with ready_token. Triggers dispatch and tracking.',
    }),
    (0, swagger_1.ApiHeader)({
        name: 'X-Ready-Token',
        required: true,
        description: 'Ready token from preflight',
    }),
    (0, swagger_1.ApiHeader)({
        name: 'Idempotency-Key',
        required: false,
        description: 'Optional idempotency key',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Delivery submitted successfully',
    }),
    (0, swagger_1.ApiResponse)({
        status: 400,
        description: 'Invalid or expired ready token',
    }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Headers)('x-ready-token')),
    __param(2, (0, common_1.Headers)('idempotency-key')),
    __param(3, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, Object]),
    __metadata("design:returntype", Promise)
], DeliveryController.prototype, "submitDelivery", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({
        summary: 'Get Delivery',
        description: 'Get delivery details by ID',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Delivery retrieved successfully',
    }),
    (0, swagger_1.ApiResponse)({
        status: 404,
        description: 'Delivery not found',
    }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], DeliveryController.prototype, "getDelivery", null);
__decorate([
    (0, common_1.Get)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({
        summary: 'List Deliveries',
        description: 'Get user deliveries with filters and pagination',
    }),
    (0, swagger_1.ApiQuery)({ name: 'role', required: false, example: 'customer' }),
    (0, swagger_1.ApiQuery)({ name: 'page', required: false, example: 1 }),
    (0, swagger_1.ApiQuery)({ name: 'size', required: false, example: 20 }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Deliveries retrieved successfully',
    }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('role')),
    __param(2, (0, common_1.Query)('page')),
    __param(3, (0, common_1.Query)('size')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Number, Number]),
    __metadata("design:returntype", Promise)
], DeliveryController.prototype, "listDeliveries", null);
__decorate([
    (0, common_1.Post)(':id/cancel'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({
        summary: 'Cancel Delivery',
        description: 'Cancel a delivery with reason',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Delivery cancelled successfully',
    }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_delivery_dto_1.CancelDeliveryDto, Object]),
    __metadata("design:returntype", Promise)
], DeliveryController.prototype, "cancelDelivery", null);
__decorate([
    (0, common_1.Get)('config/vehicle-types'),
    (0, public_decorator_1.Public)(),
    (0, swagger_1.ApiOperation)({
        summary: 'Get Vehicle Types',
        description: 'Get available vehicle types',
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], DeliveryController.prototype, "getVehicleTypes", null);
__decorate([
    (0, common_1.Get)('config/payment-methods'),
    (0, public_decorator_1.Public)(),
    (0, swagger_1.ApiOperation)({
        summary: 'Get Payment Methods',
        description: 'Get available payment methods',
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], DeliveryController.prototype, "getPaymentMethods", null);
__decorate([
    (0, common_1.Get)('config/delivery-limits'),
    (0, public_decorator_1.Public)(),
    (0, swagger_1.ApiOperation)({
        summary: 'Get Delivery Limits',
        description: 'Get delivery configuration and limits',
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], DeliveryController.prototype, "getDeliveryLimits", null);
exports.DeliveryController = DeliveryController = __decorate([
    (0, swagger_1.ApiTags)('Deliveries'),
    (0, common_1.Controller)('deliveries'),
    __metadata("design:paramtypes", [delivery_service_1.DeliveryService])
], DeliveryController);
let RiderDeliveryController = class RiderDeliveryController {
    deliveryService;
    constructor(deliveryService) {
        this.deliveryService = deliveryService;
    }
    async getNearbyDeliveries(lat, lng, radius, vehicleType) {
        return this.deliveryService.getNearbyDeliveries(Number(lat), Number(lng), Number(radius) || 10, vehicleType);
    }
    async acceptDelivery(id, dto, req) {
        return this.deliveryService.acceptDelivery(id, req.user.userId);
    }
    async markAsDelivery(id, req) {
        return this.deliveryService.markAsDelivery(id, req.user.userId);
    }
};
exports.RiderDeliveryController = RiderDeliveryController;
__decorate([
    (0, common_1.Get)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({
        summary: 'Get Nearby Deliveries',
        description: 'Get available deliveries near rider location',
    }),
    (0, swagger_1.ApiQuery)({ name: 'near_lat', required: true, example: -15.41 }),
    (0, swagger_1.ApiQuery)({ name: 'near_lng', required: true, example: 28.28 }),
    (0, swagger_1.ApiQuery)({ name: 'radius_km', required: false, example: 10 }),
    (0, swagger_1.ApiQuery)({ name: 'vehicle_type', required: false, example: 'motorbike' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Nearby deliveries retrieved',
    }),
    __param(0, (0, common_1.Query)('near_lat')),
    __param(1, (0, common_1.Query)('near_lng')),
    __param(2, (0, common_1.Query)('radius_km')),
    __param(3, (0, common_1.Query)('vehicle_type')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, Number, String]),
    __metadata("design:returntype", Promise)
], RiderDeliveryController.prototype, "getNearbyDeliveries", null);
__decorate([
    (0, common_1.Post)(':id/accept'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({
        summary: 'Accept Delivery',
        description: 'Rider accepts a delivery',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Delivery accepted',
    }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_delivery_dto_1.AcceptDeliveryDto, Object]),
    __metadata("design:returntype", Promise)
], RiderDeliveryController.prototype, "acceptDelivery", null);
__decorate([
    (0, common_1.Post)(':id/mark-delivery'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({
        summary: 'Mark as Delivery',
        description: 'Mark order status as delivery (in transit)',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Status updated',
    }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], RiderDeliveryController.prototype, "markAsDelivery", null);
exports.RiderDeliveryController = RiderDeliveryController = __decorate([
    (0, swagger_1.ApiTags)('Deliveries - Rider'),
    (0, common_1.Controller)('rider/deliveries'),
    __metadata("design:paramtypes", [delivery_service_1.DeliveryService])
], RiderDeliveryController);
//# sourceMappingURL=delivery.controller.js.map