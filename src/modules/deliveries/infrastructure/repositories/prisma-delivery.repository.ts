import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaService } from '../../../../shared/infrastructure/prisma.service';
import {
  DeliveryFilters,
  IDeliveryRepository,
  PaginatedResult,
  PaginationParams,
} from '../../domain/repositories/delivery.repository.interface';
import {
  DeliveryOrder,
  OrderStatus,
  PaymentMethod,
  VehicleType,
} from '../../domain/entities/delivery-order.entity';
import {
  Stop,
  type Address,
  type GeoCoordinates,
  StopType,
} from '../../domain/entities/stop.entity';

@Injectable()
export class PrismaDeliveryRepository implements IDeliveryRepository {
  constructor(private readonly prisma: PrismaService) {}

  private get db(): PrismaClient {
    return this.prisma as unknown as PrismaClient;
  }

  async create(delivery: DeliveryOrder): Promise<DeliveryOrder> {
    const created = await this.db.deliveryRecord.create({
      data: {
        id: delivery.id,
        created_by_user_id: delivery.created_by_user_id,
        placed_by_role: delivery.placed_by_role,
        vehicle_type: delivery.vehicle_type,
        courier_comment: delivery.courier_comment,
        is_scheduled: delivery.is_scheduled,
        scheduled_at: delivery.scheduled_at,
        order_status: delivery.order_status,
        payment_method: delivery.payment.method,
        payment_calc_payload: delivery.payment.calc_payload as any,
        payment_calc_sig: delivery.payment.calc_sig,
        payment_currency: delivery.payment.currency,
        payment_amount: delivery.payment.amount,
        payment_expires_at: delivery.payment.expires_at,
        more_info: delivery.more_info,
        rider_id: delivery.rider_id,
        ready_token: delivery.ready_token,
        ready_token_expires_at: delivery.ready_token_expires_at,
        created_at: delivery.created_at,
        updated_at: delivery.updated_at,
        stops: {
          create: delivery.stops.map((stop) => this.toStopCreateInput(stop)),
        },
      },
      include: {
        stops: {
          orderBy: { sequence: 'asc' },
        },
      },
    });

    return this.toDomain(created);
  }

  async findById(id: string): Promise<DeliveryOrder | null> {
    const delivery = await this.db.deliveryRecord.findUnique({
      where: { id },
      include: {
        stops: {
          orderBy: { sequence: 'asc' },
        },
      },
    });

    return delivery ? this.toDomain(delivery) : null;
  }

  async findAll(
    filters: DeliveryFilters,
    pagination: PaginationParams,
  ): Promise<PaginatedResult<DeliveryOrder>> {
    const where = {
      ...(filters.created_by_user_id
        ? { created_by_user_id: filters.created_by_user_id }
        : {}),
      ...(filters.rider_id ? { rider_id: filters.rider_id } : {}),
      ...(filters.placed_by_role
        ? { placed_by_role: filters.placed_by_role }
        : {}),
      ...(filters.vehicle_type ? { vehicle_type: filters.vehicle_type } : {}),
      ...(filters.order_status ? { order_status: filters.order_status } : {}),
      ...((filters.from || filters.to)
        ? {
            created_at: {
              ...(filters.from ? { gte: filters.from } : {}),
              ...(filters.to ? { lte: filters.to } : {}),
            },
          }
        : {}),
    };

    const page = Math.max(1, pagination.page);
    const size = Math.max(1, pagination.size);
    const skip = (page - 1) * size;

    const [total, rows] = await this.prisma.$transaction([
      this.db.deliveryRecord.count({ where }),
      this.db.deliveryRecord.findMany({
        where,
        include: {
          stops: {
            orderBy: { sequence: 'asc' },
          },
        },
        orderBy: { created_at: 'desc' },
        skip,
        take: size,
      }),
    ]);

    return {
      data: rows.map((row) => this.toDomain(row)),
      total,
      page,
      size,
      totalPages: Math.ceil(total / size),
    };
  }

  async update(
    id: string,
    updates: Partial<DeliveryOrder>,
  ): Promise<DeliveryOrder> {
    const payload = updates as DeliveryOrder;

    const updated = await this.db.deliveryRecord.update({
      where: { id },
      data: {
        created_by_user_id: payload.created_by_user_id,
        placed_by_role: payload.placed_by_role,
        vehicle_type: payload.vehicle_type,
        courier_comment: payload.courier_comment,
        is_scheduled: payload.is_scheduled,
        scheduled_at: payload.scheduled_at,
        order_status: payload.order_status,
        payment_method: payload.payment?.method,
        payment_calc_payload: payload.payment?.calc_payload as any,
        payment_calc_sig: payload.payment?.calc_sig,
        payment_currency: payload.payment?.currency,
        payment_amount: payload.payment?.amount,
        payment_expires_at: payload.payment?.expires_at,
        more_info: payload.more_info,
        rider_id: payload.rider_id,
        ready_token: payload.ready_token,
        ready_token_expires_at: payload.ready_token_expires_at,
        updated_at: payload.updated_at ?? new Date(),
        stops: {
          deleteMany: {},
          create: Array.isArray(payload.stops)
            ? payload.stops.map((stop) => this.toStopCreateInput(stop))
            : [],
        },
      },
      include: {
        stops: {
          orderBy: { sequence: 'asc' },
        },
      },
    });

    return this.toDomain(updated);
  }

