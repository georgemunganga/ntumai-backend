import { TrackingEvent } from '../entities/tracking-event.entity';

export const TRACKING_REPOSITORY = 'TRACKING_REPOSITORY';

export interface ITrackingRepository {
  save(event: TrackingEvent): Promise<TrackingEvent>;
  findByBookingId(bookingId: string): Promise<TrackingEvent[]>;
  findByDeliveryId(deliveryId: string): Promise<TrackingEvent[]>;
  findLatestLocation(bookingId: string): Promise<TrackingEvent | null>;
}
