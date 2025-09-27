import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { OrderRepository } from '../../domain/repositories/order.repository';
import { CartRepository } from '../../domain/repositories/cart.repository';
import { ProductRepository } from '../../domain/repositories/product.repository';
import { Order } from '../../domain/entities/order.entity';
import { OrderService } from '../../domain/services/order.service';
import { PricingService } from '../../domain/services/pricing.service';
import { OrderStatus } from '../../domain/value-objects/order-status.value-object';
import { PaymentDetails } from '../../domain/value-objects/payment-details.value-object';
import { DeliveryInfo } from '../../domain/value-objects/delivery-info.value-object';

export interface CreateOrderData {
  userId: string;
  cartId?: string;
  deliveryAddressId: string;
  paymentMethodId: string;
  specialInstructions?: string;
  scheduledDeliveryTime?: Date;
  promotionCodes?: string[];
  giftCardCodes?: string[];
}

export interface OrderSearchFilters {
  userId?: string;
  storeId?: string;
  status?: string;
  paymentStatus?: string;
  deliveryStatus?: string;
  orderNumber?: string;
  dateFrom?: Date;
  dateTo?: Date;
  minTotal?: number;
  maxTotal?: number;
  paymentMethod?: string;
  deliveryMethod?: string;
  page?: number;
  limit?: number;
  sortBy?: 'created' | 'total' | 'status' | 'delivery';
  sortOrder?: 'asc' | 'desc';
}

