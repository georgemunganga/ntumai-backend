import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { ShiftRepository } from '../../domain/repositories/shift.repository';
import { Shift } from '../../domain/entities/shift.entity';
import { ShiftStatus } from '../../domain/value-objects/shift-status.vo';
import { Location } from '../../domain/value-objects/location.vo';
import { Prisma } from '@prisma/client';

export interface ShiftSearchFilters {
  riderId?: string;
  status?: string;
  startDate?: Date;
  endDate?: Date;
  minDuration?: number;
  maxDuration?: number;
  minEarnings?: number;
  maxEarnings?: number;
  vehicleId?: string;
  city?: string;
}

export interface ShiftSearchResult {
  shifts: Shift[];
  total: number;
}

export interface PaginationOptions {
  page: number;
  limit: number;
}

export interface ShiftSummary {
  period: string;
  totalShifts: number;
  totalDuration: number;
  totalEarnings: number;
  totalOrders: number;
  averageOrdersPerShift: number;
  averageEarningsPerShift: number;
  averageEarningsPerHour: number;
}

@Injectable()
export class ShiftRepositoryImpl implements ShiftRepository {
  constructor(private readonly prisma: PrismaService) {}

  async save(shift: Shift): Promise<Shift> {
    const shiftData = this.mapToShiftData(shift);

    if (shift.getId()) {
      // Update existing shift
      const updatedShift = await this.prisma.shift.update({
        where: { id: shift.getId() },
        data: shiftData,
        include: this.getIncludeOptions(),
      });
      return this.mapToDomainEntity(updatedShift);
    } else {
      // Create new shift
      const createdShift = await this.prisma.shift.create({
        data: {
          ...shiftData,
          id: undefined, // Let Prisma generate the ID
        },
        include: this.getIncludeOptions(),
      });
      return this.mapToDomainEntity(createdShift);
    }
  }

  async findById(id: string): Promise<Shift | null> {
    const shift = await this.prisma.shift.findUnique({
      where: { id },
      include: this.getIncludeOptions(),
    });

    return shift ? this.mapToDomainEntity(shift) : null;
  }

  async findByRiderId(
    riderId: string,
    pagination?: PaginationOptions,
  ): Promise<ShiftSearchResult> {
    const where: Prisma.ShiftWhereInput = { riderId };

    const [shifts, total] = await Promise.all([
      this.prisma.shift.findMany({
        where,
        include: this.getIncludeOptions(),
        skip: pagination ? (pagination.page - 1) * pagination.limit : undefined,
        take: pagination?.limit,
        orderBy: { startTime: 'desc' },
      }),
      this.prisma.shift.count({ where }),
    ]);

    return {
      shifts: shifts.map(shift => this.mapToDomainEntity(shift)),
      total,
    };
  }

  async findCurrentShiftByRiderId(riderId: string): Promise<Shift | null> {
    const shift = await this.prisma.shift.findFirst({
      where: {
        riderId,
        status: {
          in: ['ACTIVE', 'PAUSED'],
        },
      },
      include: this.getIncludeOptions(),
      orderBy: { startTime: 'desc' },
    });

    return shift ? this.mapToDomainEntity(shift) : null;
  }

  async findActiveShifts(): Promise<Shift[]> {
    const shifts = await this.prisma.shift.findMany({
      where: {
        status: 'ACTIVE',
      },
      include: this.getIncludeOptions(),
    });

    return shifts.map(shift => this.mapToDomainEntity(shift));
  }

