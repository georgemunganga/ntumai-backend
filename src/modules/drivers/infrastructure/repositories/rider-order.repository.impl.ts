import { Injectable } from '@nestjs/common';
import { PrismaService } from '@common/prisma/prisma.service';
import { RiderOrderRepository } from '../../domain/repositories/rider-order.repository';
import { RiderOrder } from '../../domain/entities/rider-order.entity';
import { Location } from '../../domain/value-objects/location.vo';
import { Prisma } from '@prisma/client';

export interface RiderOrderSearchFilters {
  riderId?: string;
  orderId?: string;
  shiftId?: string;
  status?: string;
  startDate?: Date;
  endDate?: Date;
  minEarnings?: number;
  maxEarnings?: number;
  minDeliveryTime?: number;
  maxDeliveryTime?: number;
  customerRating?: number;
  city?: string;
}

export interface RiderOrderSearchResult {
  riderOrders: RiderOrder[];
  total: number;
}

export interface PaginationOptions {
  page: number;
  limit: number;
}

export interface OrderSummary {
  period: string;
  totalOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  totalEarnings: number;
  averageEarnings: number;
  averageDeliveryTime: number;
  averageRating: number;
}

@Injectable()
export class RiderOrderRepositoryImpl implements RiderOrderRepository {
  constructor(private readonly prisma: PrismaService) {}

  async save(riderOrder: RiderOrder): Promise<RiderOrder> {
    const riderOrderData = this.mapToRiderOrderData(riderOrder);

    if (riderOrder.getId()) {
      // Update existing rider order
      const updatedRiderOrder = await this.prisma.riderOrder.update({
        where: { id: riderOrder.getId() },
        data: riderOrderData,
        include: this.getIncludeOptions(),
      });
      return this.mapToDomainEntity(updatedRiderOrder);
    } else {
      // Create new rider order
      const createdRiderOrder = await this.prisma.riderOrder.create({
        data: {
          ...riderOrderData,
          id: undefined, // Let Prisma generate the ID
        },
        include: this.getIncludeOptions(),
      });
      return this.mapToDomainEntity(createdRiderOrder);
    }
  }

  async findById(id: string): Promise<RiderOrder | null> {
    const riderOrder = await this.prisma.riderOrder.findUnique({
      where: { id },
      include: this.getIncludeOptions(),
    });

    return riderOrder ? this.mapToDomainEntity(riderOrder) : null;
  }

  async findByOrderId(orderId: string): Promise<RiderOrder | null> {
    const riderOrder = await this.prisma.riderOrder.findUnique({
      where: { orderId },
      include: this.getIncludeOptions(),
    });

    return riderOrder ? this.mapToDomainEntity(riderOrder) : null;
  }

  async findByRiderId(
    riderId: string,
    pagination?: PaginationOptions,
  ): Promise<RiderOrderSearchResult> {
    const where: Prisma.RiderOrderWhereInput = { riderId };

    const [riderOrders, total] = await Promise.all([
      this.prisma.riderOrder.findMany({
        where,
        include: this.getIncludeOptions(),
        skip: pagination ? (pagination.page - 1) * pagination.limit : undefined,
        take: pagination?.limit,
        orderBy: { assignedAt: 'desc' },
      }),
      this.prisma.riderOrder.count({ where }),
    ]);

    return {
      riderOrders: riderOrders.map(order => this.mapToDomainEntity(order)),
      total,
    };
  }

  async findByShiftId(shiftId: string): Promise<RiderOrder[]> {
    const riderOrders = await this.prisma.riderOrder.findMany({
      where: { shiftId },
      include: this.getIncludeOptions(),
      orderBy: { assignedAt: 'asc' },
    });

    return riderOrders.map(order => this.mapToDomainEntity(order));
  }

  async findActiveOrdersByRiderId(riderId: string): Promise<RiderOrder[]> {
    const riderOrders = await this.prisma.riderOrder.findMany({
      where: {
        riderId,
        status: {
          in: ['ASSIGNED', 'ACCEPTED', 'PICKED_UP', 'IN_TRANSIT'],
        },
      },
      include: this.getIncludeOptions(),
      orderBy: { assignedAt: 'asc' },
    });

    return riderOrders.map(order => this.mapToDomainEntity(order));
  }

