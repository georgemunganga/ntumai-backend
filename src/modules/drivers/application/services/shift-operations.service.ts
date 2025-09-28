import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { ShiftRepository } from '../../domain/repositories/shift.repository';
import { RiderRepository } from '../../domain/repositories/rider.repository';
import { VehicleRepository } from '../../domain/repositories/vehicle.repository';
import { ShiftManagementService } from '../../domain/services/shift-management.service';
import { Shift } from '../../domain/entities/shift.entity';
import { ShiftStatus } from '../../domain/value-objects/shift-status.vo';
import { Location } from '../../domain/value-objects/location.vo';

export interface StartShiftRequest {
  riderId: string;
  vehicleId?: string;
  plannedEndTime?: Date;
  startLocation?: {
    latitude: number;
    longitude: number;
  };
}

export interface EndShiftRequest {
  riderId: string;
  endLocation?: {
    latitude: number;
    longitude: number;
  };
  notes?: string;
}

export interface PauseShiftRequest {
  riderId: string;
  reason?: string;
}

export interface ResumeShiftRequest {
  riderId: string;
}

export interface ShiftResponse {
  id: string;
  riderId: string;
  vehicleId?: string;
  status: string;
  startTime: Date;
  endTime?: Date;
  plannedEndTime?: Date;
  startLocation?: {
    latitude: number;
    longitude: number;
  };
  endLocation?: {
    latitude: number;
    longitude: number;
  };
  metrics: {
    totalOrders: number;
    completedOrders: number;
    totalDistance: number;
    totalEarnings: number;
    totalBreakTime: number;
    averageDeliveryTime?: number;
    customerRating?: number;
  };
  breakInfo?: {
    startTime: Date;
    endTime?: Date;
    reason?: string;
  };
  duration: number; // in minutes
  createdAt: Date;
  updatedAt: Date;
}

export interface ShiftSummaryResponse {
  totalShifts: number;
  totalHours: number;
  totalEarnings: number;
  totalOrders: number;
  completedOrders: number;
  averageShiftDuration: number;
  averageEarningsPerHour: number;
  averageOrdersPerShift: number;
}

