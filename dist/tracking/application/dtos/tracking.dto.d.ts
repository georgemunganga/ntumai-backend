export declare class GeoLocationDto {
    lat: number;
    lng: number;
}
export declare class CreateTrackingEventDto {
    booking_id: string;
    delivery_id: string;
    event_type: string;
    location?: GeoLocationDto;
    rider_user_id?: string;
}
export declare class TrackingEventResponseDto {
    id: string;
    booking_id: string;
    delivery_id: string;
    event_type: string;
    location: GeoLocationDto | null;
    rider_user_id: string | null;
    timestamp: string;
}
export declare class TrackingTimelineDto {
    booking_id: string;
    delivery_id: string;
    events: TrackingEventResponseDto[];
    current_location: GeoLocationDto | null;
    current_status: string;
}