  async findNearbyOrders(
    location: Location,
    radiusKm: number,
    excludeRiderId?: string,
  ): Promise<RiderOrder[]> {
    // Using raw SQL for geospatial queries
    const query = `
      SELECT ro.*, o.*, s.name as storeName, s.address as storeAddress
      FROM rider_orders ro
      JOIN orders o ON ro.order_id = o.id
      JOIN stores s ON o.store_id = s.id
      WHERE ro.status = 'PENDING'
        AND ro.pickup_latitude IS NOT NULL
        AND ro.pickup_longitude IS NOT NULL
        ${excludeRiderId ? 'AND ro.rider_id != ?' : ''}
        AND (
          6371 * acos(
            cos(radians(?)) * cos(radians(ro.pickup_latitude)) *
            cos(radians(ro.pickup_longitude) - radians(?)) +
            sin(radians(?)) * sin(radians(ro.pickup_latitude))
          )
        ) <= ?
      ORDER BY (
        6371 * acos(
          cos(radians(?)) * cos(radians(ro.pickup_latitude)) *
          cos(radians(ro.pickup_longitude) - radians(?)) +
          sin(radians(?)) * sin(radians(ro.pickup_latitude))
        )
      ) ASC
      LIMIT 20
    `;

    const params = [
      location.getLatitude(),
      location.getLongitude(),
      location.getLatitude(),
      radiusKm,
      location.getLatitude(),
      location.getLongitude(),
      location.getLatitude(),
    ];

    if (excludeRiderId) {
      params.unshift(excludeRiderId);
    }

    const riderOrders = await this.prisma.$queryRawUnsafe(query, ...params) as any[];

    return riderOrders.map(order => this.mapToDomainEntity(order));
  }

  async searchRiderOrders(
    filters: RiderOrderSearchFilters,
    pagination: PaginationOptions,
  ): Promise<RiderOrderSearchResult> {
    const where: Prisma.RiderOrderWhereInput = {};

    if (filters.riderId) {
      where.riderId = filters.riderId;
    }

    if (filters.orderId) {
      where.orderId = filters.orderId;
    }

    if (filters.shiftId) {
      where.shiftId = filters.shiftId;
    }

    if (filters.status) {
      where.status = filters.status as any;
    }

    if (filters.startDate) {
      where.assignedAt = {
        gte: filters.startDate,
      };
    }

    if (filters.endDate) {
      where.assignedAt = {
        ...where.assignedAt,
        lte: filters.endDate,
      };
    }

    if (filters.minEarnings !== undefined) {
      where.earnings = {
        gte: filters.minEarnings,
      };
    }

    if (filters.maxEarnings !== undefined) {
      where.earnings = {
        ...where.earnings,
        lte: filters.maxEarnings,
      };
    }

    if (filters.minDeliveryTime !== undefined) {
      where.deliveryTime = {
        gte: filters.minDeliveryTime,
      };
    }

    if (filters.maxDeliveryTime !== undefined) {
      where.deliveryTime = {
        ...where.deliveryTime,
        lte: filters.maxDeliveryTime,
      };
    }

    if (filters.customerRating !== undefined) {
      where.customerRating = filters.customerRating;
    }

    if (filters.city) {
      where.deliveryCity = {
        contains: filters.city,
        mode: 'insensitive',
      };
    }

    const [riderOrders, total] = await Promise.all([
      this.prisma.riderOrder.findMany({
        where,
        include: this.getIncludeOptions(),
        skip: (pagination.page - 1) * pagination.limit,
        take: pagination.limit,
        orderBy: { assignedAt: 'desc' },
      }),
      this.prisma.riderOrder.count({ where }),
    ]);

    return {
      riderOrders: riderOrders.map(order => this.mapToDomainEntity(order)),
      total,
    };
  }

  async getOrderSummary(
    riderId: string,
    startDate: Date,
    endDate: Date,
    groupBy: 'day' | 'week' | 'month' = 'day',
  ): Promise<OrderSummary[]> {
    let dateFormat: string;
    switch (groupBy) {
      case 'week':
        dateFormat = '%Y-%u'; // Year-Week
        break;
      case 'month':
        dateFormat = '%Y-%m'; // Year-Month
        break;
      default:
        dateFormat = '%Y-%m-%d'; // Year-Month-Day
    }

    const query = `
      SELECT 
        DATE_FORMAT(assigned_at, '${dateFormat}') as period,
        COUNT(*) as totalOrders,
        SUM(CASE WHEN status = 'DELIVERED' THEN 1 ELSE 0 END) as completedOrders,
        SUM(CASE WHEN status = 'CANCELLED' THEN 1 ELSE 0 END) as cancelledOrders,
        SUM(earnings) as totalEarnings,
        AVG(earnings) as averageEarnings,
        AVG(delivery_time) as averageDeliveryTime,
        AVG(customer_rating) as averageRating
      FROM rider_orders 
      WHERE rider_id = ? 
        AND assigned_at >= ? 
        AND assigned_at <= ?
      GROUP BY DATE_FORMAT(assigned_at, '${dateFormat}')
      ORDER BY period ASC
    `;

    const results = await this.prisma.$queryRawUnsafe(
      query,
      riderId,
      startDate,
      endDate,
    ) as any[];

    return results.map(result => ({
      period: result.period,
      totalOrders: Number(result.totalOrders),
      completedOrders: Number(result.completedOrders) || 0,
      cancelledOrders: Number(result.cancelledOrders) || 0,
      totalEarnings: Number(result.totalEarnings) || 0,
      averageEarnings: Number(result.averageEarnings) || 0,
      averageDeliveryTime: Number(result.averageDeliveryTime) || 0,
      averageRating: Number(result.averageRating) || 0,
    }));
  }

