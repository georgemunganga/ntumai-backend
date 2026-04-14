import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Length,
  Matches,
  Max,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum CustomerPaymentMethodTypeDto {
  CARD = 'card',
  MOBILE_MONEY = 'mobile_money',
}

export enum MobileMoneyProviderDto {
  MTN = 'mtn',
  AIRTEL = 'airtel',
  ZAMTEL = 'zamtel',
}

export class UpsertPaymentMethodDto {
  @ApiProperty({ enum: CustomerPaymentMethodTypeDto })
  @IsEnum(CustomerPaymentMethodTypeDto)
  type!: CustomerPaymentMethodTypeDto;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(1, 80)
  label?: string;

  @ApiPropertyOptional({ description: 'Used only for card methods. Full number is not stored.' })
  @IsOptional()
  @IsString()
  @Matches(/^[\d\s]{12,23}$/)
  cardNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(2, 40)
  cardholderName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(12)
  expiryMonth?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(2024)
  @Max(2100)
  expiryYear?: number;

  @ApiPropertyOptional({ enum: MobileMoneyProviderDto })
  @IsOptional()
  @IsEnum(MobileMoneyProviderDto)
  provider?: MobileMoneyProviderDto;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(7, 20)
  phoneNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(2, 80)
  accountName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}

export class UpdatePaymentMethodDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(1, 80)
  label?: string;

  @ApiPropertyOptional({ description: 'Optional replacement card number. Full number is not stored.' })
  @IsOptional()
  @IsString()
  @Matches(/^[\d\s]{12,23}$/)
  cardNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(2, 40)
  cardholderName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(12)
  expiryMonth?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(2024)
  @Max(2100)
  expiryYear?: number;

  @ApiPropertyOptional({ enum: MobileMoneyProviderDto })
  @IsOptional()
  @IsEnum(MobileMoneyProviderDto)
  provider?: MobileMoneyProviderDto;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(7, 20)
  phoneNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(2, 80)
  accountName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}

export class PaymentMethodResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty({ enum: CustomerPaymentMethodTypeDto })
  type!: CustomerPaymentMethodTypeDto;

  @ApiPropertyOptional({ enum: MobileMoneyProviderDto })
  provider?: MobileMoneyProviderDto;

  @ApiProperty()
  label!: string;

  @ApiPropertyOptional()
  cardBrand?: string;

  @ApiPropertyOptional()
  last4?: string;

  @ApiPropertyOptional()
  expiryMonth?: number;

  @ApiPropertyOptional()
  expiryYear?: number;

  @ApiPropertyOptional()
  cardholderName?: string;

  @ApiPropertyOptional()
  phoneNumber?: string;

  @ApiPropertyOptional()
  accountName?: string;

  @ApiProperty()
  isDefault!: boolean;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;
}

export class PaymentMethodListResponseDto {
  @ApiProperty({ type: [PaymentMethodResponseDto] })
  methods!: PaymentMethodResponseDto[];
}

export class PaymentMethodMutationResponseDto {
  @ApiPropertyOptional({ type: PaymentMethodResponseDto })
  method?: PaymentMethodResponseDto;

  @ApiProperty({ type: [PaymentMethodResponseDto] })
  methods!: PaymentMethodResponseDto[];
}
