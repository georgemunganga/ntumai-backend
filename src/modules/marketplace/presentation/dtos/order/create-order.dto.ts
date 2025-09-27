import { IsString, IsOptional, IsObject, IsEnum, ValidateNested, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum PaymentMethod {
  CREDIT_CARD = 'CREDIT_CARD',
  DEBIT_CARD = 'DEBIT_CARD',
  PAYPAL = 'PAYPAL',
  BANK_TRANSFER = 'BANK_TRANSFER',
  CASH_ON_DELIVERY = 'CASH_ON_DELIVERY',
  DIGITAL_WALLET = 'DIGITAL_WALLET',
}

export class ShippingAddressDto {
  @ApiProperty({ description: 'Full name' })
  @IsString()
  fullName: string;

  @ApiProperty({ description: 'Phone number' })
  @IsString()
  phone: string;

  @ApiProperty({ description: 'Address line 1' })
  @IsString()
  addressLine1: string;

  @ApiPropertyOptional({ description: 'Address line 2' })
  @IsOptional()
  @IsString()
  addressLine2?: string;

  @ApiProperty({ description: 'City' })
  @IsString()
  city: string;

  @ApiProperty({ description: 'State or province' })
  @IsString()
  state: string;

  @ApiProperty({ description: 'Postal code' })
  @IsString()
  postalCode: string;

  @ApiProperty({ description: 'Country' })
  @IsString()
  country: string;

  @ApiPropertyOptional({ description: 'Special delivery instructions' })
  @IsOptional()
  @IsString()
  instructions?: string;
}

export class BillingAddressDto {
  @ApiProperty({ description: 'Full name' })
  @IsString()
  fullName: string;

  @ApiProperty({ description: 'Phone number' })
  @IsString()
  phone: string;

  @ApiProperty({ description: 'Address line 1' })
  @IsString()
  addressLine1: string;

  @ApiPropertyOptional({ description: 'Address line 2' })
  @IsOptional()
  @IsString()
  addressLine2?: string;

  @ApiProperty({ description: 'City' })
  @IsString()
  city: string;

  @ApiProperty({ description: 'State or province' })
  @IsString()
  state: string;

  @ApiProperty({ description: 'Postal code' })
  @IsString()
  postalCode: string;

  @ApiProperty({ description: 'Country' })
  @IsString()
  country: string;
}

export class PaymentDetailsDto {
  @ApiProperty({ description: 'Payment method', enum: PaymentMethod })
  @IsEnum(PaymentMethod)
  method: PaymentMethod;

  @ApiPropertyOptional({ description: 'Payment gateway transaction ID' })
  @IsOptional()
  @IsString()
  transactionId?: string;

  @ApiPropertyOptional({ description: 'Additional payment metadata' })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

export class CreateOrderDto {
  @ApiPropertyOptional({ description: 'Cart ID to create order from (if not provided, uses active cart)' })
  @IsOptional()
  @IsString()
  cartId?: string;

  @ApiProperty({ description: 'Shipping address' })
  @ValidateNested()
  @Type(() => ShippingAddressDto)
  shippingAddress: ShippingAddressDto;

  @ApiProperty({ description: 'Billing address' })
  @ValidateNested()
  @Type(() => BillingAddressDto)
  billingAddress: BillingAddressDto;

  @ApiProperty({ description: 'Payment details' })
  @ValidateNested()
  @Type(() => PaymentDetailsDto)
  paymentDetails: PaymentDetailsDto;

  @ApiPropertyOptional({ description: 'Promotion code to apply' })
  @IsOptional()
  @IsString()
  promotionCode?: string;

  @ApiPropertyOptional({ description: 'Gift card code to apply' })
  @IsOptional()
  @IsString()
  giftCardCode?: string;

  @ApiPropertyOptional({ description: 'Special order notes' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: 'Tip amount', minimum: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  tipAmount?: number;
}