  async findOverdueOrders(minutesThreshold: number = 30): Promise<RiderOrder[]> {
    const thresholdDate = new Date();
    thresholdDate.setMinutes(thresholdDate.getMinutes() - minutesThreshold);

    const riderOrders = await this.prisma.riderOrder.findMany({
      where: {
        status: {
          in: ['ASSIGNED', 'ACCEPTED', 'PICKED_UP', 'IN_TRANSIT'],
        },
        assignedAt: {
          lte: thresholdDate,
        },
      },
      include: this.getIncludeOptions(),
    });

    return riderOrders.map(order => this.mapToDomainEntity(order));
  }

  async findUnassignedOrders(): Promise<RiderOrder[]> {
    const riderOrders = await this.prisma.riderOrder.findMany({
      where: {
        status: 'PENDING',
        riderId: null,
      },
      include: this.getIncludeOptions(),
      orderBy: { createdAt: 'asc' },
    });

    return riderOrders.map(order => this.mapToDomainEntity(order));
  }

  async updateOrderStatus(
    riderOrderId: string,
    status: string,
    timestamp?: Date,
  ): Promise<void> {
    const updateData: any = { status };

    switch (status) {
      case 'ACCEPTED':
        updateData.acceptedAt = timestamp || new Date();
        break;
      case 'PICKED_UP':
        updateData.pickedUpAt = timestamp || new Date();
        break;
      case 'DELIVERED':
        updateData.deliveredAt = timestamp || new Date();
        break;
      case 'CANCELLED':
        updateData.cancelledAt = timestamp || new Date();
        break;
    }

    await this.prisma.riderOrder.update({
      where: { id: riderOrderId },
      data: updateData,
    });
  }

  async updateOrderLocation(
    riderOrderId: string,
    location: Location,
    locationType: 'pickup' | 'delivery',
  ): Promise<void> {
    const updateData: any = {};

    if (locationType === 'pickup') {
      updateData.pickupLatitude = location.getLatitude();
      updateData.pickupLongitude = location.getLongitude();
    } else {
      updateData.deliveryLatitude = location.getLatitude();
      updateData.deliveryLongitude = location.getLongitude();
    }

    await this.prisma.riderOrder.update({
      where: { id: riderOrderId },
      data: updateData,
    });
  }

  async updateOrderEarnings(
    riderOrderId: string,
    earnings: number,
    tips?: number,
  ): Promise<void> {
    await this.prisma.riderOrder.update({
      where: { id: riderOrderId },
      data: {
        earnings,
        tips: tips || 0,
      },
    });
  }

