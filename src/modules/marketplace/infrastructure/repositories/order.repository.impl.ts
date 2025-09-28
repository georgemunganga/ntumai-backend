import { Injectable } from '@nestjs/common';
import { PrismaService } from '@common/prisma/prisma.service';
import { OrderRepository } from '../../domain/repositories/order.repository';
import { Order } from '../../domain/entities/order.entity';
import { OrderItem } from '../../domain/entities/order-item.entity';
import { OrderStatus } from '../../domain/value-objects/order-status.value-object';
import { Price } from '../../domain/value-objects/price.value-object';
import { DeliveryInfo } from '../../domain/value-objects/delivery-info.value-object';
import { PaymentDetails } from '../../domain/value-objects/payment-details.value-object';
import { Prisma } from '@prisma/client';

export interface OrderSearchFilters {
  userId?: string;
  storeId?: string;
  status?: string;
  paymentStatus?: string;
  dateFrom?: Date;
  dateTo?: Date;
  minAmount?: number;
  maxAmount?: number;
}

export interface OrderAnalytics {
  totalOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  ordersByStatus: Record<string, number>;
  topProducts: Array<{
    productId: string;
    productName: string;
    totalQuantity: number;
    totalRevenue: number;
  }>;
}

@Injectable()
export class OrderRepositoryImpl implements OrderRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<Order | null> {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: this.getOrderInclude(),
    });

    return order ? this.toDomain(order) : null;
  }

  async findByTrackingId(trackingId: string): Promise<Order | null> {
    const order = await this.prisma.order.findUnique({
      where: { trackingId },
      include: this.getOrderInclude(),
    });

    return order ? this.toDomain(order) : null;
  }

  async findByUserId(userId: string, limit?: number, offset?: number): Promise<Order[]> {
    const orders = await this.prisma.order.findMany({
      where: { userId },
      include: this.getOrderInclude(),
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });

    return orders.map(order => this.toDomain(order));
  }

  async findByStoreId(storeId: string, limit?: number, offset?: number): Promise<Order[]> {
    const orders = await this.prisma.order.findMany({
      where: { storeId },
      include: this.getOrderInclude(),
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });

    return orders.map(order => this.toDomain(order));
  }

  async findByStatus(status: string, limit?: number, offset?: number): Promise<Order[]> {
    const orders = await this.prisma.order.findMany({
      where: { status: status as any },
      include: this.getOrderInclude(),
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });

    return orders.map(order => this.toDomain(order));
  }

  async search(filters: OrderSearchFilters, limit?: number, offset?: number): Promise<Order[]> {
    const where: Prisma.OrderWhereInput = {};

    if (filters.userId) where.userId = filters.userId;
    if (filters.storeId) where.storeId = filters.storeId;
    if (filters.status) where.status = filters.status as any;
    if (filters.paymentStatus) where.paymentStatus = filters.paymentStatus as any;
    
    if (filters.dateFrom || filters.dateTo) {
      where.createdAt = {};
      if (filters.dateFrom) where.createdAt.gte = filters.dateFrom;
      if (filters.dateTo) where.createdAt.lte = filters.dateTo;
    }

    if (filters.minAmount || filters.maxAmount) {
      where.totalAmount = {};
      if (filters.minAmount) where.totalAmount.gte = filters.minAmount;
      if (filters.maxAmount) where.totalAmount.lte = filters.maxAmount;
    }

    const orders = await this.prisma.order.findMany({
      where,
      include: this.getOrderInclude(),
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });

    return orders.map(order => this.toDomain(order));
  }

  async save(order: Order): Promise<Order> {
    const orderData = this.toPersistence(order);
    
    if (order.getId()) {
      // Update existing order
      const updatedOrder = await this.prisma.order.update({
        where: { id: order.getId() },
        data: {
          status: orderData.status,
          paymentStatus: orderData.paymentStatus,
          subtotalAmount: orderData.subtotalAmount,
          discountAmount: orderData.discountAmount,
          deliveryFee: orderData.deliveryFee,
          totalAmount: orderData.totalAmount,
          specialInstructions: orderData.specialInstructions,
          estimatedDelivery: orderData.estimatedDelivery,
          scheduledDeliveryTime: orderData.scheduledDeliveryTime,
          updatedAt: new Date(),
        },
        include: this.getOrderInclude(),
      });
      return this.toDomain(updatedOrder);
    } else {
      // Create new order with items
      const createdOrder = await this.prisma.order.create({
        data: {
          ...orderData,
          items: {
            create: order.getItems().map(item => this.orderItemToPersistence(item))
          }
        },
        include: this.getOrderInclude(),
      });
      return this.toDomain(createdOrder);
    }
  }

  async delete(id: string): Promise<void> {
    await this.prisma.order.delete({
      where: { id },
    });
  }

  async updateStatus(id: string, status: OrderStatus): Promise<void> {
    await this.prisma.order.update({
      where: { id },
      data: {
        status: status.getValue() as any,
        updatedAt: new Date(),
      },
    });
  }

  async updatePaymentStatus(id: string, paymentStatus: string): Promise<void> {
    await this.prisma.order.update({
      where: { id },
      data: {
        paymentStatus: paymentStatus as any,
        updatedAt: new Date(),
      },
    });
  }

  async addItem(orderId: string, item: OrderItem): Promise<void> {
    const itemData = this.orderItemToPersistence(item);
    
    await this.prisma.orderItem.create({
      data: {
        ...itemData,
        order: { connect: { id: orderId } },
      },
    });

    // Update order totals
    await this.updateOrderTotals(orderId);
  }

  async removeItem(orderId: string, itemId: string): Promise<void> {
    await this.prisma.orderItem.delete({
      where: { id: itemId },
    });

    // Update order totals
    await this.updateOrderTotals(orderId);
  }

  async getAnalytics(filters: OrderSearchFilters): Promise<OrderAnalytics> {
    const where: Prisma.OrderWhereInput = {};
    
    if (filters.userId) where.userId = filters.userId;
    if (filters.storeId) where.storeId = filters.storeId;
    if (filters.status) where.status = filters.status as any;
    
    if (filters.dateFrom || filters.dateTo) {
      where.createdAt = {};
      if (filters.dateFrom) where.createdAt.gte = filters.dateFrom;
      if (filters.dateTo) where.createdAt.lte = filters.dateTo;
    }

    // Get basic analytics
    const [totalOrders, totalRevenue, ordersByStatus] = await Promise.all([
      this.prisma.order.count({ where }),
      this.prisma.order.aggregate({
        where,
        _sum: { totalAmount: true },
      }),
      this.prisma.order.groupBy({
        by: ['status'],
        where,
        _count: { status: true },
      }),
    ]);

    // Get top products
    const topProducts = await this.prisma.orderItem.groupBy({
      by: ['productId'],
      where: {
        order: where,
      },
      _sum: {
        quantity: true,
        subtotal: true,
      },
      orderBy: {
        _sum: {
          subtotal: 'desc',
        },
      },
      take: 10,
    });

    // Get product names for top products
    const productIds = topProducts.map(p => p.productId);
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, name: true },
    });

    const productMap = new Map(products.map(p => [p.id, p.name]));

    return {
      totalOrders,
      totalRevenue: totalRevenue._sum.totalAmount || 0,
      averageOrderValue: totalOrders > 0 ? (totalRevenue._sum.totalAmount || 0) / totalOrders : 0,
      ordersByStatus: Object.fromEntries(
        ordersByStatus.map(item => [item.status, item._count.status])
      ),
      topProducts: topProducts.map(item => ({
        productId: item.productId,
        productName: productMap.get(item.productId) || 'Unknown Product',
        totalQuantity: item._sum.quantity || 0,
        totalRevenue: item._sum.subtotal || 0,
      })),
    };
  }

  private async updateOrderTotals(orderId: string): Promise<void> {
    const items = await this.prisma.orderItem.findMany({
      where: { orderId },
    });

    const subtotalAmount = items.reduce((sum, item) => sum + item.subtotal, 0);

    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      select: { discountAmount: true, deliveryFee: true },
    });

    if (order) {
      const totalAmount = subtotalAmount - (order.discountAmount || 0) + (order.deliveryFee || 0);
      
      await this.prisma.order.update({
        where: { id: orderId },
        data: {
          subtotalAmount,
          totalAmount,
          updatedAt: new Date(),
        },
      });
    }
  }

  private getOrderInclude() {
    return {
      items: {
        include: {
          product: {
            include: {
              category: true,
              brand: true,
              store: true,
            },
          },
        },
      },
      user: true,
      store: true,
      deliveryAddress: true,
      discountCode: true,
      payments: true,
      deliveryAssignments: true,
      reviews: true,
    };
  }

  private toDomain(order: any): Order {
    const items = order.items?.map((item: any) => this.orderItemToDomain(item)) || [];
    
    const orderStatus = new OrderStatus(order.status);
    const deliveryInfo = new DeliveryInfo(
      order.deliveryAddress?.street || '',
      order.deliveryAddress?.city || '',
      order.deliveryAddress?.state || '',
      order.deliveryAddress?.zipCode || '',
      order.estimatedDelivery,
      order.scheduledDeliveryTime
    );
    
    const paymentDetails = new PaymentDetails(
      order.paymentStatus,
      order.payments?.[0]?.method || 'UNKNOWN',
      order.payments?.[0]?.transactionId
    );

    return new Order(
      order.id,
      order.trackingId,
      order.userId,
      order.storeId,
      items,
      orderStatus,
      new Price(order.subtotalAmount, 'USD'),
      new Price(order.discountAmount || 0, 'USD'),
      new Price(order.deliveryFee || 0, 'USD'),
      new Price(order.totalAmount, 'USD'),
      deliveryInfo,
      paymentDetails,
      order.specialInstructions,
      order.createdAt,
      order.updatedAt
    );
  }

  private orderItemToDomain(item: any): OrderItem {
    return new OrderItem(
      item.id,
      item.productId,
      item.product?.name || '',
      item.quantity,
      new Price(item.unitPrice, 'USD'),
      new Price(item.subtotal, 'USD'),
      item.variantId,
      item.product
    );
  }

  private toPersistence(order: Order): Prisma.OrderCreateInput {
    return {
      id: order.getId(),
      trackingId: order.getTrackingId(),
      user: { connect: { id: order.getUserId() } },
      store: { connect: { id: order.getStoreId() } },
      status: order.getStatus().getValue() as any,
      paymentStatus: order.getPaymentDetails().getStatus() as any,
      subtotalAmount: order.getSubtotalAmount().getAmount(),
      discountAmount: order.getDiscountAmount().getAmount(),
      deliveryFee: order.getDeliveryFee().getAmount(),
      totalAmount: order.getTotalAmount().getAmount(),
      specialInstructions: order.getSpecialInstructions(),
      estimatedDelivery: order.getDeliveryInfo().getEstimatedDelivery(),
      scheduledDeliveryTime: order.getDeliveryInfo().getScheduledTime(),
      createdAt: order.getCreatedAt(),
      updatedAt: order.getUpdatedAt(),
    };
  }

  private orderItemToPersistence(item: OrderItem): Prisma.OrderItemCreateWithoutOrderInput {
    return {
      id: item.getId(),
      product: { connect: { id: item.getProductId() } },
      quantity: item.getQuantity(),
      unitPrice: item.getUnitPrice().getAmount(),
      subtotal: item.getSubtotal().getAmount(),
      variantId: item.getVariantId(),
    };
  }
}