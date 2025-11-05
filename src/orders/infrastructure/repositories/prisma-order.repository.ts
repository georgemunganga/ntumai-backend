import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../shared/database/prisma.service';
import { IOrderRepository } from '../../domain/repositories/order.repository.interface';
import { Order } from '../../domain/entities/order.entity';

@Injectable()
export class PrismaOrderRepository implements IOrderRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByUserId(
    userId: string,
    filters?: {
      type?: string;
      status?: string;
      page?: number;
      size?: number;
    },
  ): Promise<{ orders: Order[]; total: number }> {
    const page = filters?.page || 1;
    const size = filters?.size || 20;
    const skip = (page - 1) * size;

    const where: any = { user_id: userId };
    if (filters?.type) {
      where.type = filters.type;
    }
    if (filters?.status) {
      where.status = filters.status;
    }

    const [orders, total] = await Promise.all([
      this.prisma.unifiedOrder.findMany({
        where,
        skip,
        take: size,
        orderBy: { created_at: 'desc' },
      }),
      this.prisma.unifiedOrder.count({ where }),
    ]);

    return {
      orders: orders.map((order) => Order.fromPersistence(order as any)),
      total,
    };
  }

  async findById(orderId: string): Promise<Order | null> {
    const order = await this.prisma.unifiedOrder.findUnique({
      where: { id: orderId },
    });

    if (!order) return null;
    return Order.fromPersistence(order as any);
  }

  async findByMarketplaceOrderId(
    marketplaceOrderId: string,
  ): Promise<Order | null> {
    const order = await this.prisma.unifiedOrder.findFirst({
      where: { marketplace_order_id: marketplaceOrderId },
    });

    if (!order) return null;
    return Order.fromPersistence(order as any);
  }

  async findByDeliveryId(deliveryId: string): Promise<Order | null> {
    const order = await this.prisma.unifiedOrder.findFirst({
      where: { delivery_id: deliveryId },
    });

    if (!order) return null;
    return Order.fromPersistence(order as any);
  }
}
