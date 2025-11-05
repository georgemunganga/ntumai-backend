import { PrismaService } from '../../../../shared/database/prisma.service';
export declare class CatalogService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getCategories(): Promise<{
        id: string;
        name: string;
        imageUrl: string | null;
        productCount: number;
    }[]>;
    getCategoryProducts(categoryId: string, page?: number, limit?: number, sort?: string): Promise<{
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
    }>;
    getBrands(): Promise<{
        id: string;
        name: string;
        logoUrl: string | null;
        productCount: number;
    }[]>;
    getBrandProducts(brandId: string, page?: number, limit?: number, sort?: string): Promise<{
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
    }>;
    searchProducts(query: string, page?: number, limit?: number, sort?: string): Promise<{
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
    }>;
    getProduct(productId: string, userId?: string): Promise<{
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
    }>;
    getStores(page?: number, limit?: number): Promise<{
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
    }>;
    getStore(storeId: string): Promise<{
        id: string;
        name: string;
        description: string | null;
        imageUrl: string | null;
        averageRating: number | null;
        productCount: number;
        isActive: boolean;
    }>;
    getStoreProducts(storeId: string, page?: number, limit?: number, sort?: string): Promise<{
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
    }>;
    private mapProductToDto;
}
