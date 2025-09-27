export enum GiftCardStatus {
  ACTIVE = 'ACTIVE',
  USED = 'USED',
  EXPIRED = 'EXPIRED',
  CANCELLED = 'CANCELLED'
}

export enum GiftCardDesignType {
  BIRTHDAY = 'BIRTHDAY',
  ANNIVERSARY = 'ANNIVERSARY',
  HOLIDAY = 'HOLIDAY',
  CONGRATULATIONS = 'CONGRATULATIONS',
  THANK_YOU = 'THANK_YOU',
  CUSTOM = 'CUSTOM'
}

export class GiftCard {
  private constructor(
    private readonly _id: string,
    private readonly _code: string,
    private readonly _initialAmount: number,
    private _currentBalance: number,
    private readonly _currency: string,
    private readonly _purchasedByUserId: string,
    private _recipientUserId: string | null,
    private _recipientEmail: string | null,
    private _recipientName: string | null,
    private _message: string | null,
    private readonly _designType: GiftCardDesignType,
    private readonly _designImageUrl: string | null,
    private _status: GiftCardStatus,
    private readonly _purchaseDate: Date,
    private _activationDate: Date | null,
    private _expiryDate: Date | null,
    private _lastUsedDate: Date | null,
    private readonly _createdAt: Date,
    private _updatedAt: Date
  ) {}

  // Factory methods
  static create(
    id: string,
    code: string,
    amount: number,
    currency: string,
    purchasedByUserId: string,
    designType: GiftCardDesignType,
    options?: {
      recipientUserId?: string;
      recipientEmail?: string;
      recipientName?: string;
      message?: string;
      designImageUrl?: string;
      expiryDate?: Date;
    }
  ): GiftCard {
    const now = new Date();
    const expiryDate = options?.expiryDate || new Date(now.getTime() + (365 * 24 * 60 * 60 * 1000)); // Default 1 year expiry
    
    return new GiftCard(
      id,
      code,
      amount,
      amount, // initial balance equals initial amount
      currency,
      purchasedByUserId,
      options?.recipientUserId || null,
      options?.recipientEmail || null,
      options?.recipientName || null,
      options?.message || null,
      designType,
      options?.designImageUrl || null,
      GiftCardStatus.ACTIVE,
      now, // purchase date
      now, // activation date (activated immediately)
      expiryDate,
      null, // not used yet
      now,
      now
    );
  }

  static fromPersistence(data: {
    id: string;
    code: string;
    initialAmount: number;
    currentBalance: number;
    currency: string;
    purchasedByUserId: string;
    recipientUserId: string | null;
    recipientEmail: string | null;
    recipientName: string | null;
    message: string | null;
    designType: GiftCardDesignType;
    designImageUrl: string | null;
    status: GiftCardStatus;
    purchaseDate: Date;
    activationDate: Date | null;
    expiryDate: Date | null;
    lastUsedDate: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }): GiftCard {
    return new GiftCard(
      data.id,
      data.code,
      data.initialAmount,
      data.currentBalance,
      data.currency,
      data.purchasedByUserId,
      data.recipientUserId,
      data.recipientEmail,
      data.recipientName,
      data.message,
      data.designType,
      data.designImageUrl,
      data.status,
      data.purchaseDate,
      data.activationDate,
      data.expiryDate,
      data.lastUsedDate,
      data.createdAt,
      data.updatedAt
    );
  }

  // Getters
  get id(): string { return this._id; }
  get code(): string { return this._code; }
  get initialAmount(): number { return this._initialAmount; }
  get currentBalance(): number { return this._currentBalance; }
  get currency(): string { return this._currency; }
  get purchasedByUserId(): string { return this._purchasedByUserId; }
  get recipientUserId(): string | null { return this._recipientUserId; }
  get recipientEmail(): string | null { return this._recipientEmail; }
  get recipientName(): string | null { return this._recipientName; }
  get message(): string | null { return this._message; }
  get designType(): GiftCardDesignType { return this._designType; }
  get designImageUrl(): string | null { return this._designImageUrl; }
  get status(): GiftCardStatus { return this._status; }
  get purchaseDate(): Date { return this._purchaseDate; }
  get activationDate(): Date | null { return this._activationDate; }
  get expiryDate(): Date | null { return this._expiryDate; }
  get lastUsedDate(): Date | null { return this._lastUsedDate; }
  get createdAt(): Date { return this._createdAt; }
  get updatedAt(): Date { return this._updatedAt; }

  // Business logic methods
  updateRecipientInfo(recipientUserId?: string, recipientEmail?: string, recipientName?: string): void {
    this._recipientUserId = recipientUserId || null;
    this._recipientEmail = recipientEmail || null;
    this._recipientName = recipientName || null;
    this._updatedAt = new Date();
  }

