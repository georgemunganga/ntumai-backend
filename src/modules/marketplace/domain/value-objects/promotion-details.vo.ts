export enum PromotionType {
  PERCENTAGE = 'PERCENTAGE',
  FIXED_AMOUNT = 'FIXED_AMOUNT',
  BUY_X_GET_Y = 'BUY_X_GET_Y',
  FREE_SHIPPING = 'FREE_SHIPPING',
  BUNDLE = 'BUNDLE',
  CASHBACK = 'CASHBACK'
}

export enum PromotionScope {
  GLOBAL = 'GLOBAL',
  STORE = 'STORE',
  CATEGORY = 'CATEGORY',
  PRODUCT = 'PRODUCT',
  USER = 'USER',
  FIRST_TIME_USER = 'FIRST_TIME_USER'
}

export enum PromotionStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  PAUSED = 'PAUSED',
  EXPIRED = 'EXPIRED',
  EXHAUSTED = 'EXHAUSTED',
  CANCELLED = 'CANCELLED'
}

export interface PromotionConditions {
  minimumOrderAmount?: number;
  maximumOrderAmount?: number;
  minimumQuantity?: number;
  maximumQuantity?: number;
  applicableStoreIds?: string[];
  applicableProductIds?: string[];
  applicableCategoryIds?: string[];
  excludedStoreIds?: string[];
  excludedProductIds?: string[];
  excludedCategoryIds?: string[];
  userSegments?: string[];
  dayOfWeek?: number[]; // 0-6, Sunday to Saturday
  timeOfDay?: { start: string; end: string }; // HH:MM format
  isFirstTimeUser?: boolean;
  userRegistrationDateAfter?: Date;
  userRegistrationDateBefore?: Date;
}

export interface PromotionUsageLimit {
  totalUsageLimit?: number;
  perUserLimit?: number;
  perDayLimit?: number;
  perWeekLimit?: number;
  perMonthLimit?: number;
}

export interface BuyXGetYDetails {
  buyQuantity: number;
  getQuantity: number;
  buyProductIds?: string[];
  getProductIds?: string[];
  getDiscountPercentage?: number;
}

export interface BundleDetails {
  requiredProductIds: string[];
  bundlePrice?: number;
  bundleDiscountPercentage?: number;
}

export class PromotionDetails {
  private constructor(
    private readonly _type: PromotionType,
    private readonly _scope: PromotionScope,
    private readonly _status: PromotionStatus,
    private readonly _value: number,
    private readonly _currency: string,
    private readonly _code: string | null,
    private readonly _title: string,
    private readonly _description: string,
    private readonly _startDate: Date,
    private readonly _endDate: Date | null,
    private readonly _conditions: PromotionConditions,
    private readonly _usageLimit: PromotionUsageLimit,
    private readonly _currentUsage: number,
    private readonly _buyXGetYDetails: BuyXGetYDetails | null,
    private readonly _bundleDetails: BundleDetails | null,
    private readonly _priority: number,
    private readonly _isStackable: boolean,
    private readonly _metadata: Record<string, any>
  ) {
    this.validateType(_type);
    this.validateValue(_value, _type);
    this.validateCurrency(_currency);
    this.validateDates(_startDate, _endDate);
    this.validateConditions(_conditions);
    this.validateUsageLimit(_usageLimit);
    this.validateCurrentUsage(_currentUsage);
    this.validateTypeSpecificDetails(_type, _buyXGetYDetails, _bundleDetails);
  }

  static create(
    type: PromotionType,
    scope: PromotionScope,
    value: number,
    currency: string,
    title: string,
    description: string,
    startDate: Date,
    options?: {
      status?: PromotionStatus;
      code?: string;
      endDate?: Date;
      conditions?: PromotionConditions;
      usageLimit?: PromotionUsageLimit;
      buyXGetYDetails?: BuyXGetYDetails;
      bundleDetails?: BundleDetails;
      priority?: number;
      isStackable?: boolean;
      metadata?: Record<string, any>;
    }
  ): PromotionDetails {
    return new PromotionDetails(
      type,
      scope,
      options?.status || PromotionStatus.DRAFT,
      value,
      currency,
      options?.code || null,
      title,
      description,
      startDate,
      options?.endDate || null,
      options?.conditions || {},
      options?.usageLimit || {},
      0, // current usage starts at 0
      options?.buyXGetYDetails || null,
      options?.bundleDetails || null,
      options?.priority || 0,
      options?.isStackable || false,
      options?.metadata || {}
    );
  }

