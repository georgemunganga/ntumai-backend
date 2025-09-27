export enum OrderStatusType {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  PROCESSING = 'PROCESSING',
  SHIPPED = 'SHIPPED',
  OUT_FOR_DELIVERY = 'OUT_FOR_DELIVERY',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED',
  RETURNED = 'RETURNED',
  FAILED = 'FAILED'
}

export class OrderStatus {
  private static readonly STATUS_TRANSITIONS: Map<OrderStatusType, OrderStatusType[]> = new Map([
    [OrderStatusType.PENDING, [OrderStatusType.CONFIRMED, OrderStatusType.CANCELLED, OrderStatusType.FAILED]],
    [OrderStatusType.CONFIRMED, [OrderStatusType.PROCESSING, OrderStatusType.CANCELLED]],
    [OrderStatusType.PROCESSING, [OrderStatusType.SHIPPED, OrderStatusType.CANCELLED]],
    [OrderStatusType.SHIPPED, [OrderStatusType.OUT_FOR_DELIVERY, OrderStatusType.DELIVERED]],
    [OrderStatusType.OUT_FOR_DELIVERY, [OrderStatusType.DELIVERED, OrderStatusType.FAILED]],
    [OrderStatusType.DELIVERED, [OrderStatusType.RETURNED, OrderStatusType.REFUNDED]],
    [OrderStatusType.CANCELLED, []], // Terminal state
    [OrderStatusType.REFUNDED, []], // Terminal state
    [OrderStatusType.RETURNED, [OrderStatusType.REFUNDED]], // Can be refunded after return
    [OrderStatusType.FAILED, [OrderStatusType.PENDING, OrderStatusType.CANCELLED]] // Can retry or cancel
  ]);

  private static readonly CANCELLABLE_STATUSES = [
    OrderStatusType.PENDING,
    OrderStatusType.CONFIRMED,
    OrderStatusType.PROCESSING
  ];

  private static readonly TERMINAL_STATUSES = [
    OrderStatusType.DELIVERED,
    OrderStatusType.CANCELLED,
    OrderStatusType.REFUNDED
  ];

  private static readonly ACTIVE_STATUSES = [
    OrderStatusType.PENDING,
    OrderStatusType.CONFIRMED,
    OrderStatusType.PROCESSING,
    OrderStatusType.SHIPPED,
    OrderStatusType.OUT_FOR_DELIVERY
  ];

  private constructor(
    private readonly _status: OrderStatusType,
    private readonly _timestamp: Date,
    private readonly _reason?: string,
    private readonly _updatedBy?: string
  ) {
    this.validateStatus(_status);
    this.validateTimestamp(_timestamp);
  }

  static create(
    status: OrderStatusType,
    timestamp: Date = new Date(),
    reason?: string,
    updatedBy?: string
  ): OrderStatus {
    return new OrderStatus(status, timestamp, reason, updatedBy);
  }

  static pending(reason?: string, updatedBy?: string): OrderStatus {
    return new OrderStatus(OrderStatusType.PENDING, new Date(), reason, updatedBy);
  }

  static confirmed(reason?: string, updatedBy?: string): OrderStatus {
    return new OrderStatus(OrderStatusType.CONFIRMED, new Date(), reason, updatedBy);
  }

  static processing(reason?: string, updatedBy?: string): OrderStatus {
    return new OrderStatus(OrderStatusType.PROCESSING, new Date(), reason, updatedBy);
  }

  static shipped(reason?: string, updatedBy?: string): OrderStatus {
    return new OrderStatus(OrderStatusType.SHIPPED, new Date(), reason, updatedBy);
  }

  static outForDelivery(reason?: string, updatedBy?: string): OrderStatus {
    return new OrderStatus(OrderStatusType.OUT_FOR_DELIVERY, new Date(), reason, updatedBy);
  }

  static delivered(reason?: string, updatedBy?: string): OrderStatus {
    return new OrderStatus(OrderStatusType.DELIVERED, new Date(), reason, updatedBy);
  }

  static cancelled(reason?: string, updatedBy?: string): OrderStatus {
    return new OrderStatus(OrderStatusType.CANCELLED, new Date(), reason, updatedBy);
  }

  static refunded(reason?: string, updatedBy?: string): OrderStatus {
    return new OrderStatus(OrderStatusType.REFUNDED, new Date(), reason, updatedBy);
  }

  static returned(reason?: string, updatedBy?: string): OrderStatus {
    return new OrderStatus(OrderStatusType.RETURNED, new Date(), reason, updatedBy);
  }

