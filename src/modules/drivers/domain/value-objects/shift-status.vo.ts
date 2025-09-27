import { ValueObject } from '../../../common/domain/value-object';

export type ShiftState = 'offline' | 'online' | 'on_break' | 'busy';
export type BreakType = 'short_break' | 'lunch_break' | 'emergency' | 'maintenance';

export interface ShiftStatusProps {
  state: ShiftState;
  startTime?: Date;
  endTime?: Date;
  breakType?: BreakType;
  breakStartTime?: Date;
  estimatedBreakDuration?: number; // in minutes
  isAvailableForOrders: boolean;
  lastLocationUpdate?: Date;
}

export class ShiftStatus extends ValueObject<ShiftStatusProps> {
  private constructor(props: ShiftStatusProps) {
    super(props);
  }

  public static create(props: ShiftStatusProps): ShiftStatus {
    if (!props.state) {
      throw new Error('Shift state is required');
    }

    return new ShiftStatus(props);
  }

  public static createOffline(): ShiftStatus {
    return new ShiftStatus({
      state: 'offline',
      isAvailableForOrders: false,
    });
  }

  public static createOnline(): ShiftStatus {
    return new ShiftStatus({
      state: 'online',
      startTime: new Date(),
      isAvailableForOrders: true,
      lastLocationUpdate: new Date(),
    });
  }

  get state(): ShiftState {
    return this.props.state;
  }

  get startTime(): Date | undefined {
    return this.props.startTime;
  }

  get endTime(): Date | undefined {
    return this.props.endTime;
  }

  get breakType(): BreakType | undefined {
    return this.props.breakType;
  }

  get breakStartTime(): Date | undefined {
    return this.props.breakStartTime;
  }

  get estimatedBreakDuration(): number | undefined {
    return this.props.estimatedBreakDuration;
  }

  get isAvailableForOrders(): boolean {
    return this.props.isAvailableForOrders;
  }

  get lastLocationUpdate(): Date | undefined {
    return this.props.lastLocationUpdate;
  }

  isOnline(): boolean {
    return this.props.state === 'online';
  }

  isOffline(): boolean {
    return this.props.state === 'offline';
  }

  isOnBreak(): boolean {
    return this.props.state === 'on_break';
  }

  isBusy(): boolean {
    return this.props.state === 'busy';
  }

  canAcceptOrders(): boolean {
    return this.props.isAvailableForOrders && (this.isOnline() || this.isBusy());
  }

  goOnline(): ShiftStatus {
    return ShiftStatus.create({
      ...this.props,
      state: 'online',
      startTime: this.props.startTime || new Date(),
      isAvailableForOrders: true,
      lastLocationUpdate: new Date(),
      breakType: undefined,
      breakStartTime: undefined,
      estimatedBreakDuration: undefined,
    });
  }

  goOffline(): ShiftStatus {
    return ShiftStatus.create({
      ...this.props,
      state: 'offline',
      endTime: new Date(),
      isAvailableForOrders: false,
      breakType: undefined,
      breakStartTime: undefined,
      estimatedBreakDuration: undefined,
    });
  }

  startBreak(breakType: BreakType, estimatedDuration?: number): ShiftStatus {
    return ShiftStatus.create({
      ...this.props,
      state: 'on_break',
      breakType,
      breakStartTime: new Date(),
      estimatedBreakDuration: estimatedDuration,
      isAvailableForOrders: false,
    });
  }

  endBreak(): ShiftStatus {
    return ShiftStatus.create({
      ...this.props,
      state: 'online',
      isAvailableForOrders: true,
      breakType: undefined,
      breakStartTime: undefined,
      estimatedBreakDuration: undefined,
    });
  }

  setBusy(): ShiftStatus {
    return ShiftStatus.create({
      ...this.props,
      state: 'busy',
      isAvailableForOrders: false,
    });
  }

  setAvailable(): ShiftStatus {
    if (this.props.state === 'offline') {
      throw new Error('Cannot set availability while offline');
    }

    return ShiftStatus.create({
      ...this.props,
      state: this.props.state === 'busy' ? 'online' : this.props.state,
      isAvailableForOrders: true,
    });
  }

  setUnavailable(): ShiftStatus {
    return ShiftStatus.create({
      ...this.props,
      isAvailableForOrders: false,
    });
  }

  updateLocationTimestamp(): ShiftStatus {
    return ShiftStatus.create({
      ...this.props,
      lastLocationUpdate: new Date(),
    });
  }

  getShiftDuration(): number | null {
    if (!this.props.startTime) return null;
    
    const endTime = this.props.endTime || new Date();
    return endTime.getTime() - this.props.startTime.getTime();
  }

  getShiftDurationInHours(): number | null {
    const duration = this.getShiftDuration();
    if (duration === null) return null;
    
    return duration / (1000 * 60 * 60);
  }

  getBreakDuration(): number | null {
    if (!this.props.breakStartTime) return null;
    
    const now = new Date();
    return now.getTime() - this.props.breakStartTime.getTime();
  }

  getBreakDurationInMinutes(): number | null {
    const duration = this.getBreakDuration();
    if (duration === null) return null;
    
    return duration / (1000 * 60);
  }

  isBreakOverdue(): boolean {
    if (!this.isOnBreak() || !this.props.estimatedBreakDuration) return false;
    
    const breakDurationMinutes = this.getBreakDurationInMinutes();
    if (breakDurationMinutes === null) return false;
    
    return breakDurationMinutes > this.props.estimatedBreakDuration;
  }

  isLocationStale(maxAgeMinutes: number = 5): boolean {
    if (!this.props.lastLocationUpdate) return true;
    
    const now = new Date();
    const ageMinutes = (now.getTime() - this.props.lastLocationUpdate.getTime()) / (1000 * 60);
    return ageMinutes > maxAgeMinutes;
  }

  getStateDisplayName(): string {
    switch (this.props.state) {
      case 'online':
        return 'Online';
      case 'offline':
        return 'Offline';
      case 'on_break':
        return 'On Break';
      case 'busy':
        return 'Busy';
      default:
        return 'Unknown';
    }
  }

  getBreakTypeDisplayName(): string | undefined {
    if (!this.props.breakType) return undefined;
    
    switch (this.props.breakType) {
      case 'short_break':
        return 'Short Break';
      case 'lunch_break':
        return 'Lunch Break';
      case 'emergency':
        return 'Emergency Break';
      case 'maintenance':
        return 'Vehicle Maintenance';
      default:
        return 'Break';
    }
  }

  toJSON() {
    return {
      state: this.props.state,
      startTime: this.props.startTime,
      endTime: this.props.endTime,
      breakType: this.props.breakType,
      breakStartTime: this.props.breakStartTime,
      estimatedBreakDuration: this.props.estimatedBreakDuration,
      isAvailableForOrders: this.props.isAvailableForOrders,
      lastLocationUpdate: this.props.lastLocationUpdate,
    };
  }
}