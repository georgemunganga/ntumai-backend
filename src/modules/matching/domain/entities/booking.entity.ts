import { nanoid } from 'nanoid';

export enum BookingStatus {
  PENDING = 'pending',
  SEARCHING = 'searching',
  OFFERED = 'offered',
  ACCEPTED = 'accepted',
  EN_ROUTE = 'en_route',
  ARRIVED_PICKUP = 'arrived_pickup',
  PICKED_UP = 'picked_up',
  EN_ROUTE_DROPOFF = 'en_route_dropoff',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
}

export interface GeoCoordinates {
  lat: number;
  lng: number;
}

export interface BookingStop {
  sequence: number;
  geo: GeoCoordinates;
  address?: string | null;
}

export interface RiderInfo {
  user_id: string;
  name: string;
  vehicle: string;
  phone: string;
  rating?: number;
  eta_min?: number;
}

export interface OfferInfo {
  expires_at: Date | null;
  offered_to: string[];
}

export interface WaitTimes {
  pickup_sec: number;
  dropoff_sec: number;
}

export interface BookingProps {
  booking_id: string;
  delivery_id: string;
  status: BookingStatus;
  vehicle_type: string;
  pickup: BookingStop;
  dropoffs: BookingStop[];
  rider: RiderInfo | null;
  offer: OfferInfo;
  wait_times: WaitTimes;
  can_user_edit: boolean;
  customer_user_id: string;
  customer_name: string;
  customer_phone: string;
  metadata: Record<string, any>;
  created_at: Date;
  updated_at: Date;
  pickup_wait_start: Date | null;
  dropoff_wait_start: Date | null;
}

export class Booking {
  private constructor(private props: BookingProps) {}

  static create(data: {
    delivery_id: string;
    vehicle_type: string;
    pickup: BookingStop;
    dropoffs: BookingStop[];
    customer_user_id: string;
    customer_name: string;
    customer_phone: string;
    metadata?: Record<string, any>;
  }): Booking {
    const now = new Date();
    return new Booking({
      booking_id: `bkg_${nanoid(16)}`,
      delivery_id: data.delivery_id,
      status: BookingStatus.PENDING,
      vehicle_type: data.vehicle_type,
      pickup: data.pickup,
      dropoffs: data.dropoffs,
      rider: null,
      offer: {
        expires_at: null,
        offered_to: [],
      },
      wait_times: {
        pickup_sec: 0,
        dropoff_sec: 0,
      },
      can_user_edit: true,
      customer_user_id: data.customer_user_id,
      customer_name: data.customer_name,
      customer_phone: data.customer_phone,
      metadata: data.metadata || {},
      created_at: now,
      updated_at: now,
      pickup_wait_start: null,
      dropoff_wait_start: null,
    });
  }

  static fromPersistence(data: BookingProps): Booking {
    return new Booking(data);
  }

  get booking_id(): string {
    return this.props.booking_id;
  }

  get delivery_id(): string {
    return this.props.delivery_id;
  }

  get status(): BookingStatus {
    return this.props.status;
  }

  get rider(): RiderInfo | null {
    return this.props.rider;
  }

  get wait_times(): WaitTimes {
    return this.props.wait_times;
  }

  startSearching(): void {
    if (this.props.status !== BookingStatus.PENDING) {
      throw new Error('Can only start searching from pending status');
    }
    this.props.status = BookingStatus.SEARCHING;
    this.props.updated_at = new Date();
  }

  offerToRider(riderUserId: string, expiresInSec: number = 45): void {
    if (this.props.status !== BookingStatus.SEARCHING) {
      throw new Error('Can only offer from searching status');
    }
    this.props.status = BookingStatus.OFFERED;
    this.props.offer.offered_to.push(riderUserId);
    this.props.offer.expires_at = new Date(Date.now() + expiresInSec * 1000);
    this.props.updated_at = new Date();
  }

