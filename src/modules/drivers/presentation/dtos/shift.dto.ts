import {
  IsString,
  IsOptional,
  IsDateString,
  IsEnum,
  IsBoolean,
  IsNumber,
  ValidateNested,
  IsObject,
  Min,
  Max,
  Length,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { LocationDto } from './rider-profile.dto';

// Enums
export enum ShiftStatus {
  ACTIVE = 'ACTIVE',
  PAUSED = 'PAUSED',
  ENDED = 'ENDED',
  CANCELLED = 'CANCELLED',
}

export enum ShiftType {
  REGULAR = 'REGULAR',
  PEAK_HOURS = 'PEAK_HOURS',
  NIGHT_SHIFT = 'NIGHT_SHIFT',
  WEEKEND = 'WEEKEND',
  HOLIDAY = 'HOLIDAY',
}

// Shift Break DTO
export class ShiftBreakDto {
  @ApiProperty({ description: 'Break start time' })
  @IsDateString()
  startTime: string;

  @ApiPropertyOptional({ description: 'Break end time' })
  @IsOptional()
  @IsDateString()
  endTime?: string;

  @ApiProperty({ description: 'Break duration in minutes' })
  @IsNumber()
  @Min(0)
  duration: number;

  @ApiPropertyOptional({ description: 'Break reason' })
  @IsOptional()
  @IsString()
  @Length(1, 200)
  reason?: string;

  @ApiPropertyOptional({ description: 'Break location', type: LocationDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => LocationDto)
  location?: LocationDto;
}

// Shift Earnings DTO
export class ShiftEarningsDto {
  @ApiProperty({ description: 'Base earnings amount' })
  @IsNumber()
  @Min(0)
  baseEarnings: number;

  @ApiProperty({ description: 'Bonus earnings amount' })
  @IsNumber()
  @Min(0)
  bonusEarnings: number;

  @ApiProperty({ description: 'Tips received' })
  @IsNumber()
  @Min(0)
  tips: number;

  @ApiProperty({ description: 'Incentives earned' })
  @IsNumber()
  @Min(0)
  incentives: number;

  @ApiProperty({ description: 'Total earnings' })
  @IsNumber()
  @Min(0)
  totalEarnings: number;

  @ApiProperty({ description: 'Currency code' })
  @IsString()
  @Length(3, 3)
  currency: string;

  @ApiPropertyOptional({ description: 'Fuel expenses' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  fuelExpenses?: number;

  @ApiPropertyOptional({ description: 'Other expenses' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  otherExpenses?: number;

  @ApiPropertyOptional({ description: 'Net earnings after expenses' })
  @IsOptional()
  @IsNumber()
  netEarnings?: number;
}

// Shift Statistics DTO
export class ShiftStatisticsDto {
  @ApiProperty({ description: 'Total distance covered in kilometers' })
  @IsNumber()
  @Min(0)
  totalDistance: number;

  @ApiProperty({ description: 'Total orders completed' })
  @IsNumber()
  @Min(0)
  totalOrders: number;

  @ApiProperty({ description: 'Orders accepted' })
  @IsNumber()
  @Min(0)
  ordersAccepted: number;

  @ApiProperty({ description: 'Orders rejected' })
  @IsNumber()
  @Min(0)
  ordersRejected: number;

  @ApiProperty({ description: 'Orders cancelled' })
  @IsNumber()
  @Min(0)
  ordersCancelled: number;

  @ApiProperty({ description: 'Average delivery time in minutes' })
  @IsNumber()
  @Min(0)
  averageDeliveryTime: number;

  @ApiProperty({ description: 'Customer rating for the shift' })
  @IsNumber()
  @Min(0)
  @Max(5)
  customerRating: number;

  @ApiProperty({ description: 'Number of ratings received' })
  @IsNumber()
  @Min(0)
  ratingsCount: number;

  @ApiPropertyOptional({ description: 'Peak hours worked in minutes' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  peakHoursWorked?: number;

  @ApiPropertyOptional({ description: 'Idle time in minutes' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  idleTime?: number;
}

// Start Shift DTO
export class StartShiftDto {
  @ApiProperty({ description: 'Rider ID starting the shift' })
  @IsString()
  riderId: string;

  @ApiProperty({ description: 'Vehicle ID to use for the shift' })
  @IsString()
  vehicleId: string;

  @ApiProperty({ description: 'Shift start location', type: LocationDto })
  @ValidateNested()
  @Type(() => LocationDto)
  startLocation: LocationDto;

  @ApiPropertyOptional({ description: 'Shift type', enum: ShiftType })
  @IsOptional()
  @IsEnum(ShiftType)
  shiftType?: ShiftType;

  @ApiPropertyOptional({ description: 'Planned shift duration in hours' })
  @IsOptional()
  @IsNumber()
  @Min(0.5)
  @Max(24)
  plannedDuration?: number;

  @ApiPropertyOptional({ description: 'Shift notes' })
  @IsOptional()
  @IsString()
  @Length(1, 500)
  notes?: string;

  @ApiPropertyOptional({ description: 'Additional metadata' })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

// End Shift DTO
export class EndShiftDto {
  @ApiProperty({ description: 'Shift end location', type: LocationDto })
  @ValidateNested()
  @Type(() => LocationDto)
  endLocation: LocationDto;

  @ApiPropertyOptional({ description: 'Shift summary notes' })
  @IsOptional()
  @IsString()
  @Length(1, 1000)
  summaryNotes?: string;

  @ApiPropertyOptional({ description: 'Final odometer reading' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  finalOdometerReading?: number;

  @ApiPropertyOptional({ description: 'Fuel level at end (percentage)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  fuelLevelEnd?: number;
}

// Pause Shift DTO
export class PauseShiftDto {
  @ApiProperty({ description: 'Pause reason' })
  @IsString()
  @Length(1, 200)
  reason: string;

  @ApiPropertyOptional({ description: 'Pause location', type: LocationDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => LocationDto)
  location?: LocationDto;

  @ApiPropertyOptional({ description: 'Expected pause duration in minutes' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(480) // Max 8 hours
  expectedDuration?: number;
}

// Resume Shift DTO
export class ResumeShiftDto {
  @ApiPropertyOptional({ description: 'Resume location', type: LocationDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => LocationDto)
  location?: LocationDto;

  @ApiPropertyOptional({ description: 'Resume notes' })
  @IsOptional()
  @IsString()
  @Length(1, 200)
  notes?: string;
}

// Update Shift Location DTO
export class UpdateShiftLocationDto {
  @ApiProperty({ description: 'Current location', type: LocationDto })
  @ValidateNested()
  @Type(() => LocationDto)
  location: LocationDto;

  @ApiPropertyOptional({ description: 'Current speed in km/h' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(200)
  speed?: number;

  @ApiPropertyOptional({ description: 'Heading in degrees (0-360)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(360)
  heading?: number;

  @ApiPropertyOptional({ description: 'Current odometer reading' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  odometerReading?: number;
}

// Shift Response DTO
export class ShiftResponseDto {
  @ApiProperty({ description: 'Shift ID' })
  id: string;

  @ApiProperty({ description: 'Rider ID' })
  riderId: string;

  @ApiProperty({ description: 'Vehicle ID' })
  vehicleId: string;

  @ApiProperty({ description: 'Shift status', enum: ShiftStatus })
  status: ShiftStatus;

  @ApiProperty({ description: 'Shift type', enum: ShiftType })
  shiftType: ShiftType;

  @ApiProperty({ description: 'Shift start time' })
  startTime: string;

  @ApiPropertyOptional({ description: 'Shift end time' })
  endTime?: string;

  @ApiProperty({ description: 'Shift start location', type: LocationDto })
  startLocation: LocationDto;

  @ApiPropertyOptional({ description: 'Shift end location', type: LocationDto })
  endLocation?: LocationDto;

  @ApiPropertyOptional({ description: 'Current location', type: LocationDto })
  currentLocation?: LocationDto;

  @ApiProperty({ description: 'Shift duration in minutes' })
  duration: number;

  @ApiPropertyOptional({ description: 'Planned shift duration in hours' })
  plannedDuration?: number;

  @ApiProperty({ description: 'Shift earnings', type: ShiftEarningsDto })
  earnings: ShiftEarningsDto;

  @ApiProperty({ description: 'Shift statistics', type: ShiftStatisticsDto })
  statistics: ShiftStatisticsDto;

  @ApiProperty({ description: 'Shift breaks', type: [ShiftBreakDto] })
  breaks: ShiftBreakDto[];

  @ApiProperty({ description: 'Whether shift is currently paused' })
  isPaused: boolean;

  @ApiPropertyOptional({ description: 'Pause start time if currently paused' })
  pauseStartTime?: string;

  @ApiPropertyOptional({ description: 'Total pause duration in minutes' })
  totalPauseDuration?: number;

  @ApiPropertyOptional({ description: 'Shift notes' })
  notes?: string;

  @ApiPropertyOptional({ description: 'Shift summary notes' })
  summaryNotes?: string;

  @ApiProperty({ description: 'Shift creation date' })
  createdAt: string;

  @ApiProperty({ description: 'Last shift update date' })
  updatedAt: string;

  @ApiPropertyOptional({ description: 'Additional metadata' })
  metadata?: Record<string, any>;
}

// Get Shifts DTO
export class GetShiftsDto {
  @ApiPropertyOptional({ description: 'Filter by rider ID' })
  @IsOptional()
  @IsString()
  riderId?: string;

  @ApiPropertyOptional({ description: 'Filter by vehicle ID' })
  @IsOptional()
  @IsString()
  vehicleId?: string;

  @ApiPropertyOptional({ description: 'Filter by status', enum: ShiftStatus })
  @IsOptional()
  @IsEnum(ShiftStatus)
  status?: ShiftStatus;

  @ApiPropertyOptional({ description: 'Filter by shift type', enum: ShiftType })
  @IsOptional()
  @IsEnum(ShiftType)
  shiftType?: ShiftType;

  @ApiPropertyOptional({ description: 'Filter by start date (from)' })
  @IsOptional()
  @IsDateString()
  startDateFrom?: string;

  @ApiPropertyOptional({ description: 'Filter by start date (to)' })
  @IsOptional()
  @IsDateString()
  startDateTo?: string;

  @ApiPropertyOptional({ description: 'Filter by end date (from)' })
  @IsOptional()
  @IsDateString()
  endDateFrom?: string;

  @ApiPropertyOptional({ description: 'Filter by end date (to)' })
  @IsOptional()
  @IsDateString()
  endDateTo?: string;

  @ApiPropertyOptional({ description: 'Filter by minimum duration in hours' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  minDuration?: number;

  @ApiPropertyOptional({ description: 'Filter by maximum duration in hours' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  maxDuration?: number;

  @ApiPropertyOptional({ description: 'Filter by minimum earnings' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  minEarnings?: number;

  @ApiPropertyOptional({ description: 'Filter by maximum earnings' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  maxEarnings?: number;

  @ApiPropertyOptional({ description: 'Page number for pagination', default: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Number of items per page', default: 20 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiPropertyOptional({ description: 'Sort field' })
  @IsOptional()
  @IsString()
  sortBy?: string;

  @ApiPropertyOptional({ description: 'Sort order', enum: ['asc', 'desc'] })
  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc';
}

// Paginated Shifts Response DTO
export class PaginatedShiftsResponseDto {
  @ApiProperty({ description: 'List of shifts', type: [ShiftResponseDto] })
  shifts: ShiftResponseDto[];

  @ApiProperty({ description: 'Total number of shifts' })
  total: number;

  @ApiProperty({ description: 'Current page number' })
  page: number;

  @ApiProperty({ description: 'Number of items per page' })
  limit: number;

  @ApiProperty({ description: 'Total number of pages' })
  totalPages: number;

  @ApiProperty({ description: 'Whether there is a next page' })
  hasNext: boolean;

  @ApiProperty({ description: 'Whether there is a previous page' })
  hasPrev: boolean;
}

// Shift Summary DTO
export class ShiftSummaryDto {
  @ApiProperty({ description: 'Summary period (e.g., "2024-01-15" for daily)' })
  period: string;

  @ApiProperty({ description: 'Total number of shifts' })
  totalShifts: number;

  @ApiProperty({ description: 'Total shift duration in hours' })
  totalDuration: number;

  @ApiProperty({ description: 'Total earnings', type: ShiftEarningsDto })
  totalEarnings: ShiftEarningsDto;

  @ApiProperty({ description: 'Total distance covered in kilometers' })
  totalDistance: number;

  @ApiProperty({ description: 'Total orders completed' })
  totalOrders: number;

  @ApiProperty({ description: 'Average shift duration in hours' })
  averageShiftDuration: number;

  @ApiProperty({ description: 'Average earnings per shift' })
  averageEarningsPerShift: number;

  @ApiProperty({ description: 'Average orders per shift' })
  averageOrdersPerShift: number;

  @ApiProperty({ description: 'Average customer rating' })
  averageRating: number;

  @ApiPropertyOptional({ description: 'Peak hours worked in minutes' })
  peakHoursWorked?: number;

  @ApiPropertyOptional({ description: 'Total break time in minutes' })
  totalBreakTime?: number;
}

// Get Shift Summary DTO
export class GetShiftSummaryDto {
  @ApiPropertyOptional({ description: 'Filter by rider ID' })
  @IsOptional()
  @IsString()
  riderId?: string;

  @ApiProperty({ description: 'Start date for summary period' })
  @IsDateString()
  startDate: string;

  @ApiProperty({ description: 'End date for summary period' })
  @IsDateString()
  endDate: string;

  @ApiPropertyOptional({ description: 'Group by period', enum: ['day', 'week', 'month'] })
  @IsOptional()
  @IsEnum(['day', 'week', 'month'])
  groupBy?: 'day' | 'week' | 'month' = 'day';
}

// Shift Analytics DTO
export class ShiftAnalyticsDto {
  @ApiProperty({ description: 'Analytics period' })
  period: string;

  @ApiProperty({ description: 'Total active shifts' })
  totalActiveShifts: number;

  @ApiProperty({ description: 'Total completed shifts' })
  totalCompletedShifts: number;

  @ApiProperty({ description: 'Total cancelled shifts' })
  totalCancelledShifts: number;

  @ApiProperty({ description: 'Average shift completion rate (%)' })
  completionRate: number;

  @ApiProperty({ description: 'Peak hours utilization (%)' })
  peakHoursUtilization: number;

  @ApiProperty({ description: 'Most productive hour of day (0-23)' })
  mostProductiveHour: number;

  @ApiProperty({ description: 'Most productive day of week (1-7, Monday=1)' })
  mostProductiveDay: number;

  @ApiProperty({ description: 'Average break frequency per shift' })
  averageBreakFrequency: number;

  @ApiProperty({ description: 'Top performing riders', type: [String] })
  topPerformingRiders: string[];

  @ApiProperty({ description: 'Shift type distribution' })
  shiftTypeDistribution: Record<string, number>;
}