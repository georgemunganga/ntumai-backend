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
exports.CartService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../../shared/database/prisma.service");
const uuid_1 = require("uuid");
let CartService = class CartService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async addToCart(userId, productId, quantity, variantOptions, note) {
        const product = await this.prisma.product.findUnique({
            where: { id: productId },
            include: { Store: true },
        });
        if (!product || !product.isActive) {
            throw new common_1.NotFoundException('Product not found or inactive');
        }
        if (product.stock < quantity) {
            throw new common_1.ConflictException('Insufficient stock');
        }
        let cart = await this.prisma.cart.findUnique({
            where: { userId },
            include: { CartItem: { include: { Product: true } } },
        });
        if (cart && cart.CartItem.length > 0) {
            const firstItem = cart.CartItem[0];
            if (firstItem.Product.storeId !== product.storeId) {
                throw new common_1.ConflictException('CART/DIFFERENT_STORE');
            }
        }
        if (!cart) {
            cart = await this.prisma.cart.create({
                data: {
                    id: (0, uuid_1.v4)(),
                    userId,
                    storeId: product.storeId,
                    updatedAt: new Date(),
                },
                include: { CartItem: { include: { Product: true } } },
            });
        }
        const existingItem = await this.prisma.cartItem.findUnique({
            where: {
                cartId_productId: {
                    cartId: cart.id,
                    productId,
                },
            },
        });
        if (existingItem) {
            await this.prisma.cartItem.update({
                where: { id: existingItem.id },
                data: {
                    quantity: existingItem.quantity + quantity,
                    price: product.discountedPrice || product.price,
                    variantOptions: variantOptions || existingItem.variantOptions,
                    note,
                    updatedAt: new Date(),
                },
            });
        }
        else {
            await this.prisma.cartItem.create({
                data: {
                    id: (0, uuid_1.v4)(),
                    cartId: cart.id,
                    productId,
                    quantity,
                    price: product.discountedPrice || product.price,
                    variantOptions: variantOptions || null,
                    note,
                    updatedAt: new Date(),
                },
            });
        }
        return this.getCart(userId);
    }
    async updateCartItem(userId, itemId, quantity, note) {
        const item = await this.prisma.cartItem.findUnique({
            where: { id: itemId },
            include: {
                Cart: true,
                Product: true,
            },
        });
        if (!item || item.Cart.userId !== userId) {
            throw new common_1.NotFoundException('Cart item not found');
        }
        if (item.Product.stock < quantity) {
            throw new common_1.ConflictException('Insufficient stock');
        }
        await this.prisma.cartItem.update({
            where: { id: itemId },
            data: {
                quantity,
                note,
                updatedAt: new Date(),
            },
        });
        return this.getCart(userId);
    }
    async removeCartItem(userId, itemId) {
        const item = await this.prisma.cartItem.findUnique({
            where: { id: itemId },
            include: { Cart: true },
        });
        if (!item || item.Cart.userId !== userId) {
            throw new common_1.NotFoundException('Cart item not found');
        }
        await this.prisma.cartItem.delete({
            where: { id: itemId },
        });
        return this.getCart(userId);
    }
    async getCart(userId) {
        const cart = await this.prisma.cart.findUnique({
            where: { userId },
            include: {
                CartItem: {
                    include: {
                        Product: {
                            include: {
                                Store: {
                                    select: { id: true, name: true, imageUrl: true },
                                },
                            },
                        },
                    },
                },
            },
        });
        if (!cart) {
            return {
                items: [],
                subtotal: 0,
                discount: 0,
                deliveryFee: 0,
                tax: 0,
                total: 0,
                itemCount: 0,
            };
        }
        const items = cart.CartItem.map((item) => ({
            id: item.id,
            product: {
                id: item.Product.id,
                name: item.Product.name,
                imageUrl: item.Product.imageUrl,
                price: item.Product.price,
                discountedPrice: item.Product.discountedPrice,
                store: item.Product.Store,
            },
            quantity: item.quantity,
            variantOptions: item.variantOptions,
            note: item.note,
            price: item.price,
            subtotal: item.price * item.quantity,
        }));
        const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
        const discount = cart.discountAmount || 0;
        const deliveryFee = 0;
        const tax = subtotal * 0.16;
        const total = subtotal - discount + deliveryFee + tax;
        return {
            items,
            subtotal,
            discount,
            deliveryFee,
            tax,
            total,
            itemCount: items.length,
        };
    }
    async applyDiscount(userId, discountCode) {
        const cart = await this.prisma.cart.findUnique({
            where: { userId },
        });
        if (!cart) {
            throw new common_1.NotFoundException('Cart not found');
        }
        const discount = await this.prisma.discountCode.findUnique({
            where: { code: discountCode },
        });
        if (!discount || !discount.isActive) {
            throw new common_1.NotFoundException('Invalid or expired discount code');
        }
        if (discount.expiresAt && new Date() > discount.expiresAt) {
            throw new common_1.ConflictException('Discount code has expired');
        }
        const cartData = await this.getCart(userId);
        let discountAmount = 0;
        if (discount.type === 'PERCENTAGE') {
            discountAmount = (cartData.subtotal * discount.value) / 100;
        }
        else {
            discountAmount = discount.value;
        }
        await this.prisma.cart.update({
            where: { id: cart.id },
            data: {
                discountCodeId: discount.id,
                discountAmount,
                updatedAt: new Date(),
            },
        });
        return this.getCart(userId);
    }
    async removeDiscount(userId) {
        const cart = await this.prisma.cart.findUnique({
            where: { userId },
        });
        if (!cart) {
            throw new common_1.NotFoundException('Cart not found');
        }
        await this.prisma.cart.update({
            where: { id: cart.id },
            data: {
                discountCodeId: null,
                discountAmount: 0,
                updatedAt: new Date(),
            },
        });
        return this.getCart(userId);
    }
    async clearCart(userId) {
        const cart = await this.prisma.cart.findUnique({
            where: { userId },
        });
        if (cart) {
            await this.prisma.cartItem.deleteMany({
                where: { cartId: cart.id },
            });
            await this.prisma.cart.delete({
                where: { id: cart.id },
            });
        }
        return { success: true, message: 'Cart cleared' };
    }
    async replaceStore(userId, newStoreId) {
        await this.clearCart(userId);
        await this.prisma.cart.create({
            data: {
                id: (0, uuid_1.v4)(),
                userId,
                storeId: newStoreId,
                updatedAt: new Date(),
            },
        });
        return { success: true, message: 'Cart replaced with new store' };
    }
};
exports.CartService = CartService;
exports.CartService = CartService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], CartService);
//# sourceMappingURL=cart.service.js.map