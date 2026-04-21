import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsNumber,
  IsEnum,
  IsDateString,
  IsArray,
  ValidateNested,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';

export class GeoLocationDto {
  @ApiProperty({ example: -15.41 })
  @IsNumber()
  lat: number;

  @ApiProperty({ example: 28.28 })
  @IsNumber()
  lng: number;
}

export class StartShiftDto {
  @ApiProperty({
    example: 'motorbike',
    enum: ['motorbike', 'bicycle', 'walking', 'truck'],
  })
  @IsString()
  @IsEnum(['motorbike', 'bicycle', 'walking', 'truck'])
  vehicle_type: string;

  @ApiPropertyOptional()
  @IsOptional()
  @ValidateNested()
  @Type(() => GeoLocationDto)
  current_location?: GeoLocationDto;
}

export class UpdateLocationDto {
  @ApiProperty()
  @ValidateNested()
  @Type(() => GeoLocationDto)
  location: GeoLocationDto;
}

export class EndShiftDto {
  @ApiPropertyOptional({ example: 'Shift completed' })
  @IsOptional()
  @IsString()
  reason?: string;
}

export class PauseShiftDto {
  @ApiPropertyOptional({ example: 'Break time' })
  @IsOptional()
  @IsString()
  reason?: string;
}

export class ResumeShiftDto {
  @ApiPropertyOptional()
  @IsOptional()
  @ValidateNested()
  @Type(() => GeoLocationDto)
  current_location?: GeoLocationDto;
}

export class GetShiftsQueryDto {
  @ApiPropertyOptional({
    example: 'active',
    enum: ['active', 'paused', 'ended'],
  })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ example: 'motorbike' })
  @IsOptional()
  @IsString()
  vehicle_type?: string;

  @ApiPropertyOptional({ example: '2025-10-01' })
  @IsOptional()
  @IsDateString()
  start_date?: string;

  @ApiPropertyOptional({ example: '2025-10-31' })
  @IsOptional()
  @IsDateString()
  end_date?: string;

  @ApiPropertyOptional({ example: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ example: 20, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  size?: number;
}

export class GetSummaryQueryDto {
  @ApiPropertyOptional({ example: '2025-10-19' })
  @IsOptional()
  @IsDateString()
  date?: string;
}

export class BulkEndShiftsDto {
  @ApiProperty({ example: ['shf_abc123', 'shf_def456'] })
  @IsArray()
  @IsString({ each: true })
  shift_ids: string[];

  @ApiPropertyOptional({ example: 'End of day bulk close' })
  @IsOptional()
  @IsString()
  reason?: string;
}

export class ShiftResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  rider_user_id: string;

  @ApiProperty()
  status: string;

  @ApiProperty()
  vehicle_type: string;

  @ApiProperty()
  start_time: string;

  @ApiPropertyOptional()
  end_time: string | null;

  @ApiPropertyOptional()
  current_location: GeoLocationDto | null;

  @ApiPropertyOptional()
  last_location_update: string | null;

  @ApiProperty({ example: 'online' })
  tasker_availability: 'online' | 'offline' | 'busy';

  @ApiProperty()
  dispatchable: boolean;

  @ApiPropertyOptional({
    example: 'stale_location',
    description:
      'Why the tasker is not currently dispatchable: offline, busy, missing_location, stale_location, shift_inactive',
  })
  dispatch_block_reason?: string | null;

  @ApiPropertyOptional({ example: 12 })
  location_age_sec: number | null;

  @ApiProperty()
  total_deliveries: number;

  @ApiProperty()
  total_earnings: number;

  @ApiProperty()
  total_distance_km: number;

  @ApiProperty()
  duration_sec: number;

  @ApiProperty()
  active_duration_sec: number;

  @ApiProperty()
  total_pause_duration_sec: number;
}

export class ShiftSummaryDto {
  @ApiProperty()
  total_shifts: number;

  @ApiProperty()
  active_shifts: number;

  @ApiProperty()
  ended_shifts: number;

  @ApiProperty()
  total_deliveries: number;

  @ApiProperty()
  total_earnings: number;

  @ApiProperty()
  total_distance_km: number;

  @ApiProperty()
  average_deliveries_per_shift: number;

  @ApiProperty()
  average_earnings_per_shift: number;

  @ApiProperty()
  total_active_time_hours: number;
}

export class ShiftPerformanceDto {
  @ApiProperty()
  rider_user_id: string;

  @ApiProperty()
  total_shifts: number;

  @ApiProperty()
  total_deliveries: number;

  @ApiProperty()
  total_earnings: number;

  @ApiProperty()
  average_deliveries_per_hour: number;

  @ApiProperty()
  average_earnings_per_hour: number;

  @ApiProperty()
  completion_rate: number;

  @ApiProperty()
  rating: number;
}

export class HeatmapDataPointDto {
  @ApiProperty()
  lat: number;

  @ApiProperty()
  lng: number;

  @ApiProperty()
  intensity: number;
}

export class ShiftStatisticsDto {
  @ApiProperty()
  total_active_riders: number;

  @ApiProperty()
  total_shifts_today: number;

  @ApiProperty()
  average_shift_duration_hours: number;

  @ApiProperty()
  total_deliveries_today: number;

  @ApiProperty()
  total_earnings_today: number;

  @ApiProperty()
  by_vehicle_type: Record<string, number>;
}

export class ScheduledShiftDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  date: string;

  @ApiProperty()
  startTime: string;

  @ApiProperty()
  endTime: string;

  @ApiProperty()
  isRecurring: boolean;

  @ApiPropertyOptional({ type: [Number] })
  recurringDays?: number[] | null;

  @ApiProperty()
  estimatedEarnings: number;

  @ApiPropertyOptional()
  actualEarnings?: number | null;

  @ApiProperty()
  status: string;

  @ApiPropertyOptional()
  notes?: string | null;
}

export class ScheduledShiftsResponseDto {
  @ApiProperty({ type: [ScheduledShiftDto] })
  shifts: ScheduledShiftDto[];
}

export class CreateScheduledShiftDto {
  @ApiProperty()
  @IsDateString()
  date: string;

  @ApiProperty()
  @IsString()
  startTime: string;

  @ApiProperty()
  @IsString()
  endTime: string;

  @ApiPropertyOptional()
  @IsOptional()
  isRecurring?: boolean;

  @ApiPropertyOptional({ type: [Number] })
  @IsOptional()
  @IsArray()
  recurringDays?: number[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  estimatedEarnings?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class TaskerZoneDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  latitude: number;

  @ApiProperty()
  longitude: number;

  @ApiProperty()
  radius: number;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  ordersInZone: number;

  @ApiProperty()
  totalEarnings: number;

  @ApiProperty()
  averageRating: number;
}

export class TaskerZonesResponseDto {
  @ApiProperty({ type: [TaskerZoneDto] })
  zones: TaskerZoneDto[];

  @ApiProperty({ enum: ['online', 'offline', 'busy'] })
  availability: 'online' | 'offline' | 'busy';
}

export class CreateTaskerZoneDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsNumber()
  latitude: number;

  @ApiProperty()
  @IsNumber()
  longitude: number;

  @ApiProperty()
  @IsNumber()
  @Min(1)
  radius: number;
}

export class UpdateTaskerAvailabilityDto {
  @ApiProperty({ enum: ['online', 'offline', 'busy'] })
  @IsString()
  @IsEnum(['online', 'offline', 'busy'])
  status: 'online' | 'offline' | 'busy';
}
