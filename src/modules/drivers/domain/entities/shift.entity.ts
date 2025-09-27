import { Entity } from '../../../common/domain/entity';
import { UniqueEntityID } from '../../../common/domain/unique-entity-id';
import { Location } from '../value-objects/location.vo';
import { ShiftStatus } from '../value-objects/shift-status.vo';

export type ShiftState = 'active' | 'completed' | 'cancelled';
export type BreakType = 'lunch' | 'rest' | 'emergency';

export interface BreakRecord {
  id: string;
  type: BreakType;
  startTime: Date;
  endTime?: Date;
  duration?: number; // in minutes
  reason?: string;
}

export interface LocationUpdate {
  id: string;
  location: Location;
  timestamp: Date;
  accuracy?: number; // GPS accuracy in meters
}

export interface ShiftProps {
  riderId: string;
  startTime: Date;
  endTime?: Date;
  state: ShiftState;
  startLocation?: Location;
  endLocation?: Location;
  totalDistance: number; // in kilometers
  totalOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  totalEarnings: number;
  currency: string;
  breaks: BreakRecord[];
  locationUpdates: LocationUpdate[];
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class Shift extends Entity<ShiftProps> {
  private constructor(props: ShiftProps, id?: UniqueEntityID) {
    super(props, id);
  }

  public static create(props: ShiftProps, id?: UniqueEntityID): Shift {
    return new Shift(props, id);
  }

  public static startNew(riderId: string, startLocation?: Location): Shift {
    const now = new Date();
    
    return new Shift({
      riderId,
      startTime: now,
      state: 'active',
      startLocation,
      totalDistance: 0,
      totalOrders: 0,
      completedOrders: 0,
      cancelledOrders: 0,
      totalEarnings: 0,
      currency: 'USD',
      breaks: [],
      locationUpdates: startLocation ? [{
        id: new UniqueEntityID().toString(),
        location: startLocation,
        timestamp: now,
      }] : [],
      createdAt: now,
      updatedAt: now,
    });
  }

  get shiftId(): UniqueEntityID {
    return this._id;
  }

  get riderId(): string {
    return this.props.riderId;
  }

  get startTime(): Date {
    return this.props.startTime;
  }

  get endTime(): Date | undefined {
    return this.props.endTime;
  }

  get state(): ShiftState {
    return this.props.state;
  }

  get startLocation(): Location | undefined {
    return this.props.startLocation;
  }

  get endLocation(): Location | undefined {
    return this.props.endLocation;
  }

  get totalDistance(): number {
    return this.props.totalDistance;
  }

  get totalOrders(): number {
    return this.props.totalOrders;
  }

  get completedOrders(): number {
    return this.props.completedOrders;
  }

  get cancelledOrders(): number {
    return this.props.cancelledOrders;
  }

  get totalEarnings(): number {
    return this.props.totalEarnings;
  }

  get currency(): string {
    return this.props.currency;
  }

  get breaks(): BreakRecord[] {
    return this.props.breaks;
  }

  get locationUpdates(): LocationUpdate[] {
    return this.props.locationUpdates;
  }

  get notes(): string | undefined {
    return this.props.notes;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  // Business logic methods

  public endShift(endLocation?: Location): void {
    if (this.props.state !== 'active') {
      throw new Error('Cannot end shift that is not active');
    }

    // End any active break
    this.endCurrentBreak();

    this.props.endTime = new Date();
    this.props.endLocation = endLocation;
    this.props.state = 'completed';
    this.props.updatedAt = new Date();

    if (endLocation) {
      this.addLocationUpdate(endLocation);
    }
  }

  public cancelShift(reason?: string): void {
    if (this.props.state !== 'active') {
      throw new Error('Cannot cancel shift that is not active');
    }

    this.props.endTime = new Date();
    this.props.state = 'cancelled';
    this.props.notes = reason;
    this.props.updatedAt = new Date();
  }

  public startBreak(type: BreakType, reason?: string): void {
    if (this.props.state !== 'active') {
      throw new Error('Cannot start break on inactive shift');
    }

    // End current break if any
    this.endCurrentBreak();

    const breakRecord: BreakRecord = {
      id: new UniqueEntityID().toString(),
      type,
      startTime: new Date(),
      reason,
    };

    this.props.breaks.push(breakRecord);
    this.props.updatedAt = new Date();
  }

  public endBreak(): void {
    const currentBreak = this.getCurrentBreak();
    if (!currentBreak) {
      throw new Error('No active break to end');
    }

    this.endCurrentBreak();
  }

  private endCurrentBreak(): void {
    const currentBreak = this.getCurrentBreak();
    if (currentBreak) {
      const now = new Date();
      currentBreak.endTime = now;
      currentBreak.duration = Math.floor(
        (now.getTime() - currentBreak.startTime.getTime()) / (1000 * 60)
      );
      this.props.updatedAt = new Date();
    }
  }

  public addLocationUpdate(location: Location, accuracy?: number): void {
    const locationUpdate: LocationUpdate = {
      id: new UniqueEntityID().toString(),
      location,
      timestamp: new Date(),
      accuracy,
    };

    this.props.locationUpdates.push(locationUpdate);
    
    // Calculate distance from last location
    if (this.props.locationUpdates.length > 1) {
      const previousLocation = this.props.locationUpdates[this.props.locationUpdates.length - 2];
      const distance = previousLocation.location.distanceTo(location);
      this.props.totalDistance += distance;
    }

    this.props.updatedAt = new Date();
  }

  public addOrder(): void {
    this.props.totalOrders += 1;
    this.props.updatedAt = new Date();
  }

  public completeOrder(earnings: number): void {
    this.props.completedOrders += 1;
    this.props.totalEarnings += earnings;
    this.props.updatedAt = new Date();
  }

  public cancelOrder(): void {
    this.props.cancelledOrders += 1;
    this.props.updatedAt = new Date();
  }

  public addNotes(notes: string): void {
    this.props.notes = notes;
    this.props.updatedAt = new Date();
  }

  // Helper methods

  public isActive(): boolean {
    return this.props.state === 'active';
  }

  public isCompleted(): boolean {
    return this.props.state === 'completed';
  }

  public isCancelled(): boolean {
    return this.props.state === 'cancelled';
  }

  public getCurrentBreak(): BreakRecord | undefined {
    return this.props.breaks.find(breakRecord => !breakRecord.endTime);
  }

  public isOnBreak(): boolean {
    return this.getCurrentBreak() !== undefined;
  }

  public getTotalDuration(): number {
    if (!this.props.endTime && this.props.state === 'active') {
      return Math.floor((Date.now() - this.props.startTime.getTime()) / (1000 * 60));
    }
    
    if (this.props.endTime) {
      return Math.floor((this.props.endTime.getTime() - this.props.startTime.getTime()) / (1000 * 60));
    }
    
    return 0;
  }

  public getWorkingDuration(): number {
    const totalDuration = this.getTotalDuration();
    const breakDuration = this.getTotalBreakDuration();
    return Math.max(0, totalDuration - breakDuration);
  }

  public getTotalBreakDuration(): number {
    return this.props.breaks.reduce((total, breakRecord) => {
      if (breakRecord.duration) {
        return total + breakRecord.duration;
      }
      
      // Calculate duration for active break
      if (!breakRecord.endTime) {
        const duration = Math.floor((Date.now() - breakRecord.startTime.getTime()) / (1000 * 60));
        return total + duration;
      }
      
      return total;
    }, 0);
  }

  public getBreaksByType(type: BreakType): BreakRecord[] {
    return this.props.breaks.filter(breakRecord => breakRecord.type === type);
  }

  public getAverageEarningsPerOrder(): number {
    if (this.props.completedOrders === 0) return 0;
    return this.props.totalEarnings / this.props.completedOrders;
  }

  public getOrderCompletionRate(): number {
    if (this.props.totalOrders === 0) return 0;
    return (this.props.completedOrders / this.props.totalOrders) * 100;
  }

  public getOrderCancellationRate(): number {
    if (this.props.totalOrders === 0) return 0;
    return (this.props.cancelledOrders / this.props.totalOrders) * 100;
  }

  public getAverageDistancePerOrder(): number {
    if (this.props.completedOrders === 0) return 0;
    return this.props.totalDistance / this.props.completedOrders;
  }

  public getEarningsPerHour(): number {
    const workingHours = this.getWorkingDuration() / 60;
    if (workingHours === 0) return 0;
    return this.props.totalEarnings / workingHours;
  }

  public getEarningsPerKilometer(): number {
    if (this.props.totalDistance === 0) return 0;
    return this.props.totalEarnings / this.props.totalDistance;
  }

  public getCurrentLocation(): Location | undefined {
    if (this.props.locationUpdates.length === 0) return undefined;
    
    const sortedUpdates = this.props.locationUpdates
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    
    return sortedUpdates[0].location;
  }

  public getLocationHistory(limit?: number): LocationUpdate[] {
    const sorted = this.props.locationUpdates
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    
    return limit ? sorted.slice(0, limit) : sorted;
  }

  public getShiftSummary(): {
    duration: { total: number; working: number; break: number };
    orders: { total: number; completed: number; cancelled: number };
    earnings: { total: number; perOrder: number; perHour: number; perKm: number };
    distance: { total: number; perOrder: number };
    rates: { completion: number; cancellation: number };
  } {
    return {
      duration: {
        total: this.getTotalDuration(),
        working: this.getWorkingDuration(),
        break: this.getTotalBreakDuration(),
      },
      orders: {
        total: this.props.totalOrders,
        completed: this.props.completedOrders,
        cancelled: this.props.cancelledOrders,
      },
      earnings: {
        total: this.props.totalEarnings,
        perOrder: this.getAverageEarningsPerOrder(),
        perHour: this.getEarningsPerHour(),
        perKm: this.getEarningsPerKilometer(),
      },
      distance: {
        total: this.props.totalDistance,
        perOrder: this.getAverageDistancePerOrder(),
      },
      rates: {
        completion: this.getOrderCompletionRate(),
        cancellation: this.getOrderCancellationRate(),
      },
    };
  }

  public formatDuration(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  }

  public formatEarnings(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: this.props.currency,
    }).format(amount);
  }

