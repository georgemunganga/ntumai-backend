import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../../../shared/database/prisma.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class OrderService {
  constructor(private readonly prisma: PrismaService) {}

  async calculateDelivery(userId: string, addressId: string) {
    const address = await this.prisma.address.findFirst({
      where: { id: addressId, userId },
    });

    if (!address) {
      throw new NotFoundException('Address not found');
    }

    // Simple delivery fee calculation (can be enhanced with distance-based pricing)
    const deliveryFee = 50; // Base fee in currency minor units
    const estimatedDeliveryTime = new Date(Date.now() + 45 * 60 * 1000); // 45 minutes

    return {
      deliveryFee,
      estimatedDeliveryTime,
    };
  }

  async createOrder(
    userId: string,
    addressId: string,
    paymentMethod: string,
    notes?: string,
    discountCode?: string,
    scheduleAt?: Date,
  ) {
    // Get cart
    const cart = await this.prisma.cart.findUnique({
      where: { userId },
      include: {
        CartItem: {
          include: {
            Product: true,
          },
        },
      },
    });

    if (!cart || cart.CartItem.length === 0) {
      throw new BadRequestException('Cart is empty');
    }

    // Verify address
    const address = await this.prisma.address.findFirst({
      where: { id: addressId, userId },
    });

    if (!address) {
      throw new NotFoundException('Address not found');
    }

    // Validate stock for all items
    for (const item of cart.CartItem) {
      if (item.Product.stock < item.quantity) {
        throw new ConflictException(
          `Insufficient stock for ${item.Product.name}`,
        );
      }
    }

    // Calculate totals
    const subtotal = cart.CartItem.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );
    const discountAmount = cart.discountAmount || 0;
    const deliveryCalc = await this.calculateDelivery(userId, addressId);
    const deliveryFee = deliveryCalc.deliveryFee;
    const tax = subtotal * 0.16; // 16% VAT
    const totalAmount = subtotal - discountAmount + deliveryFee + tax;

    // Create order
    const trackingId = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

    const order = await this.prisma.order.create({
      data: {
        id: uuidv4(),
        trackingId,
        userId,
        addressId,
        status: 'PENDING',
        subtotal,
        discountAmount,
        discountCodeId: cart.discountCodeId,
        deliveryFee,
        tax,
        totalAmount,
        updatedAt: new Date(),
        OrderItem: {
          create: cart.CartItem.map((item) => ({
            id: uuidv4(),
            productId: item.productId,
            quantity: item.quantity,
            price: item.price,
            updatedAt: new Date(),
          })),
        },
      },
      include: {
        OrderItem: {
          include: {
            Product: {
              include: {
                Store: true,
              },
            },
          },
        },
        Address: true,
      },
    });

    // Update product stock
    for (const item of cart.CartItem) {
      await this.prisma.product.update({
        where: { id: item.productId },
        data: {
          stock: {
            decrement: item.quantity,
          },
          updatedAt: new Date(),
        },
      });
    }

    // Clear cart
    await this.prisma.cartItem.deleteMany({
      where: { cartId: cart.id },
    });

    await this.prisma.cart.delete({
      where: { id: cart.id },
    });

    return this.mapOrderToDto(order);
  }

  async processPayment(userId: string, orderId: string, paymentDetails?: any) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, userId },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.status !== 'PENDING') {
      throw new ConflictException('Order cannot be paid');
    }

    // Create payment record (mock payment processing)
    const payment = await this.prisma.payment.create({
      data: {
        id: uuidv4(),
        orderId,
        amount: order.totalAmount,
        method: 'CREDIT_CARD', // From paymentDetails
        status: 'PAID',
        reference: `PAY-${Date.now()}`,
        updatedAt: new Date(),
      },
    });

    // Update order status
    await this.prisma.order.update({
      where: { id: orderId },
      data: {
        status: 'ACCEPTED',
        updatedAt: new Date(),
      },
    });

    return {
      paymentId: payment.id,
      status: payment.status,
      reference: payment.reference,
    };
  }

  async getOrder(userId: string, orderId: string) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, userId },
      include: {
        OrderItem: {
          include: {
            Product: {
              include: {
                Store: true,
              },
            },
          },
        },
        Address: true,
        Payment: true,
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return this.mapOrderToDto(order);
  }

  async getOrders(
    userId: string,
    page: number = 1,
    limit: number = 20,
    status?: string,
  ) {
    const skip = (page - 1) * limit;
    const where: any = { userId };

    if (status) {
      where.status = status;
    }

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        include: {
          OrderItem: {
            include: {
              Product: {
                include: {
                  Store: true,
                },
              },
            },
          },
          Address: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.order.count({ where }),
    ]);

    return {
      orders: orders.map((o) => this.mapOrderToDto(o)),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async cancelOrder(userId: string, orderId: string, reason?: string) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, userId },
      include: {
        OrderItem: true,
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Can only cancel if not yet delivered
    if (['DELIVERED', 'CANCELLED', 'COMPLETED'].includes(order.status)) {
      throw new ConflictException('Order cannot be cancelled');
    }

    // Restore stock
    for (const item of order.OrderItem) {
      await this.prisma.product.update({
        where: { id: item.productId },
        data: {
          stock: {
            increment: item.quantity,
          },
          updatedAt: new Date(),
        },
      });
    }

    // Update order status
    await this.prisma.order.update({
      where: { id: orderId },
      data: {
        status: 'CANCELLED',
        updatedAt: new Date(),
      },
    });

    return {
      success: true,
      message: 'Order cancelled successfully',
    };
  }

  async rateOrder(
    userId: string,
    orderId: string,
    rating: number,
    comment?: string,
  ) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, userId },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.status !== 'DELIVERED' && order.status !== 'COMPLETED') {
      throw new ConflictException('Can only rate delivered orders');
    }

    // Create review for the order
    const review = await this.prisma.review.create({
      data: {
        id: uuidv4(),
        userId,
        entityId: orderId,
        entityType: 'ORDER',
        orderId,
        rating,
        comment,
        updatedAt: new Date(),
      },
    });

    return {
      reviewId: review.id,
      rating: review.rating,
      comment: review.comment,
    };
  }

  async reorder(userId: string, orderId: string) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, userId },
      include: {
        OrderItem: {
          include: {
            Product: true,
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Clear current cart if exists
    const existingCart = await this.prisma.cart.findUnique({
      where: { userId },
    });

    if (existingCart) {
      await this.prisma.cartItem.deleteMany({
        where: { cartId: existingCart.id },
      });
      await this.prisma.cart.delete({
        where: { id: existingCart.id },
      });
    }

    // Create new cart with order items
    const firstProduct = order.OrderItem[0].Product;
    const cart = await this.prisma.cart.create({
      data: {
        id: uuidv4(),
        userId,
        storeId: firstProduct.storeId,
        updatedAt: new Date(),
        CartItem: {
          create: order.OrderItem.map((item) => ({
            id: uuidv4(),
            productId: item.productId,
            quantity: item.quantity,
            price: item.Product.discountedPrice || item.Product.price,
            updatedAt: new Date(),
          })),
        },
      },
      include: {
        CartItem: {
          include: {
            Product: {
              include: {
                Store: true,
              },
            },
          },
        },
      },
    });

    return {
      success: true,
      message: 'Items added to cart',
      cartItemCount: cart.CartItem.length,
    };
  }

  private mapOrderToDto(order: any) {
    return {
      id: order.id,
      trackingId: order.trackingId,
      status: order.status,
      subtotal: order.subtotal,
      discountAmount: order.discountAmount,
      deliveryFee: order.deliveryFee,
      tax: order.tax,
      totalAmount: order.totalAmount,
      items:
        order.OrderItem?.map((item: any) => ({
          id: item.id,
          product: {
            id: item.Product.id,
            name: item.Product.name,
            imageUrl: item.Product.imageUrl,
            store: item.Product.Store,
          },
          quantity: item.quantity,
          price: item.price,
          subtotal: item.price * item.quantity,
        })) || [],
      address: order.Address
        ? {
            address: order.Address.address,
            city: order.Address.city,
            contactName: order.Address.contactName,
            contactPhone: order.Address.contactPhone,
          }
        : null,
      payments:
        order.Payment?.map((p: any) => ({
          id: p.id,
          amount: p.amount,
          method: p.method,
          status: p.status,
          reference: p.reference,
        })) || [],
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    };
  }
}
