import { PrismaService } from '../../../../shared/database/prisma.service';
export declare class OrderService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    calculateDelivery(userId: string, addressId: string): Promise<{
        deliveryFee: number;
        estimatedDeliveryTime: Date;
    }>;
    createOrder(userId: string, addressId: string, paymentMethod: string, notes?: string, discountCode?: string, scheduleAt?: Date): Promise<{
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
    }>;
    processPayment(userId: string, orderId: string, paymentDetails?: any): Promise<{
        paymentId: string;
        status: import("@prisma/client").$Enums.PaymentStatus;
        reference: string | null;
    }>;
    getOrder(userId: string, orderId: string): Promise<{
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
    }>;
    getOrders(userId: string, page?: number, limit?: number, status?: string): Promise<{
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
    }>;
    cancelOrder(userId: string, orderId: string, reason?: string): Promise<{
        success: boolean;
        message: string;
    }>;
    rateOrder(userId: string, orderId: string, rating: number, comment?: string): Promise<{
        reviewId: string;
        rating: number;
        comment: string | null;
    }>;
    reorder(userId: string, orderId: string): Promise<{
        success: boolean;
        message: string;
        cartItemCount: number;
    }>;
    private mapOrderToDto;
}
