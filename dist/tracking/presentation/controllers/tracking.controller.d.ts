import { TrackingService } from '../../application/services/tracking.service';
import { CreateTrackingEventDto, TrackingEventResponseDto, TrackingTimelineDto } from '../../application/dtos/tracking.dto';
export declare class TrackingController {
    private readonly trackingService;
    constructor(trackingService: TrackingService);
    createEvent(dto: CreateTrackingEventDto): Promise<TrackingEventResponseDto>;
    getTrackingByBooking(bookingId: string): Promise<TrackingTimelineDto>;
    getTrackingByDelivery(deliveryId: string): Promise<TrackingTimelineDto>;
    getCurrentLocation(bookingId: string): Promise<any>;
}
