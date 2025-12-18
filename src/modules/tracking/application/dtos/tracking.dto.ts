import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsNumber,
  IsEnum,
  ValidateNested,
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

export class CreateTrackingEventDto {
  @ApiProperty({ example: 'bkg_abc123' })
  @IsString()
  booking_id: string;

  @ApiProperty({ example: 'del_xyz789' })
  @IsString()
  delivery_id: string;

  @ApiProperty({
    example: 'location_update',
    enum: [
      'booking_created',
      'rider_assigned',
      'en_route_to_pickup',
      'arrived_at_pickup',
      'picked_up',
      'en_route_to_dropoff',
      'arrived_at_dropoff',
      'delivered',
      'cancelled',
      'location_update',
    ],
  })
  @IsString()
  @IsEnum([
    'booking_created',
    'rider_assigned',
    'en_route_to_pickup',
    'arrived_at_pickup',
    'picked_up',
    'en_route_to_dropoff',
    'arrived_at_dropoff',
    'delivered',
    'cancelled',
    'location_update',
  ])
  event_type: string;

  @ApiPropertyOptional()
  @IsOptional()
  @ValidateNested()
  @Type(() => GeoLocationDto)
  location?: GeoLocationDto;

  @ApiPropertyOptional({ example: 'usr_r_101' })
  @IsOptional()
  @IsString()
  rider_user_id?: string;
}

export class TrackingEventResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  booking_id: string;

  @ApiProperty()
  delivery_id: string;

  @ApiProperty()
  event_type: string;

  @ApiPropertyOptional()
  location: GeoLocationDto | null;

  @ApiPropertyOptional()
  rider_user_id: string | null;

  @ApiProperty()
  timestamp: string;
}

export class TrackingTimelineDto {
  @ApiProperty()
  booking_id: string;

  @ApiProperty()
  delivery_id: string;

  @ApiProperty({ type: [TrackingEventResponseDto] })
  events: TrackingEventResponseDto[];

  @ApiPropertyOptional()
  current_location: GeoLocationDto | null;

  @ApiProperty()
  current_status: string;
}
