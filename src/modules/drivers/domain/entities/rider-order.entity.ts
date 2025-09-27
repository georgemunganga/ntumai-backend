import { Entity } from '../../../common/domain/entity';
import { UniqueEntityID } from '../../../common/domain/unique-entity-id';
import { Location } from '../value-objects/location.vo';

export type OrderStatus = 'assigned' | 'accepted' | 'picked_up' | 'in_transit' | 'delivered' | 'cancelled' | 'failed';
export type OrderType = 'food' | 'grocery' | 'pharmacy' | 'package' | 'document' | 'other';
export type PaymentMethod = 'cash' | 'card' | 'digital_wallet' | 'prepaid';
export type CancellationReason = 'rider_unavailable' | 'customer_cancelled' | 'restaurant_closed' | 'address_issue' | 'weather' | 'vehicle_issue' | 'other';

export interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  specialInstructions?: string;
}

export interface DeliveryAddress {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  coordinates: Location;
  instructions?: string;
  contactPhone?: string;
}

export interface OrderTimeline {
  status: OrderStatus;
  timestamp: Date;
  location?: Location;
  notes?: string;
}

export interface RiderOrderProps {
  orderId: string;
  riderId: string;
  shiftId?: string;
  customerId: string;
  restaurantId?: string;
  orderType: OrderType;
  status: OrderStatus;
  items: OrderItem[];
  pickupAddress: DeliveryAddress;
  deliveryAddress: DeliveryAddress;
  estimatedPickupTime: Date;
  estimatedDeliveryTime: Date;
  actualPickupTime?: Date;
  actualDeliveryTime?: Date;
  distance: number; // in kilometers
  baseFare: number;
  deliveryFee: number;
  tip: number;
  totalEarnings: number;
  currency: string;
  paymentMethod: PaymentMethod;
  isPaid: boolean;
  timeline: OrderTimeline[];
  specialInstructions?: string;
  customerNotes?: string;
  riderNotes?: string;
  cancellationReason?: CancellationReason;
  cancellationNotes?: string;
  rating?: number;
  feedback?: string;
  proofOfDelivery?: string[]; // URLs to photos
  assignedAt: Date;
  acceptedAt?: Date;
  pickedUpAt?: Date;
  deliveredAt?: Date;
  cancelledAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export class RiderOrder extends Entity<RiderOrderProps> {
  private constructor(props: RiderOrderProps, id?: UniqueEntityID) {
    super(props, id);
  }

  public static create(props: RiderOrderProps, id?: UniqueEntityID): RiderOrder {
    const order = new RiderOrder(props, id);
    
    // Add initial timeline entry
    order.addTimelineEntry('assigned');
    
    return order;
  }

  get riderOrderId(): UniqueEntityID {
    return this._id;
  }

  get orderId(): string {
    return this.props.orderId;
  }

  get riderId(): string {
    return this.props.riderId;
  }

  get shiftId(): string | undefined {
    return this.props.shiftId;
  }

  get customerId(): string {
    return this.props.customerId;
  }

  get restaurantId(): string | undefined {
    return this.props.restaurantId;
  }

  get orderType(): OrderType {
    return this.props.orderType;
  }

  get status(): OrderStatus {
    return this.props.status;
  }

  get items(): OrderItem[] {
    return this.props.items;
  }

  get pickupAddress(): DeliveryAddress {
    return this.props.pickupAddress;
  }

  get deliveryAddress(): DeliveryAddress {
    return this.props.deliveryAddress;
  }

  get estimatedPickupTime(): Date {
    return this.props.estimatedPickupTime;
  }

  get estimatedDeliveryTime(): Date {
    return this.props.estimatedDeliveryTime;
  }

  get actualPickupTime(): Date | undefined {
    return this.props.actualPickupTime;
  }

  get actualDeliveryTime(): Date | undefined {
    return this.props.actualDeliveryTime;
  }

  get distance(): number {
    return this.props.distance;
  }

  get baseFare(): number {
    return this.props.baseFare;
  }

  get deliveryFee(): number {
    return this.props.deliveryFee;
  }

  get tip(): number {
    return this.props.tip;
  }

  get totalEarnings(): number {
    return this.props.totalEarnings;
  }

  get currency(): string {
    return this.props.currency;
  }

  get paymentMethod(): PaymentMethod {
    return this.props.paymentMethod;
  }

  get isPaid(): boolean {
    return this.props.isPaid;
  }

  get timeline(): OrderTimeline[] {
    return this.props.timeline;
  }

  get specialInstructions(): string | undefined {
    return this.props.specialInstructions;
  }

  get customerNotes(): string | undefined {
    return this.props.customerNotes;
  }

  get riderNotes(): string | undefined {
    return this.props.riderNotes;
  }

  get cancellationReason(): CancellationReason | undefined {
    return this.props.cancellationReason;
  }

  get cancellationNotes(): string | undefined {
    return this.props.cancellationNotes;
  }

  get rating(): number | undefined {
    return this.props.rating;
  }

  get feedback(): string | undefined {
    return this.props.feedback;
  }

  get proofOfDelivery(): string[] | undefined {
    return this.props.proofOfDelivery;
  }

  get assignedAt(): Date {
    return this.props.assignedAt;
  }

  get acceptedAt(): Date | undefined {
    return this.props.acceptedAt;
  }

  get pickedUpAt(): Date | undefined {
    return this.props.pickedUpAt;
  }

  get deliveredAt(): Date | undefined {
    return this.props.deliveredAt;
  }

  get cancelledAt(): Date | undefined {
    return this.props.cancelledAt;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  // Business logic methods

  public accept(shiftId?: string, location?: Location): void {
    if (this.props.status !== 'assigned') {
      throw new Error('Can only accept assigned orders');
    }

    this.props.status = 'accepted';
    this.props.acceptedAt = new Date();
    if (shiftId) this.props.shiftId = shiftId;
    this.props.updatedAt = new Date();

    this.addTimelineEntry('accepted', location);
  }

  public pickUp(location?: Location, notes?: string): void {
    if (this.props.status !== 'accepted') {
      throw new Error('Can only pick up accepted orders');
    }

    this.props.status = 'picked_up';
    this.props.actualPickupTime = new Date();
    this.props.pickedUpAt = new Date();
    if (notes) this.props.riderNotes = notes;
    this.props.updatedAt = new Date();

    this.addTimelineEntry('picked_up', location, notes);
  }

  public startDelivery(location?: Location): void {
    if (this.props.status !== 'picked_up') {
      throw new Error('Can only start delivery after pickup');
    }

    this.props.status = 'in_transit';
    this.props.updatedAt = new Date();

    this.addTimelineEntry('in_transit', location);
  }

  public deliver(location?: Location, proofOfDelivery?: string[], notes?: string): void {
    if (this.props.status !== 'in_transit') {
      throw new Error('Can only deliver orders in transit');
    }

    this.props.status = 'delivered';
    this.props.actualDeliveryTime = new Date();
    this.props.deliveredAt = new Date();
    if (proofOfDelivery) this.props.proofOfDelivery = proofOfDelivery;
    if (notes) this.props.riderNotes = notes;
    this.props.updatedAt = new Date();

    this.addTimelineEntry('delivered', location, notes);
  }

  public cancel(reason: CancellationReason, notes?: string, location?: Location): void {
    if (['delivered', 'cancelled', 'failed'].includes(this.props.status)) {
      throw new Error('Cannot cancel completed or already cancelled orders');
    }

    this.props.status = 'cancelled';
    this.props.cancellationReason = reason;
    this.props.cancellationNotes = notes;
    this.props.cancelledAt = new Date();
    this.props.updatedAt = new Date();

    this.addTimelineEntry('cancelled', location, notes);
  }

  public markAsFailed(reason?: string, location?: Location): void {
    if (['delivered', 'cancelled'].includes(this.props.status)) {
      throw new Error('Cannot mark delivered or cancelled orders as failed');
    }

    this.props.status = 'failed';
    this.props.cancellationReason = 'other';
    this.props.cancellationNotes = reason;
    this.props.cancelledAt = new Date();
    this.props.updatedAt = new Date();

    this.addTimelineEntry('failed', location, reason);
  }

  public addTip(amount: number): void {
    if (amount < 0) {
      throw new Error('Tip amount cannot be negative');
    }

    this.props.tip += amount;
    this.props.totalEarnings += amount;
    this.props.updatedAt = new Date();
  }

  public updateEarnings(baseFare: number, deliveryFee: number, tip: number = 0): void {
    this.props.baseFare = baseFare;
    this.props.deliveryFee = deliveryFee;
    this.props.tip = tip;
    this.props.totalEarnings = baseFare + deliveryFee + tip;
    this.props.updatedAt = new Date();
  }

  public markAsPaid(): void {
    this.props.isPaid = true;
    this.props.updatedAt = new Date();
  }

  public addRating(rating: number, feedback?: string): void {
    if (rating < 1 || rating > 5) {
      throw new Error('Rating must be between 1 and 5');
    }

    this.props.rating = rating;
    if (feedback) this.props.feedback = feedback;
    this.props.updatedAt = new Date();
  }

  public updateEstimatedTimes(pickupTime: Date, deliveryTime: Date): void {
    this.props.estimatedPickupTime = pickupTime;
    this.props.estimatedDeliveryTime = deliveryTime;
    this.props.updatedAt = new Date();
  }

  public addRiderNotes(notes: string): void {
    this.props.riderNotes = notes;
    this.props.updatedAt = new Date();
  }

  private addTimelineEntry(status: OrderStatus, location?: Location, notes?: string): void {
    const timelineEntry: OrderTimeline = {
      status,
      timestamp: new Date(),
      location,
      notes,
    };

    this.props.timeline.push(timelineEntry);
  }

  // Helper methods

  public isAssigned(): boolean {
    return this.props.status === 'assigned';
  }

  public isAccepted(): boolean {
    return this.props.status === 'accepted';
  }

  public isPickedUp(): boolean {
    return this.props.status === 'picked_up';
  }

  public isInTransit(): boolean {
    return this.props.status === 'in_transit';
  }

  public isDelivered(): boolean {
    return this.props.status === 'delivered';
  }

  public isCancelled(): boolean {
    return this.props.status === 'cancelled';
  }

  public isFailed(): boolean {
    return this.props.status === 'failed';
  }

  public isCompleted(): boolean {
    return this.isDelivered() || this.isCancelled() || this.isFailed();
  }

  public isActive(): boolean {
    return !this.isCompleted();
  }

  public getPickupDelay(): number | null {
    if (!this.props.actualPickupTime) return null;
    
    const delayMs = this.props.actualPickupTime.getTime() - this.props.estimatedPickupTime.getTime();
    return Math.floor(delayMs / (1000 * 60)); // in minutes
  }

  public getDeliveryDelay(): number | null {
    if (!this.props.actualDeliveryTime) return null;
    
    const delayMs = this.props.actualDeliveryTime.getTime() - this.props.estimatedDeliveryTime.getTime();
    return Math.floor(delayMs / (1000 * 60)); // in minutes
  }

  public getTotalDeliveryTime(): number | null {
    if (!this.props.actualPickupTime || !this.props.actualDeliveryTime) return null;
    
    const timeMs = this.props.actualDeliveryTime.getTime() - this.props.actualPickupTime.getTime();
    return Math.floor(timeMs / (1000 * 60)); // in minutes
  }

  public isOnTime(): boolean {
    const deliveryDelay = this.getDeliveryDelay();
    return deliveryDelay !== null && deliveryDelay <= 5; // 5 minutes tolerance
  }

  public getEarningsPerKilometer(): number {
    if (this.props.distance === 0) return 0;
    return this.props.totalEarnings / this.props.distance;
  }

  public getTimeToPickup(): number | null {
    if (this.props.actualPickupTime) return null;
    
    const timeMs = this.props.estimatedPickupTime.getTime() - Date.now();
    return Math.floor(timeMs / (1000 * 60)); // in minutes
  }

  public getTimeToDelivery(): number | null {
    if (this.props.actualDeliveryTime) return null;
    
    const timeMs = this.props.estimatedDeliveryTime.getTime() - Date.now();
    return Math.floor(timeMs / (1000 * 60)); // in minutes
  }

  public getOrderAge(): number {
    const ageMs = Date.now() - this.props.assignedAt.getTime();
    return Math.floor(ageMs / (1000 * 60)); // in minutes
  }

  public getItemsCount(): number {
    return this.props.items.reduce((total, item) => total + item.quantity, 0);
  }

  public getItemsValue(): number {
    return this.props.items.reduce((total, item) => total + (item.price * item.quantity), 0);
  }

  public getDistanceToPickup(currentLocation: Location): number {
    return currentLocation.distanceTo(this.props.pickupAddress.coordinates);
  }

  public getDistanceToDelivery(currentLocation: Location): number {
    return currentLocation.distanceTo(this.props.deliveryAddress.coordinates);
  }

  public formatEarnings(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: this.props.currency,
    }).format(amount);
  }

