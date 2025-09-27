import { AggregateRoot } from '@nestjs/cqrs';
import { OrderId } from '../value-objects/order-id.vo';
import { UserId } from '../value-objects/user-id.vo';
import { StoreId } from '../value-objects/store-id.vo';
import { OrderItem } from './order-item.entity';
import { Price } from '../value-objects/price.vo';
import { OrderStatus } from '../value-objects/order-status.vo';
import { PaymentDetails } from '../value-objects/payment-details.vo';
import { DeliveryInfo } from '../value-objects/delivery-info.vo';
import { Address } from '../value-objects/address.vo';
import { OrderCreatedEvent } from '../events/order-created.event';
import { OrderStatusUpdatedEvent } from '../events/order-status-updated.event';
import { OrderCancelledEvent } from '../events/order-cancelled.event';
import { OrderCompletedEvent } from '../events/order-completed.event';
import { PaymentProcessedEvent } from '../events/payment-processed.event';

export interface OrderProps {
  id: OrderId;
  trackingId: string;
  userId: UserId;
  storeId: StoreId;
  items: OrderItem[];
  status: OrderStatus;
  paymentDetails: PaymentDetails;
  deliveryInfo: DeliveryInfo;
  deliveryAddress: Address;
  subtotal: Price;
  discountAmount: Price;
  deliveryFee: Price;
  tax: Price;
  total: Price;
  notes?: string;
  estimatedDeliveryTime?: Date;
  actualDeliveryTime?: Date;
  cancellationReason?: string;
  rating?: number;
  reviewComment?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class Order extends AggregateRoot {
  private constructor(private readonly props: OrderProps) {
    super();
  }

  public static create(
    userId: UserId,
    storeId: StoreId,
    items: OrderItem[],
    paymentDetails: PaymentDetails,
    deliveryAddress: Address,
    subtotal: Price,
    discountAmount: Price,
    deliveryFee: Price,
    tax: Price,
    notes?: string
  ): Order {
    if (items.length === 0) {
      throw new Error('Order must have at least one item');
    }

    const orderId = OrderId.generate();
    const trackingId = Order.generateTrackingId();
    const now = new Date();
    const total = Price.create(
      subtotal.amount - discountAmount.amount + deliveryFee.amount + tax.amount,
      subtotal.currency
    );

    const order = new Order({
      id: orderId,
      trackingId,
      userId,
      storeId,
      items,
      status: OrderStatus.PENDING,
      paymentDetails,
      deliveryInfo: DeliveryInfo.create(),
      deliveryAddress,
      subtotal,
      discountAmount,
      deliveryFee,
      tax,
      total,
      notes,
      createdAt: now,
      updatedAt: now,
    });

    order.apply(new OrderCreatedEvent(
      orderId.value,
      trackingId,
      userId.value,
      storeId.value,
      total.amount
    ));

    return order;
  }

  public static fromPersistence(props: OrderProps): Order {
    return new Order(props);
  }

  private static generateTrackingId(): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substr(2, 6).toUpperCase();
    return `NT${timestamp}${random}`;
  }

  // Getters
  get id(): OrderId {
    return this.props.id;
  }

  get trackingId(): string {
    return this.props.trackingId;
  }

  get userId(): UserId {
    return this.props.userId;
  }

  get storeId(): StoreId {
    return this.props.storeId;
  }

  get items(): OrderItem[] {
    return [...this.props.items];
  }

  get status(): OrderStatus {
    return this.props.status;
  }

  get paymentDetails(): PaymentDetails {
    return this.props.paymentDetails;
  }

  get deliveryInfo(): DeliveryInfo {
    return this.props.deliveryInfo;
  }

  get deliveryAddress(): Address {
    return this.props.deliveryAddress;
  }

  get subtotal(): Price {
    return this.props.subtotal;
  }

  get discountAmount(): Price {
    return this.props.discountAmount;
  }

  get deliveryFee(): Price {
    return this.props.deliveryFee;
  }

  get tax(): Price {
    return this.props.tax;
  }

  get total(): Price {
    return this.props.total;
  }

  get notes(): string | undefined {
    return this.props.notes;
  }

  get estimatedDeliveryTime(): Date | undefined {
    return this.props.estimatedDeliveryTime;
  }

  get actualDeliveryTime(): Date | undefined {
    return this.props.actualDeliveryTime;
  }

  get cancellationReason(): string | undefined {
    return this.props.cancellationReason;
  }

  get rating(): number | undefined {
    return this.props.rating;
  }

