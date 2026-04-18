import { Injectable, Inject, NotFoundException } from '@nestjs/common';
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
  PublicTrackingResponseDto,
} from '../dtos/tracking.dto';
import { PrismaService } from '../../../../shared/infrastructure/prisma.service';
import { DeliveryService } from '../../../deliveries/application/services/delivery.service';

@Injectable()
export class TrackingService {
  constructor(
    @Inject(TRACKING_REPOSITORY)
    private readonly trackingRepository: ITrackingRepository,
    private readonly prisma: PrismaService,
    private readonly deliveryService: DeliveryService,
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

  async getPublicTracking(trackingId: string): Promise<PublicTrackingResponseDto> {
    const directDelivery = await this.deliveryService
      .getDeliveryById(trackingId)
      .catch(() => null);

    if (directDelivery) {
      return this.buildPublicResponse({
        trackingId,
        source: 'delivery',
        delivery: directDelivery,
        order: null,
      });
    }

    const order = await this.prisma.order.findUnique({
      where: { trackingId },
      include: {
        Address: true,
      },
    });

    if (!order) {
      throw new NotFoundException('Tracking item not found');
    }

    const linkedDelivery = await this.deliveryService.findLinkedMarketplaceDelivery(
      order.id,
    );

    return this.buildPublicResponse({
      trackingId: order.trackingId,
      source: 'marketplace',
      delivery: linkedDelivery,
      order,
    });
  }

  private async buildPublicResponse({
    trackingId,
    source,
    delivery,
    order,
  }: {
    trackingId: string;
    source: 'delivery' | 'marketplace';
    delivery: any | null;
    order: any | null;
  }): Promise<PublicTrackingResponseDto> {
    const tracking = delivery
      ? await this.getTrackingByDelivery(delivery.id).catch(() => null)
      : null;

    const rider =
      delivery?.rider_id != null
        ? await this.prisma.user.findUnique({
            where: { id: delivery.rider_id },
            select: {
              firstName: true,
              lastName: true,
              phone: true,
              profileImage: true,
            },
          })
        : null;

    const deliveryStatus = String(
      delivery?.order_status || tracking?.current_status || '',
    ).toLowerCase();
    const orderStatus = String(order?.status || 'pending').toLowerCase();
    const rawStatus =
      ['delivery', 'in_transit', 'delivered', 'cancelled'].includes(deliveryStatus)
        ? deliveryStatus
        : orderStatus;

    return {
      tracking_id: trackingId,
      source,
      status: rawStatus,
      status_label: this.toPublicStatusLabel(rawStatus, Boolean(delivery?.rider_id)),
      eta: null,
      order_number: order?.trackingId || null,
      delivery_id: delivery?.id || null,
      rider: rider
        ? {
            name: `${rider.firstName || ''} ${rider.lastName || ''}`.trim() || null,
            phone: rider.phone || null,
            avatar: rider.profileImage || null,
          }
        : null,
      stops: Array.isArray(delivery?.stops)
        ? delivery.stops.map((stop: any) => ({
            type: stop.type,
            sequence: stop.sequence,
            address: this.formatStopAddress(stop),
            geo: stop.geo || null,
          }))
        : order?.Address
          ? [
              {
                type: 'dropoff',
                sequence: 1,
                address: this.formatAddress(order.Address),
                geo: {
                  lat: order.Address.latitude,
                  lng: order.Address.longitude,
                },
              },
            ]
          : [],
      tracking,
    };
  }

  private toPublicStatusLabel(status: string, hasRider: boolean): string {
    if (status === 'booked' && hasRider) return 'Rider accepted';
    switch (status) {
      case 'pending':
      case 'booked':
        return 'Booked';
      case 'confirmed':
      case 'accepted':
        return 'Confirmed';
      case 'preparing':
        return 'Preparing';
      case 'packing':
      case 'ready_for_pickup':
      case 'ready':
        return 'Ready for pickup';
      case 'out_for_delivery':
      case 'delivery':
      case 'in_transit':
      case 'en_route_to_dropoff':
        return 'In transit';
      case 'arrived_at_dropoff':
        return 'Arriving';
      case 'delivered':
      case 'completed':
        return 'Delivered';
      case 'cancelled':
        return 'Cancelled';
      default:
        return 'Tracking update';
    }
  }

  private formatAddress(address: any): string | null {
    if (!address) return null;
    return [
      address.address,
      address.city,
      address.state,
      address.country,
    ]
      .filter(Boolean)
      .join(', ');
  }

  private formatStopAddress(stop: any): string | null {
    if (!stop) return null;
    if (typeof stop.address === 'string') {
      return stop.address;
    }
    if (stop.address) {
      return [
        stop.address.line1,
        stop.address.city,
        stop.address.province,
        stop.address.country,
      ]
        .filter(Boolean)
        .join(', ');
    }
    return null;
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