  static fromPersistence(data: {
    type: PromotionType;
    scope: PromotionScope;
    status: PromotionStatus;
    value: number;
    currency: string;
    code: string | null;
    title: string;
    description: string;
    startDate: Date;
    endDate: Date | null;
    conditions: PromotionConditions;
    usageLimit: PromotionUsageLimit;
    currentUsage: number;
    buyXGetYDetails: BuyXGetYDetails | null;
    bundleDetails: BundleDetails | null;
    priority: number;
    isStackable: boolean;
    metadata: Record<string, any>;
  }): PromotionDetails {
    return new PromotionDetails(
      data.type,
      data.scope,
      data.status,
      data.value,
      data.currency,
      data.code,
      data.title,
      data.description,
      data.startDate,
      data.endDate,
      data.conditions,
      data.usageLimit,
      data.currentUsage,
      data.buyXGetYDetails,
      data.bundleDetails,
      data.priority,
      data.isStackable,
      data.metadata
    );
  }

  // Getters
  get type(): PromotionType {
    return this._type;
  }

  get scope(): PromotionScope {
    return this._scope;
  }

  get status(): PromotionStatus {
    return this._status;
  }

  get value(): number {
    return this._value;
  }

  get currency(): string {
    return this._currency;
  }

  get code(): string | null {
    return this._code;
  }

  get title(): string {
    return this._title;
  }

  get description(): string {
    return this._description;
  }

  get startDate(): Date {
    return this._startDate;
  }

  get endDate(): Date | null {
    return this._endDate;
  }

  get conditions(): PromotionConditions {
    return { ...this._conditions };
  }

  get usageLimit(): PromotionUsageLimit {
    return { ...this._usageLimit };
  }

  get currentUsage(): number {
    return this._currentUsage;
  }

  get buyXGetYDetails(): BuyXGetYDetails | null {
    return this._buyXGetYDetails ? { ...this._buyXGetYDetails } : null;
  }

  get bundleDetails(): BundleDetails | null {
    return this._bundleDetails ? { ...this._bundleDetails } : null;
  }

  get priority(): number {
    return this._priority;
  }

  get isStackable(): boolean {
    return this._isStackable;
  }

  get metadata(): Record<string, any> {
    return { ...this._metadata };
  }

  // Validation methods
  private validateType(type: PromotionType): void {
    if (!Object.values(PromotionType).includes(type)) {
      throw new Error(`Invalid promotion type: ${type}`);
    }
  }

