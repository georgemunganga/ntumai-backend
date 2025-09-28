export enum DeliveryMethod {
  STANDARD = 'STANDARD',
  EXPRESS = 'EXPRESS',
  OVERNIGHT = 'OVERNIGHT',
  SAME_DAY = 'SAME_DAY',
  PICKUP = 'PICKUP',
  DRONE = 'DRONE'
}

export enum DeliveryStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  PICKED_UP = 'PICKED_UP',
  IN_TRANSIT = 'IN_TRANSIT',
  OUT_FOR_DELIVERY = 'OUT_FOR_DELIVERY',
  DELIVERED = 'DELIVERED',
  FAILED = 'FAILED',
  RETURNED = 'RETURNED'
}

export interface DeliveryAddress {
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  apartment?: string;
  instructions?: string;
}

export interface DeliveryTimeSlot {
  startTime: Date;
  endTime: Date;
  isAvailable: boolean;
}

export class DeliveryInfo {
  private constructor(
    private readonly _method: DeliveryMethod,
    private readonly _status: DeliveryStatus,
    private readonly _address: DeliveryAddress,
    private readonly _fee: number,
    private readonly _currency: string,
    private readonly _estimatedDeliveryDate: Date | null,
    private readonly _actualDeliveryDate: Date | null,
    private readonly _trackingNumber: string | null,
    private readonly _carrier: string | null,
    private readonly _timeSlot: DeliveryTimeSlot | null,
    private readonly _driverId: string | null,
    private readonly _driverName: string | null,
    private readonly _driverPhone: string | null,
    private readonly _notes: string | null,
    private readonly _metadata: Record<string, any>
  ) {
    this.validateAddress(_address);
    this.validateFee(_fee);
    this.validateCurrency(_currency);
    this.validateDates(_estimatedDeliveryDate, _actualDeliveryDate);
  }

  static create(
    method: DeliveryMethod,
    address: DeliveryAddress,
    fee: number,
    currency: string,
    options?: {
      status?: DeliveryStatus;
      estimatedDeliveryDate?: Date;
      trackingNumber?: string;
      carrier?: string;
      timeSlot?: DeliveryTimeSlot;
      driverId?: string;
      driverName?: string;
      driverPhone?: string;
      notes?: string;
      metadata?: Record<string, any>;
    }
  ): DeliveryInfo {
    return new DeliveryInfo(
      method,
      options?.status || DeliveryStatus.PENDING,
      address,
      fee,
      currency,
      options?.estimatedDeliveryDate || null,
      null, // actual delivery date is null initially
      options?.trackingNumber || null,
      options?.carrier || null,
      options?.timeSlot || null,
      options?.driverId || null,
      options?.driverName || null,
      options?.driverPhone || null,
      options?.notes || null,
      options?.metadata || {}
    );
  }

  static fromPersistence(data: {
    method: DeliveryMethod;
    status: DeliveryStatus;
    address: DeliveryAddress;
    fee: number;
    currency: string;
    estimatedDeliveryDate: Date | null;
    actualDeliveryDate: Date | null;
    trackingNumber: string | null;
    carrier: string | null;
    timeSlot: DeliveryTimeSlot | null;
    driverId: string | null;
    driverName: string | null;
    driverPhone: string | null;
    notes: string | null;
    metadata: Record<string, any>;
  }): DeliveryInfo {
    return new DeliveryInfo(
      data.method,
      data.status,
      data.address,
      data.fee,
      data.currency,
      data.estimatedDeliveryDate,
      data.actualDeliveryDate,
      data.trackingNumber,
      data.carrier,
      data.timeSlot,
      data.driverId,
      data.driverName,
      data.driverPhone,
      data.notes,
      data.metadata
    );
  }

  // Getters
  get method(): DeliveryMethod {
    return this._method;
  }

  get status(): DeliveryStatus {
    return this._status;
  }

  get address(): DeliveryAddress {
    return { ...this._address };
  }

  get fee(): number {
    return this._fee;
  }

  get currency(): string {
    return this._currency;
  }

  get estimatedDeliveryDate(): Date | null {
    return this._estimatedDeliveryDate;
  }

  get actualDeliveryDate(): Date | null {
    return this._actualDeliveryDate;
  }

  get trackingNumber(): string | null {
    return this._trackingNumber;
  }

  get carrier(): string | null {
    return this._carrier;
  }

  get timeSlot(): DeliveryTimeSlot | null {
    return this._timeSlot ? { ...this._timeSlot } : null;
  }

  get driverId(): string | null {
    return this._driverId;
  }

  get driverName(): string | null {
    return this._driverName;
  }

