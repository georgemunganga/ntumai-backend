import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../../../../shared/infrastructure/prisma.service';
import { v4 as uuidv4 } from 'uuid';
import { DeliveryService } from '../../../../deliveries/application/services/delivery.service';
import { TrackingService } from '../../../../tracking/application/services/tracking.service';
import { ChatService } from '../../../../chat/application/services/chat.service';
import { ChatContextTypeDto } from '../../../../chat/application/dtos/chat.dto';
import { NotificationsService } from '../../../../notifications/application/services/notifications.service';
import { VehicleType } from '../../../../deliveries/application/dtos/create-delivery.dto';

@Injectable()
export class OrderService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly deliveryService: DeliveryService,
    private readonly trackingService: TrackingService,
    private readonly chatService: ChatService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async calculateDelivery(userId: string, addressId: string) {
    const address = await this.prisma.address.findFirst({
      where: { id: addressId, userId },
    });

    if (!address) {
      throw new NotFoundException('Address not found');
    }

    const cart = await this.prisma.cart.findUnique({
      where: { userId },
      select: { storeId: true },
    });

    if (!cart?.storeId) {
      throw new BadRequestException('Cart is empty');
    }

    const quote = await this.calculateMarketplaceDeliveryQuote(
      userId,
      addressId,
      cart.storeId,
    );

    return {
      deliveryFee: quote.calc_payload.total,
      estimatedDeliveryTime: new Date(
        Date.now() + quote.estimated_duration_minutes * 60 * 1000,
      ),
      distanceKm: quote.distance_km,
    };
  }

  private async calculateMarketplaceDeliveryQuote(
    userId: string,
    addressId: string,
    storeId: string,
  ) {
    const [address, store] = await Promise.all([
      this.prisma.address.findFirst({
        where: { id: addressId, userId },
      }),
      this.prisma.store.findUnique({
        where: { id: storeId },
        select: {
          vendorId: true,
        },
      }),
    ]);

    if (!address) {
      throw new NotFoundException('Address not found');
    }

    if (!store) {
      throw new NotFoundException('Store not found');
    }

    const vendorAddress = await this.prisma.address.findFirst({
      where: { userId: store.vendorId },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
      select: {
        latitude: true,
        longitude: true,
      },
    });

    if (!vendorAddress) {
      return this.deliveryService.estimatePricing({
        vehicle_type: VehicleType.MOTORBIKE,
        points: [
          { lat: address.latitude, lng: address.longitude },
          { lat: address.latitude, lng: address.longitude },
        ],
        parcel_size: 'medium',
        fragile: false,
      });
    }

    return this.deliveryService.estimatePricing({
      vehicle_type: VehicleType.MOTORBIKE,
      points: [
        { lat: vendorAddress.latitude, lng: vendorAddress.longitude },
        { lat: address.latitude, lng: address.longitude },
      ],
      parcel_size: 'medium',
      fragile: false,
    });
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

    if (!cart.storeId) {
      throw new BadRequestException('Cart store is missing');
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
    const deliveryCalc = await this.calculateMarketplaceDeliveryQuote(
      userId,
      addressId,
      cart.storeId,
    );
    const deliveryFee = deliveryCalc.calc_payload.total;
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

    const payload = this.mapOrderToDto(order);

    await this.notificationsService.createNotification({
      userId,
      title: 'Order placed',
      message: `Your order ${order.trackingId} has been placed successfully.`,
      type: 'ORDER_UPDATE',
      metadata: {
        entityType: 'order',
        entityId: order.id,
        trackingId: order.trackingId,
        sourceStatus: 'PENDING',
        statusLabel: 'Order Received',
      },
    });

    return payload;
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

    await this.notificationsService.createNotification({
      userId,
      title: 'Order confirmed',
      message: `Your order ${order.trackingId || orderId} is confirmed and queued for preparation.`,
      type: 'ORDER_UPDATE',
      metadata: {
        entityType: 'order',
        entityId: orderId,
        trackingId: order.trackingId || null,
        sourceStatus: 'ACCEPTED',
        statusLabel: 'Vendor Confirmed',
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
      orders: await Promise.all(orders.map((o) => this.mapOrderToDto(o))),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getOrderTracking(userId: string, orderId: string) {
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

    const deliveries = await this.deliveryService.getMyDeliveries(
      userId,
      'customer',
      1,
      200,
    );

    const linkedDelivery = (deliveries?.data || []).find((delivery: any) => {
      try {
        const metadata = delivery.more_info ? JSON.parse(delivery.more_info) : {};
        return String(metadata.marketplace_order_id || '') === String(orderId);
      } catch {
        return false;
      }
    });

    const tracking = linkedDelivery
      ? await this.trackingService.getTrackingByDelivery(linkedDelivery.id)
      : null;

    return {
      order: await this.mapOrderToDto(order),
      linkedDelivery: linkedDelivery
        ? {
            id: linkedDelivery.id,
            status: linkedDelivery.order_status,
            riderId: linkedDelivery.rider_id,
            updatedAt: linkedDelivery.updated_at.toISOString(),
          }
        : null,
      tracking,
    };
  }

  async cancelOrder(userId: string, orderId: string, reason?: string) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, userId },
      include: {
        OrderItem: true,
        Payment: true,
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

    const refundResult = await this.refundPaidPayments(order.id);

    await this.notificationsService.createNotification({
      userId,
      title: 'Order cancelled',
      message: refundResult.refunded
        ? `Your order ${order.trackingId} was cancelled. K${refundResult.amount.toFixed(2)} has been marked for refund.`
        : `Your order ${order.trackingId} was cancelled successfully.`,
      type: 'ORDER_UPDATE',
      metadata: {
        entityType: 'order',
        entityId: order.id,
        trackingId: order.trackingId,
        sourceStatus: 'CANCELLED',
        statusLabel: 'Cancelled',
        notificationType: refundResult.refunded
          ? 'order_cancelled_refund'
          : 'order_cancelled',
        refundAmount: refundResult.refunded ? refundResult.amount : 0,
      },
    });

    return {
      success: true,
      message: refundResult.refunded
        ? 'Order cancelled and refund recorded'
        : 'Order cancelled successfully',
      refund: refundResult,
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

    const existingReview = await this.prisma.review.findFirst({
      where: {
        userId,
        entityType: 'ORDER',
        entityId: orderId,
      },
    });

    if (existingReview) {
      throw new ConflictException('You have already rated this order');
    }

    // Create review for the order
    const review = await this.prisma.review.create({
      data: {
        id: uuidv4(),
        userId,
        entityId: orderId,
        entityType: 'ORDER',
        orderId,
        contextType: 'order',
        contextId: orderId,
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

  private async mapOrderToDto(order: any) {
    const conversationId = await this.chatService.findExistingConversationId(
      ChatContextTypeDto.MARKETPLACE_ORDER,
      order.id,
    );

    return {
      id: order.id,
      trackingId: order.trackingId,
      conversationId,
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

  private async refundPaidPayments(orderId: string) {
    const paidPayments = await this.prisma.payment.findMany({
      where: {
        orderId,
        status: 'PAID',
      },
    });

    if (paidPayments.length === 0) {
      return { refunded: false, amount: 0 };
    }

    const totalAmount = paidPayments.reduce(
      (sum, payment) => sum + payment.amount,
      0,
    );

    await this.prisma.payment.updateMany({
      where: {
        orderId,
        status: 'PAID',
      },
      data: {
        status: 'REFUNDED',
        updatedAt: new Date(),
      },
    });

    return {
      refunded: true,
      amount: totalAmount,
    };
  }
}