  private validateValue(value: number, type: PromotionType): void {
    if (typeof value !== 'number' || isNaN(value)) {
      throw new Error('Promotion value must be a valid number');
    }
    if (value < 0) {
      throw new Error('Promotion value cannot be negative');
    }
    if (type === PromotionType.PERCENTAGE && value > 100) {
      throw new Error('Percentage promotion value cannot exceed 100');
    }
    if (!Number.isFinite(value)) {
      throw new Error('Promotion value must be finite');
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

  private validateDates(startDate: Date, endDate: Date | null): void {
    if (!(startDate instanceof Date) || isNaN(startDate.getTime())) {
      throw new Error('Start date must be a valid Date');
    }
    if (endDate && (!(endDate instanceof Date) || isNaN(endDate.getTime()))) {
      throw new Error('End date must be a valid Date');
    }
    if (endDate && endDate <= startDate) {
      throw new Error('End date must be after start date');
    }
  }

  private validateConditions(conditions: PromotionConditions): void {
    if (conditions.minimumOrderAmount !== undefined && conditions.minimumOrderAmount < 0) {
      throw new Error('Minimum order amount cannot be negative');
    }
    if (conditions.maximumOrderAmount !== undefined && conditions.maximumOrderAmount < 0) {
      throw new Error('Maximum order amount cannot be negative');
    }
    if (conditions.minimumOrderAmount !== undefined && 
        conditions.maximumOrderAmount !== undefined && 
        conditions.minimumOrderAmount > conditions.maximumOrderAmount) {
      throw new Error('Minimum order amount cannot be greater than maximum order amount');
    }
  }

  private validateUsageLimit(usageLimit: PromotionUsageLimit): void {
    const limits = [
      usageLimit.totalUsageLimit,
      usageLimit.perUserLimit,
      usageLimit.perDayLimit,
      usageLimit.perWeekLimit,
      usageLimit.perMonthLimit
    ];

    for (const limit of limits) {
      if (limit !== undefined && (typeof limit !== 'number' || limit < 0 || !Number.isInteger(limit))) {
        throw new Error('Usage limits must be non-negative integers');
      }
    }
  }

  private validateCurrentUsage(currentUsage: number): void {
    if (typeof currentUsage !== 'number' || currentUsage < 0 || !Number.isInteger(currentUsage)) {
      throw new Error('Current usage must be a non-negative integer');
    }
  }

  private validateTypeSpecificDetails(
    type: PromotionType,
    buyXGetYDetails: BuyXGetYDetails | null,
    bundleDetails: BundleDetails | null
  ): void {
    if (type === PromotionType.BUY_X_GET_Y && !buyXGetYDetails) {
      throw new Error('BuyXGetY promotions require buyXGetYDetails');
    }
    if (type === PromotionType.BUNDLE && !bundleDetails) {
      throw new Error('Bundle promotions require bundleDetails');
    }
  }

  // Status checking methods
  isDraft(): boolean {
    return this._status === PromotionStatus.DRAFT;
  }

  isActive(): boolean {
    return this._status === PromotionStatus.ACTIVE;
  }

  isPaused(): boolean {
    return this._status === PromotionStatus.PAUSED;
  }

  isExpired(): boolean {
    return this._status === PromotionStatus.EXPIRED;
  }

  isExhausted(): boolean {
    return this._status === PromotionStatus.EXHAUSTED;
  }

  isCancelled(): boolean {
    return this._status === PromotionStatus.CANCELLED;
  }

  // Business logic methods
  isCurrentlyValid(): boolean {
    if (!this.isActive()) return false;
    
    const now = new Date();
    if (now < this._startDate) return false;
    if (this._endDate && now > this._endDate) return false;
    
    return !this.isUsageLimitReached();
  }

  isUsageLimitReached(): boolean {
    if (this._usageLimit.totalUsageLimit && this._currentUsage >= this._usageLimit.totalUsageLimit) {
      return true;
    }
    return false;
  }

  canBeUsedBy(userId: string, userUsageCount: number): boolean {
    if (!this.isCurrentlyValid()) return false;
    
    if (this._usageLimit.perUserLimit && userUsageCount >= this._usageLimit.perUserLimit) {
      return false;
    }
    
    return true;
  }

  requiresCode(): boolean {
    return this._code !== null;
  }

  isValidCode(code: string): boolean {
    if (!this.requiresCode()) return true;
    return this._code === code;
  }

  isApplicableToStore(storeId: string): boolean {
    if (this._scope === PromotionScope.GLOBAL) return true;
    if (this._scope !== PromotionScope.STORE) return false;
    
    const { applicableStoreIds, excludedStoreIds } = this._conditions;
    
    if (excludedStoreIds && excludedStoreIds.includes(storeId)) {
      return false;
    }
    
    if (applicableStoreIds && applicableStoreIds.length > 0) {
      return applicableStoreIds.includes(storeId);
    }
    
    return true;
  }

  isApplicableToProduct(productId: string): boolean {
    if (this._scope === PromotionScope.GLOBAL) return true;
    if (this._scope === PromotionScope.PRODUCT) {
      const { applicableProductIds, excludedProductIds } = this._conditions;
      
      if (excludedProductIds && excludedProductIds.includes(productId)) {
        return false;
      }
      
      if (applicableProductIds && applicableProductIds.length > 0) {
        return applicableProductIds.includes(productId);
      }
    }
    
    return true;
  }

  isApplicableToCategory(categoryId: string): boolean {
    if (this._scope === PromotionScope.GLOBAL) return true;
    if (this._scope === PromotionScope.CATEGORY) {
      const { applicableCategoryIds, excludedCategoryIds } = this._conditions;
      
      if (excludedCategoryIds && excludedCategoryIds.includes(categoryId)) {
        return false;
      }
      
      if (applicableCategoryIds && applicableCategoryIds.length > 0) {
        return applicableCategoryIds.includes(categoryId);
      }
    }
    
    return true;
  }

  meetsOrderConditions(orderAmount: number, orderQuantity: number): boolean {
    const { minimumOrderAmount, maximumOrderAmount, minimumQuantity, maximumQuantity } = this._conditions;
    
    if (minimumOrderAmount && orderAmount < minimumOrderAmount) return false;
    if (maximumOrderAmount && orderAmount > maximumOrderAmount) return false;
    if (minimumQuantity && orderQuantity < minimumQuantity) return false;
    if (maximumQuantity && orderQuantity > maximumQuantity) return false;
    
    return true;
  }

  meetsTimeConditions(): boolean {
    const now = new Date();
    const { dayOfWeek, timeOfDay } = this._conditions;
    
    if (dayOfWeek && dayOfWeek.length > 0) {
      const currentDay = now.getDay();
      if (!dayOfWeek.includes(currentDay)) return false;
    }
    
    if (timeOfDay) {
      const currentTime = now.toTimeString().slice(0, 5); // HH:MM format
      if (currentTime < timeOfDay.start || currentTime > timeOfDay.end) {
        return false;
      }
    }
    
    return true;
  }

  // Calculation methods
  calculateDiscount(orderAmount: number, quantity: number = 1): number {
    if (!this.isCurrentlyValid()) return 0;
    
    switch (this._type) {
      case PromotionType.PERCENTAGE:
        return (orderAmount * this._value) / 100;
      
      case PromotionType.FIXED_AMOUNT:
        return Math.min(this._value, orderAmount);
      
      case PromotionType.FREE_SHIPPING:
        return 0; // Shipping discount handled separately
      
      case PromotionType.BUY_X_GET_Y:
        if (this._buyXGetYDetails) {
          const eligibleSets = Math.floor(quantity / this._buyXGetYDetails.buyQuantity);
          const freeItems = eligibleSets * this._buyXGetYDetails.getQuantity;
          const itemPrice = orderAmount / quantity;
          return freeItems * itemPrice;
        }
        return 0;
      
      case PromotionType.BUNDLE:
        if (this._bundleDetails) {
          if (this._bundleDetails.bundlePrice) {
            return Math.max(0, orderAmount - this._bundleDetails.bundlePrice);
          }
          if (this._bundleDetails.bundleDiscountPercentage) {
            return (orderAmount * this._bundleDetails.bundleDiscountPercentage) / 100;
          }
        }
        return 0;
      
      case PromotionType.CASHBACK:
        return 0; // Cashback handled separately
      
      default:
        return 0;
    }
  }

  calculateCashback(orderAmount: number): number {
    if (this._type !== PromotionType.CASHBACK || !this.isCurrentlyValid()) {
      return 0;
    }
    
    return (orderAmount * this._value) / 100;
  }

  // State transition methods
  activate(): PromotionDetails {
    if (!this.isDraft() && !this.isPaused()) {
      throw new Error('Can only activate draft or paused promotions');
    }
    
    return new PromotionDetails(
      this._type,
      this._scope,
      PromotionStatus.ACTIVE,
      this._value,
      this._currency,
      this._code,
      this._title,
      this._description,
      this._startDate,
      this._endDate,
      this._conditions,
      this._usageLimit,
      this._currentUsage,
      this._buyXGetYDetails,
      this._bundleDetails,
      this._priority,
      this._isStackable,
      this._metadata
    );
  }

  pause(): PromotionDetails {
    if (!this.isActive()) {
      throw new Error('Can only pause active promotions');
    }
    
    return new PromotionDetails(
      this._type,
      this._scope,
      PromotionStatus.PAUSED,
      this._value,
      this._currency,
      this._code,
      this._title,
      this._description,
      this._startDate,
      this._endDate,
      this._conditions,
      this._usageLimit,
      this._currentUsage,
      this._buyXGetYDetails,
      this._bundleDetails,
      this._priority,
      this._isStackable,
      this._metadata
    );
  }

  expire(): PromotionDetails {
    if (this.isExpired() || this.isCancelled()) {
      throw new Error('Promotion is already expired or cancelled');
    }
    
    return new PromotionDetails(
      this._type,
      this._scope,
      PromotionStatus.EXPIRED,
      this._value,
      this._currency,
      this._code,
      this._title,
      this._description,
      this._startDate,
      this._endDate,
      this._conditions,
      this._usageLimit,
      this._currentUsage,
      this._buyXGetYDetails,
      this._bundleDetails,
      this._priority,
      this._isStackable,
      this._metadata
    );
  }

  cancel(): PromotionDetails {
    if (this.isCancelled()) {
      throw new Error('Promotion is already cancelled');
    }
    
    return new PromotionDetails(
      this._type,
      this._scope,
      PromotionStatus.CANCELLED,
      this._value,
      this._currency,
      this._code,
      this._title,
      this._description,
      this._startDate,
      this._endDate,
      this._conditions,
      this._usageLimit,
      this._currentUsage,
      this._buyXGetYDetails,
      this._bundleDetails,
      this._priority,
      this._isStackable,
      this._metadata
    );
  }

  incrementUsage(count: number = 1): PromotionDetails {
    const newUsage = this._currentUsage + count;
    
    let newStatus = this._status;
    if (this._usageLimit.totalUsageLimit && newUsage >= this._usageLimit.totalUsageLimit) {
      newStatus = PromotionStatus.EXHAUSTED;
    }
    
    return new PromotionDetails(
      this._type,
      this._scope,
      newStatus,
      this._value,
      this._currency,
      this._code,
      this._title,
      this._description,
      this._startDate,
      this._endDate,
      this._conditions,
      this._usageLimit,
      newUsage,
      this._buyXGetYDetails,
      this._bundleDetails,
      this._priority,
      this._isStackable,
      this._metadata
    );
  }

  // Display methods
  getTypeDisplayName(): string {
    const displayNames: Record<PromotionType, string> = {
      [PromotionType.PERCENTAGE]: 'Percentage Discount',
      [PromotionType.FIXED_AMOUNT]: 'Fixed Amount Discount',
      [PromotionType.BUY_X_GET_Y]: 'Buy X Get Y',
      [PromotionType.FREE_SHIPPING]: 'Free Shipping',
      [PromotionType.BUNDLE]: 'Bundle Deal',
      [PromotionType.CASHBACK]: 'Cashback'
    };
    
    return displayNames[this._type] || this._type;
  }

  getStatusDisplayName(): string {
    const displayNames: Record<PromotionStatus, string> = {
      [PromotionStatus.DRAFT]: 'Draft',
      [PromotionStatus.ACTIVE]: 'Active',
      [PromotionStatus.PAUSED]: 'Paused',
      [PromotionStatus.EXPIRED]: 'Expired',
      [PromotionStatus.EXHAUSTED]: 'Exhausted',
      [PromotionStatus.CANCELLED]: 'Cancelled'
    };
    
    return displayNames[this._status] || this._status;
  }

  formatValue(locale: string = 'en-US'): string {
    if (this._type === PromotionType.PERCENTAGE) {
      return `${this._value}%`;
    }
    
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: this._currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(this._value);
  }

  getUsagePercentage(): number {
    if (!this._usageLimit.totalUsageLimit) return 0;
    return (this._currentUsage / this._usageLimit.totalUsageLimit) * 100;
  }

  getRemainingUsage(): number | null {
    if (!this._usageLimit.totalUsageLimit) return null;
    return Math.max(0, this._usageLimit.totalUsageLimit - this._currentUsage);
  }

  // Persistence helper
  toPersistence() {
    return {
      type: this._type,
      scope: this._scope,
      status: this._status,
      value: this._value,
      currency: this._currency,
      code: this._code,
      title: this._title,
      description: this._description,
      startDate: this._startDate,
      endDate: this._endDate,
      conditions: this._conditions,
      usageLimit: this._usageLimit,
      currentUsage: this._currentUsage,
      buyXGetYDetails: this._buyXGetYDetails,
      bundleDetails: this._bundleDetails,
      priority: this._priority,
      isStackable: this._isStackable,
      metadata: this._metadata
    };
  }

  toJSON() {
    return {
      type: this._type,
      typeDisplayName: this.getTypeDisplayName(),
      scope: this._scope,
      status: this._status,
      statusDisplayName: this.getStatusDisplayName(),
      value: this._value,
      formattedValue: this.formatValue(),
      currency: this._currency,
      code: this._code,
      title: this._title,
      description: this._description,
      startDate: this._startDate,
      endDate: this._endDate,
      conditions: this._conditions,
      usageLimit: this._usageLimit,
      currentUsage: this._currentUsage,
      usagePercentage: this.getUsagePercentage(),
      remainingUsage: this.getRemainingUsage(),
      buyXGetYDetails: this._buyXGetYDetails,
      bundleDetails: this._bundleDetails,
      priority: this._priority,
      isStackable: this._isStackable,
      isCurrentlyValid: this.isCurrentlyValid(),
      requiresCode: this.requiresCode(),
      isUsageLimitReached: this.isUsageLimitReached(),
      metadata: this._metadata
    };
  }

  // Static utility methods
  static getAllTypes(): PromotionType[] {
    return Object.values(PromotionType);
  }

  static getAllScopes(): PromotionScope[] {
    return Object.values(PromotionScope);
  }

  static getAllStatuses(): PromotionStatus[] {
    return Object.values(PromotionStatus);
  }

  static isValidType(type: string): boolean {
    return Object.values(PromotionType).includes(type as PromotionType);
  }

  static isValidScope(scope: string): boolean {
    return Object.values(PromotionScope).includes(scope as PromotionScope);
  }

  static isValidStatus(status: string): boolean {
    return Object.values(PromotionStatus).includes(status as PromotionStatus);
  }

  static compareByPriority(a: PromotionDetails, b: PromotionDetails): number {
    return b._priority - a._priority; // Higher priority first
  }

  static filterStackable(promotions: PromotionDetails[]): PromotionDetails[] {
    return promotions.filter(p => p._isStackable);
  }

  static filterNonStackable(promotions: PromotionDetails[]): PromotionDetails[] {
    return promotions.filter(p => !p._isStackable);
  }
}