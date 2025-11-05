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
exports.OrderController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const order_service_1 = require("../../application/services/order.service");
const order_dto_1 = require("../../application/dtos/order.dto");
const jwt_auth_guard_1 = require("../../../auth/infrastructure/guards/jwt-auth.guard");
let OrderController = class OrderController {
    orderService;
    constructor(orderService) {
        this.orderService = orderService;
    }
    async getOrders(req, query) {
        return this.orderService.getOrders(req.user.userId, query);
    }
    async getOrderById(req, orderId) {
        return this.orderService.getOrderById(orderId, req.user.userId);
    }
    async getOrderByMarketplaceOrderId(req, marketplaceOrderId) {
        return this.orderService.getOrderByMarketplaceOrderId(marketplaceOrderId, req.user.userId);
    }
    async getOrderByDeliveryId(req, deliveryId) {
        return this.orderService.getOrderByDeliveryId(deliveryId, req.user.userId);
    }
};
exports.OrderController = OrderController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({
        summary: 'Get user order history (marketplace + deliveries)',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Orders retrieved',
        type: order_dto_1.OrdersListResponseDto,
    }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, order_dto_1.GetOrdersQueryDto]),
    __metadata("design:returntype", Promise)
], OrderController.prototype, "getOrders", null);
__decorate([
    (0, common_1.Get)(':orderId'),
    (0, swagger_1.ApiOperation)({ summary: 'Get order by ID' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Order retrieved',
        type: order_dto_1.OrderResponseDto,
    }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('orderId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], OrderController.prototype, "getOrderById", null);
__decorate([
    (0, common_1.Get)('marketplace/:marketplaceOrderId'),
    (0, swagger_1.ApiOperation)({ summary: 'Get order by marketplace order ID' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Order retrieved',
        type: order_dto_1.OrderResponseDto,
    }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('marketplaceOrderId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], OrderController.prototype, "getOrderByMarketplaceOrderId", null);
__decorate([
    (0, common_1.Get)('delivery/:deliveryId'),
    (0, swagger_1.ApiOperation)({ summary: 'Get order by delivery ID' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Order retrieved',
        type: order_dto_1.OrderResponseDto,
    }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('deliveryId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], OrderController.prototype, "getOrderByDeliveryId", null);
exports.OrderController = OrderController = __decorate([
    (0, swagger_1.ApiTags)('Orders'),
    (0, common_1.Controller)('orders'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [order_service_1.OrderService])
], OrderController);
//# sourceMappingURL=order.controller.js.map