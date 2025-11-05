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
exports.OrderService = void 0;
const common_1 = require("@nestjs/common");
const order_repository_interface_1 = require("../../domain/repositories/order.repository.interface");
let OrderService = class OrderService {
    orderRepository;
    constructor(orderRepository) {
        this.orderRepository = orderRepository;
    }
    async getOrders(userId, query) {
        const page = query.page || 1;
        const size = query.size || 20;
        const { orders, total } = await this.orderRepository.findByUserId(userId, {
            type: query.type,
            status: query.status,
            page,
            size,
        });
        const totalPages = Math.ceil(total / size);
        return {
            orders: orders.map((order) => this.toResponseDto(order)),
            total,
            page,
            size,
            total_pages: totalPages,
        };
    }
    async getOrderById(orderId, userId) {
        const order = await this.orderRepository.findById(orderId);
        if (!order) {
            throw new common_1.NotFoundException('Order not found');
        }
        if (order.user_id !== userId) {
            throw new common_1.NotFoundException('Order not found');
        }
        return this.toResponseDto(order);
    }
    async getOrderByMarketplaceOrderId(marketplaceOrderId, userId) {
        const order = await this.orderRepository.findByMarketplaceOrderId(marketplaceOrderId);
        if (!order) {
            throw new common_1.NotFoundException('Order not found');
        }
        if (order.user_id !== userId) {
            throw new common_1.NotFoundException('Order not found');
        }
        return this.toResponseDto(order);
    }
    async getOrderByDeliveryId(deliveryId, userId) {
        const order = await this.orderRepository.findByDeliveryId(deliveryId);
        if (!order) {
            throw new common_1.NotFoundException('Order not found');
        }
        if (order.user_id !== userId) {
            throw new common_1.NotFoundException('Order not found');
        }
        return this.toResponseDto(order);
    }
    toResponseDto(order) {
        const data = order.toJSON();
        return {
            id: data.id,
            user_id: data.user_id,
            type: data.type,
            status: data.status,
            marketplace_order_id: data.marketplace_order_id,
            delivery_id: data.delivery_id,
            booking_id: data.booking_id,
            total_amount: data.total_amount,
            currency: data.currency,
            items_summary: data.items_summary,
            delivery_address: data.delivery_address,
            created_at: data.created_at.toISOString(),
            updated_at: data.updated_at.toISOString(),
            completed_at: data.completed_at?.toISOString() || null,
        };
    }
};
exports.OrderService = OrderService;
exports.OrderService = OrderService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(order_repository_interface_1.ORDER_REPOSITORY)),
    __metadata("design:paramtypes", [Object])
], OrderService);
//# sourceMappingURL=order.service.js.map