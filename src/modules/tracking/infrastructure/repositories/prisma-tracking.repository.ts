import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../shared/infrastructure/prisma.service';
import { ITrackingRepository } from '../../domain/repositories/tracking.repository.interface';
import { TrackingEvent } from '../../domain/entities/tracking-event.entity';

@Injectable()
export class PrismaTrackingRepository implements ITrackingRepository {
  constructor(private readonly prisma: PrismaService) {}

  async save(event: TrackingEvent): Promise<TrackingEvent> {
    const data = event.toJSON();

    const saved = await this.prisma.trackingEvent.create({
      data: {
        id: data.id,
        booking_id: data.booking_id,
        delivery_id: data.delivery_id,
        event_type: data.event_type,
        location: data.location as any,
        rider_user_id: data.rider_user_id,
        metadata: data.metadata as any,
        timestamp: data.timestamp,
      },
    });

    return TrackingEvent.fromPersistence({
      ...saved,
      event_type: saved.event_type as any,
      location: saved.location as any,
      metadata: saved.metadata as any,
    });
  }

  async findByBookingId(bookingId: string): Promise<TrackingEvent[]> {
    const events = await this.prisma.trackingEvent.findMany({
      where: { booking_id: bookingId },
      orderBy: { timestamp: 'asc' },
    });

    return events.map((event) =>
      TrackingEvent.fromPersistence({
        ...event,
        event_type: event.event_type as any,
        location: event.location as any,
        metadata: event.metadata as any,
      }),
    );
  }

  async findByDeliveryId(deliveryId: string): Promise<TrackingEvent[]> {
    const events = await this.prisma.trackingEvent.findMany({
      where: { delivery_id: deliveryId },
      orderBy: { timestamp: 'asc' },
    });

    return events.map((event) =>
      TrackingEvent.fromPersistence({
        ...event,
        event_type: event.event_type as any,
        location: event.location as any,
        metadata: event.metadata as any,
      }),
    );
  }

  async findLatestLocation(bookingId: string): Promise<TrackingEvent | null> {
    const event = await this.prisma.trackingEvent.findFirst({
      where: {
        booking_id: bookingId,
        location: { not: null as any },
      },
      orderBy: { timestamp: 'desc' },
    });

    if (!event) return null;

    return TrackingEvent.fromPersistence({
      ...event,
      event_type: event.event_type as any,
      location: event.location as any,
      metadata: event.metadata as any,
    });
  }
}
