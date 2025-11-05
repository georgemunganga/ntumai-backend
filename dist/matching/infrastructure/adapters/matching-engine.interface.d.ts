import { RiderInfo } from '../../domain/entities/booking.entity';
export interface MatchingCriteria {
    pickup_lat: number;
    pickup_lng: number;
    vehicle_type: string;
    radius_km?: number;
}
export interface IMatchingEngine {
    findCandidates(criteria: MatchingCriteria): Promise<RiderInfo[]>;
}