  static failed(reason?: string, updatedBy?: string): OrderStatus {
    return new OrderStatus(OrderStatusType.FAILED, new Date(), reason, updatedBy);
  }

  // Getters
  get status(): OrderStatusType {
    return this._status;
  }

  get timestamp(): Date {
    return this._timestamp;
  }

  get reason(): string | undefined {
    return this._reason;
  }

  get updatedBy(): string | undefined {
    return this._updatedBy;
  }

  // Validation methods
  private validateStatus(status: OrderStatusType): void {
    if (!Object.values(OrderStatusType).includes(status)) {
      throw new Error(`Invalid order status: ${status}`);
    }
  }

  private validateTimestamp(timestamp: Date): void {
    if (!(timestamp instanceof Date) || isNaN(timestamp.getTime())) {
      throw new Error('Invalid timestamp');
    }
  }

  // Status checking methods
  isPending(): boolean {
    return this._status === OrderStatusType.PENDING;
  }

  isConfirmed(): boolean {
    return this._status === OrderStatusType.CONFIRMED;
  }

  isProcessing(): boolean {
    return this._status === OrderStatusType.PROCESSING;
  }

  isShipped(): boolean {
    return this._status === OrderStatusType.SHIPPED;
  }

  isOutForDelivery(): boolean {
    return this._status === OrderStatusType.OUT_FOR_DELIVERY;
  }

  isDelivered(): boolean {
    return this._status === OrderStatusType.DELIVERED;
  }

  isCancelled(): boolean {
    return this._status === OrderStatusType.CANCELLED;
  }

  isRefunded(): boolean {
    return this._status === OrderStatusType.REFUNDED;
  }

  isReturned(): boolean {
    return this._status === OrderStatusType.RETURNED;
  }

  isFailed(): boolean {
    return this._status === OrderStatusType.FAILED;
  }

  // State validation methods
  isActive(): boolean {
    return OrderStatus.ACTIVE_STATUSES.includes(this._status);
  }

  isTerminal(): boolean {
    return OrderStatus.TERMINAL_STATUSES.includes(this._status);
  }

  isCancellable(): boolean {
    return OrderStatus.CANCELLABLE_STATUSES.includes(this._status);
  }

  isRefundable(): boolean {
    return this._status === OrderStatusType.DELIVERED || this._status === OrderStatusType.RETURNED;
  }

  isReturnable(): boolean {
    return this._status === OrderStatusType.DELIVERED;
  }

  canBeTracked(): boolean {
    return [
      OrderStatusType.CONFIRMED,
      OrderStatusType.PROCESSING,
      OrderStatusType.SHIPPED,
      OrderStatusType.OUT_FOR_DELIVERY
    ].includes(this._status);
  }

  requiresPayment(): boolean {
    return this._status === OrderStatusType.PENDING;
  }

  allowsModification(): boolean {
    return [
      OrderStatusType.PENDING,
      OrderStatusType.CONFIRMED
    ].includes(this._status);
  }

  // Transition methods
  canTransitionTo(newStatus: OrderStatusType): boolean {
    const allowedTransitions = OrderStatus.STATUS_TRANSITIONS.get(this._status) || [];
    return allowedTransitions.includes(newStatus);
  }

  transitionTo(
    newStatus: OrderStatusType,
    reason?: string,
    updatedBy?: string
  ): OrderStatus {
    if (!this.canTransitionTo(newStatus)) {
      throw new Error(
        `Invalid status transition from ${this._status} to ${newStatus}`
      );
    }

    return new OrderStatus(newStatus, new Date(), reason, updatedBy);
  }

  getAllowedTransitions(): OrderStatusType[] {
    return OrderStatus.STATUS_TRANSITIONS.get(this._status) || [];
  }

  // Progress methods
  getProgressPercentage(): number {
    const progressMap: Record<OrderStatusType, number> = {
      [OrderStatusType.PENDING]: 0,
      [OrderStatusType.CONFIRMED]: 20,
      [OrderStatusType.PROCESSING]: 40,
      [OrderStatusType.SHIPPED]: 60,
      [OrderStatusType.OUT_FOR_DELIVERY]: 80,
      [OrderStatusType.DELIVERED]: 100,
      [OrderStatusType.CANCELLED]: 0,
      [OrderStatusType.REFUNDED]: 0,
      [OrderStatusType.RETURNED]: 0,
      [OrderStatusType.FAILED]: 0
    };

    return progressMap[this._status] || 0;
  }

