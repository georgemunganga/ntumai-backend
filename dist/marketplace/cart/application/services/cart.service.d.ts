import { PrismaService } from '../../../../shared/database/prisma.service';
export declare class CartService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    addToCart(userId: string, productId: string, quantity: number, variantOptions?: any, note?: string): Promise<{
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
    }>;
    updateCartItem(userId: string, itemId: string, quantity: number, note?: string): Promise<{
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
    }>;
    removeCartItem(userId: string, itemId: string): Promise<{
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
    }>;
    getCart(userId: string): Promise<{
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
    }>;
    applyDiscount(userId: string, discountCode: string): Promise<{
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
    }>;
    removeDiscount(userId: string): Promise<{
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
    }>;
    clearCart(userId: string): Promise<{
        success: boolean;
        message: string;
    }>;
    replaceStore(userId: string, newStoreId: string): Promise<{
        success: boolean;
        message: string;
    }>;
}
