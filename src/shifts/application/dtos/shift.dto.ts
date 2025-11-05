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
