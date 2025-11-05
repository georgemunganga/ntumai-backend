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
exports.VendorService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../../shared/database/prisma.service");
const uuid_1 = require("uuid");
let VendorService = class VendorService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async createStore(userId, storeData) {
        const existingStore = await this.prisma.store.findFirst({
            where: { vendorId: userId },
        });
        if (existingStore) {
            throw new common_1.ConflictException('User already owns a store');
        }
        const store = await this.prisma.store.create({
            data: {
                id: (0, uuid_1.v4)(),
                vendorId: userId,
                name: storeData.name,
                description: storeData.description,
                imageUrl: storeData.imageUrl,
                isActive: true,
                averageRating: 0,
                updatedAt: new Date(),
            },
        });
        return {
            id: store.id,
            name: store.name,
            description: store.description,
            imageUrl: store.imageUrl,
            isActive: store.isActive,
        };
    }
    async updateStore(userId, storeId, updateData) {
        await this.verifyStoreOwnership(userId, storeId);
        const updated = await this.prisma.store.update({
            where: { id: storeId },
            data: {
                ...updateData,
                updatedAt: new Date(),
            },
        });
        return {
            id: updated.id,
            name: updated.name,
            description: updated.description,
            imageUrl: updated.imageUrl,
            isActive: updated.isActive,
        };
    }
    async pauseStore(userId, storeId, paused) {
        await this.verifyStoreOwnership(userId, storeId);
        await this.prisma.store.update({
            where: { id: storeId },
            data: {
                isActive: !paused,
                updatedAt: new Date(),
            },
        });
        return {
            success: true,
            message: paused ? 'Store paused' : 'Store activated',
        };
    }
    async getStoreAdmin(userId, storeId) {
        const store = await this.verifyStoreOwnership(userId, storeId);
        const [productCount, orderCount] = await Promise.all([
            this.prisma.product.count({ where: { storeId } }),
            this.prisma.order.count({
                where: {
                    OrderItem: {
                        some: {
                            Product: {
                                storeId,
                            },
                        },
                    },
                },
            }),
        ]);
        return {
            id: store.id,
            name: store.name,
            description: store.description,
            imageUrl: store.imageUrl,
            isActive: store.isActive,
            averageRating: store.averageRating,
            productCount,
            orderCount,
            createdAt: store.createdAt,
        };
    }
    async createProduct(userId, storeId, productData) {
        await this.verifyStoreOwnership(userId, storeId);
        const product = await this.prisma.product.create({
            data: {
                id: (0, uuid_1.v4)(),
                storeId,
                name: productData.name,
                description: productData.description,
                price: productData.price,
                discountedPrice: productData.discountedPrice,
                discountPercentage: productData.discountPercentage,
                stock: productData.stock || 0,
                minStock: productData.minStock || 0,
                imageUrl: productData.imageUrl,
                tags: productData.tags || [],
                categoryId: productData.categoryId,
                brandId: productData.brandId,
                isActive: true,
                averageRating: 0,
                reviewCount: 0,
                updatedAt: new Date(),
            },
        });
        if (productData.variants && productData.variants.length > 0) {
            await this.prisma.productVariant.createMany({
                data: productData.variants.map((v) => ({
                    id: (0, uuid_1.v4)(),
                    productId: product.id,
                    name: v.name,
                    value: v.value,
                    price: v.price,
                    stock: v.stock || 0,
                    updatedAt: new Date(),
                })),
            });
        }
        return {
            id: product.id,
            name: product.name,
            price: product.price,
            stock: product.stock,
            isActive: product.isActive,
        };
    }
    async updateProduct(userId, storeId, productId, updateData) {
        await this.verifyProductOwnership(userId, storeId, productId);
        const updated = await this.prisma.product.update({
            where: { id: productId },
            data: {
                ...updateData,
                updatedAt: new Date(),
            },
        });
        return {
            id: updated.id,
            name: updated.name,
            description: updated.description,
            price: updated.price,
            isActive: updated.isActive,
        };
    }
    async updateProductPricing(userId, storeId, productId, pricingData) {
        await this.verifyProductOwnership(userId, storeId, productId);
        const updated = await this.prisma.product.update({
            where: { id: productId },
            data: {
                price: pricingData.price,
                discountedPrice: pricingData.discountedPrice,
                discountPercentage: pricingData.discountPercentage,
                updatedAt: new Date(),
            },
        });
        return {
            id: updated.id,
            price: updated.price,
            discountedPrice: updated.discountedPrice,
            discountPercentage: updated.discountPercentage,
        };
    }
    async updateProductInventory(userId, storeId, productId, inventoryData) {
        await this.verifyProductOwnership(userId, storeId, productId);
        const updated = await this.prisma.product.update({
            where: { id: productId },
            data: {
                stock: inventoryData.stockQuantity,
                minStock: inventoryData.minStock,
                isActive: inventoryData.isInStock !== false,
                updatedAt: new Date(),
            },
        });
        return {
            id: updated.id,
            stock: updated.stock,
            minStock: updated.minStock,
            isActive: updated.isActive,
        };
    }
    async deleteProduct(userId, storeId, productId) {
        await this.verifyProductOwnership(userId, storeId, productId);
        await this.prisma.product.update({
            where: { id: productId },
            data: {
                isActive: false,
                updatedAt: new Date(),
            },
        });
        return {
            success: true,
            message: 'Product deleted successfully',
        };
    }
    async uploadProductMedia(userId, storeId, productId, imageUrl) {
        await this.verifyProductOwnership(userId, storeId, productId);
        await this.prisma.product.update({
            where: { id: productId },
            data: {
                imageUrl,
                updatedAt: new Date(),
            },
        });
        return {
            imageUrl,
        };
    }
    async getStoreOrders(userId, storeId, page = 1, limit = 20, status) {
        await this.verifyStoreOwnership(userId, storeId);
        const skip = (page - 1) * limit;
        const where = {
            OrderItem: {
                some: {
                    Product: {
                        storeId,
                    },
                },
            },
        };
        if (status) {
            where.status = status;
        }
        const [orders, total] = await Promise.all([
            this.prisma.order.findMany({
                where,
                include: {
                    OrderItem: {
                        where: {
                            Product: {
                                storeId,
                            },
                        },
                        include: {
                            Product: true,
                        },
                    },
                    Address: true,
                    User: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            phone: true,
                        },
                    },
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            this.prisma.order.count({ where }),
        ]);
        return {
            orders: orders.map((order) => ({
                id: order.id,
                trackingId: order.trackingId,
                status: order.status,
                totalAmount: order.totalAmount,
                customer: {
                    name: `${order.User.firstName} ${order.User.lastName}`,
                    phone: order.User.phone,
                },
                items: order.OrderItem.map((item) => ({
                    product: item.Product.name,
                    quantity: item.quantity,
                    price: item.price,
                })),
                deliveryAddress: {
                    address: order.Address.address,
                    city: order.Address.city,
                },
                createdAt: order.createdAt,
            })),
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
    async verifyStoreOwnership(userId, storeId) {
        const store = await this.prisma.store.findUnique({
            where: { id: storeId },
        });
        if (!store) {
            throw new common_1.NotFoundException('Store not found');
        }
        if (store.vendorId !== userId) {
            throw new common_1.ForbiddenException('You do not own this store');
        }
        return store;
    }
    async verifyProductOwnership(userId, storeId, productId) {
        await this.verifyStoreOwnership(userId, storeId);
        const product = await this.prisma.product.findUnique({
            where: { id: productId },
        });
        if (!product) {
            throw new common_1.NotFoundException('Product not found');
        }
        if (product.storeId !== storeId) {
            throw new common_1.ForbiddenException('Product does not belong to this store');
        }
        return product;
    }
};
exports.VendorService = VendorService;
exports.VendorService = VendorService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], VendorService);
//# sourceMappingURL=vendor.service.js.map