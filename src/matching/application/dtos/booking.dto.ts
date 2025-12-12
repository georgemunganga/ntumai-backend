import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsNumber,
  IsEnum,
  IsArray,
  ValidateNested,
  IsObject,
} from 'class-validator';
import { Type } from 'class-transformer';

export class GeoCoordinatesDto {
  @ApiProperty({ example: -15.41 })
  @IsNumber()
  lat: number;

  @ApiProperty({ example: 28.28 })
  @IsNumber()
  lng: number;
}

export class BookingStopDto {
  @ApiProperty({ example: 0 })
  @IsNumber()
  sequence: number;

  @ApiProperty()
  @ValidateNested()
  @Type(() => GeoCoordinatesDto)
  geo: GeoCoordinatesDto;

  @ApiPropertyOptional({ example: '123 Main St, Lusaka' })
  @IsOptional()
  @IsString()
  address?: string;
}

export class CreateBookingDto {
  @ApiProperty({ example: 'del_abc123' })
  @IsString()
  delivery_id: string;

  @ApiProperty({
    example: 'motorbike',
    enum: ['motorbike', 'bicycle', 'walking', 'truck'],
  })
  @IsString()
  @IsEnum(['motorbike', 'bicycle', 'walking', 'truck'])
  vehicle_type: string;

  @ApiProperty()
  @ValidateNested()
  @Type(() => BookingStopDto)
  pickup: BookingStopDto;

  @ApiProperty({ type: [BookingStopDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BookingStopDto)
  dropoffs: BookingStopDto[];

  @ApiProperty({ example: 'usr_123' })
  @IsString()
  customer_user_id: string;

  @ApiProperty({ example: 'John Doe' })
  @IsString()
  customer_name: string;

  @ApiProperty({ example: '+260972827372' })
  @IsString()
  customer_phone: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

export class EditBookingDto {
  @ApiPropertyOptional()
  @IsOptional()
  @ValidateNested()
  @Type(() => BookingStopDto)
  pickup?: BookingStopDto;

  @ApiPropertyOptional({ type: [BookingStopDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BookingStopDto)
  dropoffs?: BookingStopDto[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

export class CancelBookingDto {
  @ApiProperty({ example: 'user_request' })
  @IsString()
  reason: string;
}

export class RespondToOfferDto {
  @ApiProperty({ example: 'usr_r_101' })
  @IsString()
  rider_user_id: string;

  @ApiProperty({ example: 'accept', enum: ['accept', 'decline'] })
  @IsString()
  @IsEnum(['accept', 'decline'])
  decision: 'accept' | 'decline';
}

export class UpdateProgressDto {
  @ApiProperty({
    example: 'arrived_pickup',
    enum: [
      'en_route',
      'arrived_pickup',
      'picked_up',
      'en_route_dropoff',
      'delivered',
    ],
  })
  @IsString()
  @IsEnum([
    'en_route',
    'arrived_pickup',
    'picked_up',
    'en_route_dropoff',
    'delivered',
  ])
  stage: string;
}

export class RiderInfoDto {
  @ApiProperty()
  user_id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  vehicle: string;

  @ApiProperty()
  phone: string;

  @ApiPropertyOptional()
  rating?: number;

  @ApiPropertyOptional()
  eta_min?: number;
}

export class BookingResponseDto {
  @ApiProperty()
  booking_id: string;

  @ApiProperty()
  delivery_id: string;

  @ApiProperty()
  status: string;

  @ApiProperty()
  vehicle_type: string;

  @ApiProperty()
  pickup: BookingStopDto;

  @ApiProperty({ type: [BookingStopDto] })
  dropoffs: BookingStopDto[];

  @ApiPropertyOptional()
  rider: RiderInfoDto | null;

  @ApiProperty()
  wait_times: {
    pickup_sec: number;
    dropoff_sec: number;
  };

  @ApiProperty()
  can_user_edit: boolean;

  @ApiProperty()
  created_at: string;

  @ApiProperty()
  updated_at: string;
}

export class CreateBookingResponseDto {
  @ApiProperty()
  booking_id: string;

  @ApiProperty()
  status: string;

  @ApiProperty()
  estimated_search_sec: number;

  @ApiPropertyOptional()
  offer_expires_at?: string;
}

export class BookingOfferedEventDto {
  @ApiProperty()
  booking_id: string;

  @ApiProperty({ type: [RiderInfoDto] })
  candidates: RiderInfoDto[];
}

export class BookingAcceptedEventDto {
  @ApiProperty()
  booking_id: string;

  @ApiProperty()
  rider: RiderInfoDto;
}

export class BookingProgressEventDto {
  @ApiProperty()
  booking_id: string;

  @ApiProperty()
  status: string;

  @ApiProperty()
  timestamp: string;
}

export class BookingCompletedEventDto {
  @ApiProperty()
  booking_id: string;

  @ApiProperty()
  delivery_id: string;

  @ApiProperty()
  wait_times: {
    pickup_sec: number;
    dropoff_sec: number;
  };
}