  public toJSON() {
    const summary = this.getShiftSummary();
    
    return {
      id: this._id.toString(),
      riderId: this.props.riderId,
      startTime: this.props.startTime,
      endTime: this.props.endTime,
      state: this.props.state,
      startLocation: this.props.startLocation?.toJSON(),
      endLocation: this.props.endLocation?.toJSON(),
      currentLocation: this.getCurrentLocation()?.toJSON(),
      totalDistance: this.props.totalDistance,
      totalOrders: this.props.totalOrders,
      completedOrders: this.props.completedOrders,
      cancelledOrders: this.props.cancelledOrders,
      totalEarnings: this.props.totalEarnings,
      currency: this.props.currency,
      breaks: this.props.breaks,
      locationUpdates: this.props.locationUpdates.map(update => ({
        ...update,
        location: update.location.toJSON(),
      })),
      notes: this.props.notes,
      isActive: this.isActive(),
      isOnBreak: this.isOnBreak(),
      currentBreak: this.getCurrentBreak(),
      summary,
      formattedDuration: this.formatDuration(summary.duration.total),
      formattedWorkingDuration: this.formatDuration(summary.duration.working),
      formattedEarnings: this.formatEarnings(this.props.totalEarnings),
      createdAt: this.props.createdAt,
      updatedAt: this.props.updatedAt,
    };
  }
}