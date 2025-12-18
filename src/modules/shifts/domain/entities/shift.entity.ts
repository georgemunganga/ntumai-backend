import { nanoid } from 'nanoid';

export enum ShiftStatus {
  ACTIVE = 'active',
  PAUSED = 'paused',
  ENDED = 'ended',
}

export interface GeoLocation {
  lat: number;
  lng: number;
}

export interface ShiftProps {
  id: string;
  rider_user_id: string;
  status: ShiftStatus;
  vehicle_type: string;
  start_time: Date;
  end_time: Date | null;
  pause_time: Date | null;
  resume_time: Date | null;
  total_pause_duration_sec: number;
  current_location: GeoLocation | null;
  last_location_update: Date | null;
  total_deliveries: number;
  total_earnings: number;
  total_distance_km: number;
  metadata: Record<string, any>;
  created_at: Date;
  updated_at: Date;
}

export class Shift {
  private constructor(private props: ShiftProps) {}

  static create(data: {
    rider_user_id: string;
    vehicle_type: string;
    current_location?: GeoLocation;
  }): Shift {
    const now = new Date();
    return new Shift({
      id: `shf_${nanoid(16)}`,
      rider_user_id: data.rider_user_id,
      status: ShiftStatus.ACTIVE,
      vehicle_type: data.vehicle_type,
      start_time: now,
      end_time: null,
      pause_time: null,
      resume_time: null,
      total_pause_duration_sec: 0,
      current_location: data.current_location || null,
      last_location_update: data.current_location ? now : null,
      total_deliveries: 0,
      total_earnings: 0,
      total_distance_km: 0,
      metadata: {},
      created_at: now,
      updated_at: now,
    });
  }

  static fromPersistence(data: ShiftProps): Shift {
    return new Shift(data);
  }

  get id(): string {
    return this.props.id;
  }

  get rider_user_id(): string {
    return this.props.rider_user_id;
  }

  get status(): ShiftStatus {
    return this.props.status;
  }

  get vehicle_type(): string {
    return this.props.vehicle_type;
  }

  get start_time(): Date {
    return this.props.start_time;
  }

  get end_time(): Date | null {
    return this.props.end_time;
  }

  get current_location(): GeoLocation | null {
    return this.props.current_location;
  }

  get total_deliveries(): number {
    return this.props.total_deliveries;
  }

  get total_earnings(): number {
    return this.props.total_earnings;
  }

  get total_distance_km(): number {
    return this.props.total_distance_km;
  }

  get total_pause_duration_sec(): number {
    return this.props.total_pause_duration_sec;
  }

  pause(): void {
    if (this.props.status !== ShiftStatus.ACTIVE) {
      throw new Error('Can only pause an active shift');
    }
    this.props.status = ShiftStatus.PAUSED;
    this.props.pause_time = new Date();
    this.props.updated_at = new Date();
  }

  resume(): void {
    if (this.props.status !== ShiftStatus.PAUSED) {
      throw new Error('Can only resume a paused shift');
    }
    if (this.props.pause_time) {
      const pauseDuration = Math.floor(
        (new Date().getTime() - this.props.pause_time.getTime()) / 1000,
      );
      this.props.total_pause_duration_sec += pauseDuration;
    }
    this.props.status = ShiftStatus.ACTIVE;
    this.props.resume_time = new Date();
    this.props.pause_time = null;
    this.props.updated_at = new Date();
  }

  end(): void {
    if (this.props.status === ShiftStatus.ENDED) {
      throw new Error('Shift already ended');
    }
    // If paused, calculate final pause duration
    if (this.props.status === ShiftStatus.PAUSED && this.props.pause_time) {
      const pauseDuration = Math.floor(
        (new Date().getTime() - this.props.pause_time.getTime()) / 1000,
      );
      this.props.total_pause_duration_sec += pauseDuration;
    }
    this.props.status = ShiftStatus.ENDED;
    this.props.end_time = new Date();
    this.props.updated_at = new Date();
  }

  updateLocation(location: GeoLocation): void {
    this.props.current_location = location;
    this.props.last_location_update = new Date();
    this.props.updated_at = new Date();
  }

  incrementDelivery(earnings: number, distance_km: number): void {
    this.props.total_deliveries += 1;
    this.props.total_earnings += earnings;
    this.props.total_distance_km += distance_km;
    this.props.updated_at = new Date();
  }

  getDuration(): number {
    const endTime = this.props.end_time || new Date();
    return Math.floor(
      (endTime.getTime() - this.props.start_time.getTime()) / 1000,
    );
  }

  getActiveDuration(): number {
    return this.getDuration() - this.props.total_pause_duration_sec;
  }

  isActive(): boolean {
    return this.props.status === ShiftStatus.ACTIVE;
  }

  toJSON(): ShiftProps {
    return { ...this.props };
  }
}
