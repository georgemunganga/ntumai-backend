export declare enum TrackingEventType {
    BOOKING_CREATED = "booking_created",
    RIDER_ASSIGNED = "rider_assigned",
    EN_ROUTE_TO_PICKUP = "en_route_to_pickup",
    ARRIVED_AT_PICKUP = "arrived_at_pickup",
    PICKED_UP = "picked_up",
    EN_ROUTE_TO_DROPOFF = "en_route_to_dropoff",
    ARRIVED_AT_DROPOFF = "arrived_at_dropoff",
    DELIVERED = "delivered",
    CANCELLED = "cancelled",
    LOCATION_UPDATE = "location_update"
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
export declare class TrackingEvent {
    private props;
    private constructor();
    static create(data: {
        booking_id: string;
        delivery_id: string;
        event_type: TrackingEventType;
        location?: GeoLocation;
        rider_user_id?: string;
        metadata?: Record<string, any>;
    }): TrackingEvent;
    static fromPersistence(data: TrackingEventProps): TrackingEvent;
    get id(): string;
    get booking_id(): string;
    get delivery_id(): string;
    get event_type(): TrackingEventType;
    get location(): GeoLocation | null;
    get timestamp(): Date;
    toJSON(): TrackingEventProps;
}
