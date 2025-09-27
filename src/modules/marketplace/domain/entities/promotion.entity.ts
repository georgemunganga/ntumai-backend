export enum PromotionType {
  PERCENTAGE = 'PERCENTAGE',
  FIXED_AMOUNT = 'FIXED_AMOUNT',
  BUY_X_GET_Y = 'BUY_X_GET_Y',
  FREE_SHIPPING = 'FREE_SHIPPING'
}

export enum PromotionStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  EXPIRED = 'EXPIRED',
  SCHEDULED = 'SCHEDULED'
}

export class Promotion {
  private constructor(
    private readonly _id: string,
    private _code: string,
    private _title: string,
    private _description: string,
    private _type: PromotionType,
    private _value: number,
    private _minOrderAmount: number | null,
    private _maxDiscountAmount: number | null,
    private _usageLimit: number | null,
    private _usageCount: number,
    private _userUsageLimit: number | null,
    private _applicableStoreIds: string[],
    private _applicableProductIds: string[],
    private _applicableCategoryIds: string[],
    private _startDate: Date,
    private _endDate: Date | null,
    private _status: PromotionStatus,
    private _isActive: boolean,
    private readonly _createdAt: Date,
    private _updatedAt: Date
  ) {}

  // Factory methods
  static create(
    id: string,
    code: string,
    title: string,
    description: string,
    type: PromotionType,
    value: number,
    startDate: Date,
    options?: {
      minOrderAmount?: number;
      maxDiscountAmount?: number;
      usageLimit?: number;
      userUsageLimit?: number;
      applicableStoreIds?: string[];
      applicableProductIds?: string[];
      applicableCategoryIds?: string[];
      endDate?: Date;
    }
  ): Promotion {
    const now = new Date();
    return new Promotion(
      id,
      code,
      title,
      description,
      type,
      value,
      options?.minOrderAmount || null,
      options?.maxDiscountAmount || null,
      options?.usageLimit || null,
      0, // initial usage count
      options?.userUsageLimit || null,
      options?.applicableStoreIds || [],
      options?.applicableProductIds || [],
      options?.applicableCategoryIds || [],
      startDate,
      options?.endDate || null,
      this.determineStatus(startDate, options?.endDate),
      true,
      now,
      now
    );
  }

  static fromPersistence(data: {
    id: string;
    code: string;
    title: string;
    description: string;
    type: PromotionType;
    value: number;
    minOrderAmount: number | null;
    maxDiscountAmount: number | null;
    usageLimit: number | null;
    usageCount: number;
    userUsageLimit: number | null;
    applicableStoreIds: string[];
    applicableProductIds: string[];
    applicableCategoryIds: string[];
    startDate: Date;
    endDate: Date | null;
    status: PromotionStatus;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
  }): Promotion {
    return new Promotion(
      data.id,
      data.code,
      data.title,
      data.description,
      data.type,
      data.value,
      data.minOrderAmount,
      data.maxDiscountAmount,
      data.usageLimit,
      data.usageCount,
      data.userUsageLimit,
      data.applicableStoreIds,
      data.applicableProductIds,
      data.applicableCategoryIds,
      data.startDate,
      data.endDate,
      data.status,
      data.isActive,
      data.createdAt,
      data.updatedAt
    );
  }

  // Getters
  get id(): string { return this._id; }
  get code(): string { return this._code; }
  get title(): string { return this._title; }
  get description(): string { return this._description; }
  get type(): PromotionType { return this._type; }
  get value(): number { return this._value; }
  get minOrderAmount(): number | null { return this._minOrderAmount; }
  get maxDiscountAmount(): number | null { return this._maxDiscountAmount; }
  get usageLimit(): number | null { return this._usageLimit; }
  get usageCount(): number { return this._usageCount; }
  get userUsageLimit(): number | null { return this._userUsageLimit; }
  get applicableStoreIds(): string[] { return [...this._applicableStoreIds]; }
  get applicableProductIds(): string[] { return [...this._applicableProductIds]; }
  get applicableCategoryIds(): string[] { return [...this._applicableCategoryIds]; }
  get startDate(): Date { return this._startDate; }
  get endDate(): Date | null { return this._endDate; }
  get status(): PromotionStatus { return this._status; }
  get isActive(): boolean { return this._isActive; }
  get createdAt(): Date { return this._createdAt; }
  get updatedAt(): Date { return this._updatedAt; }

  // Business logic methods
  updateDetails(title: string, description: string): void {
    this._title = title;
    this._description = description;
    this._updatedAt = new Date();
  }

  updateValue(value: number): void {
    this._value = value;
    this._updatedAt = new Date();
  }

  updateDateRange(startDate: Date, endDate?: Date): void {
    this._startDate = startDate;
    this._endDate = endDate || null;
    this._status = Promotion.determineStatus(startDate, endDate);
    this._updatedAt = new Date();
  }