  acceptByRider(rider: RiderInfo): void {
    if (this.props.status !== BookingStatus.OFFERED) {
      throw new Error('Can only accept from offered status');
    }
    this.props.status = BookingStatus.ACCEPTED;
    this.props.rider = rider;
    this.props.offer.expires_at = null;
    this.props.can_user_edit = true; // Can still edit after acceptance
    this.props.updated_at = new Date();
  }

  declineByRider(riderUserId: string): void {
    if (this.props.status !== BookingStatus.OFFERED) {
      throw new Error('Can only decline from offered status');
    }
    // Remove from offered list and go back to searching
    this.props.status = BookingStatus.SEARCHING;
    this.props.offer.expires_at = null;
    this.props.updated_at = new Date();
  }

  updateProgress(stage: BookingStatus): void {
    const validTransitions: Record<BookingStatus, BookingStatus[]> = {
      [BookingStatus.ACCEPTED]: [BookingStatus.EN_ROUTE],
      [BookingStatus.EN_ROUTE]: [BookingStatus.ARRIVED_PICKUP],
      [BookingStatus.ARRIVED_PICKUP]: [BookingStatus.PICKED_UP],
      [BookingStatus.PICKED_UP]: [BookingStatus.EN_ROUTE_DROPOFF],
      [BookingStatus.EN_ROUTE_DROPOFF]: [BookingStatus.DELIVERED],
      [BookingStatus.PENDING]: [],
      [BookingStatus.SEARCHING]: [],
      [BookingStatus.OFFERED]: [],
      [BookingStatus.DELIVERED]: [],
      [BookingStatus.CANCELLED]: [],
    };

    if (!validTransitions[this.props.status]?.includes(stage)) {
      throw new Error(
        `Invalid transition from ${this.props.status} to ${stage}`,
      );
    }

    // Handle wait time tracking
    if (stage === BookingStatus.ARRIVED_PICKUP) {
      this.props.pickup_wait_start = new Date();
    } else if (
      stage === BookingStatus.PICKED_UP &&
      this.props.pickup_wait_start
    ) {
      const waitSec = Math.floor(
        (new Date().getTime() - this.props.pickup_wait_start.getTime()) / 1000,
      );
      this.props.wait_times.pickup_sec = waitSec;
      this.props.pickup_wait_start = null;
    } else if (stage === BookingStatus.EN_ROUTE_DROPOFF) {
      this.props.dropoff_wait_start = new Date();
    } else if (
      stage === BookingStatus.DELIVERED &&
      this.props.dropoff_wait_start
    ) {
      const waitSec = Math.floor(
        (new Date().getTime() - this.props.dropoff_wait_start.getTime()) / 1000,
      );
      this.props.wait_times.dropoff_sec = waitSec;
      this.props.dropoff_wait_start = null;
      this.props.can_user_edit = false;
    }

    this.props.status = stage;
    this.props.updated_at = new Date();
  }

  editDetails(updates: {
    pickup?: BookingStop;
    dropoffs?: BookingStop[];
    metadata?: Record<string, any>;
  }): void {
    if (!this.props.can_user_edit) {
      throw new Error('Cannot edit booking after delivery');
    }
    if (updates.pickup) {
      this.props.pickup = updates.pickup;
    }
    if (updates.dropoffs) {
      this.props.dropoffs = updates.dropoffs;
    }
    if (updates.metadata) {
      this.props.metadata = { ...this.props.metadata, ...updates.metadata };
    }
    this.props.updated_at = new Date();
  }

  cancel(reason: string): void {
    if (
      this.props.status === BookingStatus.DELIVERED ||
      this.props.status === BookingStatus.CANCELLED
    ) {
      throw new Error('Cannot cancel delivered or already cancelled booking');
    }
    this.props.status = BookingStatus.CANCELLED;
    this.props.metadata.cancel_reason = reason;
    this.props.can_user_edit = false;
    this.props.updated_at = new Date();
  }

  toJSON(): BookingProps {
    return { ...this.props };
  }
}
