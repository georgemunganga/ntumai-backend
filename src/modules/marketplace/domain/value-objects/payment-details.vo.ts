export enum PaymentMethod {
  CREDIT_CARD = 'CREDIT_CARD',
  DEBIT_CARD = 'DEBIT_CARD',
  PAYPAL = 'PAYPAL',
  BANK_TRANSFER = 'BANK_TRANSFER',
  DIGITAL_WALLET = 'DIGITAL_WALLET',
  CASH_ON_DELIVERY = 'CASH_ON_DELIVERY',
  GIFT_CARD = 'GIFT_CARD',
  STORE_CREDIT = 'STORE_CREDIT'
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED',
  PARTIALLY_REFUNDED = 'PARTIALLY_REFUNDED'
}

export interface PaymentBreakdown {
  subtotal: number;
  tax: number;
  shipping: number;
  discount: number;
  total: number;
}

export class PaymentDetails {
  private constructor(
    private readonly _method: PaymentMethod,
    private readonly _status: PaymentStatus,
    private readonly _amount: number,
    private readonly _currency: string,
    private readonly _transactionId: string | null,
    private readonly _paymentGateway: string | null,
    private readonly _breakdown: PaymentBreakdown,
    private readonly _processedAt: Date | null,
    private readonly _refundedAmount: number,
    private readonly _metadata: Record<string, any>
  ) {
    this.validateAmount(_amount);
    this.validateCurrency(_currency);
    this.validateRefundedAmount(_refundedAmount, _amount);
    this.validateBreakdown(_breakdown);
  }

  static create(
    method: PaymentMethod,
    amount: number,
    currency: string,
    breakdown: PaymentBreakdown,
    options?: {
      status?: PaymentStatus;
      transactionId?: string;
      paymentGateway?: string;
      processedAt?: Date;
      metadata?: Record<string, any>;
    }
  ): PaymentDetails {
    return new PaymentDetails(
      method,
      options?.status || PaymentStatus.PENDING,
      amount,
      currency,
      options?.transactionId || null,
      options?.paymentGateway || null,
      breakdown,
      options?.processedAt || null,
      0, // initial refunded amount
      options?.metadata || {}
    );
  }

  static fromPersistence(data: {
    method: PaymentMethod;
    status: PaymentStatus;
    amount: number;
    currency: string;
    transactionId: string | null;
    paymentGateway: string | null;
    breakdown: PaymentBreakdown;
    processedAt: Date | null;
    refundedAmount: number;
    metadata: Record<string, any>;
  }): PaymentDetails {
    return new PaymentDetails(
      data.method,
      data.status,
      data.amount,
      data.currency,
      data.transactionId,
      data.paymentGateway,
      data.breakdown,
      data.processedAt,
      data.refundedAmount,
      data.metadata
    );
  }

  // Getters
  get method(): PaymentMethod {
    return this._method;
  }

  get status(): PaymentStatus {
    return this._status;
  }

  get amount(): number {
    return this._amount;
  }

  get currency(): string {
    return this._currency;
  }

  get transactionId(): string | null {
    return this._transactionId;
  }

  get paymentGateway(): string | null {
    return this._paymentGateway;
  }

  get breakdown(): PaymentBreakdown {
    return { ...this._breakdown };
  }

  get processedAt(): Date | null {
    return this._processedAt;
  }

  get refundedAmount(): number {
    return this._refundedAmount;
  }

  get metadata(): Record<string, any> {
    return { ...this._metadata };
  }

  // Validation methods
  private validateAmount(amount: number): void {
    if (typeof amount !== 'number' || isNaN(amount)) {
      throw new Error('Payment amount must be a valid number');
    }
    if (amount < 0) {
      throw new Error('Payment amount cannot be negative');
    }
    if (!Number.isFinite(amount)) {
      throw new Error('Payment amount must be finite');
    }
  }

  private validateCurrency(currency: string): void {
    if (!currency || typeof currency !== 'string') {
      throw new Error('Currency must be a non-empty string');
    }
    if (currency.length !== 3) {
      throw new Error('Currency must be a 3-letter ISO code');
    }
    if (!/^[A-Z]{3}$/.test(currency)) {
      throw new Error('Currency must be uppercase 3-letter ISO code');
    }
  }

  private validateRefundedAmount(refundedAmount: number, totalAmount: number): void {
    if (typeof refundedAmount !== 'number' || isNaN(refundedAmount)) {
      throw new Error('Refunded amount must be a valid number');
    }
    if (refundedAmount < 0) {
      throw new Error('Refunded amount cannot be negative');
    }
    if (refundedAmount > totalAmount) {
      throw new Error('Refunded amount cannot exceed total payment amount');
    }
  }

