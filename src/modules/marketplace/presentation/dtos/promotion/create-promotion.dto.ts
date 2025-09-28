import { IsString, IsOptional, IsNumber, IsEnum, IsBoolean, IsDateString, IsArray, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum PromotionType {
  PERCENTAGE = 'PERCENTAGE',
  FIXED_AMOUNT = 'FIXED_AMOUNT',
  BUY_X_GET_Y = 'BUY_X_GET_Y',
  FREE_SHIPPING = 'FREE_SHIPPING',
}

export enum PromotionStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SCHEDULED = 'SCHEDULED',
  EXPIRED = 'EXPIRED',
}

export enum PromotionTarget {
  ALL_PRODUCTS = 'ALL_PRODUCTS',
  SPECIFIC_PRODUCTS = 'SPECIFIC_PRODUCTS',
  CATEGORIES = 'CATEGORIES',
  BRANDS = 'BRANDS',
  MINIMUM_ORDER = 'MINIMUM_ORDER',
}

export class CreatePromotionDto {
  @ApiProperty({ description: 'Promotion name', example: 'Summer Sale 2024' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Promotion description' })
  @IsString()
  description: string;

  @ApiProperty({ description: 'Promotion code (coupon code)', example: 'SUMMER2024' })
  @IsString()
  code: string;

  @ApiProperty({ description: 'Promotion type', enum: PromotionType })
  @IsEnum(PromotionType)
  type: PromotionType;

  @ApiProperty({ description: 'Discount value (percentage or fixed amount)', minimum: 0 })
  @IsNumber()
  @Min(0)
  discountValue: number;

  @ApiPropertyOptional({ description: 'Maximum discount amount (for percentage discounts)', minimum: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  maxDiscountAmount?: number;

  @ApiPropertyOptional({ description: 'Minimum order amount to apply promotion', minimum: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  minOrderAmount?: number;

  @ApiProperty({ description: 'Promotion target', enum: PromotionTarget })
  @IsEnum(PromotionTarget)
  target: PromotionTarget;

  @ApiPropertyOptional({ description: 'Target product IDs (for SPECIFIC_PRODUCTS target)', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  targetProductIds?: string[];

  @ApiPropertyOptional({ description: 'Target category IDs (for CATEGORIES target)', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  targetCategoryIds?: string[];

  @ApiPropertyOptional({ description: 'Target brand IDs (for BRANDS target)', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  targetBrandIds?: string[];

  @ApiProperty({ description: 'Promotion start date (ISO string)' })
  @IsDateString()
  startDate: string;

  @ApiProperty({ description: 'Promotion end date (ISO string)' })
  @IsDateString()
  endDate: string;

  @ApiPropertyOptional({ description: 'Maximum usage count (0 = unlimited)', minimum: 0, default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  maxUsage?: number;

  @ApiPropertyOptional({ description: 'Maximum usage per user (0 = unlimited)', minimum: 0, default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  maxUsagePerUser?: number;

  @ApiPropertyOptional({ description: 'Is promotion stackable with other promotions', default: false })
  @IsOptional()
  @IsBoolean()
  stackable?: boolean;

  @ApiPropertyOptional({ description: 'Promotion status', enum: PromotionStatus, default: PromotionStatus.ACTIVE })
  @IsOptional()
  @IsEnum(PromotionStatus)
  status?: PromotionStatus;

  @ApiPropertyOptional({ description: 'Priority (higher number = higher priority)', minimum: 0, default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  priority?: number;
}