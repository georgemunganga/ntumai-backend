import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { SHIFT_REPOSITORY } from '../../domain/repositories/shift.repository.interface';
import type { IShiftRepository } from '../../domain/repositories/shift.repository.interface';
import { Shift, ShiftStatus } from '../../domain/entities/shift.entity';
import {
  StartShiftDto,
  UpdateLocationDto,
  GetShiftsQueryDto,
  ShiftResponseDto,
  ShiftSummaryDto,
  ShiftPerformanceDto,
  HeatmapDataPointDto,
  ShiftStatisticsDto,
} from '../dtos/shift.dto';

@Injectable()
export class ShiftService {
  constructor(
    @Inject(SHIFT_REPOSITORY)
    private readonly shiftRepository: IShiftRepository,
  ) {}

  async startShift(
    riderUserId: string,
    dto: StartShiftDto,
  ): Promise<ShiftResponseDto> {
    // Check if rider already has an active shift
    const existingShift =
      await this.shiftRepository.findActiveByRiderUserId(riderUserId);
    if (existingShift) {
      throw new ConflictException(
        'Rider already has an active shift. Please end the current shift first.',
      );
    }

    const shift = Shift.create({
      rider_user_id: riderUserId,
      vehicle_type: dto.vehicle_type,
      current_location: dto.current_location,
    });

    const saved = await this.shiftRepository.save(shift);
    return this.toResponseDto(saved);
  }

  async endShift(
    shiftId: string,
    riderUserId: string,
  ): Promise<ShiftResponseDto> {
    const shift = await this.shiftRepository.findById(shiftId);
    if (!shift) {
      throw new NotFoundException('Shift not found');
    }

    if (shift.rider_user_id !== riderUserId) {
      throw new BadRequestException('You can only end your own shifts');
    }

    shift.end();
    const saved = await this.shiftRepository.save(shift);
    return this.toResponseDto(saved);
  }

  async pauseShift(
    shiftId: string,
    riderUserId: string,
  ): Promise<ShiftResponseDto> {
    const shift = await this.shiftRepository.findById(shiftId);
    if (!shift) {
      throw new NotFoundException('Shift not found');
    }

    if (shift.rider_user_id !== riderUserId) {
      throw new BadRequestException('You can only pause your own shifts');
    }

    shift.pause();
    const saved = await this.shiftRepository.save(shift);
    return this.toResponseDto(saved);
  }

  async resumeShift(
    shiftId: string,
    riderUserId: string,
    location?: { lat: number; lng: number },
  ): Promise<ShiftResponseDto> {
    const shift = await this.shiftRepository.findById(shiftId);
    if (!shift) {
      throw new NotFoundException('Shift not found');
    }

    if (shift.rider_user_id !== riderUserId) {
      throw new BadRequestException('You can only resume your own shifts');
    }

    shift.resume();
    if (location) {
      shift.updateLocation(location);
    }
    const saved = await this.shiftRepository.save(shift);
    return this.toResponseDto(saved);
  }

  async getCurrentShift(riderUserId: string): Promise<ShiftResponseDto | null> {
    const shift =
      await this.shiftRepository.findActiveByRiderUserId(riderUserId);
    if (!shift) {
      return null;
    }
    return this.toResponseDto(shift);
  }

  async getShifts(
    riderUserId: string,
    query: GetShiftsQueryDto,
  ): Promise<{
    shifts: ShiftResponseDto[];
    total: number;
    page: number;
    size: number;
  }> {
    const filters = {
      rider_user_id: riderUserId,
      status: query.status,
      vehicle_type: query.vehicle_type,
      start_date: query.start_date ? new Date(query.start_date) : undefined,
      end_date: query.end_date ? new Date(query.end_date) : undefined,
      page: query.page || 1,
      size: query.size || 20,
    };

    const { shifts, total } = await this.shiftRepository.findAll(filters);

    return {
      shifts: shifts.map((shift) => this.toResponseDto(shift)),
      total,
      page: filters.page,
      size: filters.size,
    };
  }

