import { Injectable } from '@nestjs/common';
import { Shift } from '../entities/shift.entity';
import { Rider } from '../entities/rider.entity';
import { Vehicle } from '../entities/vehicle.entity';
import { UniqueEntityID } from '../../../common/domain/unique-entity-id';
import { ShiftStatus } from '../value-objects/shift-status.vo';
import { Location } from '../value-objects/location.vo';
import { DomainEvents } from '../../../common/domain/domain-events';
import { ShiftStartedEvent } from '../events/shift-started.event';
import { ShiftEndedEvent } from '../events/shift-ended.event';
import { ShiftPausedEvent } from '../events/shift-paused.event';
import { ShiftResumedEvent } from '../events/shift-resumed.event';

export interface StartShiftRequest {
  riderId: UniqueEntityID;
  vehicleId: UniqueEntityID;
  startLocation: Location;
  plannedDuration?: number;
  shiftType?: 'regular' | 'peak' | 'night' | 'weekend';
  notes?: string;
}

export interface EndShiftRequest {
  shiftId: UniqueEntityID;
  endLocation: Location;
  actualEndTime?: Date;
  endReason?: 'completed' | 'early_end' | 'emergency' | 'system';
  notes?: string;
}

export interface PauseShiftRequest {
  shiftId: UniqueEntityID;
  pauseLocation: Location;
  pauseReason: 'break' | 'meal' | 'fuel' | 'maintenance' | 'personal' | 'emergency';
  estimatedDuration?: number;
  notes?: string;
}

export interface ResumeShiftRequest {
  shiftId: UniqueEntityID;
  resumeLocation: Location;
  notes?: string;
}

export interface ShiftValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface ShiftMetrics {
  totalDuration: number;
  activeDuration: number;
  breakDuration: number;
  distanceTraveled: number;
  ordersCompleted: number;
  earnings: number;
  fuelConsumed?: number;
  averageSpeed?: number;
  efficiency: number;
}

export interface ShiftConflict {
  type: 'overlapping' | 'vehicle_unavailable' | 'rider_unavailable' | 'location_restricted';
  conflictingShiftId?: UniqueEntityID;
  message: string;
  severity: 'low' | 'medium' | 'high';
}

@Injectable()
export class ShiftManagementService {
  constructor() {}

  /**
   * Validates if a rider can start a new shift
   */
  async validateShiftStart(
    request: StartShiftRequest,
    existingShifts: Shift[],
    rider: Rider,
    vehicle: Vehicle
  ): Promise<ShiftValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check rider status
    if (!rider.isActive()) {
      errors.push('Rider is not active');
    }

    if (!rider.isVerified()) {
      errors.push('Rider is not verified');
    }

    // Check for active shifts
    const activeShift = existingShifts.find(shift => 
      shift.getStatus().getValue() === 'active' || 
      shift.getStatus().getValue() === 'paused'
    );

    if (activeShift) {
      errors.push('Rider already has an active shift');
    }

    // Check vehicle availability
    if (!vehicle.isAvailable()) {
      errors.push('Vehicle is not available');
    }

    if (!vehicle.isVerified()) {
      errors.push('Vehicle is not verified');
    }

    // Check vehicle maintenance status
    if (vehicle.requiresMaintenance()) {
      warnings.push('Vehicle requires maintenance');
    }

    // Check fuel level
    if (vehicle.getFuelLevel() < 0.2) {
      warnings.push('Vehicle fuel level is low');
    }

    // Check insurance and registration
    if (vehicle.isInsuranceExpired()) {
      errors.push('Vehicle insurance has expired');
    }

    if (vehicle.isRegistrationExpired()) {
      errors.push('Vehicle registration has expired');
    }

    // Check working hours compliance
    const todayShifts = existingShifts.filter(shift => 
      this.isSameDay(shift.getStartTime(), new Date())
    );

    const totalHoursToday = todayShifts.reduce((total, shift) => 
      total + shift.getDuration(), 0
    );

    if (totalHoursToday >= 12) {
      errors.push('Maximum daily working hours exceeded');
    } else if (totalHoursToday >= 10) {
      warnings.push('Approaching maximum daily working hours');
    }

