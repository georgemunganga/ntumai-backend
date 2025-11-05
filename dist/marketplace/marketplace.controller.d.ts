import { CatalogService } from './catalog/application/services/catalog.service';
import { CartService } from './cart/application/services/cart.service';
import { OrderService } from './orders/application/services/order.service';
import { VendorService } from './vendor/application/services/vendor.service';
import { PromotionService } from './promotions/application/services/promotion.service';
import { ReviewService } from './reviews/application/services/review.service';
export declare class MarketplaceController {
    private readonly catalogService;
    private readonly cartService;
    private readonly orderService;
    private readonly vendorService;
    private readonly promotionService;
    private readonly reviewService;
    constructor(catalogService: CatalogService, cartService: CartService, orderService: OrderService, vendorService: VendorService, promotionService: PromotionService, reviewService: ReviewService);
    getCategories(): Promise<{
        success: boolean;
        data: {
            categories: {
                id: string;
                name: string;
                imageUrl: string | null;
                productCount: number;
            }[];
        };
    }>;
    getCategoryProducts(categoryId: string, page?: string, limit?: string, sort?: string): Promise<{
        success: boolean;
        data: {
            products: {
                id: any;
                name: any;
                description: any;
                price: any;
                discountedPrice: any;
                discountPercentage: any;
                imageUrl: any;
                rating: any;
                reviewCount: any;
                store: any;
                isFavorite: boolean;
            }[];
            pagination: {
                page: number;
                limit: number;
                total: number;
                totalPages: number;
            };
        };
    }>;
    getBrands(): Promise<{
        success: boolean;
        data: {
            brands: {
                id: string;
                name: string;
                logoUrl: string | null;
                productCount: number;
            }[];
        };
    }>;
    getBrandProducts(brandId: string, page?: string, limit?: string, sort?: string): Promise<{
        success: boolean;
        data: {
            products: {
                id: any;
                name: any;
                description: any;
                price: any;
                discountedPrice: any;
                discountPercentage: any;
                imageUrl: any;
                rating: any;
                reviewCount: any;
                store: any;
                isFavorite: boolean;
            }[];
            pagination: {
                page: number;
                limit: number;
                total: number;
                totalPages: number;
            };
        };
    }>;
    searchProducts(query: string, page?: string, limit?: string, sort?: string): Promise<{
        success: boolean;
        data: {
            products: {
                id: any;
                name: any;
                description: any;
                price: any;
                discountedPrice: any;
                discountPercentage: any;
                imageUrl: any;
                rating: any;
                reviewCount: any;
                store: any;
                isFavorite: boolean;
            }[];
            pagination: {
                page: number;
                limit: number;
                total: number;
                totalPages: number;
            };
        };
    }>;
    getProduct(productId: string, req: any): Promise<{
        success: boolean;
        data: {
            product: {
                id: string;
                name: string;
                description: string | null;
                price: number;
                discountedPrice: number | null;
                discountPercentage: number | null;
                stock: number;
                imageUrl: string | null;
                tags: string[];
                averageRating: number | null;
                reviewCount: number;
                store: {
                    name: string;
                    id: string;
                    imageUrl: string | null;
                    averageRating: number | null;
                };
                brand: {
                    name: string;
                    id: string;
                    imageUrl: string | null;
                } | null;
                category: {
                    name: string;
                    id: string;
                } | null;
                variants: {
                    name: string;
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    price: number | null;
                    stock: number;
                    productId: string;
                    value: string;
                }[];
                reviews: {
                    id: string;
                    rating: number;
                    comment: string | null;
                    createdAt: Date;
                    user: {
                        name: string;
                        profileImage: string | null;
                    };
                }[];
                isFavorite: boolean;
                relatedProducts: {
                    id: any;
                    name: any;
                    description: any;
                    price: any;
                    discountedPrice: any;
                    discountPercentage: any;
                    imageUrl: any;
                    rating: any;
                    reviewCount: any;
                    store: any;
                    isFavorite: boolean;
                }[];
            };
        };
    }>;
    getStores(page?: string, limit?: string): Promise<{
        success: boolean;
        data: {
            stores: {
                id: string;
                name: string;
                imageUrl: string | null;
                averageRating: number | null;
                productCount: number;
            }[];
            pagination: {
                page: number;
                limit: number;
                total: number;
                totalPages: number;
            };
        };
    }>;
    getStore(storeId: string): Promise<{
        success: boolean;
        data: {
            store: {
                id: string;
                name: string;
                description: string | null;
                imageUrl: string | null;
                averageRating: number | null;
                productCount: number;
                isActive: boolean;
            };
        };
    }>;
    getStoreProducts(storeId: string, page?: string, limit?: string, sort?: string): Promise<{
        success: boolean;
        data: {
            products: {
                id: any;
                name: any;
                description: any;
                price: any;
                discountedPrice: any;
                discountPercentage: any;
                imageUrl: any;
                rating: any;
                reviewCount: any;
                store: any;
                isFavorite: boolean;
            }[];
            pagination: {
                page: number;
                limit: number;
                total: number;
                totalPages: number;
            };
        };
    }>;
    addToCart(req: any, body: any): Promise<{
        success: boolean;
        data: {
            cart: {
                items: {
                    id: string;
                    product: {
                        id: string;
                        name: string;
                        imageUrl: string | null;
                        price: number;
                        discountedPrice: number | null;
                        store: {
                            name: string;
                            id: string;
                            imageUrl: string | null;
                        };
                    };
                    quantity: number;
                    variantOptions: import("@prisma/client/runtime/library").JsonValue;
                    note: string | null;
                    price: number;
                    subtotal: number;
                }[];
                subtotal: number;
                discount: number;
                deliveryFee: number;
                tax: number;
                total: number;
                itemCount: number;
            };
        };
    }>;
    updateCartItem(req: any, itemId: string, body: any): Promise<{
        success: boolean;
        data: {
            cart: {
                items: {
                    id: string;
                    product: {
                        id: string;
                        name: string;
                        imageUrl: string | null;
                        price: number;
                        discountedPrice: number | null;
                        store: {
                            name: string;
                            id: string;
                            imageUrl: string | null;
                        };
                    };
                    quantity: number;
                    variantOptions: import("@prisma/client/runtime/library").JsonValue;
                    note: string | null;
                    price: number;
                    subtotal: number;
                }[];
                subtotal: number;
                discount: number;
                deliveryFee: number;
                tax: number;
                total: number;
                itemCount: number;
            };
        };
    }>;
    removeCartItem(req: any, itemId: string): Promise<{
        success: boolean;
        data: {
            cart: {
                items: {
                    id: string;
                    product: {
                        id: string;
                        name: string;
                        imageUrl: string | null;
                        price: number;
                        discountedPrice: number | null;
                        store: {
                            name: string;
                            id: string;
                            imageUrl: string | null;
                        };
                    };
                    quantity: number;
                    variantOptions: import("@prisma/client/runtime/library").JsonValue;
                    note: string | null;
                    price: number;
                    subtotal: number;
                }[];
                subtotal: number;
                discount: number;
                deliveryFee: number;
                tax: number;
                total: number;
                itemCount: number;
            };
        };
    }>;
    getCart(req: any): Promise<{
        success: boolean;
        data: {
            cart: {
                items: {
                    id: string;
                    product: {
                        id: string;
                        name: string;
                        imageUrl: string | null;
                        price: number;
                        discountedPrice: number | null;
                        store: {
                            name: string;
                            id: string;
                            imageUrl: string | null;
                        };
                    };
                    quantity: number;
                    variantOptions: import("@prisma/client/runtime/library").JsonValue;
                    note: string | null;
                    price: number;
                    subtotal: number;
                }[];
                subtotal: number;
                discount: number;
                deliveryFee: number;
                tax: number;
                total: number;
                itemCount: number;
            };
        };
    }>;
    applyDiscount(req: any, body: any): Promise<{
        success: boolean;
        data: {
            cart: {
                items: {
                    id: string;
                    product: {
                        id: string;
                        name: string;
                        imageUrl: string | null;
                        price: number;
                        discountedPrice: number | null;
                        store: {
                            name: string;
                            id: string;
                            imageUrl: string | null;
                        };
                    };
                    quantity: number;
                    variantOptions: import("@prisma/client/runtime/library").JsonValue;
                    note: string | null;
                    price: number;
                    subtotal: number;
                }[];
                subtotal: number;
                discount: number;
                deliveryFee: number;
                tax: number;
                total: number;
                itemCount: number;
            };
        };
    }>;
    removeDiscount(req: any): Promise<{
        success: boolean;
        data: {
            cart: {
                items: {
                    id: string;
                    product: {
                        id: string;
                        name: string;
                        imageUrl: string | null;
                        price: number;
                        discountedPrice: number | null;
                        store: {
                            name: string;
                            id: string;
                            imageUrl: string | null;
                        };
                    };
                    quantity: number;
                    variantOptions: import("@prisma/client/runtime/library").JsonValue;
                    note: string | null;
                    price: number;
                    subtotal: number;
                }[];
                subtotal: number;
                discount: number;
                deliveryFee: number;
                tax: number;
                total: number;
                itemCount: number;
            };
        };
    }>;
    clearCart(req: any): Promise<{
        success: boolean;
        message: string;
    }>;
    calculateDelivery(req: any, body: any): Promise<{
        success: boolean;
        data: {
            deliveryFee: number;
            estimatedDeliveryTime: Date;
        };
    }>;
    createOrder(req: any, body: any): Promise<{
        success: boolean;
        data: {
            order: {
                id: any;
                trackingId: any;
                status: any;
                subtotal: any;
                discountAmount: any;
                deliveryFee: any;
                tax: any;
                totalAmount: any;
                items: any;
                address: {
                    address: any;
                    city: any;
                    contactName: any;
                    contactPhone: any;
                } | null;
                payments: any;
                createdAt: any;
                updatedAt: any;
            };
        };
    }>;
    processPayment(req: any, orderId: string, body: any): Promise<{
        success: boolean;
        data: {
            paymentId: string;
            status: import("@prisma/client").$Enums.PaymentStatus;
            reference: string | null;
        };
    }>;
    getOrder(req: any, orderId: string): Promise<{
        success: boolean;
        data: {
            order: {
                id: any;
                trackingId: any;
                status: any;
                subtotal: any;
                discountAmount: any;
                deliveryFee: any;
                tax: any;
                totalAmount: any;
                items: any;
                address: {
                    address: any;
                    city: any;
                    contactName: any;
                    contactPhone: any;
                } | null;
                payments: any;
                createdAt: any;
                updatedAt: any;
            };
        };
    }>;
    getOrders(req: any, page?: string, limit?: string, status?: string): Promise<{
        success: boolean;
        data: {
            orders: {
                id: any;
                trackingId: any;
                status: any;
                subtotal: any;
                discountAmount: any;
                deliveryFee: any;
                tax: any;
                totalAmount: any;
                items: any;
                address: {
                    address: any;
                    city: any;
                    contactName: any;
                    contactPhone: any;
                } | null;
                payments: any;
                createdAt: any;
                updatedAt: any;
            }[];
            pagination: {
                page: number;
                limit: number;
                total: number;
                totalPages: number;
            };
        };
    }>;
    cancelOrder(req: any, orderId: string, body: any): Promise<{
        success: boolean;
        message: string;
    }>;
    rateOrder(req: any, orderId: string, body: any): Promise<{
        success: boolean;
        data: {
            reviewId: string;
            rating: number;
            comment: string | null;
        };
    }>;
    reorder(req: any, orderId: string): Promise<{
        success: boolean;
        message: string;
        cartItemCount: number;
    }>;
    createStore(req: any, body: any): Promise<{
        success: boolean;
        data: {
            store: {
                id: string;
                name: string;
                description: string | null;
                imageUrl: string | null;
                isActive: boolean;
            };
        };
    }>;
    updateStore(req: any, storeId: string, body: any): Promise<{
        success: boolean;
        data: {
            store: {
                id: string;
                name: string;
                description: string | null;
                imageUrl: string | null;
                isActive: boolean;
            };
        };
    }>;
    pauseStore(req: any, storeId: string, body: any): Promise<{
        success: boolean;
        message: string;
    }>;
    getStoreAdmin(req: any, storeId: string): Promise<{
        success: boolean;
        data: {
            store: {
                id: string;
                name: string;
                description: string | null;
                imageUrl: string | null;
                isActive: boolean;
                averageRating: number | null;
                productCount: number;
                orderCount: number;
                createdAt: Date;
            };
        };
    }>;
    createProduct(req: any, storeId: string, body: any): Promise<{
        success: boolean;
        data: {
            product: {
                id: string;
                name: string;
                price: number;
                stock: number;
                isActive: boolean;
            };
        };
    }>;
    updateProduct(req: any, storeId: string, productId: string, body: any): Promise<{
        success: boolean;
        data: {
            product: {
                id: string;
                name: string;
                description: string | null;
                price: number;
                isActive: boolean;
            };
        };
    }>;
    updateProductPricing(req: any, storeId: string, productId: string, body: any): Promise<{
        success: boolean;
        data: {
            id: string;
            price: number;
            discountedPrice: number | null;
            discountPercentage: number | null;
        };
    }>;
    updateProductInventory(req: any, storeId: string, productId: string, body: any): Promise<{
        success: boolean;
        data: {
            id: string;
            stock: number;
            minStock: number;
            isActive: boolean;
        };
    }>;
    deleteProduct(req: any, storeId: string, productId: string): Promise<{
        success: boolean;
        message: string;
    }>;
    getStoreOrders(req: any, storeId: string, page?: string, limit?: string, status?: string): Promise<{
        success: boolean;
        data: {
            orders: {
                id: string;
                trackingId: string;
                status: import("@prisma/client").$Enums.OrderStatus;
                totalAmount: number;
                customer: {
                    name: string;
                    phone: string | null;
                };
                items: {
                    product: string;
                    quantity: number;
                    price: number;
                }[];
                deliveryAddress: {
                    address: string;
                    city: string;
                };
                createdAt: Date;
            }[];
            pagination: {
                page: number;
                limit: number;
                total: number;
                totalPages: number;
            };
        };
    }>;
    getPromotions(category?: string): Promise<{
        success: boolean;
        data: {
            promotions: {
                id: string;
                title: string;
                description: string;
                type: import("@prisma/client").$Enums.PromotionType;
                value: number;
                startDate: Date;
                endDate: Date;
            }[];
        };
    }>;
    createGiftCard(req: any, body: any): Promise<{
        success: boolean;
        data: {
            giftCard: {
                id: string;
                code: string;
                amount: number;
                recipientEmail: string | null;
                recipientPhone: string | null;
                expiresAt: Date;
            };
        };
    }>;
    getGiftCardDesigns(): Promise<{
        success: boolean;
        data: {
            designs: {
                id: string;
                name: string;
                imageUrl: string;
            }[];
        };
    }>;
    getGiftCardHistory(req: any): Promise<{
        success: boolean;
        data: {
            sent: {
                id: string;
                code: string;
                amount: number;
                balance: number;
                recipientEmail: string | null;
                recipientPhone: string | null;
                isRedeemed: boolean;
                createdAt: Date;
            }[];
            received: {
                id: string;
                code: string;
                amount: number;
                balance: number;
                isRedeemed: boolean;
                redeemedAt: Date | null;
                expiresAt: Date;
                createdAt: Date;
            }[];
        };
    }>;
    redeemGiftCard(req: any, body: any): Promise<{
        success: boolean;
        amount: number;
        balance: number;
        message: string;
    }>;
    getProductReviews(productId: string, page?: string, limit?: string): Promise<{
        success: boolean;
        data: {
            reviews: {
                id: any;
                user: {
                    id: any;
                    name: string;
                    profileImage: any;
                };
                rating: any;
                comment: any;
                images: any;
                helpfulCount: any;
                createdAt: any;
            }[];
            pagination: {
                page: number;
                limit: number;
                total: number;
                totalPages: number;
            };
        };
    }>;
    addProductReview(req: any, productId: string, body: any): Promise<{
        success: boolean;
        data: {
            review: {
                id: any;
                user: {
                    id: any;
                    name: string;
                    profileImage: any;
                };
                rating: any;
                comment: any;
                images: any;
                helpfulCount: any;
                createdAt: any;
            };
        };
    }>;
    voteOnReview(req: any, reviewId: string, body: any): Promise<{
        success: boolean;
        message: string;
    }>;
    getStoreReviews(storeId: string, page?: string, limit?: string): Promise<{
        success: boolean;
        data: {
            reviews: {
                id: any;
                user: {
                    id: any;
                    name: string;
                    profileImage: any;
                };
                rating: any;
                comment: any;
                images: any;
                helpfulCount: any;
                createdAt: any;
            }[];
            pagination: {
                page: number;
                limit: number;
                total: number;
                totalPages: number;
            };
        };
    }>;
    getStoreReviewSummary(storeId: string): Promise<{
        success: boolean;
        data: {
            reviews: {
                id: any;
                user: {
                    id: any;
                    name: string;
                    profileImage: any;
                };
                rating: any;
                comment: any;
                images: any;
                helpfulCount: any;
                createdAt: any;
            }[];
            pagination: {
                page: number;
                limit: number;
                total: number;
                totalPages: number;
            };
        };
    }>;
    toggleFavorite(req: any, body: any): Promise<{
        isFavorite: boolean;
        message: string;
    }>;
    getFavorites(req: any, page?: string, limit?: string): Promise<{
        success: boolean;
        data: {
            favorites: {
                id: string;
                product: {
                    id: string;
                    name: string;
                    imageUrl: string | null;
                    price: number;
                    discountedPrice: number | null;
                    averageRating: number | null;
                    store: {
                        name: string;
                        id: string;
                        imageUrl: string | null;
                    };
                };
                createdAt: Date;
            }[];
            pagination: {
                page: number;
                limit: number;
                total: number;
                totalPages: number;
            };
        };
    }>;
    toggleWishlist(req: any, body: any): Promise<{
        inWishlist: boolean;
        message: string;
    }>;
    getWishlist(req: any, page?: string, limit?: string): Promise<{
        success: boolean;
        data: {
            wishlist: {
                id: string;
                product: {
                    id: string;
                    name: string;
                    imageUrl: string | null;
                    price: number;
                    discountedPrice: number | null;
                    averageRating: number | null;
                    store: {
                        name: string;
                        id: string;
                        imageUrl: string | null;
                    };
                };
                note: string | null;
                createdAt: Date;
            }[];
            pagination: {
                page: number;
                limit: number;
                total: number;
                totalPages: number;
            };
        };
    }>;
}
