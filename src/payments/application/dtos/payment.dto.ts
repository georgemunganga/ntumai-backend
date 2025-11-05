import {
  IsString,
  IsNumber,
  IsOptional,
  IsObject,
  IsEnum,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum PaymentMethodType {
  CASH_ON_DELIVERY = 'cash_on_delivery',
  MOBILE_MONEY = 'mobile_money',
  CARD = 'card',
  WALLET = 'wallet',
  BANK_TRANSFER = 'bank_transfer',
}

export class CreatePaymentIntentDto {
  @ApiProperty({
    description: 'Amount in minor units (e.g., ngwee)',
    example: 6692,
  })
  @IsNumber()
  @Min(1)
  amount: number;

  @ApiProperty({ example: 'ZMW' })
  @IsString()
  currency: string;

  @ApiPropertyOptional({
    description: 'Reference to delivery or order',
    example: { delivery_id: 'del_8f3a2' },
  })
  @IsOptional()
  @IsObject()
  reference?: {
    delivery_id?: string;
    marketplace_order_id?: string;
    custom_reference?: string;
  };

  @ApiPropertyOptional({
    description: 'Pricing calculator signature',
  })
  @IsOptional()
  @IsObject()
  calc_sig?: {
    sig: string;
    expires_at: string;
  };

  @ApiPropertyOptional({
    description: 'Payer information',
  })
  @IsOptional()
  @IsObject()
  payer?: {
    user_id?: string;
    email?: string;
    phone?: string;
  };

  @ApiPropertyOptional({
    description: 'Additional metadata',
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

export class ConfirmPaymentIntentDto {
  @ApiProperty({
    description: 'Payment method key',
    example: 'mobile_money:airtel_zm',
  })
  @IsString()
  method: string;

  @ApiProperty({
    description: 'Method-specific parameters',
    example: { msisdn: '+260972827372' },
  })
  @IsObject()
  method_params: Record<string, any>;

  @ApiPropertyOptional({
    description: 'Return URL for redirect methods',
  })
  @IsOptional()
  @IsString()
  return_url?: string;
}

export class CollectCashDto {
  @ApiProperty({ description: 'Rider/collector user ID' })
  @IsString()
  collector_user_id: string;

  @ApiProperty({ description: 'Amount collected in minor units' })
  @IsNumber()
  @Min(1)
  amount: number;

  @ApiPropertyOptional({ description: 'Evidence photo attachment ID' })
  @IsOptional()
  @IsString()
  evidence_photo_id?: string;
}

export class CreateRefundDto {
  @ApiProperty({ description: 'Refund amount in minor units' })
  @IsNumber()
  @Min(1)
  amount: number;

  @ApiProperty({ description: 'Refund reason' })
  @IsString()
  reason: string;
}

export class RegisterPaymentMethodDto {
  @ApiProperty({ description: 'Method key', example: 'mobile_money:airtel_zm' })
  @IsString()
  method: string;

  @ApiProperty({ enum: PaymentMethodType })
  @IsEnum(PaymentMethodType)
  type: PaymentMethodType;

  @ApiProperty({ example: 'Airtel Money' })
  @IsString()
  display_name: string;

  @ApiProperty({ type: [String], example: ['ZM-LSK'] })
  regions: string[];

  @ApiProperty({ type: [String], example: ['ZMW'] })
  currency: string[];

  @ApiProperty({
    description: 'Method capabilities',
  })
  @IsObject()
  capabilities: {
    capture: boolean;
    refund: boolean;
    partial_refund: boolean;
    requires_redirect: boolean;
    stk_push: boolean;
    qr: boolean;
    three_ds: boolean;
  };

  @ApiPropertyOptional({
    description: 'Adapter configuration (encrypted)',
  })
  @IsOptional()
  @IsObject()
  adapter_config?: Record<string, any>;

  @ApiPropertyOptional({
    description: 'Fields to collect from user',
  })
  @IsOptional()
  fields?: Array<{
    name: string;
    label: string;
    type: string;
    required: boolean;
  }>;
}