  public formatDuration(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  }

  public getStatusDisplay(): string {
    const statusMap: Record<OrderStatus, string> = {
      assigned: 'Assigned',
      accepted: 'Accepted',
      picked_up: 'Picked Up',
      in_transit: 'In Transit',
      delivered: 'Delivered',
      cancelled: 'Cancelled',
      failed: 'Failed',
    };
    
    return statusMap[this.props.status];
  }

  public toJSON() {
    return {
      id: this._id.toString(),
      orderId: this.props.orderId,
      riderId: this.props.riderId,
      shiftId: this.props.shiftId,
      customerId: this.props.customerId,
      restaurantId: this.props.restaurantId,
      orderType: this.props.orderType,
      status: this.props.status,
      statusDisplay: this.getStatusDisplay(),
      items: this.props.items,
      itemsCount: this.getItemsCount(),
      itemsValue: this.getItemsValue(),
      pickupAddress: {
        ...this.props.pickupAddress,
        coordinates: this.props.pickupAddress.coordinates.toJSON(),
      },
      deliveryAddress: {
        ...this.props.deliveryAddress,
        coordinates: this.props.deliveryAddress.coordinates.toJSON(),
      },
      estimatedPickupTime: this.props.estimatedPickupTime,
      estimatedDeliveryTime: this.props.estimatedDeliveryTime,
      actualPickupTime: this.props.actualPickupTime,
      actualDeliveryTime: this.props.actualDeliveryTime,
      distance: this.props.distance,
      baseFare: this.props.baseFare,
      deliveryFee: this.props.deliveryFee,
      tip: this.props.tip,
      totalEarnings: this.props.totalEarnings,
      currency: this.props.currency,
      paymentMethod: this.props.paymentMethod,
      isPaid: this.props.isPaid,
      timeline: this.props.timeline.map(entry => ({
        ...entry,
        location: entry.location?.toJSON(),
      })),
      specialInstructions: this.props.specialInstructions,
      customerNotes: this.props.customerNotes,
      riderNotes: this.props.riderNotes,
      cancellationReason: this.props.cancellationReason,
      cancellationNotes: this.props.cancellationNotes,
      rating: this.props.rating,
      feedback: this.props.feedback,
      proofOfDelivery: this.props.proofOfDelivery,
      assignedAt: this.props.assignedAt,
      acceptedAt: this.props.acceptedAt,
      pickedUpAt: this.props.pickedUpAt,
      deliveredAt: this.props.deliveredAt,
      cancelledAt: this.props.cancelledAt,
      pickupDelay: this.getPickupDelay(),
      deliveryDelay: this.getDeliveryDelay(),
      totalDeliveryTime: this.getTotalDeliveryTime(),
      isOnTime: this.isOnTime(),
      earningsPerKm: this.getEarningsPerKilometer(),
      timeToPickup: this.getTimeToPickup(),
      timeToDelivery: this.getTimeToDelivery(),
      orderAge: this.getOrderAge(),
      isActive: this.isActive(),
      isCompleted: this.isCompleted(),
      formattedEarnings: this.formatEarnings(this.props.totalEarnings),
      formattedDeliveryTime: this.getTotalDeliveryTime() ? this.formatDuration(this.getTotalDeliveryTime()!) : null,
      createdAt: this.props.createdAt,
      updatedAt: this.props.updatedAt,
    };
  }
}