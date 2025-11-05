export declare enum BookingStatus {
    PENDING = "pending",
    SEARCHING = "searching",
    OFFERED = "offered",
    ACCEPTED = "accepted",
    EN_ROUTE = "en_route",
    ARRIVED_PICKUP = "arrived_pickup",
    PICKED_UP = "picked_up",
    EN_ROUTE_DROPOFF = "en_route_dropoff",
    DELIVERED = "delivered",
    CANCELLED = "cancelled"
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
export declare class Booking {
    private props;
    private constructor();
    static create(data: {
        delivery_id: string;
        vehicle_type: string;
        pickup: BookingStop;
        dropoffs: BookingStop[];
        customer_user_id: string;
        customer_name: string;
        customer_phone: string;
        metadata?: Record<string, any>;
    }): Booking;
    static fromPersistence(data: BookingProps): Booking;
    get booking_id(): string;
    get delivery_id(): string;
    get status(): BookingStatus;
    get rider(): RiderInfo | null;
    get wait_times(): WaitTimes;
    startSearching(): void;
    offerToRider(riderUserId: string, expiresInSec?: number): void;
    acceptByRider(rider: RiderInfo): void;
    declineByRider(riderUserId: string): void;
    updateProgress(stage: BookingStatus): void;
    editDetails(updates: {
        pickup?: BookingStop;
        dropoffs?: BookingStop[];
        metadata?: Record<string, any>;
    }): void;
    cancel(reason: string): void;
    toJSON(): BookingProps;
}