  get driverPhone(): string | null {
    return this._driverPhone;
  }

  get notes(): string | null {
    return this._notes;
  }

  get metadata(): Record<string, any> {
    return { ...this._metadata };
  }

  // Validation methods
  private validateAddress(address: DeliveryAddress): void {
    if (!address) {
      throw new Error('Delivery address is required');
    }

    const requiredFields = ['street', 'city', 'state', 'postalCode', 'country'];
    for (const field of requiredFields) {
      if (!address[field as keyof DeliveryAddress] || 
          typeof address[field as keyof DeliveryAddress] !== 'string' ||
          (address[field as keyof DeliveryAddress] as string).trim() === '') {
        throw new Error(`Address ${field} is required and must be a non-empty string`);
      }
    }

    // Validate postal code format (basic validation)
    if (!/^[A-Za-z0-9\s-]{3,10}$/.test(address.postalCode)) {
      throw new Error('Invalid postal code format');
    }
  }

  private validateFee(fee: number): void {
    if (typeof fee !== 'number' || isNaN(fee)) {
      throw new Error('Delivery fee must be a valid number');
    }
    if (fee < 0) {
      throw new Error('Delivery fee cannot be negative');
    }
    if (!Number.isFinite(fee)) {
      throw new Error('Delivery fee must be finite');
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

  private validateDates(estimatedDate: Date | null, actualDate: Date | null): void {
    if (estimatedDate && (!(estimatedDate instanceof Date) || isNaN(estimatedDate.getTime()))) {
      throw new Error('Estimated delivery date must be a valid Date');
    }
    if (actualDate && (!(actualDate instanceof Date) || isNaN(actualDate.getTime()))) {
      throw new Error('Actual delivery date must be a valid Date');
    }
    if (actualDate && estimatedDate && actualDate < estimatedDate) {
      // This is actually okay - early delivery is good!
    }
  }

  // Status checking methods
  isPending(): boolean {
    return this._status === DeliveryStatus.PENDING;
  }

  isConfirmed(): boolean {
    return this._status === DeliveryStatus.CONFIRMED;
  }

  isPickedUp(): boolean {
    return this._status === DeliveryStatus.PICKED_UP;
  }

  isInTransit(): boolean {
    return this._status === DeliveryStatus.IN_TRANSIT;
  }

  isOutForDelivery(): boolean {
    return this._status === DeliveryStatus.OUT_FOR_DELIVERY;
  }

  isDelivered(): boolean {
    return this._status === DeliveryStatus.DELIVERED;
  }

  isFailed(): boolean {
    return this._status === DeliveryStatus.FAILED;
  }

  isReturned(): boolean {
    return this._status === DeliveryStatus.RETURNED;
  }

  // Business logic methods
  isActive(): boolean {
    return [
      DeliveryStatus.CONFIRMED,
      DeliveryStatus.PICKED_UP,
      DeliveryStatus.IN_TRANSIT,
      DeliveryStatus.OUT_FOR_DELIVERY
    ].includes(this._status);
  }

  isCompleted(): boolean {
    return this._status === DeliveryStatus.DELIVERED;
  }

  canBeTracked(): boolean {
    return this._trackingNumber !== null && this.isActive();
  }

  requiresSignature(): boolean {
    return this._method === DeliveryMethod.EXPRESS || 
           this._method === DeliveryMethod.OVERNIGHT;
  }

  isFreeDelivery(): boolean {
    return this._fee === 0;
  }

  isExpressDelivery(): boolean {
    return [
      DeliveryMethod.EXPRESS,
      DeliveryMethod.OVERNIGHT,
      DeliveryMethod.SAME_DAY
    ].includes(this._method);
  }

  hasTimeSlot(): boolean {
    return this._timeSlot !== null;
  }

  hasDriver(): boolean {
    return this._driverId !== null;
  }

  // State transition methods
  confirm(trackingNumber?: string, carrier?: string): DeliveryInfo {
    if (!this.isPending()) {
      throw new Error('Can only confirm pending deliveries');
    }

    return new DeliveryInfo(
      this._method,
      DeliveryStatus.CONFIRMED,
      this._address,
      this._fee,
      this._currency,
      this._estimatedDeliveryDate,
      this._actualDeliveryDate,
      trackingNumber || this._trackingNumber,
      carrier || this._carrier,
      this._timeSlot,
      this._driverId,
      this._driverName,
      this._driverPhone,
      this._notes,
      this._metadata
    );
  }

  pickUp(driverId?: string, driverName?: string, driverPhone?: string): DeliveryInfo {
    if (!this.isConfirmed()) {
      throw new Error('Can only pick up confirmed deliveries');
    }

    return new DeliveryInfo(
      this._method,
      DeliveryStatus.PICKED_UP,
      this._address,
      this._fee,
      this._currency,
      this._estimatedDeliveryDate,
      this._actualDeliveryDate,
      this._trackingNumber,
      this._carrier,
      this._timeSlot,
      driverId || this._driverId,
      driverName || this._driverName,
      driverPhone || this._driverPhone,
      this._notes,
      this._metadata
    );
  }

  startTransit(): DeliveryInfo {
    if (!this.isPickedUp()) {
      throw new Error('Can only start transit for picked up deliveries');
    }

    return new DeliveryInfo(
      this._method,
      DeliveryStatus.IN_TRANSIT,
      this._address,
      this._fee,
      this._currency,
      this._estimatedDeliveryDate,
      this._actualDeliveryDate,
      this._trackingNumber,
      this._carrier,
      this._timeSlot,
      this._driverId,
      this._driverName,
      this._driverPhone,
      this._notes,
      this._metadata
    );
  }

  startDelivery(): DeliveryInfo {
    if (!this.isInTransit()) {
      throw new Error('Can only start delivery for in-transit deliveries');
    }

    return new DeliveryInfo(
      this._method,
      DeliveryStatus.OUT_FOR_DELIVERY,
      this._address,
      this._fee,
      this._currency,
      this._estimatedDeliveryDate,
      this._actualDeliveryDate,
      this._trackingNumber,
      this._carrier,
      this._timeSlot,
      this._driverId,
      this._driverName,
      this._driverPhone,
      this._notes,
      this._metadata
    );
  }

  complete(actualDeliveryDate?: Date): DeliveryInfo {
    if (!this.isOutForDelivery()) {
      throw new Error('Can only complete out-for-delivery deliveries');
    }

    return new DeliveryInfo(
      this._method,
      DeliveryStatus.DELIVERED,
      this._address,
      this._fee,
      this._currency,
      this._estimatedDeliveryDate,
      actualDeliveryDate || new Date(),
      this._trackingNumber,
      this._carrier,
      this._timeSlot,
      this._driverId,
      this._driverName,
      this._driverPhone,
      this._notes,
      this._metadata
    );
  }

  fail(reason?: string): DeliveryInfo {
    if (this.isDelivered()) {
      throw new Error('Cannot fail already delivered orders');
    }

    const updatedMetadata = { ...this._metadata };
    if (reason) {
      updatedMetadata.failureReason = reason;
    }
    updatedMetadata.failedAt = new Date();

    return new DeliveryInfo(
      this._method,
      DeliveryStatus.FAILED,
      this._address,
      this._fee,
      this._currency,
      this._estimatedDeliveryDate,
      this._actualDeliveryDate,
      this._trackingNumber,
      this._carrier,
      this._timeSlot,
      this._driverId,
      this._driverName,
      this._driverPhone,
      this._notes,
      updatedMetadata
    );
  }

  // Time calculation methods
  getEstimatedDeliveryDays(): number | null {
    if (!this._estimatedDeliveryDate) return null;
    const now = new Date();
    const diffTime = this._estimatedDeliveryDate.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  getActualDeliveryDays(): number | null {
    if (!this._actualDeliveryDate) return null;
    const orderDate = new Date(); // This would typically come from order creation date
    const diffTime = this._actualDeliveryDate.getTime() - orderDate.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  isDeliveryDelayed(): boolean {
    if (!this._estimatedDeliveryDate || this.isDelivered()) return false;
    return new Date() > this._estimatedDeliveryDate;
  }

  wasDeliveredEarly(): boolean {
    if (!this._estimatedDeliveryDate || !this._actualDeliveryDate) return false;
    return this._actualDeliveryDate < this._estimatedDeliveryDate;
  }

  wasDeliveredOnTime(): boolean {
    if (!this._estimatedDeliveryDate || !this._actualDeliveryDate) return false;
    const daysDiff = Math.abs(
      (this._actualDeliveryDate.getTime() - this._estimatedDeliveryDate.getTime()) / 
      (1000 * 60 * 60 * 24)
    );
    return daysDiff <= 1; // Within 1 day is considered on time
  }

  // Address methods
  getFullAddress(): string {
    const parts = [this._address.street];
    if (this._address.apartment) {
      parts.push(this._address.apartment);
    }
    parts.push(this._address.city);
    parts.push(this._address.state);
    parts.push(this._address.postalCode);
    parts.push(this._address.country);
    return parts.join(', ');
  }

  isSameAddress(other: DeliveryAddress): boolean {
    return this._address.street === other.street &&
           this._address.city === other.city &&
           this._address.state === other.state &&
           this._address.postalCode === other.postalCode &&
           this._address.country === other.country;
  }

  // Display methods
  getMethodDisplayName(): string {
    const displayNames: Record<DeliveryMethod, string> = {
      [DeliveryMethod.STANDARD]: 'Standard Delivery',
      [DeliveryMethod.EXPRESS]: 'Express Delivery',
      [DeliveryMethod.OVERNIGHT]: 'Overnight Delivery',
      [DeliveryMethod.SAME_DAY]: 'Same Day Delivery',
      [DeliveryMethod.PICKUP]: 'Store Pickup',
      [DeliveryMethod.DRONE]: 'Drone Delivery'
    };

    return displayNames[this._method] || this._method;
  }

  getStatusDisplayName(): string {
    const displayNames: Record<DeliveryStatus, string> = {
      [DeliveryStatus.PENDING]: 'Pending',
      [DeliveryStatus.CONFIRMED]: 'Confirmed',
      [DeliveryStatus.PICKED_UP]: 'Picked Up',
      [DeliveryStatus.IN_TRANSIT]: 'In Transit',
      [DeliveryStatus.OUT_FOR_DELIVERY]: 'Out for Delivery',
      [DeliveryStatus.DELIVERED]: 'Delivered',
      [DeliveryStatus.FAILED]: 'Failed',
      [DeliveryStatus.RETURNED]: 'Returned'
    };

    return displayNames[this._status] || this._status;
  }

  formatFee(locale: string = 'en-US'): string {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: this._currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(this._fee);
  }

  // Persistence helper
  toPersistence() {
    return {
      method: this._method,
      status: this._status,
      address: this._address,
      fee: this._fee,
      currency: this._currency,
      estimatedDeliveryDate: this._estimatedDeliveryDate,
      actualDeliveryDate: this._actualDeliveryDate,
      trackingNumber: this._trackingNumber,
      carrier: this._carrier,
      timeSlot: this._timeSlot,
      driverId: this._driverId,
      driverName: this._driverName,
      driverPhone: this._driverPhone,
      notes: this._notes,
      metadata: this._metadata
    };
  }

  toJSON() {
    return {
      method: this._method,
      methodDisplayName: this.getMethodDisplayName(),
      status: this._status,
      statusDisplayName: this.getStatusDisplayName(),
      address: this._address,
      fullAddress: this.getFullAddress(),
      fee: this._fee,
      currency: this._currency,
      formattedFee: this.formatFee(),
      estimatedDeliveryDate: this._estimatedDeliveryDate,
      actualDeliveryDate: this._actualDeliveryDate,
      estimatedDeliveryDays: this.getEstimatedDeliveryDays(),
      trackingNumber: this._trackingNumber,
      carrier: this._carrier,
      timeSlot: this._timeSlot,
      driverId: this._driverId,
      driverName: this._driverName,
      driverPhone: this._driverPhone,
      notes: this._notes,
      isActive: this.isActive(),
      isCompleted: this.isCompleted(),
      canBeTracked: this.canBeTracked(),
      isFreeDelivery: this.isFreeDelivery(),
      isExpressDelivery: this.isExpressDelivery(),
      isDeliveryDelayed: this.isDeliveryDelayed(),
      metadata: this._metadata
    };
  }

  // Static utility methods
  static getAllMethods(): DeliveryMethod[] {
    return Object.values(DeliveryMethod);
  }

  static getAllStatuses(): DeliveryStatus[] {
    return Object.values(DeliveryStatus);
  }

  static isValidMethod(method: string): boolean {
    return Object.values(DeliveryMethod).includes(method as DeliveryMethod);
  }

  static isValidStatus(status: string): boolean {
    return Object.values(DeliveryStatus).includes(status as DeliveryStatus);
  }

  static calculateEstimatedDeliveryDate(method: DeliveryMethod, orderDate: Date = new Date()): Date {
    const deliveryDays: Record<DeliveryMethod, number> = {
      [DeliveryMethod.SAME_DAY]: 0,
      [DeliveryMethod.OVERNIGHT]: 1,
      [DeliveryMethod.EXPRESS]: 2,
      [DeliveryMethod.STANDARD]: 5,
      [DeliveryMethod.PICKUP]: 1,
      [DeliveryMethod.DRONE]: 0
    };

    const days = deliveryDays[method] || 5;
    const estimatedDate = new Date(orderDate);
    estimatedDate.setDate(estimatedDate.getDate() + days);
    return estimatedDate;
  }
}