  async updateCustomerRating(
    riderOrderId: string,
    rating: number,
    feedback?: string,
  ): Promise<void> {
    await this.prisma.riderOrder.update({
      where: { id: riderOrderId },
      data: {
        customerRating: rating,
        customerFeedback: feedback,
      },
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.riderOrder.delete({
      where: { id },
    });
  }

  async findAll(): Promise<RiderOrder[]> {
    const riderOrders = await this.prisma.riderOrder.findMany({
      include: this.getIncludeOptions(),
      orderBy: { assignedAt: 'desc' },
    });

    return riderOrders.map(order => this.mapToDomainEntity(order));
  }

  async count(): Promise<number> {
    return this.prisma.riderOrder.count();
  }

  async countByRiderId(riderId: string): Promise<number> {
    return this.prisma.riderOrder.count({
      where: { riderId },
    });
  }

  async countByStatus(status: string): Promise<number> {
    return this.prisma.riderOrder.count({
      where: { status: status as any },
    });
  }

  async getTotalEarningsByRiderId(
    riderId: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<number> {
    const where: Prisma.RiderOrderWhereInput = {
      riderId,
      status: 'DELIVERED',
    };

    if (startDate) {
      where.assignedAt = { gte: startDate };
    }

    if (endDate) {
      where.assignedAt = {
        ...where.assignedAt,
        lte: endDate,
      };
    }

    const result = await this.prisma.riderOrder.aggregate({
      where,
      _sum: {
        earnings: true,
        tips: true,
      },
    });

    return (result._sum.earnings || 0) + (result._sum.tips || 0);
  }

  async getAverageRatingByRiderId(
    riderId: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<number> {
    const where: Prisma.RiderOrderWhereInput = {
      riderId,
      customerRating: {
        not: null,
      },
    };

    if (startDate) {
      where.assignedAt = { gte: startDate };
    }

    if (endDate) {
      where.assignedAt = {
        ...where.assignedAt,
        lte: endDate,
      };
    }

    const result = await this.prisma.riderOrder.aggregate({
      where,
      _avg: {
        customerRating: true,
      },
    });

    return result._avg.customerRating || 0;
  }

  private getIncludeOptions() {
    return {
      rider: {
        select: {
          id: true,
          riderCode: true,
          firstName: true,
          lastName: true,
          email: true,
          phoneNumber: true,
        },
      },
      order: {
        select: {
          id: true,
          trackingId: true,
          status: true,
          totalAmount: true,
          deliveryFee: true,
          specialInstructions: true,
          estimatedDelivery: true,
        },
      },
      shift: {
        select: {
          id: true,
          status: true,
          startTime: true,
          endTime: true,
        },
      },
      earnings: {
        select: {
          id: true,
          type: true,
          amount: true,
          currency: true,
        },
      },
      incidents: {
        select: {
          id: true,
          type: true,
          severity: true,
          status: true,
          description: true,
        },
      },
    };
  }

  private mapToRiderOrderData(riderOrder: RiderOrder): Prisma.RiderOrderCreateInput | Prisma.RiderOrderUpdateInput {
    const pickupLocation = riderOrder.getPickupLocation();
    const deliveryLocation = riderOrder.getDeliveryLocation();

    return {
      riderId: riderOrder.getRiderId(),
      orderId: riderOrder.getOrderId(),
      shiftId: riderOrder.getShiftId(),
      status: riderOrder.getStatus() as any,
      priority: riderOrder.getPriority(),
      estimatedPickupTime: riderOrder.getEstimatedPickupTime(),
      estimatedDeliveryTime: riderOrder.getEstimatedDeliveryTime(),
      pickupLatitude: pickupLocation?.getLatitude(),
      pickupLongitude: pickupLocation?.getLongitude(),
      pickupAddress: riderOrder.getPickupAddress(),
      pickupCity: riderOrder.getPickupCity(),
      pickupInstructions: riderOrder.getPickupInstructions(),
      deliveryLatitude: deliveryLocation?.getLatitude(),
      deliveryLongitude: deliveryLocation?.getLongitude(),
      deliveryAddress: riderOrder.getDeliveryAddress(),
      deliveryCity: riderOrder.getDeliveryCity(),
      deliveryInstructions: riderOrder.getDeliveryInstructions(),
      distance: riderOrder.getDistance(),
      earnings: riderOrder.getEarnings(),
      tips: riderOrder.getTips(),
      deliveryTime: riderOrder.getDeliveryTime(),
      customerRating: riderOrder.getCustomerRating(),
      customerFeedback: riderOrder.getCustomerFeedback(),
      riderNotes: riderOrder.getRiderNotes(),
      assignedAt: riderOrder.getAssignedAt(),
      acceptedAt: riderOrder.getAcceptedAt(),
      pickedUpAt: riderOrder.getPickedUpAt(),
      deliveredAt: riderOrder.getDeliveredAt(),
      cancelledAt: riderOrder.getCancelledAt(),
      cancellationReason: riderOrder.getCancellationReason(),
    };
  }

  private mapToDomainEntity(data: any): RiderOrder {
    const pickupLocation = (data.pickupLatitude && data.pickupLongitude) ?
      Location.create(data.pickupLatitude, data.pickupLongitude) : null;

    const deliveryLocation = (data.deliveryLatitude && data.deliveryLongitude) ?
      Location.create(data.deliveryLatitude, data.deliveryLongitude) : null;

    return new RiderOrder(
      data.id,
      data.riderId,
      data.orderId,
      data.shiftId,
      data.status,
      data.priority || 'NORMAL',
      data.estimatedPickupTime,
      data.estimatedDeliveryTime,
      pickupLocation,
      data.pickupAddress,
      data.pickupCity,
      data.pickupInstructions,
      deliveryLocation,
      data.deliveryAddress,
      data.deliveryCity,
      data.deliveryInstructions,
      data.distance || 0,
      data.earnings || 0,
      data.tips || 0,
      data.deliveryTime,
      data.customerRating,
      data.customerFeedback,
      data.riderNotes,
      data.assignedAt,
      data.acceptedAt,
      data.pickedUpAt,
      data.deliveredAt,
      data.cancelledAt,
      data.cancellationReason,
      data.createdAt,
      data.updatedAt,
    );
  }
}