import { PrismaService } from '../../../../shared/database/prisma.service';
export declare class VendorService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    createStore(userId: string, storeData: any): Promise<{
        id: string;
        name: string;
        description: string | null;
        imageUrl: string | null;
        isActive: boolean;
    }>;
    updateStore(userId: string, storeId: string, updateData: any): Promise<{
        id: string;
        name: string;
        description: string | null;
        imageUrl: string | null;
        isActive: boolean;
    }>;
    pauseStore(userId: string, storeId: string, paused: boolean): Promise<{
        success: boolean;
        message: string;
    }>;
    getStoreAdmin(userId: string, storeId: string): Promise<{
        id: string;
        name: string;
        description: string | null;
        imageUrl: string | null;
        isActive: boolean;
        averageRating: number | null;
        productCount: number;
        orderCount: number;
        createdAt: Date;
    }>;
    createProduct(userId: string, storeId: string, productData: any): Promise<{
        id: string;
        name: string;
        price: number;
        stock: number;
        isActive: boolean;
    }>;
    updateProduct(userId: string, storeId: string, productId: string, updateData: any): Promise<{
        id: string;
        name: string;
        description: string | null;
        price: number;
        isActive: boolean;
    }>;
    updateProductPricing(userId: string, storeId: string, productId: string, pricingData: any): Promise<{
        id: string;
        price: number;
        discountedPrice: number | null;
        discountPercentage: number | null;
    }>;
    updateProductInventory(userId: string, storeId: string, productId: string, inventoryData: any): Promise<{
        id: string;
        stock: number;
        minStock: number;
        isActive: boolean;
    }>;
    deleteProduct(userId: string, storeId: string, productId: string): Promise<{
        success: boolean;
        message: string;
    }>;
    uploadProductMedia(userId: string, storeId: string, productId: string, imageUrl: string): Promise<{
        imageUrl: string;
    }>;
    getStoreOrders(userId: string, storeId: string, page?: number, limit?: number, status?: string): Promise<{
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
    }>;
    private verifyStoreOwnership;
    private verifyProductOwnership;
}