  updateUsageLimits(usageLimit?: number, userUsageLimit?: number): void {
    this._usageLimit = usageLimit || null;
    this._userUsageLimit = userUsageLimit || null;
    this._updatedAt = new Date();
  }

  updateOrderConstraints(minOrderAmount?: number, maxDiscountAmount?: number): void {
    this._minOrderAmount = minOrderAmount || null;
    this._maxDiscountAmount = maxDiscountAmount || null;
    this._updatedAt = new Date();
  }

  updateApplicableStores(storeIds: string[]): void {
    this._applicableStoreIds = [...storeIds];
    this._updatedAt = new Date();
  }

  updateApplicableProducts(productIds: string[]): void {
    this._applicableProductIds = [...productIds];
    this._updatedAt = new Date();
  }

  updateApplicableCategories(categoryIds: string[]): void {
    this._applicableCategoryIds = [...categoryIds];
    this._updatedAt = new Date();
  }

  activate(): void {
    this._isActive = true;
    this._status = Promotion.determineStatus(this._startDate, this._endDate);
    this._updatedAt = new Date();
  }

  deactivate(): void {
    this._isActive = false;
    this._status = PromotionStatus.INACTIVE;
    this._updatedAt = new Date();
  }

  incrementUsage(): void {
    this._usageCount++;
    this._updatedAt = new Date();
  }

  // Validation methods
  isValidForOrder(orderAmount: number, storeId?: string): boolean {
    if (!this.isCurrentlyActive()) return false;
    if (this.isUsageLimitReached()) return false;
    if (this._minOrderAmount && orderAmount < this._minOrderAmount) return false;
    if (storeId && this._applicableStoreIds.length > 0 && !this._applicableStoreIds.includes(storeId)) return false;
    return true;
  }

  isValidForProduct(productId: string, categoryId?: string): boolean {
    if (this._applicableProductIds.length > 0 && !this._applicableProductIds.includes(productId)) return false;
    if (this._applicableCategoryIds.length > 0 && categoryId && !this._applicableCategoryIds.includes(categoryId)) return false;
    return true;
  }

  canBeUsedByUser(userUsageCount: number): boolean {
    if (!this._userUsageLimit) return true;
    return userUsageCount < this._userUsageLimit;
  }

  isCurrentlyActive(): boolean {
    if (!this._isActive) return false;
    const now = new Date();
    if (now < this._startDate) return false;
    if (this._endDate && now > this._endDate) return false;
    return this._status === PromotionStatus.ACTIVE;
  }

  isUsageLimitReached(): boolean {
    if (!this._usageLimit) return false;
    return this._usageCount >= this._usageLimit;
  }

  isExpired(): boolean {
    if (!this._endDate) return false;
    return new Date() > this._endDate;
  }

  // Calculation methods
  calculateDiscount(orderAmount: number): number {
    let discount = 0;

    switch (this._type) {
      case PromotionType.PERCENTAGE:
        discount = (orderAmount * this._value) / 100;
        break;
      case PromotionType.FIXED_AMOUNT:
        discount = this._value;
        break;
      case PromotionType.FREE_SHIPPING:
        // This would be handled separately for shipping calculations
        discount = 0;
        break;
      default:
        discount = 0;
    }

    // Apply maximum discount limit if set
    if (this._maxDiscountAmount && discount > this._maxDiscountAmount) {
      discount = this._maxDiscountAmount;
    }

    return Math.min(discount, orderAmount); // Discount cannot exceed order amount
  }

  getRemainingUsage(): number | null {
    if (!this._usageLimit) return null;
    return Math.max(0, this._usageLimit - this._usageCount);
  }

  getDaysUntilExpiry(): number | null {
    if (!this._endDate) return null;
    const now = new Date();
    const diffTime = this._endDate.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  // Helper methods
  private static determineStatus(startDate: Date, endDate?: Date): PromotionStatus {
    const now = new Date();
    
    if (endDate && now > endDate) {
      return PromotionStatus.EXPIRED;
    }
    
    if (now < startDate) {
      return PromotionStatus.SCHEDULED;
    }
    
    return PromotionStatus.ACTIVE;
  }

  updateStatus(): void {
    this._status = Promotion.determineStatus(this._startDate, this._endDate);
    this._updatedAt = new Date();
  }

  // Persistence helper
  toPersistence() {
    return {
      id: this._id,
      code: this._code,
      title: this._title,
      description: this._description,
      type: this._type,
      value: this._value,
      minOrderAmount: this._minOrderAmount,
      maxDiscountAmount: this._maxDiscountAmount,
      usageLimit: this._usageLimit,
      usageCount: this._usageCount,
      userUsageLimit: this._userUsageLimit,
      applicableStoreIds: this._applicableStoreIds,
      applicableProductIds: this._applicableProductIds,
      applicableCategoryIds: this._applicableCategoryIds,
      startDate: this._startDate,
      endDate: this._endDate,
      status: this._status,
      isActive: this._isActive,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt
    };
  }
}