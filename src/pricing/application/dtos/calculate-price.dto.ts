import {
  IsString,
  IsEnum,
  IsBoolean,
  IsOptional,
  IsNumber,
  IsArray,
  ValidateNested,
  IsDateString,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum StopType {
  PICKUP = 'pickup',
  DROPOFF = 'dropoff',
}

export enum VehicleType {
  MOTORBIKE = 'motorbike',
  BICYCLE = 'bicycle',
  WALKING = 'walking',
  TRUCK = 'truck',
}

export enum ServiceLevel {
  STANDARD = 'standard',
  EXPRESS = 'express',
  PREMIUM = 'premium',
}

export class GeoDto {
  @ApiProperty({ example: -15.41 })
  @IsNumber()
  @Min(-90)
  @Max(90)
  lat: number;

  @ApiProperty({ example: 28.28 })
  @IsNumber()
  @Min(-180)
  @Max(180)
  lng: number;
}

export class AddressDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  line1?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  line2?: string;

  @ApiProperty()
  @IsString()
  city: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  province?: string;

  @ApiProperty()
  @IsString()
  country: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  postal_code?: string;
}

export class StopDto {
  @ApiProperty({ enum: StopType })
  @IsEnum(StopType)
  type: StopType;

  @ApiProperty({ example: 0 })
  @IsNumber()
  @Min(0)
  sequence: number;

  @ApiPropertyOptional({ type: GeoDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => GeoDto)
  geo?: GeoDto;

  @ApiPropertyOptional({ type: AddressDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => AddressDto)
  address?: AddressDto;
}

export class LegDto {
  @ApiProperty({ example: 0 })
  @IsNumber()
  @Min(0)
  from: number;

  @ApiProperty({ example: 1 })
  @IsNumber()
  @Min(0)
  to: number;

  @ApiProperty({ example: 7.4 })
  @IsNumber()
  @Min(0)
  distance_km: number;

  @ApiProperty({ example: 20.0 })
  @IsNumber()
  @Min(0)
  duration_min: number;
}

export class CalculatePriceDto {
  @ApiProperty({ example: 'ZMW' })
  @IsString()
  currency: string;

  @ApiProperty({ example: 'ZM-LSK' })
  @IsString()
  region: string;

  @ApiProperty({ enum: VehicleType })
  @IsEnum(VehicleType)
  vehicle_type: VehicleType;

  @ApiProperty({ enum: ServiceLevel, default: ServiceLevel.STANDARD })
  @IsEnum(ServiceLevel)
  service_level: ServiceLevel;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  is_scheduled?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  scheduled_at?: string;

  @ApiProperty({ type: [StopDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => StopDto)
  stops: StopDto[];

  @ApiPropertyOptional({ type: [LegDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LegDto)
  legs?: LegDto[];

  @ApiPropertyOptional({ example: 2 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  weight_kg?: number;

  @ApiPropertyOptional({ example: 8 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  volume_l?: number;

  @ApiPropertyOptional({ example: 'WELCOME10' })
  @IsOptional()
  @IsString()
  promo_code?: string;

  @ApiPropertyOptional({ example: 'GC-ABCD' })
  @IsOptional()
  @IsString()
  gift_card_hint?: string;
}

export class PriceBreakdownDto {
  @ApiProperty()
  base: number;

  @ApiProperty()
  distance: number;

  @ApiProperty()
  duration: number;

  @ApiProperty()
  multistop: number;

  @ApiProperty()
  vehicle_surcharge: number;

  @ApiProperty()
  service_level: number;

  @ApiProperty()
  small_order_fee: number;

  @ApiProperty()
  platform_fee: number;

  @ApiProperty()
  surge: number;

  @ApiProperty()
  promo_discount: number;

  @ApiProperty()
  gift_card_preview: number;

  @ApiProperty()
  tax: number;
}

export class VehicleLimitsDto {
  @ApiProperty()
  max_weight_kg: number;

  @ApiProperty()
  max_volume_l: number;
}

export class PriceConstraintsDto {
  @ApiProperty()
  max_stops: number;

  @ApiProperty()
  max_schedule_ahead_hours: number;

  @ApiProperty({ type: VehicleLimitsDto })
  vehicle_limits: VehicleLimitsDto;
}

export class SignatureFieldsDto {
  @ApiProperty()
  alg: string;

  @ApiProperty()
  key_id: string;

  @ApiProperty()
  issued_at: string;

  @ApiProperty()
  ttl_seconds: number;

  @ApiProperty()
  canon_hash: string;
}

export class CalculatePriceResponseDto {
  @ApiProperty()
  ok: boolean;

  @ApiProperty()
  currency: string;

  @ApiProperty()
  region: string;

  @ApiProperty()
  vehicle_type: string;

  @ApiProperty()
  service_level: string;

  @ApiProperty()
  distance_km: number;

  @ApiProperty()
  duration_min: number;

  @ApiProperty({ type: [String] })
  rule_ids: string[];

  @ApiProperty({ type: PriceBreakdownDto })
  breakdown: PriceBreakdownDto;

  @ApiProperty()
  subtotal: number;

  @ApiProperty()
  total: number;

  @ApiProperty({ type: PriceConstraintsDto })
  constraints: PriceConstraintsDto;

  @ApiProperty({ type: [String] })
  advisories: string[];

  @ApiProperty()
  expires_at: string;

  @ApiProperty()
  sig: string;

  @ApiProperty({ type: SignatureFieldsDto })
  sig_fields: SignatureFieldsDto;
}
