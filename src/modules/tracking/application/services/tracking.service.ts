import { Injectable, Inject } from '@nestjs/common';
import { TRACKING_REPOSITORY } from '../../domain/repositories/tracking.repository.interface';
import type { ITrackingRepository } from '../../domain/repositories/tracking.repository.interface';
import {
  TrackingEvent,
  TrackingEventType,
} from '../../domain/entities/tracking-event.entity';
import {
  CreateTrackingEventDto,
  TrackingEventResponseDto,
  TrackingTimelineDto,
} from '../dtos/tracking.dto';

@Injectable()
export class TrackingService {
  constructor(
    @Inject(TRACKING_REPOSITORY)
    private readonly trackingRepository: ITrackingRepository,
  ) {}

  async createEvent(
    dto: CreateTrackingEventDto,
  ): Promise<TrackingEventResponseDto> {
    const event = TrackingEvent.create({
      booking_id: dto.booking_id,
      delivery_id: dto.delivery_id,
      event_type: dto.event_type as TrackingEventType,
      location: dto.location,
      rider_user_id: dto.rider_user_id,
    });

    const saved = await this.trackingRepository.save(event);
    return this.toResponseDto(saved);
  }

  async getTrackingByBooking(bookingId: string): Promise<TrackingTimelineDto> {
    const events = await this.trackingRepository.findByBookingId(bookingId);
    const latestLocation =
      await this.trackingRepository.findLatestLocation(bookingId);

    const currentStatus =
      events.length > 0 ? events[events.length - 1].event_type : 'unknown';

    return {
      booking_id: bookingId,
      delivery_id: events[0]?.delivery_id || '',
      events: events.map((e) => this.toResponseDto(e)),
      current_location: latestLocation?.location || null,
      current_status: currentStatus,
    };
  }

  async getTrackingByDelivery(
    deliveryId: string,
  ): Promise<TrackingTimelineDto> {
    const events = await this.trackingRepository.findByDeliveryId(deliveryId);

    const bookingId = events[0]?.booking_id || '';
    const latestLocation = bookingId
      ? await this.trackingRepository.findLatestLocation(bookingId)
      : null;

    const currentStatus =
      events.length > 0 ? events[events.length - 1].event_type : 'unknown';

    return {
      booking_id: bookingId,
      delivery_id: deliveryId,
      events: events.map((e) => this.toResponseDto(e)),
      current_location: latestLocation?.location || null,
      current_status: currentStatus,
    };
  }

  async getCurrentLocation(
    bookingId: string,
  ): Promise<{ location: any; timestamp: string } | null> {
    const latestLocation =
      await this.trackingRepository.findLatestLocation(bookingId);

    if (!latestLocation) {
      return null;
    }

    return {
      location: latestLocation.location,
      timestamp: latestLocation.timestamp.toISOString(),
    };
  }

  private toResponseDto(event: TrackingEvent): TrackingEventResponseDto {
    const data = event.toJSON();
    return {
      id: data.id,
      booking_id: data.booking_id,
      delivery_id: data.delivery_id,
      event_type: data.event_type,
      location: data.location,
      rider_user_id: data.rider_user_id,
      timestamp: data.timestamp.toISOString(),
    };
  }
}
