import { Injectable } from '@nestjs/common';
import {
  IDeliveryRepository,
  DeliveryFilters,
  PaginationParams,
  PaginatedResult,
} from '../../domain/repositories/delivery.repository.interface';
import { DeliveryOrder } from '../../domain/entities/delivery-order.entity';

@Injectable()
export class InMemoryDeliveryRepository implements IDeliveryRepository {
  private deliveries: Map<string, DeliveryOrder> = new Map();

  async create(delivery: DeliveryOrder): Promise<DeliveryOrder> {
    this.deliveries.set(delivery.id, delivery);
    return delivery;
  }

  async findById(id: string): Promise<DeliveryOrder | null> {
    return this.deliveries.get(id) || null;
  }

  async findAll(
    filters: DeliveryFilters,
    pagination: PaginationParams,
  ): Promise<PaginatedResult<DeliveryOrder>> {
    let results = Array.from(this.deliveries.values());

    // Apply filters
    if (filters.created_by_user_id) {
      results = results.filter(
        (d) => d.created_by_user_id === filters.created_by_user_id,
      );
    }

    if (filters.rider_id) {
      results = results.filter((d) => d.rider_id === filters.rider_id);
    }

    if (filters.placed_by_role) {
      results = results.filter(
        (d) => d.placed_by_role === filters.placed_by_role,
      );
    }

    if (filters.vehicle_type) {
      results = results.filter((d) => d.vehicle_type === filters.vehicle_type);
    }

    if (filters.order_status) {
      results = results.filter((d) => d.order_status === filters.order_status);
    }

    if (filters.from) {
      results = results.filter((d) => d.created_at >= filters.from!);
    }

    if (filters.to) {
      results = results.filter((d) => d.created_at <= filters.to!);
    }

    // Sort by created_at descending
    results.sort((a, b) => b.created_at.getTime() - a.created_at.getTime());

    // Pagination
    const total = results.length;
    const totalPages = Math.ceil(total / pagination.size);
    const start = (pagination.page - 1) * pagination.size;
    const end = start + pagination.size;
    const data = results.slice(start, end);

    return {
      data,
      total,
      page: pagination.page,
      size: pagination.size,
      totalPages,
    };
  }

  async update(
    id: string,
    updates: Partial<DeliveryOrder>,
  ): Promise<DeliveryOrder> {
    const existing = this.deliveries.get(id);
    if (!existing) {
      throw new Error('Delivery not found');
    }

    const updated = Object.assign(
      Object.create(Object.getPrototypeOf(existing)),
      existing,
      updates,
      { updated_at: new Date() },
    );

    this.deliveries.set(id, updated);
    return updated;
  }

  async delete(id: string): Promise<void> {
    this.deliveries.delete(id);
  }

  async findNearby(
    lat: number,
    lng: number,
    radius_km: number,
    vehicle_type?: string,
  ): Promise<DeliveryOrder[]> {
    const results = Array.from(this.deliveries.values()).filter((delivery) => {
      // Filter by vehicle type if provided
      if (vehicle_type && delivery.vehicle_type !== vehicle_type) {
        return false;
      }

      // Only include deliveries with booked status
      if (delivery.order_status !== 'booked') {
        return false;
      }

      // Check if pickup location is within radius
      const pickup = delivery.stops.find((s) => s.type === 'pickup');
      if (!pickup || !pickup.geo) {
        return false;
      }

      const distance = this.calculateDistance(
        lat,
        lng,
        pickup.geo.lat,
        pickup.geo.lng,
      );

      return distance <= radius_km;
    });

    return results;
  }

  private calculateDistance(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number,
  ): number {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRad(lat2 - lat1);
    const dLng = this.toRad(lng2 - lng1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) *
        Math.cos(this.toRad(lat2)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(degrees: number): number {
    return (degrees * Math.PI) / 180;
  }
}