  async findShiftsByDateRange(
    riderId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<Shift[]> {
    const shifts = await this.prisma.shift.findMany({
      where: {
        riderId,
        startTime: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: this.getIncludeOptions(),
      orderBy: { startTime: 'desc' },
    });

    return shifts.map(shift => this.mapToDomainEntity(shift));
  }

  async searchShifts(
    filters: ShiftSearchFilters,
    pagination: PaginationOptions,
  ): Promise<ShiftSearchResult> {
    const where: Prisma.ShiftWhereInput = {};

    if (filters.riderId) {
      where.riderId = filters.riderId;
    }

    if (filters.status) {
      where.status = filters.status as any;
    }

    if (filters.startDate) {
      where.startTime = {
        gte: filters.startDate,
      };
    }

    if (filters.endDate) {
      where.startTime = {
        ...where.startTime,
        lte: filters.endDate,
      };
    }

    if (filters.minDuration !== undefined) {
      where.duration = {
        gte: filters.minDuration,
      };
    }

    if (filters.maxDuration !== undefined) {
      where.duration = {
        ...where.duration,
        lte: filters.maxDuration,
      };
    }

    if (filters.minEarnings !== undefined) {
      where.totalEarnings = {
        gte: filters.minEarnings,
      };
    }

    if (filters.maxEarnings !== undefined) {
      where.totalEarnings = {
        ...where.totalEarnings,
        lte: filters.maxEarnings,
      };
    }

    if (filters.vehicleId) {
      where.vehicleId = filters.vehicleId;
    }

    if (filters.city) {
      where.startLocationCity = {
        contains: filters.city,
        mode: 'insensitive',
      };
    }

    const [shifts, total] = await Promise.all([
      this.prisma.shift.findMany({
        where,
        include: this.getIncludeOptions(),
        skip: (pagination.page - 1) * pagination.limit,
        take: pagination.limit,
        orderBy: { startTime: 'desc' },
      }),
      this.prisma.shift.count({ where }),
    ]);

    return {
      shifts: shifts.map(shift => this.mapToDomainEntity(shift)),
      total,
    };
  }

  async getShiftSummary(
    riderId: string,
    startDate: Date,
    endDate: Date,
    groupBy: 'day' | 'week' | 'month' = 'day',
  ): Promise<ShiftSummary[]> {
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
        DATE_FORMAT(start_time, '${dateFormat}') as period,
        COUNT(*) as totalShifts,
        SUM(duration) as totalDuration,
        SUM(total_earnings) as totalEarnings,
        SUM(total_orders) as totalOrders,
        AVG(total_orders) as averageOrdersPerShift,
        AVG(total_earnings) as averageEarningsPerShift,
        AVG(CASE WHEN duration > 0 THEN total_earnings / (duration / 3600) ELSE 0 END) as averageEarningsPerHour
      FROM shifts 
      WHERE rider_id = ? 
        AND start_time >= ? 
        AND start_time <= ?
        AND status = 'COMPLETED'
      GROUP BY DATE_FORMAT(start_time, '${dateFormat}')
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
      totalShifts: Number(result.totalShifts),
      totalDuration: Number(result.totalDuration) || 0,
      totalEarnings: Number(result.totalEarnings) || 0,
      totalOrders: Number(result.totalOrders) || 0,
      averageOrdersPerShift: Number(result.averageOrdersPerShift) || 0,
      averageEarningsPerShift: Number(result.averageEarningsPerShift) || 0,
      averageEarningsPerHour: Number(result.averageEarningsPerHour) || 0,
    }));
  }

  async findLongRunningShifts(hoursThreshold: number = 12): Promise<Shift[]> {
    const thresholdDate = new Date();
    thresholdDate.setHours(thresholdDate.getHours() - hoursThreshold);

    const shifts = await this.prisma.shift.findMany({
      where: {
        status: 'ACTIVE',
        startTime: {
          lte: thresholdDate,
        },
      },
      include: this.getIncludeOptions(),
    });

    return shifts.map(shift => this.mapToDomainEntity(shift));
  }

  async findShiftsWithoutEndTime(): Promise<Shift[]> {
    const shifts = await this.prisma.shift.findMany({
      where: {
        endTime: null,
        status: {
          not: 'ACTIVE',
        },
      },
      include: this.getIncludeOptions(),
    });

    return shifts.map(shift => this.mapToDomainEntity(shift));
  }

  async updateShiftEarnings(
    shiftId: string,
    totalEarnings: number,
    totalOrders: number,
  ): Promise<void> {
    await this.prisma.shift.update({
      where: { id: shiftId },
      data: {
        totalEarnings,
        totalOrders,
      },
    });
  }

  async updateShiftLocation(
    shiftId: string,
    location: Location,
    locationType: 'start' | 'end',
  ): Promise<void> {
    const updateData: any = {};

    if (locationType === 'start') {
      updateData.startLocationLatitude = location.getLatitude();
      updateData.startLocationLongitude = location.getLongitude();
    } else {
      updateData.endLocationLatitude = location.getLatitude();
      updateData.endLocationLongitude = location.getLongitude();
    }

    await this.prisma.shift.update({
      where: { id: shiftId },
      data: updateData,
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.shift.delete({
      where: { id },
    });
  }

  async findAll(): Promise<Shift[]> {
    const shifts = await this.prisma.shift.findMany({
      include: this.getIncludeOptions(),
      orderBy: { startTime: 'desc' },
    });

    return shifts.map(shift => this.mapToDomainEntity(shift));
  }

  async count(): Promise<number> {
    return this.prisma.shift.count();
  }

  async countByRiderId(riderId: string): Promise<number> {
    return this.prisma.shift.count({
      where: { riderId },
    });
  }

  async countActiveShifts(): Promise<number> {
    return this.prisma.shift.count({
      where: { status: 'ACTIVE' },
    });
  }

  async getTotalEarningsByRiderId(
    riderId: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<number> {
    const where: Prisma.ShiftWhereInput = {
      riderId,
      status: 'COMPLETED',
    };

    if (startDate) {
      where.startTime = { gte: startDate };
    }

    if (endDate) {
      where.startTime = {
        ...where.startTime,
        lte: endDate,
      };
    }

    const result = await this.prisma.shift.aggregate({
      where,
      _sum: {
        totalEarnings: true,
      },
    });

    return result._sum.totalEarnings || 0;
  }

  async getTotalDurationByRiderId(
    riderId: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<number> {
    const where: Prisma.ShiftWhereInput = {
      riderId,
      status: 'COMPLETED',
    };

    if (startDate) {
      where.startTime = { gte: startDate };
    }

    if (endDate) {
      where.startTime = {
        ...where.startTime,
        lte: endDate,
      };
    }

    const result = await this.prisma.shift.aggregate({
      where,
      _sum: {
        duration: true,
      },
    });

    return result._sum.duration || 0;
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
      vehicle: {
        select: {
          id: true,
          type: true,
          make: true,
          model: true,
          plateNumber: true,
        },
      },
      riderOrders: {
        select: {
          id: true,
          orderId: true,
          status: true,
          earnings: true,
        },
      },
    };
  }

  private mapToShiftData(shift: Shift): Prisma.ShiftCreateInput | Prisma.ShiftUpdateInput {
    const status = shift.getStatus();
    const startLocation = shift.getStartLocation();
    const endLocation = shift.getEndLocation();

    return {
      riderId: shift.getRiderId(),
      vehicleId: shift.getVehicleId(),
      status: status.getStatus() as any,
      startTime: shift.getStartTime(),
      endTime: shift.getEndTime(),
      duration: shift.getDuration(),
      pausedDuration: shift.getPausedDuration(),
      startLocationLatitude: startLocation?.getLatitude(),
      startLocationLongitude: startLocation?.getLongitude(),
      startLocationAddress: shift.getStartLocationAddress(),
      startLocationCity: shift.getStartLocationCity(),
      endLocationLatitude: endLocation?.getLatitude(),
      endLocationLongitude: endLocation?.getLongitude(),
      endLocationAddress: shift.getEndLocationAddress(),
      endLocationCity: shift.getEndLocationCity(),
      totalOrders: shift.getTotalOrders(),
      completedOrders: shift.getCompletedOrders(),
      cancelledOrders: shift.getCancelledOrders(),
      totalEarnings: shift.getTotalEarnings(),
      totalDistance: shift.getTotalDistance(),
      averageRating: shift.getAverageRating(),
      notes: shift.getNotes(),
      pauseReasons: shift.getPauseReasons(),
      endReason: shift.getEndReason(),
    };
  }

  private mapToDomainEntity(data: any): Shift {
    const status = ShiftStatus.create(
      data.status,
      data.startTime,
      data.endTime,
      data.pausedDuration,
    );

    const startLocation = (data.startLocationLatitude && data.startLocationLongitude) ?
      Location.create(data.startLocationLatitude, data.startLocationLongitude) : null;

    const endLocation = (data.endLocationLatitude && data.endLocationLongitude) ?
      Location.create(data.endLocationLatitude, data.endLocationLongitude) : null;

    return new Shift(
      data.id,
      data.riderId,
      data.vehicleId,
      status,
      data.startTime,
      data.endTime,
      data.duration,
      data.pausedDuration,
      startLocation,
      data.startLocationAddress,
      data.startLocationCity,
      endLocation,
      data.endLocationAddress,
      data.endLocationCity,
      data.totalOrders || 0,
      data.completedOrders || 0,
      data.cancelledOrders || 0,
      data.totalEarnings || 0,
      data.totalDistance || 0,
      data.averageRating || 0,
      data.notes,
      data.pauseReasons,
      data.endReason,
      data.createdAt,
      data.updatedAt,
    );
  }
}