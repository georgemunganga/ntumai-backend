import { Injectable } from '@nestjs/common';
import { Order } from '../entities/order.entity';
import { OrderItem } from '../entities/order-item.entity';
import { Cart } from '../entities/cart.entity';
import { Product } from '../entities/product.entity';
import { Price } from '../value-objects/price.vo';
import { OrderStatus } from '../value-objects/order-status.vo';
import { PaymentDetails } from '../value-objects/payment-details.vo';
import { DeliveryInfo } from '../value-objects/delivery-info.vo';
import { PricingService } from './pricing.service';

export interface OrderCreationData {
  userId: string;
  storeId?: string;
  shippingAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  billingAddress?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  paymentMethod: string;
  deliveryMethod: string;
  specialInstructions?: string;
  giftMessage?: string;
  promotionCodes?: string[];
}

export interface OrderValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  blockers: string[]; // Issues that prevent order creation
}

export interface OrderFulfillmentPlan {
  canFulfill: boolean;
  estimatedShipDate: Date;
  estimatedDeliveryDate: Date;
  shippingMethod: string;
  trackingAvailable: boolean;
  splitShipments: Array<{
    items: string[];
    estimatedShipDate: Date;
    reason: string;
  }>;
}

export interface OrderStatusTransition {
  fromStatus: string;
  toStatus: string;
  isValid: boolean;
  reason?: string;
  requiredActions?: string[];
}

export interface OrderRefundCalculation {
  refundableAmount: Price;
  refundBreakdown: {
    items: Price;
    shipping: Price;
    tax: Price;
    fees: Price;
  };
  nonRefundableAmount: Price;
  refundMethod: 'original_payment' | 'store_credit' | 'gift_card';
}

@Injectable()
export class OrderService {
  constructor(private readonly pricingService: PricingService) {}

  // Order Creation
  async createOrderFromCart(
    cart: Cart,
    orderData: OrderCreationData
  ): Promise<Order> {
    // Validate cart before creating order
    const cartValidation = await this.validateCartForOrder(cart);
    if (!cartValidation.isValid) {
      throw new Error(`Cannot create order: ${cartValidation.errors.join(', ')}`);
    }

    // Calculate final pricing
    const pricing = await this.pricingService.calculateCartPricing(cart, {
      promotionCodes: orderData.promotionCodes,
      shippingAddress: orderData.shippingAddress,
      deliveryMethod: orderData.deliveryMethod
    });

    // Generate order number
    const orderNumber = await this.generateOrderNumber();

    // Create order items from cart items
    const orderItems = await this.createOrderItemsFromCart(cart);

    // Create payment details
    const paymentDetails = PaymentDetails.create({
      method: orderData.paymentMethod,
      amount: pricing.total,
      currency: pricing.total.currency,
      status: 'pending'
    });

    // Create delivery info
    const deliveryInfo = DeliveryInfo.create({
      method: orderData.deliveryMethod,
      address: orderData.shippingAddress,
      estimatedDelivery: await this.calculateEstimatedDelivery(
        orderData.deliveryMethod,
        orderData.shippingAddress
      ),
      cost: pricing.shipping
    });

    // Create order
    const order = Order.create({
      orderNumber,
      userId: orderData.userId,
      storeId: orderData.storeId,
      items: orderItems,
      status: OrderStatus.create('pending'),
      subtotal: pricing.subtotal,
      tax: pricing.tax,
      shipping: pricing.shipping,
      discount: pricing.discount,
      total: pricing.total,
      currency: pricing.total.currency,
      paymentDetails,
      deliveryInfo,
      billingAddress: orderData.billingAddress || orderData.shippingAddress,
      specialInstructions: orderData.specialInstructions,
      giftMessage: orderData.giftMessage,
      promotionCodes: orderData.promotionCodes || [],
      createdAt: new Date(),
      updatedAt: new Date()
    });

    return order;
  }

