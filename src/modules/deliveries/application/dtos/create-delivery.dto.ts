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
  @ApiProperty({ enum: StopType, example: StopType.PICKUP })
  @IsEnum(StopType)
  type: StopType;

  @ApiProperty({ example: 0 })
  @IsNumber()
  @Min(0)
  sequence: number;

  @ApiPropertyOptional({ example: 'John Doe' })
  @IsOptional()
  @IsString()
  contact_name?: string;

  @ApiPropertyOptional({ example: '+254711223344' })
  @IsOptional()
  @IsString()
  contact_phone?: string;

  @ApiPropertyOptional({ example: 'Ring the bell twice and wait' })
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
  @ApiProperty({ enum: VehicleType, example: VehicleType.MOTORBIKE })
  @IsEnum(VehicleType)
  vehicle_type: VehicleType;

  @ApiPropertyOptional({
    description: 'Special instructions for the courier',
    example: 'Handle with care, fragile contents.',
  })
  @IsOptional()
  @IsString()
  courier_comment?: string;

  @ApiPropertyOptional({ default: false, example: false })
  @IsOptional()
  @IsBoolean()
  is_scheduled?: boolean;

  @ApiPropertyOptional({
    description: 'Scheduled delivery time (required if is_scheduled is true)',
    example: '2025-12-31T10:00:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  scheduled_at?: string;

  @ApiPropertyOptional({
    description: 'Additional delivery information',
    example: 'Package contains documents only.',
  })
  @IsOptional()
  @IsString()
  more_info?: string;

  @ApiProperty({
    type: [CreateStopDto],
    description: 'Delivery stops (1 pickup + N dropoffs)',
    example: [
      {
        type: StopType.PICKUP,
        sequence: 0,
        contact_name: 'Sender Name',
        contact_phone: '+254700112233',
        notes: 'Pick up from reception desk.',
        geo: { lat: -1.286389, lng: 36.817223 },
        address: {
          line1: '123 Main St',
          city: 'Nairobi',
          country: 'Kenya',
        },
      },
      {
        type: StopType.DROPOFF,
        sequence: 1,
        contact_name: 'Receiver Name',
        contact_phone: '+254700445566',
        notes: 'Deliver to 5th floor.',
        geo: { lat: -1.300000, lng: 36.820000 },
        address: {
          line1: '456 Side Ave',
          city: 'Nairobi',
          country: 'Kenya',
        },
      },
    ],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateStopDto)
  stops: CreateStopDto[];

  @ApiPropertyOptional({
    description:
      'Optional marketplace order ID for integration (makes this a marketplace delivery)',
    example: 'marketplace-order-uuid-123',
  })
  @IsOptional()
  @IsString()
  marketplace_order_id?: string;

  @ApiPropertyOptional({
    description: 'Optional store ID if this is a vendor delivery',
    example: 'vendor-store-uuid-456',
  })
  @IsOptional()
  @IsString()
  store_id?: string;
}

export class AttachPricingDto {
  @ApiProperty({
    description: 'Pricing calculator payload',
    example: {
      distance_km: 5.2,
      base_fee: 100,
      total_cost: 250,
      expires_at: '2025-12-31T10:05:00.000Z',
    },
  })
  calc_payload: any;

  @ApiProperty({
    description: 'HMAC signature from pricing calculator',
    example: 'hmac-signature-string-12345',
  })
  @IsString()
  calc_sig: string;
}

export class SetPaymentMethodDto {
  @ApiProperty({ enum: PaymentMethod, example: PaymentMethod.MOBILE_MONEY })
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
  @ApiProperty({ example: 'Changed my mind' })
  @IsString()
  reason: string;
}

export class AcceptDeliveryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  estimated_pickup_time?: string;
}
