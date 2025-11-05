import { Order } from '../entities/order.entity';
export declare const ORDER_REPOSITORY = "ORDER_REPOSITORY";
export interface IOrderRepository {
    findByUserId(userId: string, filters?: {
        type?: string;
        status?: string;
        page?: number;
        size?: number;
    }): Promise<{
        orders: Order[];
        total: number;
    }>;
    findById(orderId: string): Promise<Order | null>;
    findByMarketplaceOrderId(marketplaceOrderId: string): Promise<Order | null>;
    findByDeliveryId(deliveryId: string): Promise<Order | null>;
}
