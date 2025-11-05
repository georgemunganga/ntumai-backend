export declare class GeoLocationDto {
    lat: number;
    lng: number;
}
export declare class StartShiftDto {
    vehicle_type: string;
    current_location?: GeoLocationDto;
}
export declare class UpdateLocationDto {
    location: GeoLocationDto;
}
export declare class EndShiftDto {
    reason?: string;
}
export declare class PauseShiftDto {
    reason?: string;
}
export declare class ResumeShiftDto {
    current_location?: GeoLocationDto;
}
export declare class GetShiftsQueryDto {
    status?: string;
    vehicle_type?: string;
    start_date?: string;
    end_date?: string;
    page?: number;
    size?: number;
}
export declare class GetSummaryQueryDto {
    date?: string;
}
export declare class BulkEndShiftsDto {
    shift_ids: string[];
    reason?: string;
}
export declare class ShiftResponseDto {
    id: string;
    rider_user_id: string;
    status: string;
    vehicle_type: string;
    start_time: string;
    end_time: string | null;
    current_location: GeoLocationDto | null;
    total_deliveries: number;
    total_earnings: number;
    total_distance_km: number;
    duration_sec: number;
    active_duration_sec: number;
    total_pause_duration_sec: number;
}
export declare class ShiftSummaryDto {
    total_shifts: number;
    active_shifts: number;
    ended_shifts: number;
    total_deliveries: number;
    total_earnings: number;
    total_distance_km: number;
    average_deliveries_per_shift: number;
    average_earnings_per_shift: number;
    total_active_time_hours: number;
}
export declare class ShiftPerformanceDto {
    rider_user_id: string;
    total_shifts: number;
    total_deliveries: number;
    total_earnings: number;
    average_deliveries_per_hour: number;
    average_earnings_per_hour: number;
    completion_rate: number;
    rating: number;
}
export declare class HeatmapDataPointDto {
    lat: number;
    lng: number;
    intensity: number;
}
export declare class ShiftStatisticsDto {
    total_active_riders: number;
    total_shifts_today: number;
    average_shift_duration_hours: number;
    total_deliveries_today: number;
    total_earnings_today: number;
    by_vehicle_type: Record<string, number>;
}