export interface OrderSearchResult {
  orders: Order[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface OrderSummary {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  deliveryStatus: string;
  total: number;
  currency: string;
  itemCount: number;
  createdAt: Date;
  estimatedDelivery?: Date;
  trackingNumber?: string;
}

export interface OrderDetails {
  order: Order;
  items: Array<{
    id: string;
    productId: string;
    productName: string;
    productImage?: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    variantOptions?: Record<string, string>;
  }>;
  pricing: {
    subtotal: number;
    discounts: number;
    tax: number;
    shipping: number;
    total: number;
    currency: string;
  };
  delivery: {
    address: any; // Address entity
    method: string;
    estimatedDate?: Date;
    trackingNumber?: string;
    instructions?: string;
  };
  payment: {
    method: string;
    status: string;
    transactionId?: string;
    paidAt?: Date;
  };
}

export interface OrderStatusUpdate {
  status: string;
  reason?: string;
  estimatedDelivery?: Date;
  trackingNumber?: string;
  notes?: string;
}

export interface OrderModification {
  type: 'add_item' | 'remove_item' | 'update_quantity' | 'update_address' | 'update_delivery_time';
  data: any;
  reason?: string;
}

export interface OrderRefund {
  orderId: string;
  items?: Array<{ itemId: string; quantity?: number; reason: string }>;
  amount?: number;
  reason: string;
  refundMethod?: 'original' | 'store_credit' | 'gift_card';
}

export interface OrderAnalytics {
  totalOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  ordersByStatus: Record<string, number>;
  ordersByPaymentStatus: Record<string, number>;
  topProducts: Array<{ productId: string; quantity: number; revenue: number }>;
  customerMetrics: {
    newCustomers: number;
    returningCustomers: number;
    averageOrdersPerCustomer: number;
  };
  timeMetrics: {
    averageProcessingTime: number;
    averageDeliveryTime: number;
    onTimeDeliveryRate: number;
  };
}

@Injectable()
export class OrderApplicationService {
  constructor(
    private readonly orderRepository: OrderRepository,
    private readonly cartRepository: CartRepository,
    private readonly productRepository: ProductRepository,
    private readonly orderService: OrderService,
    private readonly pricingService: PricingService,
  ) {}

  // Order Creation
  async createOrder(data: CreateOrderData): Promise<Order> {
    // Get user's cart
    const cart = data.cartId 
      ? await this.cartRepository.findById(data.cartId)
      : await this.cartRepository.findByUserId(data.userId);

    if (!cart || cart.getItems().length === 0) {
      throw new BadRequestException('Cart is empty or not found');
    }

    // Validate cart for order creation
    const validationResult = await this.orderService.validateCartForOrder(cart);
    if (!validationResult.isValid) {
      throw new BadRequestException(`Cart validation failed: ${validationResult.errors.join(', ')}`);
    }

    // Create order from cart
    const orderCreationData = {
      cart,
      deliveryAddressId: data.deliveryAddressId,
      paymentMethodId: data.paymentMethodId,
      specialInstructions: data.specialInstructions,
      scheduledDeliveryTime: data.scheduledDeliveryTime,
      promotionCodes: data.promotionCodes || [],
      giftCardCodes: data.giftCardCodes || [],
    };

    const order = await this.orderService.createOrderFromCart(orderCreationData);

    // Save order
    const savedOrder = await this.orderRepository.create(order);

    // Clear cart after successful order creation
    await this.cartRepository.clearCart(cart.getId());

    // Trigger order confirmation events (email, SMS, etc.)
    this.triggerOrderConfirmationEvents(savedOrder).catch(error => {
      console.error('Failed to trigger order confirmation events:', error);
    });

    return savedOrder;
  }

  async createOrderFromProducts(data: {
    userId: string;
    items: Array<{ productId: string; quantity: number; variantOptions?: Record<string, string> }>;
    deliveryAddressId: string;
    paymentMethodId: string;
    specialInstructions?: string;
    scheduledDeliveryTime?: Date;
    promotionCodes?: string[];
    giftCardCodes?: string[];
  }): Promise<Order> {
    // Validate products and create temporary cart-like structure
    const cartItems = [];
    for (const item of data.items) {
      const product = await this.productRepository.findById(item.productId);
      if (!product) {
        throw new NotFoundException(`Product ${item.productId} not found`);
      }
      if (!product.isActive()) {
        throw new BadRequestException(`Product ${product.getDetails().name} is not available`);
      }
      if (product.getStock() < item.quantity) {
        throw new BadRequestException(`Insufficient stock for product ${product.getDetails().name}`);
      }
      cartItems.push(item);
    }

    // Create order directly from items
    const orderCreationData = {
      userId: data.userId,
      items: cartItems,
      deliveryAddressId: data.deliveryAddressId,
      paymentMethodId: data.paymentMethodId,
      specialInstructions: data.specialInstructions,
      scheduledDeliveryTime: data.scheduledDeliveryTime,
      promotionCodes: data.promotionCodes || [],
      giftCardCodes: data.giftCardCodes || [],
    };

    const order = await this.orderService.createOrderFromItems(orderCreationData);
    return await this.orderRepository.create(order);
  }

  // Order Retrieval
  async getOrderById(id: string, userId?: string): Promise<Order> {
    const order = await this.orderRepository.findById(id);
    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Check if user has permission to view this order
    if (userId && order.getUserId() !== userId) {
      throw new ForbiddenException('Access denied');
    }

    return order;
  }

  async getOrderByNumber(orderNumber: string, userId?: string): Promise<Order> {
    const order = await this.orderRepository.findByOrderNumber(orderNumber);
    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (userId && order.getUserId() !== userId) {
      throw new ForbiddenException('Access denied');
    }

    return order;
  }

  async getOrderDetails(id: string, userId?: string): Promise<OrderDetails> {
    const order = await this.getOrderById(id, userId);
    
    // Get product details for order items
    const productIds = order.getItems().map(item => item.getProductId());
    const products = await this.productRepository.findByIds(productIds);
    
    const items = order.getItems().map(item => {
      const product = products.find(p => p.getId() === item.getProductId());
      return {
        id: item.getId(),
        productId: item.getProductId(),
        productName: product?.getDetails().name || 'Unknown Product',
        productImage: product?.getDetails().imageUrls[0],
        quantity: item.getQuantity(),
        unitPrice: item.getPrice(),
        totalPrice: item.getPrice() * item.getQuantity(),
        variantOptions: item.getVariantOptions(),
      };
    });

    return {
      order,
      items,
      pricing: {
        subtotal: order.getSubtotal(),
        discounts: order.getDiscountAmount(),
        tax: order.getTaxAmount(),
        shipping: order.getShippingAmount(),
        total: order.getTotal(),
        currency: order.getCurrency(),
      },
      delivery: {
        address: order.getDeliveryInfo().address,
        method: order.getDeliveryInfo().method,
        estimatedDate: order.getDeliveryInfo().estimatedDate,
        trackingNumber: order.getDeliveryInfo().trackingNumber,
        instructions: order.getSpecialInstructions(),
      },
      payment: {
        method: order.getPaymentDetails().method,
        status: order.getPaymentDetails().status,
        transactionId: order.getPaymentDetails().transactionId,
        paidAt: order.getPaymentDetails().paidAt,
      },
    };
  }

  // Order Search and Filtering
  async searchOrders(filters: OrderSearchFilters): Promise<OrderSearchResult> {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const offset = (page - 1) * limit;

    const { orders, total } = await this.orderRepository.findWithFilters({
      ...filters,
      offset,
      limit,
    });

    const totalPages = Math.ceil(total / limit);

    return {
      orders,
      total,
      page,
      limit,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    };
  }

  async getUserOrders(userId: string, page: number = 1, limit: number = 20): Promise<OrderSearchResult> {
    return await this.searchOrders({ userId, page, limit });
  }

  async getStoreOrders(storeId: string, page: number = 1, limit: number = 20): Promise<OrderSearchResult> {
    return await this.searchOrders({ storeId, page, limit });
  }

  // Order Status Management
  async updateOrderStatus(id: string, update: OrderStatusUpdate): Promise<Order> {
    const order = await this.orderRepository.findById(id);
    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Validate status transition
    const validationResult = await this.orderService.validateStatusTransition(
      order,
      update.status,
      update.reason,
    );

    if (!validationResult.isValid) {
      throw new BadRequestException(`Invalid status transition: ${validationResult.errors.join(', ')}`);
    }

    // Update order status
    await this.orderService.updateOrderStatus(
      order,
      update.status,
      update.reason,
      update.estimatedDelivery,
      update.trackingNumber,
      update.notes,
    );

    const updatedOrder = await this.orderRepository.update(order);

    // Trigger status update events
    this.triggerOrderStatusUpdateEvents(updatedOrder, update).catch(error => {
      console.error('Failed to trigger order status update events:', error);
    });

    return updatedOrder;
  }

  async cancelOrder(id: string, reason: string, userId?: string): Promise<Order> {
    const order = await this.orderRepository.findById(id);
    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Check permissions
    if (userId && order.getUserId() !== userId) {
      throw new ForbiddenException('Access denied');
    }

    // Validate cancellation
    if (!order.canBeCancelled()) {
      throw new BadRequestException('Order cannot be cancelled at this stage');
    }

    // Cancel order
    await this.orderService.cancelOrder(order, reason);
    return await this.orderRepository.update(order);
  }

  // Order Modifications
  async modifyOrder(id: string, modification: OrderModification): Promise<Order> {
    const order = await this.orderRepository.findById(id);
    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Check if order can be modified
    if (!order.canBeModified()) {
      throw new BadRequestException('Order cannot be modified at this stage');
    }

    switch (modification.type) {
      case 'add_item':
        await this.orderService.addItemToOrder(order, modification.data);
        break;
      case 'remove_item':
        await this.orderService.removeItemFromOrder(order, modification.data.itemId);
        break;
      case 'update_quantity':
        await this.orderService.updateOrderItemQuantity(
          order,
          modification.data.itemId,
          modification.data.quantity,
        );
        break;
      case 'update_address':
        await this.orderService.updateDeliveryAddress(order, modification.data.addressId);
        break;
      case 'update_delivery_time':
        await this.orderService.updateDeliveryTime(order, modification.data.deliveryTime);
        break;
      default:
        throw new BadRequestException('Invalid modification type');
    }

    // Recalculate order totals
    await this.orderService.recalculateOrderTotals(order);

    return await this.orderRepository.update(order);
  }

  // Order Refunds
  async processRefund(refundData: OrderRefund): Promise<{
    order: Order;
    refundAmount: number;
    refundId: string;
  }> {
    const order = await this.orderRepository.findById(refundData.orderId);
    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Calculate refund amount
    const refundCalculation = await this.orderService.calculateRefund(
      order,
      refundData.items,
      refundData.amount,
    );

    if (refundCalculation.amount <= 0) {
      throw new BadRequestException('Invalid refund amount');
    }

    // Process refund
    const refundResult = await this.orderService.processRefund(
      order,
      refundCalculation,
      refundData.reason,
      refundData.refundMethod,
    );

    const updatedOrder = await this.orderRepository.update(order);

    return {
      order: updatedOrder,
      refundAmount: refundResult.amount,
      refundId: refundResult.refundId,
    };
  }

  // Order Analytics
  async getOrderAnalytics(filters: {
    storeId?: string;
    dateFrom?: Date;
    dateTo?: Date;
  }): Promise<OrderAnalytics> {
    return await this.orderRepository.getAnalytics(filters);
  }

  async getOrderSummaries(orderIds: string[]): Promise<OrderSummary[]> {
    const orders = await this.orderRepository.findByIds(orderIds);
    
    return orders.map(order => ({
      id: order.getId(),
      orderNumber: order.getOrderNumber(),
      status: order.getStatus().value,
      paymentStatus: order.getPaymentDetails().status,
      deliveryStatus: order.getDeliveryInfo().status,
      total: order.getTotal(),
      currency: order.getCurrency(),
      itemCount: order.getItems().length,
      createdAt: order.getCreatedAt(),
      estimatedDelivery: order.getDeliveryInfo().estimatedDate,
      trackingNumber: order.getDeliveryInfo().trackingNumber,
    }));
  }

  // Helper Methods
  private async triggerOrderConfirmationEvents(order: Order): Promise<void> {
    // This would typically trigger events for:
    // - Email confirmation
    // - SMS notification
    // - Push notification
    // - Inventory updates
    // - Analytics tracking
    console.log(`Order confirmation events triggered for order ${order.getOrderNumber()}`);
  }

  private async triggerOrderStatusUpdateEvents(order: Order, update: OrderStatusUpdate): Promise<void> {
    // This would typically trigger events for:
    // - Status update notifications
    // - Delivery tracking updates
    // - Customer communications
    console.log(`Order status update events triggered for order ${order.getOrderNumber()}`);
  }

  // Bulk Operations
  async bulkUpdateOrderStatus(orderIds: string[], status: string, reason?: string): Promise<Order[]> {
    const orders = await this.orderRepository.findByIds(orderIds);
    const updatedOrders: Order[] = [];

    for (const order of orders) {
      try {
        const validationResult = await this.orderService.validateStatusTransition(order, status, reason);
        if (validationResult.isValid) {
          await this.orderService.updateOrderStatus(order, status, reason);
          const updatedOrder = await this.orderRepository.update(order);
          updatedOrders.push(updatedOrder);
        }
      } catch (error) {
        console.error(`Failed to update order ${order.getId()}:`, error);
      }
    }

    return updatedOrders;
  }

  async getOrdersByStatus(status: string, limit: number = 50): Promise<Order[]> {
    return await this.orderRepository.findByStatus(status, limit);
  }

  async getOrdersByDateRange(dateFrom: Date, dateTo: Date, limit: number = 100): Promise<Order[]> {
    return await this.orderRepository.findByDateRange(dateFrom, dateTo, limit);
  }
}