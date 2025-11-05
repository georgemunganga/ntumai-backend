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
exports.ReviewService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../../shared/database/prisma.service");
const uuid_1 = require("uuid");
let ReviewService = class ReviewService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async createProductReview(userId, productId, rating, comment, images) {
        const product = await this.prisma.product.findUnique({
            where: { id: productId },
        });
        if (!product) {
            throw new common_1.NotFoundException('Product not found');
        }
        const existingReview = await this.prisma.review.findFirst({
            where: {
                userId,
                productId,
                entityType: 'PRODUCT',
            },
        });
        if (existingReview) {
            throw new common_1.ConflictException('You have already reviewed this product');
        }
        const review = await this.prisma.review.create({
            data: {
                id: (0, uuid_1.v4)(),
                userId,
                entityId: productId,
                entityType: 'PRODUCT',
                productId,
                rating,
                comment,
                images: images || [],
                updatedAt: new Date(),
            },
            include: {
                User_Review_userIdToUser: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        profileImage: true,
                    },
                },
            },
        });
        await this.updateProductRating(productId);
        return this.mapReviewToDto(review);
    }
    async getProductReviews(productId, page = 1, limit = 20) {
        const skip = (page - 1) * limit;
        const [reviews, total] = await Promise.all([
            this.prisma.review.findMany({
                where: {
                    productId,
                    entityType: 'PRODUCT',
                },
                include: {
                    User_Review_userIdToUser: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            profileImage: true,
                        },
                    },
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            this.prisma.review.count({
                where: {
                    productId,
                    entityType: 'PRODUCT',
                },
            }),
        ]);
        return {
            reviews: reviews.map((r) => this.mapReviewToDto(r)),
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
    async createStoreReview(userId, storeId, rating, comment) {
        const store = await this.prisma.store.findUnique({
            where: { id: storeId },
        });
        if (!store) {
            throw new common_1.NotFoundException('Store not found');
        }
        const existingReview = await this.prisma.review.findFirst({
            where: {
                userId,
                storeId,
                entityType: 'STORE',
            },
        });
        if (existingReview) {
            throw new common_1.ConflictException('You have already reviewed this store');
        }
        const review = await this.prisma.review.create({
            data: {
                id: (0, uuid_1.v4)(),
                userId,
                entityId: storeId,
                entityType: 'STORE',
                storeId,
                rating,
                comment,
                updatedAt: new Date(),
            },
            include: {
                User_Review_userIdToUser: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        profileImage: true,
                    },
                },
            },
        });
        await this.updateStoreRating(storeId);
        return this.mapReviewToDto(review);
    }
    async getStoreReviews(storeId, page = 1, limit = 20) {
        const skip = (page - 1) * limit;
        const [reviews, total] = await Promise.all([
            this.prisma.review.findMany({
                where: {
                    storeId,
                    entityType: 'STORE',
                },
                include: {
                    User_Review_userIdToUser: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            profileImage: true,
                        },
                    },
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            this.prisma.review.count({
                where: {
                    storeId,
                    entityType: 'STORE',
                },
            }),
        ]);
        return {
            reviews: reviews.map((r) => this.mapReviewToDto(r)),
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
    async toggleFavorite(userId, productId) {
        const product = await this.prisma.product.findUnique({
            where: { id: productId },
        });
        if (!product) {
            throw new common_1.NotFoundException('Product not found');
        }
        const existing = await this.prisma.favorite.findUnique({
            where: {
                userId_productId: {
                    userId,
                    productId,
                },
            },
        });
        if (existing) {
            await this.prisma.favorite.delete({
                where: { id: existing.id },
            });
            return {
                isFavorite: false,
                message: 'Removed from favorites',
            };
        }
        else {
            await this.prisma.favorite.create({
                data: {
                    id: (0, uuid_1.v4)(),
                    userId,
                    productId,
                },
            });
            return {
                isFavorite: true,
                message: 'Added to favorites',
            };
        }
    }
    async getFavorites(userId, page = 1, limit = 20) {
        const skip = (page - 1) * limit;
        const [favorites, total] = await Promise.all([
            this.prisma.favorite.findMany({
                where: { userId },
                include: {
                    Product: {
                        include: {
                            Store: {
                                select: {
                                    id: true,
                                    name: true,
                                    imageUrl: true,
                                },
                            },
                        },
                    },
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            this.prisma.favorite.count({ where: { userId } }),
        ]);
        return {
            favorites: favorites.map((f) => ({
                id: f.id,
                product: {
                    id: f.Product.id,
                    name: f.Product.name,
                    imageUrl: f.Product.imageUrl,
                    price: f.Product.price,
                    discountedPrice: f.Product.discountedPrice,
                    averageRating: f.Product.averageRating,
                    store: f.Product.Store,
                },
                createdAt: f.createdAt,
            })),
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
    async addToWishlist(userId, productId, note) {
        const product = await this.prisma.product.findUnique({
            where: { id: productId },
        });
        if (!product) {
            throw new common_1.NotFoundException('Product not found');
        }
        const existing = await this.prisma.wishlist.findUnique({
            where: {
                userId_productId: {
                    userId,
                    productId,
                },
            },
        });
        if (existing) {
            await this.prisma.wishlist.delete({
                where: { id: existing.id },
            });
            return {
                inWishlist: false,
                message: 'Removed from wishlist',
            };
        }
        else {
            await this.prisma.wishlist.create({
                data: {
                    id: (0, uuid_1.v4)(),
                    userId,
                    productId,
                    note,
                },
            });
            return {
                inWishlist: true,
                message: 'Added to wishlist',
            };
        }
    }
    async getWishlist(userId, page = 1, limit = 20) {
        const skip = (page - 1) * limit;
        const [wishlist, total] = await Promise.all([
            this.prisma.wishlist.findMany({
                where: { userId },
                include: {
                    product: {
                        include: {
                            Store: {
                                select: {
                                    id: true,
                                    name: true,
                                    imageUrl: true,
                                },
                            },
                        },
                    },
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            this.prisma.wishlist.count({ where: { userId } }),
        ]);
        return {
            wishlist: wishlist.map((w) => ({
                id: w.id,
                product: {
                    id: w.product.id,
                    name: w.product.name,
                    imageUrl: w.product.imageUrl,
                    price: w.product.price,
                    discountedPrice: w.product.discountedPrice,
                    averageRating: w.product.averageRating,
                    store: w.product.Store,
                },
                note: w.note,
                createdAt: w.createdAt,
            })),
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
    async updateProductRating(productId) {
        const result = await this.prisma.review.aggregate({
            where: {
                productId,
                entityType: 'PRODUCT',
            },
            _avg: {
                rating: true,
            },
            _count: true,
        });
        await this.prisma.product.update({
            where: { id: productId },
            data: {
                averageRating: result._avg.rating || 0,
                reviewCount: result._count,
                updatedAt: new Date(),
            },
        });
    }
    async updateStoreRating(storeId) {
        const result = await this.prisma.review.aggregate({
            where: {
                storeId,
                entityType: 'STORE',
            },
            _avg: {
                rating: true,
            },
        });
        await this.prisma.store.update({
            where: { id: storeId },
            data: {
                averageRating: result._avg.rating || 0,
                updatedAt: new Date(),
            },
        });
    }
    mapReviewToDto(review) {
        return {
            id: review.id,
            user: {
                id: review.User_Review_userIdToUser.id,
                name: `${review.User_Review_userIdToUser.firstName} ${review.User_Review_userIdToUser.lastName}`,
                profileImage: review.User_Review_userIdToUser.profileImage,
            },
            rating: review.rating,
            comment: review.comment,
            images: review.images || [],
            helpfulCount: review.helpfulCount || 0,
            createdAt: review.createdAt,
        };
    }
};
exports.ReviewService = ReviewService;
exports.ReviewService = ReviewService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ReviewService);
//# sourceMappingURL=review.service.js.map