  async getShiftById(
    shiftId: string,
    riderUserId: string,
  ): Promise<ShiftResponseDto> {
    const shift = await this.shiftRepository.findById(shiftId);
    if (!shift) {
      throw new NotFoundException('Shift not found');
    }

    if (shift.rider_user_id !== riderUserId) {
      throw new BadRequestException('You can only view your own shifts');
    }

    return this.toResponseDto(shift);
  }

  async updateLocation(
    shiftId: string,
    riderUserId: string,
    dto: UpdateLocationDto,
  ): Promise<ShiftResponseDto> {
    const shift = await this.shiftRepository.findById(shiftId);
    if (!shift) {
      throw new NotFoundException('Shift not found');
    }

    if (shift.rider_user_id !== riderUserId) {
      throw new BadRequestException(
        'You can only update your own shift location',
      );
    }

    if (!shift.isActive()) {
      throw new BadRequestException(
        'Can only update location for active shifts',
      );
    }

    shift.updateLocation(dto.location);
    const saved = await this.shiftRepository.save(shift);
    return this.toResponseDto(saved);
  }

  async getDailySummary(
    riderUserId: string,
    date?: string,
  ): Promise<ShiftSummaryDto> {
    const targetDate = date ? new Date(date) : new Date();
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    const shifts = await this.shiftRepository.findShiftsByDateRange(
      riderUserId,
      startOfDay,
      endOfDay,
    );

    return this.calculateSummary(shifts);
  }

  async getWeeklySummary(riderUserId: string): Promise<ShiftSummaryDto> {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    const shifts = await this.shiftRepository.findShiftsByDateRange(
      riderUserId,
      startOfWeek,
      endOfWeek,
    );

    return this.calculateSummary(shifts);
  }

