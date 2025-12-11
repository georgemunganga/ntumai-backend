import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../shared/infrastructure/prisma.service';
import { OrderEntity } from '../../domain/entities/order.entity';
import { Order as PrismaOrder, OrderItem as PrismaOrderItem } from '@prisma/client';

@Injectable()
export class OrderRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<OrderEntity | null> {
    const order = await this.prisma.order.findUnique({ where: { id }, include: { items: true } });
    return order ? this.toDomain(order) : null;
  }

  async findByCustomerId(customerId: string): Promise<OrderEntity[]> {
    const orders = await this.prisma.order.findMany({ where: { customerId }, include: { items: true } });
    return orders.map(this.toDomain);
  }

  async save(order: OrderEntity): Promise<OrderEntity> {
    const saved = await this.prisma.order.upsert({
      where: { id: order.id || 'non-existent-id' },
      update: { status: order.status, totalAmount: order.totalAmount, deliveryFee: order.deliveryFee },
      create: {
        id: order.id,
        customerId: order.customerId,
        vendorId: order.vendorId,
        taskId: order.taskId,
        status: order.status,
        totalAmount: order.totalAmount,
        deliveryFee: order.deliveryFee,
      },
      include: { items: true },
    });
    return this.toDomain(saved as PrismaOrder & { items: PrismaOrderItem[] });
  }

  private toDomain(raw: PrismaOrder & { items: PrismaOrderItem[] }): OrderEntity {
    return new OrderEntity({ ...raw, totalAmount: raw.totalAmount.toNumber(), deliveryFee: raw.deliveryFee.toNumber() });
  }
}