  async validateCartForOrder(cart: Cart): Promise<OrderValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];
    const blockers: string[] = [];

    if (cart.isEmpty()) {
      blockers.push('Cart is empty');
      return { isValid: false, errors, warnings, blockers };
    }

    // Validate each cart item
    for (const item of cart.items) {
      const product = await this.getProduct(item.productId);
      
      // Check product availability
      if (!product.isAvailableForPurchase()) {
        blockers.push(`Product ${product.name} is not available for purchase`);
      }

      // Check stock availability
      const availableQuantity = product.getAvailableQuantity(item.variantId);
      if (item.quantity > availableQuantity) {
        if (availableQuantity === 0) {
          blockers.push(`Product ${product.name} is out of stock`);
        } else {
          errors.push(`Only ${availableQuantity} units of ${product.name} available`);
        }
      }

      // Check quantity limits
      if (item.quantity < product.getMinOrderQuantity()) {
        errors.push(`Minimum order quantity for ${product.name} is ${product.getMinOrderQuantity()}`);
      }

      if (item.quantity > product.getMaxOrderQuantity()) {
        errors.push(`Maximum order quantity for ${product.name} is ${product.getMaxOrderQuantity()}`);
      }

      // Check for price changes
      if (!item.unitPrice.equals(product.price)) {
        warnings.push(`Price for ${product.name} has changed`);
      }
    }

    return {
      isValid: blockers.length === 0 && errors.length === 0,
      errors,
      warnings,
      blockers
    };
  }

  // Order Status Management
  async updateOrderStatus(
    order: Order,
    newStatus: string,
    reason?: string
  ): Promise<Order> {
    const transition = this.validateStatusTransition(
      order.status.value,
      newStatus
    );

    if (!transition.isValid) {
      throw new Error(`Invalid status transition: ${transition.reason}`);
    }

    // Perform any required actions for the status change
    if (transition.requiredActions) {
      await this.performStatusTransitionActions(order, transition.requiredActions);
    }

    return order.updateStatus(OrderStatus.create(newStatus), reason);
  }

  validateStatusTransition(
    fromStatus: string,
    toStatus: string
  ): OrderStatusTransition {
    const validTransitions: Record<string, string[]> = {
      'pending': ['confirmed', 'cancelled'],
      'confirmed': ['processing', 'cancelled'],
      'processing': ['shipped', 'cancelled'],
      'shipped': ['delivered', 'returned'],
      'delivered': ['completed', 'returned'],
      'completed': ['returned'],
      'cancelled': [], // Terminal state
      'returned': ['refunded'],
      'refunded': [] // Terminal state
    };

    const allowedTransitions = validTransitions[fromStatus] || [];
    const isValid = allowedTransitions.includes(toStatus);

    let reason: string | undefined;
    let requiredActions: string[] | undefined;

    if (!isValid) {
      reason = `Cannot transition from ${fromStatus} to ${toStatus}`;
    } else {
      // Define required actions for specific transitions
      if (fromStatus === 'pending' && toStatus === 'confirmed') {
        requiredActions = ['validate_payment', 'reserve_inventory'];
      } else if (fromStatus === 'confirmed' && toStatus === 'processing') {
        requiredActions = ['allocate_inventory', 'generate_picking_list'];
      } else if (fromStatus === 'processing' && toStatus === 'shipped') {
        requiredActions = ['generate_tracking', 'update_inventory'];
      }
    }

    return {
      fromStatus,
      toStatus,
      isValid,
      reason,
      requiredActions
    };
  }

  private async performStatusTransitionActions(
    order: Order,
    actions: string[]
  ): Promise<void> {
    for (const action of actions) {
      switch (action) {
        case 'validate_payment':
          await this.validatePayment(order);
          break;
        case 'reserve_inventory':
          await this.reserveInventory(order);
          break;
        case 'allocate_inventory':
          await this.allocateInventory(order);
          break;
        case 'generate_picking_list':
          await this.generatePickingList(order);
          break;
        case 'generate_tracking':
          await this.generateTrackingNumber(order);
          break;
        case 'update_inventory':
          await this.updateInventoryAfterShipment(order);
          break;
      }
    }
  }

  // Order Fulfillment
  async createFulfillmentPlan(order: Order): Promise<OrderFulfillmentPlan> {
    const canFulfill = await this.canFulfillOrder(order);
    const splitShipments: OrderFulfillmentPlan['splitShipments'] = [];

    if (!canFulfill) {
      return {
        canFulfill: false,
        estimatedShipDate: new Date(),
        estimatedDeliveryDate: new Date(),
        shippingMethod: '',
        trackingAvailable: false,
        splitShipments
      };
    }

    // Check if items need to be split across shipments
    const itemAvailability = await this.checkItemAvailability(order);
    const availableItems: string[] = [];
    const backorderItems: string[] = [];

    for (const [itemId, availability] of Object.entries(itemAvailability)) {
      if (availability.available) {
        availableItems.push(itemId);
      } else {
        backorderItems.push(itemId);
        splitShipments.push({
          items: [itemId],
          estimatedShipDate: availability.expectedDate || new Date(),
          reason: 'backorder'
        });
      }
    }

    const estimatedShipDate = this.calculateEstimatedShipDate(order);
    const estimatedDeliveryDate = await this.calculateEstimatedDelivery(
      order.deliveryInfo.method,
      order.deliveryInfo.address
    );

    return {
      canFulfill: true,
      estimatedShipDate,
      estimatedDeliveryDate,
      shippingMethod: order.deliveryInfo.method,
      trackingAvailable: true,
      splitShipments
    };
  }

  // Order Modifications
  async addItemToOrder(
    order: Order,
    product: Product,
    quantity: number,
    variantId?: string
  ): Promise<Order> {
    // Only allow modifications for certain statuses
    if (!['pending', 'confirmed'].includes(order.status.value)) {
      throw new Error('Cannot modify order in current status');
    }

    // Validate item can be added
    const validation = await this.validateOrderItem(product, quantity, variantId);
    if (!validation.isValid) {
      throw new Error(`Cannot add item: ${validation.errors.join(', ')}`);
    }

    // Create order item
    const orderItem = OrderItem.create({
      productId: product.id,
      variantId,
      quantity,
      unitPrice: product.price,
      totalPrice: new Price(product.price.amount * quantity, product.price.currency),
      productSnapshot: product.toSnapshot()
    });

    // Add item and recalculate totals
    const updatedOrder = order.addItem(orderItem);
    return this.recalculateOrderTotals(updatedOrder);
  }

  async removeItemFromOrder(order: Order, itemId: string): Promise<Order> {
    // Only allow modifications for certain statuses
    if (!['pending', 'confirmed'].includes(order.status.value)) {
      throw new Error('Cannot modify order in current status');
    }

    const updatedOrder = order.removeItem(itemId);
    return this.recalculateOrderTotals(updatedOrder);
  }

  async updateItemQuantity(
    order: Order,
    itemId: string,
    quantity: number
  ): Promise<Order> {
    // Only allow modifications for certain statuses
    if (!['pending', 'confirmed'].includes(order.status.value)) {
      throw new Error('Cannot modify order in current status');
    }

    if (quantity <= 0) {
      return this.removeItemFromOrder(order, itemId);
    }

    const item = order.getItem(itemId);
    if (!item) {
      throw new Error('Order item not found');
    }

    // Validate new quantity
    const product = await this.getProduct(item.productId);
    const validation = await this.validateOrderItem(product, quantity, item.variantId);
    
    if (!validation.isValid) {
      throw new Error(`Cannot update quantity: ${validation.errors.join(', ')}`);
    }

    const updatedOrder = order.updateItemQuantity(itemId, quantity);
    return this.recalculateOrderTotals(updatedOrder);
  }

  // Order Cancellation and Returns
  async cancelOrder(order: Order, reason: string): Promise<Order> {
    const transition = this.validateStatusTransition(order.status.value, 'cancelled');
    if (!transition.isValid) {
      throw new Error(`Cannot cancel order: ${transition.reason}`);
    }

    // Release reserved inventory
    await this.releaseReservedInventory(order);

    // Process refund if payment was captured
    if (order.paymentDetails.status === 'captured') {
      await this.processRefund(order, order.total, 'order_cancelled');
    }

    return order.cancel(reason);
  }

  async calculateRefund(
    order: Order,
    itemsToRefund?: string[],
    refundShipping: boolean = false
  ): Promise<OrderRefundCalculation> {
    let itemsAmount = new Price(0, order.currency);
    let shippingAmount = new Price(0, order.currency);
    let taxAmount = new Price(0, order.currency);
    let feesAmount = new Price(0, order.currency);

    // Calculate refundable items amount
    if (itemsToRefund) {
      for (const itemId of itemsToRefund) {
        const item = order.getItem(itemId);
        if (item) {
          itemsAmount = itemsAmount.add(item.totalPrice);
        }
      }
    } else {
      // Refund all items
      itemsAmount = order.subtotal;
    }

    // Calculate refundable shipping
    if (refundShipping) {
      shippingAmount = order.shipping;
    }

    // Calculate proportional tax
    const taxRate = order.tax.amount / order.subtotal.amount;
    taxAmount = new Price(itemsAmount.amount * taxRate, order.currency);

    const refundableAmount = itemsAmount.add(shippingAmount).add(taxAmount);
    const nonRefundableAmount = order.total.subtract(refundableAmount);

    return {
      refundableAmount,
      refundBreakdown: {
        items: itemsAmount,
        shipping: shippingAmount,
        tax: taxAmount,
        fees: feesAmount
      },
      nonRefundableAmount,
      refundMethod: 'original_payment'
    };
  }

  // Helper Methods
  private async createOrderItemsFromCart(cart: Cart): Promise<OrderItem[]> {
    const orderItems: OrderItem[] = [];

    for (const cartItem of cart.items) {
      const product = await this.getProduct(cartItem.productId);
      
      const orderItem = OrderItem.create({
        productId: cartItem.productId,
        variantId: cartItem.variantId,
        quantity: cartItem.quantity,
        unitPrice: cartItem.unitPrice,
        totalPrice: new Price(
          cartItem.unitPrice.amount * cartItem.quantity,
          cartItem.unitPrice.currency
        ),
        productSnapshot: product.toSnapshot(),
        customizations: cartItem.customizations
      });

      orderItems.push(orderItem);
    }

    return orderItems;
  }

  private async generateOrderNumber(): Promise<string> {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `ORD-${timestamp}-${random}`;
  }

  private async calculateEstimatedDelivery(
    deliveryMethod: string,
    address: any
  ): Promise<Date> {
    // This would typically integrate with shipping providers
    const deliveryDays = this.getDeliveryDays(deliveryMethod);
    const estimatedDate = new Date();
    estimatedDate.setDate(estimatedDate.getDate() + deliveryDays);
    return estimatedDate;
  }

  private getDeliveryDays(deliveryMethod: string): number {
    const deliveryTimes: Record<string, number> = {
      'standard': 5,
      'express': 2,
      'overnight': 1,
      'same_day': 0
    };
    return deliveryTimes[deliveryMethod] || 5;
  }

  private calculateEstimatedShipDate(order: Order): Date {
    const processingDays = 1; // Default processing time
    const shipDate = new Date();
    shipDate.setDate(shipDate.getDate() + processingDays);
    return shipDate;
  }

  private async recalculateOrderTotals(order: Order): Promise<Order> {
    // This would recalculate all order totals based on current items
    // For now, return the order as-is
    return order;
  }

  // Placeholder methods that would integrate with other services
  private async getProduct(productId: string): Promise<Product> {
    throw new Error('Product repository integration needed');
  }

  private async validateOrderItem(product: Product, quantity: number, variantId?: string): Promise<{ isValid: boolean; errors: string[] }> {
    // Similar to cart validation logic
    return { isValid: true, errors: [] };
  }

  private async validatePayment(order: Order): Promise<void> {
    // Payment validation logic
  }

  private async reserveInventory(order: Order): Promise<void> {
    // Inventory reservation logic
  }

  private async allocateInventory(order: Order): Promise<void> {
    // Inventory allocation logic
  }

  private async generatePickingList(order: Order): Promise<void> {
    // Picking list generation logic
  }

  private async generateTrackingNumber(order: Order): Promise<void> {
    // Tracking number generation logic
  }

  private async updateInventoryAfterShipment(order: Order): Promise<void> {
    // Inventory update logic
  }

  private async canFulfillOrder(order: Order): Promise<boolean> {
    // Order fulfillment validation logic
    return true;
  }

  private async checkItemAvailability(order: Order): Promise<Record<string, { available: boolean; expectedDate?: Date }>> {
    // Item availability checking logic
    return {};
  }

  private async releaseReservedInventory(order: Order): Promise<void> {
    // Release inventory logic
  }

  private async processRefund(order: Order, amount: Price, reason: string): Promise<void> {
    // Refund processing logic
  }
}