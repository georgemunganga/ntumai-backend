import type { ITrackingRepository } from '../../domain/repositories/tracking.repository.interface';
import { CreateTrackingEventDto, TrackingEventResponseDto, TrackingTimelineDto } from '../dtos/tracking.dto';
export declare class TrackingService {
    private readonly trackingRepository;
    constructor(trackingRepository: ITrackingRepository);
    createEvent(dto: CreateTrackingEventDto): Promise<TrackingEventResponseDto>;
    getTrackingByBooking(bookingId: string): Promise<TrackingTimelineDto>;
    getTrackingByDelivery(deliveryId: string): Promise<TrackingTimelineDto>;
    getCurrentLocation(bookingId: string): Promise<{
        location: any;
        timestamp: string;
    } | null>;
    private toResponseDto;
}
