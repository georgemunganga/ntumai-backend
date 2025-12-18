import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../shared/infrastructure/prisma.service';
import { IBookingRepository } from '../../domain/repositories/booking.repository.interface';
import { Booking, BookingStatus } from '../../domain/entities/booking.entity';

@Injectable()
export class PrismaBookingRepository implements IBookingRepository {
  constructor(private readonly prisma: PrismaService) {}

  async save(booking: Booking): Promise<Booking> {
    const data = booking.toJSON();

    const saved = await this.prisma.booking.upsert({
      where: { booking_id: data.booking_id },
      create: {
        booking_id: data.booking_id,
        delivery_id: data.delivery_id,
        status: data.status,
        vehicle_type: data.vehicle_type,
        pickup: data.pickup as any,
        dropoffs: data.dropoffs as any,
        rider: data.rider as any,
        offer: data.offer as any,
        wait_times: data.wait_times as any,
        can_user_edit: data.can_user_edit,
        customer_user_id: data.customer_user_id,
        customer_name: data.customer_name,
        customer_phone: data.customer_phone,
        metadata: data.metadata as any,
        created_at: data.created_at,
        updated_at: data.updated_at,
        pickup_wait_start: data.pickup_wait_start,
        dropoff_wait_start: data.dropoff_wait_start,
      },
      update: {
        status: data.status,
        pickup: data.pickup as any,
        dropoffs: data.dropoffs as any,
        rider: data.rider as any,
        offer: data.offer as any,
        wait_times: data.wait_times as any,
        can_user_edit: data.can_user_edit,
        metadata: data.metadata as any,
        updated_at: data.updated_at,
        pickup_wait_start: data.pickup_wait_start,
        dropoff_wait_start: data.dropoff_wait_start,
      },
    });

    return Booking.fromPersistence({
      ...saved,
      status: saved.status as any,
      pickup: saved.pickup as any,
      dropoffs: saved.dropoffs as any,
      rider: saved.rider as any,
      offer: saved.offer as any,
      wait_times: saved.wait_times as any,
      metadata: saved.metadata as any,
    });
  }

  async findById(bookingId: string): Promise<Booking | null> {
    const booking = await this.prisma.booking.findUnique({
      where: { booking_id: bookingId },
    });

    if (!booking) return null;

    return Booking.fromPersistence({
      ...booking,
      status: booking.status as any,
      pickup: booking.pickup as any,
      dropoffs: booking.dropoffs as any,
      rider: booking.rider as any,
      offer: booking.offer as any,
      wait_times: booking.wait_times as any,
      metadata: booking.metadata as any,
    });
  }

  async findByDeliveryId(deliveryId: string): Promise<Booking | null> {
    const booking = await this.prisma.booking.findFirst({
      where: { delivery_id: deliveryId },
    });

    if (!booking) return null;

    return Booking.fromPersistence({
      ...booking,
      status: booking.status as any,
      pickup: booking.pickup as any,
      dropoffs: booking.dropoffs as any,
      rider: booking.rider as any,
      offer: booking.offer as any,
      wait_times: booking.wait_times as any,
      metadata: booking.metadata as any,
    });
  }

  async findByCustomerUserId(customerUserId: string): Promise<Booking[]> {
    const bookings = await this.prisma.booking.findMany({
      where: { customer_user_id: customerUserId },
      orderBy: { created_at: 'desc' },
    });

    return bookings.map((booking) =>
      Booking.fromPersistence({
        ...booking,
        status: booking.status as any,
        pickup: booking.pickup as any,
        dropoffs: booking.dropoffs as any,
        rider: booking.rider as any,
        offer: booking.offer as any,
        wait_times: booking.wait_times as any,
        metadata: booking.metadata as any,
      }),
    );
  }

  async findActiveBookings(): Promise<Booking[]> {
    const bookings = await this.prisma.booking.findMany({
      where: {
        status: {
          in: [
            BookingStatus.SEARCHING,
            BookingStatus.OFFERED,
            BookingStatus.ACCEPTED,
            BookingStatus.EN_ROUTE,
            BookingStatus.ARRIVED_PICKUP,
            BookingStatus.PICKED_UP,
            BookingStatus.EN_ROUTE_DROPOFF,
          ],
        },
      },
      orderBy: { created_at: 'desc' },
    });

    return bookings.map((booking) =>
      Booking.fromPersistence({
        ...booking,
        status: booking.status as any,
        pickup: booking.pickup as any,
        dropoffs: booking.dropoffs as any,
        rider: booking.rider as any,
        offer: booking.offer as any,
        wait_times: booking.wait_times as any,
        metadata: booking.metadata as any,
      }),
    );
  }

  async findBookingsByStatus(status: string): Promise<Booking[]> {
    const bookings = await this.prisma.booking.findMany({
      where: { status },
      orderBy: { created_at: 'desc' },
    });

    return bookings.map((booking) =>
      Booking.fromPersistence({
        ...booking,
        status: booking.status as any,
        pickup: booking.pickup as any,
        dropoffs: booking.dropoffs as any,
        rider: booking.rider as any,
        offer: booking.offer as any,
        wait_times: booking.wait_times as any,
        metadata: booking.metadata as any,
      }),
    );
  }
}
