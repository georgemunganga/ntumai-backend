import { PrismaService } from '../../../shared/database/prisma.service';
import { IOrderRepository } from '../../domain/repositories/order.repository.interface';
import { Order } from '../../domain/entities/order.entity';
export declare class PrismaOrderRepository implements IOrderRepository {
    private readonly prisma;
    constructor(prisma: PrismaService);
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