  async delete(id: string): Promise<void> {
    await this.db.deliveryRecord.delete({
      where: { id },
    });
  }

  async findNearby(
    lat: number,
    lng: number,
    radius_km: number,
    vehicle_type?: string,
  ): Promise<DeliveryOrder[]> {
    const deliveries = await this.db.deliveryRecord.findMany({
      where: {
        order_status: OrderStatus.BOOKED,
        ...(vehicle_type ? { vehicle_type } : {}),
      },
      include: {
        stops: {
          orderBy: { sequence: 'asc' },
        },
      },
      orderBy: { created_at: 'desc' },
    });

    return deliveries
      .map((delivery) => this.toDomain(delivery))
      .filter((delivery) => {
        const pickup = delivery.stops.find((stop) => stop.type === StopType.PICKUP);
        if (!pickup?.geo) {
          return false;
        }

        return (
          this.calculateDistanceKm(lat, lng, pickup.geo.lat, pickup.geo.lng) <=
          radius_km
        );
      });
  }

  private toDomain(record: any): DeliveryOrder {
    const stops = Array.isArray(record?.stops)
      ? record.stops
          .sort((a, b) => a.sequence - b.sequence)
          .map((stop) => this.toDomainStop(stop))
      : [];

    return new DeliveryOrder(
      record!.id,
      record!.created_by_user_id,
      record!.placed_by_role,
      this.toVehicleType(record!.vehicle_type),
      record!.courier_comment,
      record!.is_scheduled,
      record!.scheduled_at,
      this.toOrderStatus(record!.order_status),
      {
        method: this.toPaymentMethod(record!.payment_method),
        calc_payload: record!.payment_calc_payload,
        calc_sig: record!.payment_calc_sig,
        currency: record!.payment_currency,
        amount: record!.payment_amount,
        expires_at: record!.payment_expires_at,
      },
      stops,
      [],
      record!.more_info,
      record!.rider_id,
      record!.ready_token,
      record!.ready_token_expires_at,
      record!.created_at,
      record!.updated_at,
    );
  }

  private toDomainStop(stop: any): Stop {
    return new Stop(
      stop.id,
      this.toStopType(stop.type),
      stop.sequence,
      stop.contact_name,
      stop.contact_phone,
      stop.notes,
      (stop.geo as GeoCoordinates | null) ?? null,
      (stop.address as Address | null) ?? null,
      stop.completed_at,
      stop.proof_photo_id,
    );
  }

  private toStopCreateInput(stop: Stop) {
    return {
      id: stop.id,
      type: stop.type,
      sequence: stop.sequence,
      contact_name: stop.contact_name,
      contact_phone: stop.contact_phone,
      notes: stop.notes,
      geo: (stop.geo as any) ?? undefined,
      address: (stop.address as any) ?? undefined,
      completed_at: stop.completed_at,
      proof_photo_id: stop.proof_photo_id,
    };
  }

  private toVehicleType(value: string): VehicleType {
    return Object.values(VehicleType).includes(value as VehicleType)
      ? (value as VehicleType)
      : VehicleType.MOTORBIKE;
  }

  private toOrderStatus(value: string): OrderStatus {
    return value === OrderStatus.DELIVERY
      ? OrderStatus.DELIVERY
      : OrderStatus.BOOKED;
  }

  private toPaymentMethod(value: string | null): PaymentMethod | null {
    if (!value) {
      return null;
    }

    return Object.values(PaymentMethod).includes(value as PaymentMethod)
      ? (value as PaymentMethod)
      : null;
  }

  private toStopType(value: string): StopType {
    return value === StopType.DROPOFF ? StopType.DROPOFF : StopType.PICKUP;
  }

  private calculateDistanceKm(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number,
  ): number {
    const earthRadiusKm = 6371;
    const dLat = this.toRadians(lat2 - lat1);
    const dLng = this.toRadians(lng2 - lng1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) *
        Math.cos(this.toRadians(lat2)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);

    return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  private toRadians(value: number): number {
    return (value * Math.PI) / 180;
  }
}