  get reviewComment(): string | undefined {
    return this.props.reviewComment;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  // Business methods
  public updateStatus(newStatus: OrderStatus): void {
    if (!this.canTransitionTo(newStatus)) {
      throw new Error(`Cannot transition from ${this.props.status.value} to ${newStatus.value}`);
    }

    const previousStatus = this.props.status;
    this.props.status = newStatus;
    this.props.updatedAt = new Date();

    // Set delivery time for completed orders
    if (newStatus.isCompleted() && !this.props.actualDeliveryTime) {
      this.props.actualDeliveryTime = new Date();
    }

    this.apply(new OrderStatusUpdatedEvent(
      this.props.id.value,
      previousStatus.value,
      newStatus.value
    ));

    if (newStatus.isCompleted()) {
      this.apply(new OrderCompletedEvent(
        this.props.id.value,
        this.props.userId.value,
        this.props.total.amount
      ));
    }
  }

  public processPayment(transactionId: string): void {
    if (!this.props.status.isPending()) {
      throw new Error('Can only process payment for pending orders');
    }

    this.props.paymentDetails = this.props.paymentDetails.markAsPaid(transactionId);
    this.updateStatus(OrderStatus.CONFIRMED);
    this.props.updatedAt = new Date();

    this.apply(new PaymentProcessedEvent(
      this.props.id.value,
      transactionId,
      this.props.total.amount
    ));
  }

  public cancel(reason: string): void {
    if (!this.canBeCancelled()) {
      throw new Error(`Cannot cancel order in ${this.props.status.value} status`);
    }

    this.props.status = OrderStatus.CANCELLED;
    this.props.cancellationReason = reason;
    this.props.updatedAt = new Date();

    this.apply(new OrderCancelledEvent(
      this.props.id.value,
      reason,
      this.props.userId.value
    ));
  }

  public updateDeliveryInfo(deliveryInfo: DeliveryInfo): void {
    this.props.deliveryInfo = deliveryInfo;
    this.props.updatedAt = new Date();
  }

  public setEstimatedDeliveryTime(estimatedTime: Date): void {
    this.props.estimatedDeliveryTime = estimatedTime;
    this.props.updatedAt = new Date();
  }

  public addRating(rating: number, comment?: string): void {
    if (!this.props.status.isCompleted()) {
      throw new Error('Can only rate completed orders');
    }

    if (rating < 1 || rating > 5) {
      throw new Error('Rating must be between 1 and 5');
    }

    this.props.rating = rating;
    this.props.reviewComment = comment;
    this.props.updatedAt = new Date();
  }

  public updateNotes(notes: string): void {
    if (!this.props.status.isPending() && !this.props.status.isConfirmed()) {
      throw new Error('Cannot update notes for orders in progress');
    }

    this.props.notes = notes;
    this.props.updatedAt = new Date();
  }

  private canTransitionTo(newStatus: OrderStatus): boolean {
    const currentStatus = this.props.status;
    
    // Define valid transitions
    const validTransitions: Record<string, string[]> = {
      [OrderStatus.PENDING.value]: [OrderStatus.CONFIRMED.value, OrderStatus.CANCELLED.value],
      [OrderStatus.CONFIRMED.value]: [OrderStatus.PREPARING.value, OrderStatus.CANCELLED.value],
      [OrderStatus.PREPARING.value]: [OrderStatus.READY.value, OrderStatus.CANCELLED.value],
      [OrderStatus.READY.value]: [OrderStatus.PICKED_UP.value],
      [OrderStatus.PICKED_UP.value]: [OrderStatus.IN_TRANSIT.value],
      [OrderStatus.IN_TRANSIT.value]: [OrderStatus.DELIVERED.value],
      [OrderStatus.DELIVERED.value]: [],
      [OrderStatus.CANCELLED.value]: [],
    };

    return validTransitions[currentStatus.value]?.includes(newStatus.value) || false;
  }

  public canBeCancelled(): boolean {
    return this.props.status.isPending() || 
           this.props.status.isConfirmed() || 
           this.props.status.isPreparing();
  }

  public canBeModified(): boolean {
    return this.props.status.isPending() || this.props.status.isConfirmed();
  }

  public isActive(): boolean {
    return !this.props.status.isCompleted() && !this.props.status.isCancelled();
  }

  public isDelivered(): boolean {
    return this.props.status.isDelivered();
  }

  public isCancelled(): boolean {
    return this.props.status.isCancelled();
  }

  public hasRating(): boolean {
    return this.props.rating !== undefined;
  }

  public getItemCount(): number {
    return this.props.items.reduce((sum, item) => sum + item.quantity, 0);
  }

  public getItemById(itemId: string): OrderItem | undefined {
    return this.props.items.find(item => item.id === itemId);
  }

  public calculateDeliveryTime(): Date | undefined {
    if (this.props.actualDeliveryTime) {
      return this.props.actualDeliveryTime;
    }
    return this.props.estimatedDeliveryTime;
  }

  public getTimeToDelivery(): number | undefined {
    const deliveryTime = this.calculateDeliveryTime();
    if (!deliveryTime) {
      return undefined;
    }
    return Math.max(0, deliveryTime.getTime() - Date.now());
  }

  public isOverdue(): boolean {
    if (!this.props.estimatedDeliveryTime || this.props.status.isCompleted()) {
      return false;
    }
    return new Date() > this.props.estimatedDeliveryTime;
  }

  public toSnapshot(): OrderProps {
    return {
      ...this.props,
      items: [...this.props.items],
    };
  }
}