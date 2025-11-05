export declare class GeoCoordinatesDto {
    lat: number;
    lng: number;
}
export declare class BookingStopDto {
    sequence: number;
    geo: GeoCoordinatesDto;
    address?: string;
}
export declare class CreateBookingDto {
    delivery_id: string;
    vehicle_type: string;
    pickup: BookingStopDto;
    dropoffs: BookingStopDto[];
    customer_user_id: string;
    customer_name: string;
    customer_phone: string;
    metadata?: Record<string, any>;
}
export declare class EditBookingDto {
    pickup?: BookingStopDto;
    dropoffs?: BookingStopDto[];
    metadata?: Record<string, any>;
}
export declare class CancelBookingDto {
    reason: string;
}
export declare class RespondToOfferDto {
    rider_user_id: string;
    decision: 'accept' | 'decline';
}
export declare class UpdateProgressDto {
    stage: string;
}
export declare class RiderInfoDto {
    user_id: string;
    name: string;
    vehicle: string;
    phone: string;
    rating?: number;
    eta_min?: number;
}
export declare class BookingResponseDto {
    booking_id: string;
    delivery_id: string;
    status: string;
    vehicle_type: string;
    pickup: BookingStopDto;
    dropoffs: BookingStopDto[];
    rider: RiderInfoDto | null;
    wait_times: {
        pickup_sec: number;
        dropoff_sec: number;
    };
    can_user_edit: boolean;
    created_at: string;
    updated_at: string;
}
export declare class CreateBookingResponseDto {
    booking_id: string;
    status: string;
    estimated_search_sec: number;
    offer_expires_at?: string;
}
export declare class BookingOfferedEventDto {
    booking_id: string;
    candidates: RiderInfoDto[];
}
export declare class BookingAcceptedEventDto {
    booking_id: string;
    rider: RiderInfoDto;
}
export declare class BookingProgressEventDto {
    booking_id: string;
    status: string;
    timestamp: string;
}
export declare class BookingCompletedEventDto {
    booking_id: string;
    delivery_id: string;
    wait_times: {
        pickup_sec: number;
        dropoff_sec: number;
    };
}
