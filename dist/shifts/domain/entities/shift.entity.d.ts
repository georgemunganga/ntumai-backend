export declare enum ShiftStatus {
    ACTIVE = "active",
    PAUSED = "paused",
    ENDED = "ended"
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
export declare class Shift {
    private props;
    private constructor();
    static create(data: {
        rider_user_id: string;
        vehicle_type: string;
        current_location?: GeoLocation;
    }): Shift;
    static fromPersistence(data: ShiftProps): Shift;
    get id(): string;
    get rider_user_id(): string;
    get status(): ShiftStatus;
    get vehicle_type(): string;
    get start_time(): Date;
    get end_time(): Date | null;
    get current_location(): GeoLocation | null;
    get total_deliveries(): number;
    get total_earnings(): number;
    get total_distance_km(): number;
    get total_pause_duration_sec(): number;
    pause(): void;
    resume(): void;
    end(): void;
    updateLocation(location: GeoLocation): void;
    incrementDelivery(earnings: number, distance_km: number): void;
    getDuration(): number;
    getActiveDuration(): number;
    isActive(): boolean;
    toJSON(): ShiftProps;
}
