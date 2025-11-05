import { PrismaService } from '../../../../shared/database/prisma.service';
export declare class ReviewService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    createProductReview(userId: string, productId: string, rating: number, comment?: string, images?: string[]): Promise<{
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
    }>;
    getProductReviews(productId: string, page?: number, limit?: number): Promise<{
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
    }>;
    createStoreReview(userId: string, storeId: string, rating: number, comment?: string): Promise<{
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
    }>;
    getStoreReviews(storeId: string, page?: number, limit?: number): Promise<{
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
    }>;
    toggleFavorite(userId: string, productId: string): Promise<{
        isFavorite: boolean;
        message: string;
    }>;
    getFavorites(userId: string, page?: number, limit?: number): Promise<{
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
    }>;
    addToWishlist(userId: string, productId: string, note?: string): Promise<{
        inWishlist: boolean;
        message: string;
    }>;
    getWishlist(userId: string, page?: number, limit?: number): Promise<{
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
    }>;
    private updateProductRating;
    private updateStoreRating;
    private mapReviewToDto;
}