  updateMessage(message: string): void {
    this._message = message;
    this._updatedAt = new Date();
  }

  activate(): void {
    if (this._status !== GiftCardStatus.ACTIVE) {
      this._status = GiftCardStatus.ACTIVE;
      this._activationDate = new Date();
      this._updatedAt = new Date();
    }
  }

  cancel(): void {
    if (this._status === GiftCardStatus.ACTIVE) {
      this._status = GiftCardStatus.CANCELLED;
      this._updatedAt = new Date();
    }
  }

  useAmount(amount: number): boolean {
    if (!this.canUseAmount(amount)) {
      return false;
    }

    this._currentBalance -= amount;
    this._lastUsedDate = new Date();
    this._updatedAt = new Date();

    // Mark as used if balance is zero
    if (this._currentBalance === 0) {
      this._status = GiftCardStatus.USED;
    }

    return true;
  }

  refundAmount(amount: number): void {
    if (amount <= 0 || amount > (this._initialAmount - this._currentBalance)) {
      throw new Error('Invalid refund amount');
    }

    this._currentBalance += amount;
    
    // Reactivate if it was marked as used
    if (this._status === GiftCardStatus.USED && this._currentBalance > 0) {
      this._status = GiftCardStatus.ACTIVE;
    }

    this._updatedAt = new Date();
  }

  // Validation methods
  isValid(): boolean {
    return this._status === GiftCardStatus.ACTIVE && 
           !this.isExpired() && 
           this._currentBalance > 0;
  }

  isExpired(): boolean {
    if (!this._expiryDate) return false;
    return new Date() > this._expiryDate;
  }

  canUseAmount(amount: number): boolean {
    if (!this.isValid()) return false;
    if (amount <= 0) return false;
    if (amount > this._currentBalance) return false;
    return true;
  }

  isFullyUsed(): boolean {
    return this._currentBalance === 0 || this._status === GiftCardStatus.USED;
  }

  isCancelled(): boolean {
    return this._status === GiftCardStatus.CANCELLED;
  }

  hasRecipient(): boolean {
    return this._recipientUserId !== null || this._recipientEmail !== null;
  }

  // Calculation methods
  getUsedAmount(): number {
    return this._initialAmount - this._currentBalance;
  }

  getUsagePercentage(): number {
    return (this.getUsedAmount() / this._initialAmount) * 100;
  }

  getDaysUntilExpiry(): number | null {
    if (!this._expiryDate) return null;
    const now = new Date();
    const diffTime = this._expiryDate.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  getDaysSincePurchase(): number {
    const now = new Date();
    const diffTime = now.getTime() - this._purchaseDate.getTime();
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  }

  getDaysSinceLastUse(): number | null {
    if (!this._lastUsedDate) return null;
    const now = new Date();
    const diffTime = now.getTime() - this._lastUsedDate.getTime();
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  }

  // Status management
  updateStatus(): void {
    if (this.isExpired() && this._status === GiftCardStatus.ACTIVE) {
      this._status = GiftCardStatus.EXPIRED;
      this._updatedAt = new Date();
    }
  }

  // Display methods
  getDisplayCode(): string {
    // Mask the code for security (show only last 4 characters)
    if (this._code.length <= 4) return this._code;
    return '*'.repeat(this._code.length - 4) + this._code.slice(-4);
  }

  getRecipientDisplay(): string {
    if (this._recipientName) return this._recipientName;
    if (this._recipientEmail) return this._recipientEmail;
    if (this._recipientUserId) return `User ID: ${this._recipientUserId}`;
    return 'No recipient assigned';
  }

  // Transaction history helper
  createTransactionRecord(amount: number, type: 'PURCHASE' | 'USE' | 'REFUND' | 'CANCEL') {
    return {
      giftCardId: this._id,
      amount,
      type,
      balanceAfter: this._currentBalance,
      timestamp: new Date()
    };
  }

  // Persistence helper
  toPersistence() {
    return {
      id: this._id,
      code: this._code,
      initialAmount: this._initialAmount,
      currentBalance: this._currentBalance,
      currency: this._currency,
      purchasedByUserId: this._purchasedByUserId,
      recipientUserId: this._recipientUserId,
      recipientEmail: this._recipientEmail,
      recipientName: this._recipientName,
      message: this._message,
      designType: this._designType,
      designImageUrl: this._designImageUrl,
      status: this._status,
      purchaseDate: this._purchaseDate,
      activationDate: this._activationDate,
      expiryDate: this._expiryDate,
      lastUsedDate: this._lastUsedDate,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt
    };
  }
}