import { IsString, IsOptional, IsNumber, IsEnum, IsBoolean, IsDateString, IsArray, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PromotionType, PromotionStatus, PromotionTarget } from './create-promotion.dto';

export class UpdatePromotionDto {
  @ApiPropertyOptional({ description: 'Promotion name' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Promotion description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Promotion code (coupon code)' })
  @IsOptional()
  @IsString()
  code?: string;

  @ApiPropertyOptional({ description: 'Promotion type', enum: PromotionType })
  @IsOptional()
  @IsEnum(PromotionType)
  type?: PromotionType;

  @ApiPropertyOptional({ description: 'Discount value (percentage or fixed amount)', minimum: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  discountValue?: number;

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

  @ApiPropertyOptional({ description: 'Promotion target', enum: PromotionTarget })
  @IsOptional()
  @IsEnum(PromotionTarget)
  target?: PromotionTarget;

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

  @ApiPropertyOptional({ description: 'Promotion start date (ISO string)' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'Promotion end date (ISO string)' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Maximum usage count (0 = unlimited)', minimum: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  maxUsage?: number;

  @ApiPropertyOptional({ description: 'Maximum usage per user (0 = unlimited)', minimum: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  maxUsagePerUser?: number;

  @ApiPropertyOptional({ description: 'Is promotion stackable with other promotions' })
  @IsOptional()
  @IsBoolean()
  stackable?: boolean;

  @ApiPropertyOptional({ description: 'Promotion status', enum: PromotionStatus })
  @IsOptional()
  @IsEnum(PromotionStatus)
  status?: PromotionStatus;

  @ApiPropertyOptional({ description: 'Priority (higher number = higher priority)', minimum: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  priority?: number;
}