export interface ShiftListResponse {
  shifts: ShiftResponse[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ShiftFilters {
  riderId?: string;
  status?: string;
  vehicleId?: string;
  startDate?: Date;
  endDate?: Date;
  minDuration?: number; // in minutes
  maxDuration?: number; // in minutes
  minEarnings?: number;
  maxEarnings?: number;
}

export interface ShiftAnalyticsRequest {
  riderId?: string;
  startDate: Date;
  endDate: Date;
  groupBy?: 'day' | 'week' | 'month';
}

export interface ShiftAnalyticsResponse {
  period: string;
  totalShifts: number;
  totalHours: number;
  totalEarnings: number;
  totalOrders: number;
  averageShiftDuration: number;
  averageEarningsPerHour: number;
  peakHours: Array<{
    hour: number;
    orderCount: number;
    earnings: number;
  }>;
}

@Injectable()
export class ShiftOperationsService {
  constructor(
    private readonly shiftRepository: ShiftRepository,
    private readonly riderRepository: RiderRepository,
    private readonly vehicleRepository: VehicleRepository,
    private readonly shiftManagementService: ShiftManagementService,
  ) {}

  async startShift(request: StartShiftRequest): Promise<ShiftResponse> {
    // Validate rider exists and is eligible
    const rider = await this.riderRepository.findById(request.riderId);
    if (!rider) {
      throw new NotFoundException('Rider not found');
    }

    // Check if rider already has an active shift
    const activeShift = await this.shiftRepository.findActiveShiftByRiderId(request.riderId);
    if (activeShift) {
      throw new ConflictException('Rider already has an active shift');
    }

    // Validate vehicle if provided
    let vehicle = null;
    if (request.vehicleId) {
      vehicle = await this.vehicleRepository.findById(request.vehicleId);
      if (!vehicle || vehicle.getRiderId() !== request.riderId) {
        throw new NotFoundException('Vehicle not found or does not belong to rider');
      }
      if (!vehicle.getIsActive() || !vehicle.getIsVerified()) {
        throw new BadRequestException('Vehicle is not active or verified');
      }
    }

    // Use domain service to validate shift eligibility
    const startShiftRequest = {
      riderId: request.riderId,
      vehicleId: request.vehicleId,
      plannedEndTime: request.plannedEndTime,
    };

    const validationResult = await this.shiftManagementService.validateShiftEligibility(
      startShiftRequest,
    );

    if (!validationResult.isEligible) {
      throw new BadRequestException(`Cannot start shift: ${validationResult.reason}`);
    }

    // Create and start shift
    const startLocation = request.startLocation
      ? Location.create(request.startLocation.latitude, request.startLocation.longitude)
      : null;

    const shift = new Shift(
      '', // ID will be generated
      request.riderId,
      request.vehicleId,
      ShiftStatus.create('ACTIVE'),
      new Date(),
      null, // endTime
      request.plannedEndTime,
      startLocation,
      null, // endLocation
    );

    const savedShift = await this.shiftRepository.save(shift);

    // Update rider status to online
    rider.updateStatus(rider.getStatus().goOnline());
    await this.riderRepository.save(rider);

    return this.mapToShiftResponse(savedShift);
  }

  async endShift(request: EndShiftRequest): Promise<ShiftResponse> {
    // Find active shift
    const activeShift = await this.shiftRepository.findActiveShiftByRiderId(request.riderId);
    if (!activeShift) {
      throw new NotFoundException('No active shift found for rider');
    }

    // End shift
    const endLocation = request.endLocation
      ? Location.create(request.endLocation.latitude, request.endLocation.longitude)
      : null;

    activeShift.end(endLocation);

    const savedShift = await this.shiftRepository.save(activeShift);

    // Update rider status to offline
    const rider = await this.riderRepository.findById(request.riderId);
    if (rider) {
      rider.updateStatus(rider.getStatus().goOffline());
      await this.riderRepository.save(rider);
    }

    return this.mapToShiftResponse(savedShift);
  }

  async pauseShift(request: PauseShiftRequest): Promise<ShiftResponse> {
    const activeShift = await this.shiftRepository.findActiveShiftByRiderId(request.riderId);
    if (!activeShift) {
      throw new NotFoundException('No active shift found for rider');
    }

    if (activeShift.getStatus().getValue() === 'PAUSED') {
      throw new BadRequestException('Shift is already paused');
    }

    activeShift.pause(request.reason);
    const savedShift = await this.shiftRepository.save(activeShift);

    // Update rider status to break
    const rider = await this.riderRepository.findById(request.riderId);
    if (rider) {
      rider.updateStatus(rider.getStatus().goOnBreak());
      await this.riderRepository.save(rider);
    }

    return this.mapToShiftResponse(savedShift);
  }

  async resumeShift(request: ResumeShiftRequest): Promise<ShiftResponse> {
    const activeShift = await this.shiftRepository.findActiveShiftByRiderId(request.riderId);
    if (!activeShift) {
      throw new NotFoundException('No active shift found for rider');
    }

    if (activeShift.getStatus().getValue() !== 'PAUSED') {
      throw new BadRequestException('Shift is not paused');
    }

    activeShift.resume();
    const savedShift = await this.shiftRepository.save(activeShift);

    // Update rider status to online
    const rider = await this.riderRepository.findById(request.riderId);
    if (rider) {
      rider.updateStatus(rider.getStatus().goOnline());
      await this.riderRepository.save(rider);
    }

    return this.mapToShiftResponse(savedShift);
  }

  async getCurrentShift(riderId: string): Promise<ShiftResponse | null> {
    const activeShift = await this.shiftRepository.findActiveShiftByRiderId(riderId);
    if (!activeShift) {
      return null;
    }

    return this.mapToShiftResponse(activeShift);
  }

  async getShiftById(shiftId: string): Promise<ShiftResponse> {
    const shift = await this.shiftRepository.findById(shiftId);
    if (!shift) {
      throw new NotFoundException('Shift not found');
    }

    return this.mapToShiftResponse(shift);
  }

  async getShiftHistory(
    riderId: string,
    page: number = 1,
    limit: number = 20,
    filters?: Omit<ShiftFilters, 'riderId'>,
  ): Promise<ShiftListResponse> {
    const shiftFilters: ShiftFilters = {
      ...filters,
      riderId,
    };

    const { shifts, total } = await this.shiftRepository.searchShifts(shiftFilters, {
      page,
      limit,
    });

    const shiftResponses = shifts.map(shift => this.mapToShiftResponse(shift));

    return {
      shifts: shiftResponses,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getShiftSummary(
    riderId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<ShiftSummaryResponse> {
    const shifts = await this.shiftRepository.findShiftsByRiderAndDateRange(
      riderId,
      startDate,
      endDate,
    );

    const completedShifts = shifts.filter(shift => shift.getStatus().getValue() === 'COMPLETED');

    const totalShifts = completedShifts.length;
    const totalHours = completedShifts.reduce((sum, shift) => {
      const duration = shift.getDuration();
      return sum + (duration ? duration / 60 : 0); // Convert minutes to hours
    }, 0);

    const totalEarnings = completedShifts.reduce(
      (sum, shift) => sum + shift.getTotalEarnings(),
      0,
    );

    const totalOrders = completedShifts.reduce(
      (sum, shift) => sum + shift.getTotalOrders(),
      0,
    );

    const completedOrders = completedShifts.reduce(
      (sum, shift) => sum + shift.getCompletedOrders(),
      0,
    );

    return {
      totalShifts,
      totalHours,
      totalEarnings,
      totalOrders,
      completedOrders,
      averageShiftDuration: totalShifts > 0 ? totalHours / totalShifts : 0,
      averageEarningsPerHour: totalHours > 0 ? totalEarnings / totalHours : 0,
      averageOrdersPerShift: totalShifts > 0 ? totalOrders / totalShifts : 0,
    };
  }

  async getShiftAnalytics(request: ShiftAnalyticsRequest): Promise<ShiftAnalyticsResponse[]> {
    const analytics = await this.shiftRepository.getShiftAnalytics(
      request.startDate,
      request.endDate,
      request.riderId,
      request.groupBy || 'day',
    );

    return analytics.map(data => ({
      period: data.period,
      totalShifts: data.totalShifts,
      totalHours: data.totalHours,
      totalEarnings: data.totalEarnings,
      totalOrders: data.totalOrders,
      averageShiftDuration: data.totalShifts > 0 ? data.totalHours / data.totalShifts : 0,
      averageEarningsPerHour: data.totalHours > 0 ? data.totalEarnings / data.totalHours : 0,
      peakHours: data.peakHours || [],
    }));
  }

  async updateShiftMetrics(
    shiftId: string,
    metrics: {
      totalOrders?: number;
      completedOrders?: number;
      totalDistance?: number;
      totalEarnings?: number;
      averageDeliveryTime?: number;
      customerRating?: number;
    },
  ): Promise<ShiftResponse> {
    const shift = await this.shiftRepository.findById(shiftId);
    if (!shift) {
      throw new NotFoundException('Shift not found');
    }

    // Update metrics
    if (metrics.totalOrders !== undefined) {
      shift.updateTotalOrders(metrics.totalOrders);
    }
    if (metrics.completedOrders !== undefined) {
      shift.updateCompletedOrders(metrics.completedOrders);
    }
    if (metrics.totalDistance !== undefined) {
      shift.updateTotalDistance(metrics.totalDistance);
    }
    if (metrics.totalEarnings !== undefined) {
      shift.updateTotalEarnings(metrics.totalEarnings);
    }
    if (metrics.averageDeliveryTime !== undefined) {
      shift.updateAverageDeliveryTime(metrics.averageDeliveryTime);
    }
    if (metrics.customerRating !== undefined) {
      shift.updateCustomerRating(metrics.customerRating);
    }

    const updatedShift = await this.shiftRepository.save(shift);
    return this.mapToShiftResponse(updatedShift);
  }

  async searchShifts(
    filters: ShiftFilters,
    page: number = 1,
    limit: number = 20,
  ): Promise<ShiftListResponse> {
    const { shifts, total } = await this.shiftRepository.searchShifts(filters, {
      page,
      limit,
    });

    const shiftResponses = shifts.map(shift => this.mapToShiftResponse(shift));

    return {
      shifts: shiftResponses,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  private mapToShiftResponse(shift: Shift): ShiftResponse {
    const duration = shift.getDuration() || 0;

    return {
      id: shift.getId(),
      riderId: shift.getRiderId(),
      vehicleId: shift.getVehicleId(),
      status: shift.getStatus().getValue(),
      startTime: shift.getStartTime(),
      endTime: shift.getEndTime(),
      plannedEndTime: shift.getPlannedEndTime(),
      startLocation: shift.getStartLocation() ? {
        latitude: shift.getStartLocation()!.getLatitude(),
        longitude: shift.getStartLocation()!.getLongitude(),
      } : undefined,
      endLocation: shift.getEndLocation() ? {
        latitude: shift.getEndLocation()!.getLatitude(),
        longitude: shift.getEndLocation()!.getLongitude(),
      } : undefined,
      metrics: {
        totalOrders: shift.getTotalOrders(),
        completedOrders: shift.getCompletedOrders(),
        totalDistance: shift.getTotalDistance(),
        totalEarnings: shift.getTotalEarnings(),
        totalBreakTime: shift.getTotalBreakTime(),
        averageDeliveryTime: shift.getAverageDeliveryTime(),
        customerRating: shift.getCustomerRating(),
      },
      breakInfo: shift.getBreakStartTime() ? {
        startTime: shift.getBreakStartTime()!,
        endTime: shift.getBreakEndTime(),
        reason: shift.getBreakReason(),
      } : undefined,
      duration,
      createdAt: shift.getCreatedAt(),
      updatedAt: shift.getUpdatedAt(),
    };
  }
}