    // Check rest period
    const lastShift = existingShifts
      .filter(shift => shift.getEndTime())
      .sort((a, b) => b.getEndTime()!.getTime() - a.getEndTime()!.getTime())[0];

    if (lastShift && lastShift.getEndTime()) {
      const restHours = (new Date().getTime() - lastShift.getEndTime()!.getTime()) / (1000 * 60 * 60);
      if (restHours < 8) {
        warnings.push('Insufficient rest period since last shift');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Starts a new shift for a rider
   */
  async startShift(
    request: StartShiftRequest,
    rider: Rider,
    vehicle: Vehicle
  ): Promise<Shift> {
    const shiftId = new UniqueEntityID();
    const startTime = new Date();
    
    const shift = Shift.create({
      riderId: request.riderId,
      vehicleId: request.vehicleId,
      startTime,
      startLocation: request.startLocation,
      status: ShiftStatus.create('active'),
      plannedDuration: request.plannedDuration,
      shiftType: request.shiftType || 'regular',
      notes: request.notes,
      breaks: [],
      orders: [],
      earnings: 0,
      distanceTraveled: 0,
      fuelConsumed: 0
    }, shiftId);

    // Raise domain event
    DomainEvents.raise(new ShiftStartedEvent({
      shiftId: shift.id,
      riderId: request.riderId,
      vehicleId: request.vehicleId,
      startTime,
      startLocation: request.startLocation,
      shiftType: request.shiftType || 'regular'
    }));

    return shift;
  }

  /**
   * Ends an active shift
   */
  async endShift(
    shift: Shift,
    request: EndShiftRequest
  ): Promise<Shift> {
    const endTime = request.actualEndTime || new Date();
    
    // Validate shift can be ended
    if (!shift.canEnd()) {
      throw new Error('Shift cannot be ended in current state');
    }

    // End the shift
    shift.end(
      endTime,
      request.endLocation,
      request.endReason || 'completed',
      request.notes
    );

    // Calculate final metrics
    const metrics = this.calculateShiftMetrics(shift);
    shift.updateMetrics(metrics);

    // Raise domain event
    DomainEvents.raise(new ShiftEndedEvent({
      shiftId: shift.id,
      riderId: shift.getRiderId(),
      vehicleId: shift.getVehicleId(),
      startTime: shift.getStartTime(),
      endTime,
      duration: shift.getDuration(),
      earnings: shift.getEarnings(),
      ordersCompleted: shift.getOrdersCount(),
      distanceTraveled: shift.getDistanceTraveled(),
      endReason: request.endReason || 'completed'
    }));

    return shift;
  }

  /**
   * Pauses an active shift
   */
  async pauseShift(
    shift: Shift,
    request: PauseShiftRequest
  ): Promise<Shift> {
    const pauseTime = new Date();

    // Validate shift can be paused
    if (!shift.canPause()) {
      throw new Error('Shift cannot be paused in current state');
    }

    // Pause the shift
    shift.pause(
      pauseTime,
      request.pauseLocation,
      request.pauseReason,
      request.estimatedDuration,
      request.notes
    );

    // Raise domain event
    DomainEvents.raise(new ShiftPausedEvent({
      shiftId: shift.id,
      riderId: shift.getRiderId(),
      pauseTime,
      pauseLocation: request.pauseLocation,
      pauseReason: request.pauseReason,
      estimatedDuration: request.estimatedDuration
    }));

    return shift;
  }

  /**
   * Resumes a paused shift
   */
  async resumeShift(
    shift: Shift,
    request: ResumeShiftRequest
  ): Promise<Shift> {
    const resumeTime = new Date();

    // Validate shift can be resumed
    if (!shift.canResume()) {
      throw new Error('Shift cannot be resumed in current state');
    }

    // Resume the shift
    shift.resume(
      resumeTime,
      request.resumeLocation,
      request.notes
    );

    // Raise domain event
    DomainEvents.raise(new ShiftResumedEvent({
      shiftId: shift.id,
      riderId: shift.getRiderId(),
      resumeTime,
      resumeLocation: request.resumeLocation
    }));

    return shift;
  }

  /**
   * Checks for shift conflicts
   */
  async checkShiftConflicts(
    request: StartShiftRequest,
    existingShifts: Shift[]
  ): Promise<ShiftConflict[]> {
    const conflicts: ShiftConflict[] = [];

    // Check for overlapping shifts
    const activeShifts = existingShifts.filter(shift => 
      shift.getStatus().getValue() === 'active' || 
      shift.getStatus().getValue() === 'paused'
    );

    for (const activeShift of activeShifts) {
      if (activeShift.getRiderId().equals(request.riderId)) {
        conflicts.push({
          type: 'overlapping',
          conflictingShiftId: activeShift.id,
          message: 'Rider already has an active shift',
          severity: 'high'
        });
      }

      if (activeShift.getVehicleId().equals(request.vehicleId)) {
        conflicts.push({
          type: 'vehicle_unavailable',
          conflictingShiftId: activeShift.id,
          message: 'Vehicle is already in use by another rider',
          severity: 'high'
        });
      }
    }

    return conflicts;
  }

  /**
   * Calculates shift metrics
   */
  private calculateShiftMetrics(shift: Shift): ShiftMetrics {
    const totalDuration = shift.getDuration();
    const breakDuration = shift.getTotalBreakDuration();
    const activeDuration = totalDuration - breakDuration;
    
    return {
      totalDuration,
      activeDuration,
      breakDuration,
      distanceTraveled: shift.getDistanceTraveled(),
      ordersCompleted: shift.getOrdersCount(),
      earnings: shift.getEarnings(),
      fuelConsumed: shift.getFuelConsumed(),
      averageSpeed: shift.getDistanceTraveled() / (activeDuration / 60), // km/h
      efficiency: shift.getOrdersCount() / (activeDuration / 60) // orders per hour
    };
  }

  /**
   * Checks if two dates are on the same day
   */
  private isSameDay(date1: Date, date2: Date): boolean {
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate();
  }

  /**
   * Gets optimal shift duration based on historical data
   */
  async getOptimalShiftDuration(
    riderId: UniqueEntityID,
    shiftType: string,
    historicalShifts: Shift[]
  ): Promise<number> {
    const relevantShifts = historicalShifts.filter(shift => 
      shift.getRiderId().equals(riderId) && 
      shift.getShiftType() === shiftType &&
      shift.isCompleted()
    );

    if (relevantShifts.length === 0) {
      // Default durations by shift type
      const defaults = {
        regular: 8,
        peak: 4,
        night: 10,
        weekend: 6
      };
      return defaults[shiftType as keyof typeof defaults] || 8;
    }

    // Calculate average duration of successful shifts
    const totalDuration = relevantShifts.reduce((sum, shift) => 
      sum + shift.getDuration(), 0
    );

    return Math.round(totalDuration / relevantShifts.length);
  }

  /**
   * Predicts shift earnings based on historical data
   */
  async predictShiftEarnings(
    riderId: UniqueEntityID,
    shiftType: string,
    duration: number,
    startLocation: Location,
    historicalShifts: Shift[]
  ): Promise<{
    estimatedEarnings: number;
    confidence: number;
    factors: string[];
  }> {
    const relevantShifts = historicalShifts.filter(shift => 
      shift.getRiderId().equals(riderId) && 
      shift.getShiftType() === shiftType &&
      shift.isCompleted() &&
      Math.abs(shift.getDuration() - duration) <= 2 // Within 2 hours
    );

    if (relevantShifts.length < 3) {
      return {
        estimatedEarnings: 0,
        confidence: 0,
        factors: ['Insufficient historical data']
      };
    }

    const avgEarningsPerHour = relevantShifts.reduce((sum, shift) => 
      sum + (shift.getEarnings() / shift.getDuration()), 0
    ) / relevantShifts.length;

    const estimatedEarnings = avgEarningsPerHour * duration;
    const confidence = Math.min(relevantShifts.length / 10, 1); // Max confidence at 10+ shifts

    const factors = [
      `Based on ${relevantShifts.length} similar shifts`,
      `Average earnings: $${avgEarningsPerHour.toFixed(2)}/hour`,
      `Shift type: ${shiftType}`,
      `Duration: ${duration} hours`
    ];

    return {
      estimatedEarnings,
      confidence,
      factors
    };
  }
}