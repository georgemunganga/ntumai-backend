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
exports.PrismaOrderRepository = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../shared/database/prisma.service");
const order_entity_1 = require("../../domain/entities/order.entity");
let PrismaOrderRepository = class PrismaOrderRepository {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findByUserId(userId, filters) {
        const page = filters?.page || 1;
        const size = filters?.size || 20;
        const skip = (page - 1) * size;
        const where = { user_id: userId };
        if (filters?.type) {
            where.type = filters.type;
        }
        if (filters?.status) {
            where.status = filters.status;
        }
        const [orders, total] = await Promise.all([
            this.prisma.unifiedOrder.findMany({
                where,
                skip,
                take: size,
                orderBy: { created_at: 'desc' },
            }),
            this.prisma.unifiedOrder.count({ where }),
        ]);
        return {
            orders: orders.map((order) => order_entity_1.Order.fromPersistence(order)),
            total,
        };
    }
    async findById(orderId) {
        const order = await this.prisma.unifiedOrder.findUnique({
            where: { id: orderId },
        });
        if (!order)
            return null;
        return order_entity_1.Order.fromPersistence(order);
    }
    async findByMarketplaceOrderId(marketplaceOrderId) {
        const order = await this.prisma.unifiedOrder.findFirst({
            where: { marketplace_order_id: marketplaceOrderId },
        });
        if (!order)
            return null;
        return order_entity_1.Order.fromPersistence(order);
    }
    async findByDeliveryId(deliveryId) {
        const order = await this.prisma.unifiedOrder.findFirst({
            where: { delivery_id: deliveryId },
        });
        if (!order)
            return null;
        return order_entity_1.Order.fromPersistence(order);
    }
};
exports.PrismaOrderRepository = PrismaOrderRepository;
exports.PrismaOrderRepository = PrismaOrderRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PrismaOrderRepository);
//# sourceMappingURL=prisma-order.repository.js.map