  private validateBreakdown(breakdown: PaymentBreakdown): void {
    const { subtotal, tax, shipping, discount, total } = breakdown;
    
    // Validate all components are numbers
    [subtotal, tax, shipping, discount, total].forEach((value, index) => {
      const names = ['subtotal', 'tax', 'shipping', 'discount', 'total'];
      if (typeof value !== 'number' || isNaN(value)) {
        throw new Error(`Payment breakdown ${names[index]} must be a valid number`);
      }
      if (value < 0 && names[index] !== 'discount') {
        throw new Error(`Payment breakdown ${names[index]} cannot be negative`);
      }
    });

    // Validate calculation
    const calculatedTotal = subtotal + tax + shipping - discount;
    if (Math.abs(calculatedTotal - total) > 0.01) { // Allow for small rounding differences
      throw new Error('Payment breakdown total does not match calculated total');
    }
  }

  // Status checking methods
  isPending(): boolean {
    return this._status === PaymentStatus.PENDING;
  }

  isProcessing(): boolean {
    return this._status === PaymentStatus.PROCESSING;
  }

  isCompleted(): boolean {
    return this._status === PaymentStatus.COMPLETED;
  }

  isFailed(): boolean {
    return this._status === PaymentStatus.FAILED;
  }

  isCancelled(): boolean {
    return this._status === PaymentStatus.CANCELLED;
  }

  isRefunded(): boolean {
    return this._status === PaymentStatus.REFUNDED;
  }

  isPartiallyRefunded(): boolean {
    return this._status === PaymentStatus.PARTIALLY_REFUNDED;
  }

  // Business logic methods
  isSuccessful(): boolean {
    return this._status === PaymentStatus.COMPLETED;
  }

  canBeRefunded(): boolean {
    return this.isCompleted() && this._refundedAmount < this._amount;
  }

  canBeCancelled(): boolean {
    return this._status === PaymentStatus.PENDING;
  }

  requiresManualProcessing(): boolean {
    return this._method === PaymentMethod.BANK_TRANSFER || 
           this._method === PaymentMethod.CASH_ON_DELIVERY;
  }

  isDigitalPayment(): boolean {
    return [
      PaymentMethod.CREDIT_CARD,
      PaymentMethod.DEBIT_CARD,
      PaymentMethod.PAYPAL,
      PaymentMethod.DIGITAL_WALLET
    ].includes(this._method);
  }

  hasTransactionId(): boolean {
    return this._transactionId !== null;
  }

  // State transition methods
  markAsProcessing(transactionId?: string, paymentGateway?: string): PaymentDetails {
    if (!this.isPending()) {
      throw new Error('Can only mark pending payments as processing');
    }

    return new PaymentDetails(
      this._method,
      PaymentStatus.PROCESSING,
      this._amount,
      this._currency,
      transactionId || this._transactionId,
      paymentGateway || this._paymentGateway,
      this._breakdown,
      this._processedAt,
      this._refundedAmount,
      this._metadata
    );
  }

  markAsCompleted(transactionId: string, paymentGateway?: string): PaymentDetails {
    if (!this.isPending() && !this.isProcessing()) {
      throw new Error('Can only complete pending or processing payments');
    }

    return new PaymentDetails(
      this._method,
      PaymentStatus.COMPLETED,
      this._amount,
      this._currency,
      transactionId,
      paymentGateway || this._paymentGateway,
      this._breakdown,
      new Date(),
      this._refundedAmount,
      this._metadata
    );
  }

  markAsFailed(reason?: string): PaymentDetails {
    if (this.isCompleted() || this.isRefunded()) {
      throw new Error('Cannot mark completed or refunded payments as failed');
    }

    const updatedMetadata = { ...this._metadata };
    if (reason) {
      updatedMetadata.failureReason = reason;
    }

    return new PaymentDetails(
      this._method,
      PaymentStatus.FAILED,
      this._amount,
      this._currency,
      this._transactionId,
      this._paymentGateway,
      this._breakdown,
      this._processedAt,
      this._refundedAmount,
      updatedMetadata
    );
  }

  markAsCancelled(reason?: string): PaymentDetails {
    if (!this.canBeCancelled()) {
      throw new Error('Payment cannot be cancelled in current state');
    }

    const updatedMetadata = { ...this._metadata };
    if (reason) {
      updatedMetadata.cancellationReason = reason;
    }

    return new PaymentDetails(
      this._method,
      PaymentStatus.CANCELLED,
      this._amount,
      this._currency,
      this._transactionId,
      this._paymentGateway,
      this._breakdown,
      this._processedAt,
      this._refundedAmount,
      updatedMetadata
    );
  }