  getProgressStage(): string {
    const stageMap: Record<OrderStatusType, string> = {
      [OrderStatusType.PENDING]: 'Order Placed',
      [OrderStatusType.CONFIRMED]: 'Order Confirmed',
      [OrderStatusType.PROCESSING]: 'Preparing Order',
      [OrderStatusType.SHIPPED]: 'Order Shipped',
      [OrderStatusType.OUT_FOR_DELIVERY]: 'Out for Delivery',
      [OrderStatusType.DELIVERED]: 'Delivered',
      [OrderStatusType.CANCELLED]: 'Cancelled',
      [OrderStatusType.REFUNDED]: 'Refunded',
      [OrderStatusType.RETURNED]: 'Returned',
      [OrderStatusType.FAILED]: 'Failed'
    };

    return stageMap[this._status] || 'Unknown';
  }

  // Comparison methods
  equals(other: OrderStatus): boolean {
    return this._status === other._status;
  }

  isAfter(other: OrderStatus): boolean {
    return this.getProgressPercentage() > other.getProgressPercentage();
  }

  isBefore(other: OrderStatus): boolean {
    return this.getProgressPercentage() < other.getProgressPercentage();
  }

  // Time-based methods
  getAge(): number {
    return Date.now() - this._timestamp.getTime();
  }

  getAgeInDays(): number {
    return Math.floor(this.getAge() / (1000 * 60 * 60 * 24));
  }

  getAgeInHours(): number {
    return Math.floor(this.getAge() / (1000 * 60 * 60));
  }

  isOlderThan(days: number): boolean {
    return this.getAgeInDays() > days;
  }

  // Display methods
  toString(): string {
    return this._status;
  }

  toDisplayString(): string {
    return this.getProgressStage();
  }

  toDetailedString(): string {
    let result = `${this.getProgressStage()} (${this._status})`;
    if (this._reason) {
      result += ` - ${this._reason}`;
    }
    if (this._updatedBy) {
      result += ` by ${this._updatedBy}`;
    }
    return result;
  }

  toJSON() {
    return {
      status: this._status,
      timestamp: this._timestamp,
      reason: this._reason,
      updatedBy: this._updatedBy,
      progressPercentage: this.getProgressPercentage(),
      progressStage: this.getProgressStage(),
      isActive: this.isActive(),
      isTerminal: this.isTerminal(),
      isCancellable: this.isCancellable(),
      allowedTransitions: this.getAllowedTransitions()
    };
  }

  // Static utility methods
  static getAllStatuses(): OrderStatusType[] {
    return Object.values(OrderStatusType);
  }

  static getActiveStatuses(): OrderStatusType[] {
    return [...OrderStatus.ACTIVE_STATUSES];
  }

  static getTerminalStatuses(): OrderStatusType[] {
    return [...OrderStatus.TERMINAL_STATUSES];
  }

  static getCancellableStatuses(): OrderStatusType[] {
    return [...OrderStatus.CANCELLABLE_STATUSES];
  }

  static isValidStatus(status: string): boolean {
    return Object.values(OrderStatusType).includes(status as OrderStatusType);
  }

  static getStatusDescription(status: OrderStatusType): string {
    const descriptions: Record<OrderStatusType, string> = {
      [OrderStatusType.PENDING]: 'Order is awaiting confirmation and payment',
      [OrderStatusType.CONFIRMED]: 'Order has been confirmed and payment processed',
      [OrderStatusType.PROCESSING]: 'Order is being prepared for shipment',
      [OrderStatusType.SHIPPED]: 'Order has been shipped and is in transit',
      [OrderStatusType.OUT_FOR_DELIVERY]: 'Order is out for delivery',
      [OrderStatusType.DELIVERED]: 'Order has been successfully delivered',
      [OrderStatusType.CANCELLED]: 'Order has been cancelled',
      [OrderStatusType.REFUNDED]: 'Order has been refunded',
      [OrderStatusType.RETURNED]: 'Order has been returned by customer',
      [OrderStatusType.FAILED]: 'Order processing failed'
    };

    return descriptions[status] || 'Unknown status';
  }

  // Business rule helpers
  static createStatusHistory(statuses: OrderStatus[]): OrderStatus[] {
    return statuses.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  static getLatestStatus(statuses: OrderStatus[]): OrderStatus | null {
    if (statuses.length === 0) return null;
    return statuses.reduce((latest, current) => 
      current.timestamp > latest.timestamp ? current : latest
    );
  }

  static validateStatusTransition(from: OrderStatusType, to: OrderStatusType): boolean {
    const allowedTransitions = OrderStatus.STATUS_TRANSITIONS.get(from) || [];
    return allowedTransitions.includes(to);
  }
}