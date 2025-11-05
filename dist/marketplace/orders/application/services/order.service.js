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
exports.OrderService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../../shared/database/prisma.service");
const uuid_1 = require("uuid");
let OrderService = class OrderService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async calculateDelivery(userId, addressId) {
        const address = await this.prisma.address.findFirst({
            where: { id: addressId, userId },
        });
        if (!address) {
            throw new common_1.NotFoundException('Address not found');
        }
        const deliveryFee = 50;
        const estimatedDeliveryTime = new Date(Date.now() + 45 * 60 * 1000);
        return {
            deliveryFee,
            estimatedDeliveryTime,
        };
    }
    async createOrder(userId, addressId, paymentMethod, notes, discountCode, scheduleAt) {
        const cart = await this.prisma.cart.findUnique({
            where: { userId },
            include: {
                CartItem: {
                    include: {
                        Product: true,
                    },
                },
            },
        });
        if (!cart || cart.CartItem.length === 0) {
            throw new common_1.BadRequestException('Cart is empty');
        }
        const address = await this.prisma.address.findFirst({
            where: { id: addressId, userId },
        });
        if (!address) {
            throw new common_1.NotFoundException('Address not found');
        }
        for (const item of cart.CartItem) {
            if (item.Product.stock < item.quantity) {
                throw new common_1.ConflictException(`Insufficient stock for ${item.Product.name}`);
            }
        }
        const subtotal = cart.CartItem.reduce((sum, item) => sum + item.price * item.quantity, 0);
        const discountAmount = cart.discountAmount || 0;
        const deliveryCalc = await this.calculateDelivery(userId, addressId);
        const deliveryFee = deliveryCalc.deliveryFee;
        const tax = subtotal * 0.16;
        const totalAmount = subtotal - discountAmount + deliveryFee + tax;
        const trackingId = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
        const order = await this.prisma.order.create({
            data: {
                id: (0, uuid_1.v4)(),
                trackingId,
                userId,
                addressId,
                status: 'PENDING',
                subtotal,
                discountAmount,
                discountCodeId: cart.discountCodeId,
                deliveryFee,
                tax,
                totalAmount,
                updatedAt: new Date(),
                OrderItem: {
                    create: cart.CartItem.map((item) => ({
                        id: (0, uuid_1.v4)(),
                        productId: item.productId,
                        quantity: item.quantity,
                        price: item.price,
                        updatedAt: new Date(),
                    })),
                },
            },
            include: {
                OrderItem: {
                    include: {
                        Product: {
                            include: {
                                Store: true,
                            },
                        },
                    },
                },
                Address: true,
            },
        });
        for (const item of cart.CartItem) {
            await this.prisma.product.update({
                where: { id: item.productId },
                data: {
                    stock: {
                        decrement: item.quantity,
                    },
                    updatedAt: new Date(),
                },
            });
        }
        await this.prisma.cartItem.deleteMany({
            where: { cartId: cart.id },
        });
        await this.prisma.cart.delete({
            where: { id: cart.id },
        });
        return this.mapOrderToDto(order);
    }
    async processPayment(userId, orderId, paymentDetails) {
        const order = await this.prisma.order.findFirst({
            where: { id: orderId, userId },
        });
        if (!order) {
            throw new common_1.NotFoundException('Order not found');
        }
        if (order.status !== 'PENDING') {
            throw new common_1.ConflictException('Order cannot be paid');
        }
        const payment = await this.prisma.payment.create({
            data: {
                id: (0, uuid_1.v4)(),
                orderId,
                amount: order.totalAmount,
                method: 'CREDIT_CARD',
                status: 'PAID',
                reference: `PAY-${Date.now()}`,
                updatedAt: new Date(),
            },
        });
        await this.prisma.order.update({
            where: { id: orderId },
            data: {
                status: 'ACCEPTED',
                updatedAt: new Date(),
            },
        });
        return {
            paymentId: payment.id,
            status: payment.status,
            reference: payment.reference,
        };
    }
    async getOrder(userId, orderId) {
        const order = await this.prisma.order.findFirst({
            where: { id: orderId, userId },
            include: {
                OrderItem: {
                    include: {
                        Product: {
                            include: {
                                Store: true,
                            },
                        },
                    },
                },
                Address: true,
                Payment: true,
            },
        });
        if (!order) {
            throw new common_1.NotFoundException('Order not found');
        }
        return this.mapOrderToDto(order);
    }
    async getOrders(userId, page = 1, limit = 20, status) {
        const skip = (page - 1) * limit;
        const where = { userId };
        if (status) {
            where.status = status;
        }
        const [orders, total] = await Promise.all([
            this.prisma.order.findMany({
                where,
                include: {
                    OrderItem: {
                        include: {
                            Product: {
                                include: {
                                    Store: true,
                                },
                            },
                        },
                    },
                    Address: true,
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            this.prisma.order.count({ where }),
        ]);
        return {
            orders: orders.map((o) => this.mapOrderToDto(o)),
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
    async cancelOrder(userId, orderId, reason) {
        const order = await this.prisma.order.findFirst({
            where: { id: orderId, userId },
            include: {
                OrderItem: true,
            },
        });
        if (!order) {
            throw new common_1.NotFoundException('Order not found');
        }
        if (['DELIVERED', 'CANCELLED', 'COMPLETED'].includes(order.status)) {
            throw new common_1.ConflictException('Order cannot be cancelled');
        }
        for (const item of order.OrderItem) {
            await this.prisma.product.update({
                where: { id: item.productId },
                data: {
                    stock: {
                        increment: item.quantity,
                    },
                    updatedAt: new Date(),
                },
            });
        }
        await this.prisma.order.update({
            where: { id: orderId },
            data: {
                status: 'CANCELLED',
                updatedAt: new Date(),
            },
        });
        return {
            success: true,
            message: 'Order cancelled successfully',
        };
    }
    async rateOrder(userId, orderId, rating, comment) {
        const order = await this.prisma.order.findFirst({
            where: { id: orderId, userId },
        });
        if (!order) {
            throw new common_1.NotFoundException('Order not found');
        }
        if (order.status !== 'DELIVERED' && order.status !== 'COMPLETED') {
            throw new common_1.ConflictException('Can only rate delivered orders');
        }
        const review = await this.prisma.review.create({
            data: {
                id: (0, uuid_1.v4)(),
                userId,
                entityId: orderId,
                entityType: 'ORDER',
                orderId,
                rating,
                comment,
                updatedAt: new Date(),
            },
        });
        return {
            reviewId: review.id,
            rating: review.rating,
            comment: review.comment,
        };
    }
    async reorder(userId, orderId) {
        const order = await this.prisma.order.findFirst({
            where: { id: orderId, userId },
            include: {
                OrderItem: {
                    include: {
                        Product: true,
                    },
                },
            },
        });
        if (!order) {
            throw new common_1.NotFoundException('Order not found');
        }
        const existingCart = await this.prisma.cart.findUnique({
            where: { userId },
        });
        if (existingCart) {
            await this.prisma.cartItem.deleteMany({
                where: { cartId: existingCart.id },
            });
            await this.prisma.cart.delete({
                where: { id: existingCart.id },
            });
        }
        const firstProduct = order.OrderItem[0].Product;
        const cart = await this.prisma.cart.create({
            data: {
                id: (0, uuid_1.v4)(),
                userId,
                storeId: firstProduct.storeId,
                updatedAt: new Date(),
                CartItem: {
                    create: order.OrderItem.map((item) => ({
                        id: (0, uuid_1.v4)(),
                        productId: item.productId,
                        quantity: item.quantity,
                        price: item.Product.discountedPrice || item.Product.price,
                        updatedAt: new Date(),
                    })),
                },
            },
            include: {
                CartItem: {
                    include: {
                        Product: {
                            include: {
                                Store: true,
                            },
                        },
                    },
                },
            },
        });
        return {
            success: true,
            message: 'Items added to cart',
            cartItemCount: cart.CartItem.length,
        };
    }
    mapOrderToDto(order) {
        return {
            id: order.id,
            trackingId: order.trackingId,
            status: order.status,
            subtotal: order.subtotal,
            discountAmount: order.discountAmount,
            deliveryFee: order.deliveryFee,
            tax: order.tax,
            totalAmount: order.totalAmount,
            items: order.OrderItem?.map((item) => ({
                id: item.id,
                product: {
                    id: item.Product.id,
                    name: item.Product.name,
                    imageUrl: item.Product.imageUrl,
                    store: item.Product.Store,
                },
                quantity: item.quantity,
                price: item.price,
                subtotal: item.price * item.quantity,
            })) || [],
            address: order.Address
                ? {
                    address: order.Address.address,
                    city: order.Address.city,
                    contactName: order.Address.contactName,
                    contactPhone: order.Address.contactPhone,
                }
                : null,
            payments: order.Payment?.map((p) => ({
                id: p.id,
                amount: p.amount,
                method: p.method,
                status: p.status,
                reference: p.reference,
            })) || [],
            createdAt: order.createdAt,
            updatedAt: order.updatedAt,
        };
    }
};
exports.OrderService = OrderService;
exports.OrderService = OrderService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], OrderService);
//# sourceMappingURL=order.service.js.map