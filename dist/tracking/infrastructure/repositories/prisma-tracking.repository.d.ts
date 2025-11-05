import { PrismaService } from '../../../shared/database/prisma.service';
import { ITrackingRepository } from '../../domain/repositories/tracking.repository.interface';
import { TrackingEvent } from '../../domain/entities/tracking-event.entity';
export declare class PrismaTrackingRepository implements ITrackingRepository {
    private readonly prisma;
    constructor(prisma: PrismaService);
    save(event: TrackingEvent): Promise<TrackingEvent>;
    findByBookingId(bookingId: string): Promise<TrackingEvent[]>;
    findByDeliveryId(deliveryId: string): Promise<TrackingEvent[]>;
    findLatestLocation(bookingId: string): Promise<TrackingEvent | null>;
}