  async getMonthlySummary(riderUserId: string): Promise<ShiftSummaryDto> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
      23,
      59,
      59,
      999,
    );

    const shifts = await this.shiftRepository.findShiftsByDateRange(
      riderUserId,
      startOfMonth,
      endOfMonth,
    );

    return this.calculateSummary(shifts);
  }

  async getPerformanceAnalytics(
    riderUserId: string,
  ): Promise<ShiftPerformanceDto> {
    const shifts = await this.shiftRepository.findByRiderUserId(riderUserId);

    const totalShifts = shifts.length;
    const totalDeliveries = shifts.reduce(
      (sum, s) => sum + s.total_deliveries,
      0,
    );
    const totalEarnings = shifts.reduce((sum, s) => sum + s.total_earnings, 0);
    const totalActiveHours =
      shifts.reduce((sum, s) => sum + s.getActiveDuration(), 0) / 3600;

    return {
      rider_user_id: riderUserId,
      total_shifts: totalShifts,
      total_deliveries: totalDeliveries,
      total_earnings: totalEarnings,
      average_deliveries_per_hour:
        totalActiveHours > 0 ? totalDeliveries / totalActiveHours : 0,
      average_earnings_per_hour:
        totalActiveHours > 0 ? totalEarnings / totalActiveHours : 0,
      completion_rate: 100, // Mock value
      rating: 4.8, // Mock value
    };
  }

  async searchAllShifts(query: GetShiftsQueryDto): Promise<{
    shifts: ShiftResponseDto[];
    total: number;
    page: number;
    size: number;
  }> {
    const filters = {
      status: query.status,
      vehicle_type: query.vehicle_type,
      start_date: query.start_date ? new Date(query.start_date) : undefined,
      end_date: query.end_date ? new Date(query.end_date) : undefined,
      page: query.page || 1,
      size: query.size || 20,
    };

    const { shifts, total } = await this.shiftRepository.findAll(filters);

    return {
      shifts: shifts.map((shift) => this.toResponseDto(shift)),
      total,
      page: filters.page,
      size: filters.size,
    };
  }

  async getStatisticsOverview(): Promise<ShiftStatisticsDto> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const activeShifts = await this.shiftRepository.findActiveShifts();
    const { shifts: todayShifts } = await this.shiftRepository.findAll({
      start_date: today,
      end_date: tomorrow,
    });

    const totalDeliveries = todayShifts.reduce(
      (sum, s) => sum + s.total_deliveries,
      0,
    );
    const totalEarnings = todayShifts.reduce(
      (sum, s) => sum + s.total_earnings,
      0,
    );
    const totalDuration = todayShifts.reduce(
      (sum, s) => sum + s.getDuration(),
      0,
    );
    const avgDuration =
      todayShifts.length > 0 ? totalDuration / todayShifts.length / 3600 : 0;

    const byVehicleType: Record<string, number> = {};
    activeShifts.forEach((shift) => {
      byVehicleType[shift.vehicle_type] =
        (byVehicleType[shift.vehicle_type] || 0) + 1;
    });

    return {
      total_active_riders: activeShifts.length,
      total_shifts_today: todayShifts.length,
      average_shift_duration_hours: avgDuration,
      total_deliveries_today: totalDeliveries,
      total_earnings_today: totalEarnings,
      by_vehicle_type: byVehicleType,
    };
  }

  async getActiveCount(): Promise<{ count: number }> {
    const activeShifts = await this.shiftRepository.findActiveShifts();
    return { count: activeShifts.length };
  }

  async bulkEndShifts(shiftIds: string[]): Promise<{ ended_count: number }> {
    const count = await this.shiftRepository.bulkEnd(shiftIds);
    return { ended_count: count };
  }

  async getHeatmapData(): Promise<HeatmapDataPointDto[]> {
    const activeShifts = await this.shiftRepository.findActiveShifts();

    const heatmap: HeatmapDataPointDto[] = [];
    activeShifts.forEach((shift) => {
      if (shift.current_location) {
        heatmap.push({
          lat: shift.current_location.lat,
          lng: shift.current_location.lng,
          intensity: 1,
        });
      }
    });

    return heatmap;
  }

  async exportData(riderUserId: string): Promise<any[]> {
    const shifts = await this.shiftRepository.findByRiderUserId(riderUserId);
    return shifts.map((shift) => this.toResponseDto(shift));
  }

  private calculateSummary(shifts: Shift[]): ShiftSummaryDto {
    const totalShifts = shifts.length;
    const activeShifts = shifts.filter(
      (s) => s.status === ShiftStatus.ACTIVE,
    ).length;
    const endedShifts = shifts.filter(
      (s) => s.status === ShiftStatus.ENDED,
    ).length;
    const totalDeliveries = shifts.reduce(
      (sum, s) => sum + s.total_deliveries,
      0,
    );
    const totalEarnings = shifts.reduce((sum, s) => sum + s.total_earnings, 0);
    const totalDistance = shifts.reduce(
      (sum, s) => sum + s.total_distance_km,
      0,
    );
    const totalActiveTime =
      shifts.reduce((sum, s) => sum + s.getActiveDuration(), 0) / 3600;

    return {
      total_shifts: totalShifts,
      active_shifts: activeShifts,
      ended_shifts: endedShifts,
      total_deliveries: totalDeliveries,
      total_earnings: totalEarnings,
      total_distance_km: totalDistance,
      average_deliveries_per_shift:
        totalShifts > 0 ? totalDeliveries / totalShifts : 0,
      average_earnings_per_shift:
        totalShifts > 0 ? totalEarnings / totalShifts : 0,
      total_active_time_hours: totalActiveTime,
    };
  }

  private toResponseDto(shift: Shift): ShiftResponseDto {
    return {
      id: shift.id,
      rider_user_id: shift.rider_user_id,
      status: shift.status,
      vehicle_type: shift.vehicle_type,
      start_time: shift.start_time.toISOString(),
      end_time: shift.end_time?.toISOString() || null,
      current_location: shift.current_location,
      total_deliveries: shift.total_deliveries,
      total_earnings: shift.total_earnings,
      total_distance_km: shift.total_distance_km,
      duration_sec: shift.getDuration(),
      active_duration_sec: shift.getActiveDuration(),
      total_pause_duration_sec: shift.total_pause_duration_sec,
    };
  }
}
