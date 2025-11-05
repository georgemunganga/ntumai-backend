import { nanoid } from 'nanoid';

export enum TrackingEventType {
  BOOKING_CREATED = 'booking_created',
  RIDER_ASSIGNED = 'rider_assigned',
  EN_ROUTE_TO_PICKUP = 'en_route_to_pickup',
  ARRIVED_AT_PICKUP = 'arrived_at_pickup',
  PICKED_UP = 'picked_up',
  EN_ROUTE_TO_DROPOFF = 'en_route_to_dropoff',
  ARRIVED_AT_DROPOFF = 'arrived_at_dropoff',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
  LOCATION_UPDATE = 'location_update',
}

export interface GeoLocation {
  lat: number;
  lng: number;
}

export interface TrackingEventProps {
  id: string;
  booking_id: string;
  delivery_id: string;
  event_type: TrackingEventType;
  location: GeoLocation | null;
  rider_user_id: string | null;
  metadata: Record<string, any>;
  timestamp: Date;
}

export class TrackingEvent {
  private constructor(private props: TrackingEventProps) {}

  static create(data: {
    booking_id: string;
    delivery_id: string;
    event_type: TrackingEventType;
    location?: GeoLocation;
    rider_user_id?: string;
    metadata?: Record<string, any>;
  }): TrackingEvent {
    return new TrackingEvent({
      id: `trk_${nanoid(16)}`,
      booking_id: data.booking_id,
      delivery_id: data.delivery_id,
      event_type: data.event_type,
      location: data.location || null,
      rider_user_id: data.rider_user_id || null,
      metadata: data.metadata || {},
      timestamp: new Date(),
    });
  }

  static fromPersistence(data: TrackingEventProps): TrackingEvent {
    return new TrackingEvent(data);
  }

  get id(): string {
    return this.props.id;
  }

  get booking_id(): string {
    return this.props.booking_id;
  }

  get delivery_id(): string {
    return this.props.delivery_id;
  }

  get event_type(): TrackingEventType {
    return this.props.event_type;
  }

  get location(): GeoLocation | null {
    return this.props.location;
  }

  get timestamp(): Date {
    return this.props.timestamp;
  }

  toJSON(): TrackingEventProps {
    return { ...this.props };
  }
}
