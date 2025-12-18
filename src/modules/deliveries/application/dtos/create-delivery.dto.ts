import {
  IsString,
  IsEnum,
  IsBoolean,
  IsOptional,
  IsArray,
  ValidateNested,
  IsDateString,
  IsNumber,
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

export enum PaymentMethod {
  CASH_ON_DELIVERY = 'cash_on_delivery',
  MOBILE_MONEY = 'mobile_money',
  CARD = 'card',
  WALLET = 'wallet',
  BANK_TRANSFER = 'bank_transfer',
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

export class CreateStopDto {
  @ApiProperty({ enum: StopType })
  @IsEnum(StopType)
  type: StopType;

  @ApiProperty({ example: 0 })
  @IsNumber()
  @Min(0)
  sequence: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  contact_name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  contact_phone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

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

export class CreateDeliveryDto {
  @ApiProperty({ enum: VehicleType })
  @IsEnum(VehicleType)
  vehicle_type: VehicleType;

  @ApiPropertyOptional({ description: 'Special instructions for the courier' })
  @IsOptional()
  @IsString()
  courier_comment?: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  is_scheduled?: boolean;

  @ApiPropertyOptional({
    description: 'Scheduled delivery time (required if is_scheduled is true)',
  })
  @IsOptional()
  @IsDateString()
  scheduled_at?: string;

  @ApiPropertyOptional({ description: 'Additional delivery information' })
  @IsOptional()
  @IsString()
  more_info?: string;

  @ApiProperty({
    type: [CreateStopDto],
    description: 'Delivery stops (1 pickup + N dropoffs)',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateStopDto)
  stops: CreateStopDto[];

  @ApiPropertyOptional({
    description:
      'Optional marketplace order ID for integration (makes this a marketplace delivery)',
  })
  @IsOptional()
  @IsString()
  marketplace_order_id?: string;

  @ApiPropertyOptional({
    description: 'Optional store ID if this is a vendor delivery',
  })
  @IsOptional()
  @IsString()
  store_id?: string;
}

export class AttachPricingDto {
  @ApiProperty({ description: 'Pricing calculator payload' })
  calc_payload: any;

  @ApiProperty({ description: 'HMAC signature from pricing calculator' })
  @IsString()
  calc_sig: string;
}

export class SetPaymentMethodDto {
  @ApiProperty({ enum: PaymentMethod })
  @IsEnum(PaymentMethod)
  method: PaymentMethod;
}

export class UpdateDeliveryDto {
  @ApiPropertyOptional({ enum: VehicleType })
  @IsOptional()
  @IsEnum(VehicleType)
  vehicle_type?: VehicleType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  courier_comment?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  is_scheduled?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  scheduled_at?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  more_info?: string;
}

export class ReorderStopsDto {
  @ApiProperty({
    type: [String],
    description: 'Array of stop IDs in desired order',
  })
  @IsArray()
  @IsString({ each: true })
  order: string[];
}

export class CancelDeliveryDto {
  @ApiProperty()
  @IsString()
  reason: string;
}

export class AcceptDeliveryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  estimated_pickup_time?: string;
}