  processRefund(refundAmount: number, refundTransactionId?: string): PaymentDetails {
    if (!this.canBeRefunded()) {
      throw new Error('Payment cannot be refunded');
    }

    const newRefundedAmount = this._refundedAmount + refundAmount;
    if (newRefundedAmount > this._amount) {
      throw new Error('Total refund amount cannot exceed payment amount');
    }

    const newStatus = newRefundedAmount === this._amount 
      ? PaymentStatus.REFUNDED 
      : PaymentStatus.PARTIALLY_REFUNDED;

    const updatedMetadata = { ...this._metadata };
    if (refundTransactionId) {
      updatedMetadata.refundTransactionId = refundTransactionId;
    }
    updatedMetadata.lastRefundAt = new Date();

    return new PaymentDetails(
      this._method,
      newStatus,
      this._amount,
      this._currency,
      this._transactionId,
      this._paymentGateway,
      this._breakdown,
      this._processedAt,
      newRefundedAmount,
      updatedMetadata
    );
  }

  // Calculation methods
  getRemainingAmount(): number {
    return this._amount - this._refundedAmount;
  }

  getRefundPercentage(): number {
    if (this._amount === 0) return 0;
    return (this._refundedAmount / this._amount) * 100;
  }

  getTaxPercentage(): number {
    if (this._breakdown.subtotal === 0) return 0;
    return (this._breakdown.tax / this._breakdown.subtotal) * 100;
  }

  getDiscountPercentage(): number {
    if (this._breakdown.subtotal === 0) return 0;
    return (this._breakdown.discount / this._breakdown.subtotal) * 100;
  }

  // Display methods
  getMethodDisplayName(): string {
    const displayNames: Record<PaymentMethod, string> = {
      [PaymentMethod.CREDIT_CARD]: 'Credit Card',
      [PaymentMethod.DEBIT_CARD]: 'Debit Card',
      [PaymentMethod.PAYPAL]: 'PayPal',
      [PaymentMethod.BANK_TRANSFER]: 'Bank Transfer',
      [PaymentMethod.DIGITAL_WALLET]: 'Digital Wallet',
      [PaymentMethod.CASH_ON_DELIVERY]: 'Cash on Delivery',
      [PaymentMethod.GIFT_CARD]: 'Gift Card',
      [PaymentMethod.STORE_CREDIT]: 'Store Credit'
    };

    return displayNames[this._method] || this._method;
  }

  getStatusDisplayName(): string {
    const displayNames: Record<PaymentStatus, string> = {
      [PaymentStatus.PENDING]: 'Pending',
      [PaymentStatus.PROCESSING]: 'Processing',
      [PaymentStatus.COMPLETED]: 'Completed',
      [PaymentStatus.FAILED]: 'Failed',
      [PaymentStatus.CANCELLED]: 'Cancelled',
      [PaymentStatus.REFUNDED]: 'Refunded',
      [PaymentStatus.PARTIALLY_REFUNDED]: 'Partially Refunded'
    };

    return displayNames[this._status] || this._status;
  }

  formatAmount(locale: string = 'en-US'): string {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: this._currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(this._amount);
  }

  // Comparison methods
  equals(other: PaymentDetails): boolean {
    return this._transactionId === other._transactionId &&
           this._amount === other._amount &&
           this._currency === other._currency &&
           this._method === other._method;
  }

  // Persistence helper
  toPersistence() {
    return {
      method: this._method,
      status: this._status,
      amount: this._amount,
      currency: this._currency,
      transactionId: this._transactionId,
      paymentGateway: this._paymentGateway,
      breakdown: this._breakdown,
      processedAt: this._processedAt,
      refundedAmount: this._refundedAmount,
      metadata: this._metadata
    };
  }

  toJSON() {
    return {
      method: this._method,
      methodDisplayName: this.getMethodDisplayName(),
      status: this._status,
      statusDisplayName: this.getStatusDisplayName(),
      amount: this._amount,
      currency: this._currency,
      formattedAmount: this.formatAmount(),
      transactionId: this._transactionId,
      paymentGateway: this._paymentGateway,
      breakdown: this._breakdown,
      processedAt: this._processedAt,
      refundedAmount: this._refundedAmount,
      remainingAmount: this.getRemainingAmount(),
      refundPercentage: this.getRefundPercentage(),
      isSuccessful: this.isSuccessful(),
      canBeRefunded: this.canBeRefunded(),
      canBeCancelled: this.canBeCancelled(),
      metadata: this._metadata
    };
  }

  // Static utility methods
  static getAllMethods(): PaymentMethod[] {
    return Object.values(PaymentMethod);
  }

  static getAllStatuses(): PaymentStatus[] {
    return Object.values(PaymentStatus);
  }

  static isValidMethod(method: string): boolean {
    return Object.values(PaymentMethod).includes(method as PaymentMethod);
  }

  static isValidStatus(status: string): boolean {
    return Object.values(PaymentStatus).includes(status as PaymentStatus);
  }

  static createBreakdown(
    subtotal: number,
    tax: number = 0,
    shipping: number = 0,
    discount: number = 0
  ): PaymentBreakdown {
    const total = subtotal + tax + shipping - discount;
    return { subtotal, tax, shipping, discount, total };
  }
}