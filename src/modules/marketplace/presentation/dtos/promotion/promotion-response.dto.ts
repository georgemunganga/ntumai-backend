import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PromotionType, PromotionStatus, PromotionTarget } from './create-promotion.dto';

export class PromotionResponseDto {
  @ApiProperty({ description: 'Promotion ID' })
  id: string;

  @ApiProperty({ description: 'Promotion name' })
  name: string;

  @ApiProperty({ description: 'Promotion description' })
  description: string;

  @ApiProperty({ description: 'Promotion code (coupon code)' })
  code: string;

  @ApiProperty({ description: 'Promotion type', enum: PromotionType })
  type: PromotionType;

  @ApiProperty({ description: 'Discount value (percentage or fixed amount)' })
  discountValue: number;

  @ApiPropertyOptional({ description: 'Maximum discount amount (for percentage discounts)' })
  maxDiscountAmount?: number;

  @ApiPropertyOptional({ description: 'Minimum order amount to apply promotion' })
  minOrderAmount?: number;

  @ApiProperty({ description: 'Promotion target', enum: PromotionTarget })
  target: PromotionTarget;

  @ApiPropertyOptional({ description: 'Target product IDs', type: [String] })
  targetProductIds?: string[];

  @ApiPropertyOptional({ description: 'Target category IDs', type: [String] })
  targetCategoryIds?: string[];

  @ApiPropertyOptional({ description: 'Target brand IDs', type: [String] })
  targetBrandIds?: string[];

  @ApiProperty({ description: 'Promotion start date' })
  startDate: Date;

  @ApiProperty({ description: 'Promotion end date' })
  endDate: Date;

  @ApiProperty({ description: 'Maximum usage count (0 = unlimited)' })
  maxUsage: number;

  @ApiProperty({ description: 'Maximum usage per user (0 = unlimited)' })
  maxUsagePerUser: number;

  @ApiProperty({ description: 'Current usage count' })
  currentUsage: number;

  @ApiProperty({ description: 'Is promotion stackable with other promotions' })
  stackable: boolean;

  @ApiProperty({ description: 'Promotion status', enum: PromotionStatus })
  status: PromotionStatus;

  @ApiProperty({ description: 'Priority (higher number = higher priority)' })
  priority: number;

  @ApiProperty({ description: 'Is promotion currently active' })
  isActive: boolean;

  @ApiProperty({ description: 'Is promotion expired' })
  isExpired: boolean;

  @ApiProperty({ description: 'Days until expiration (negative if expired)' })
  daysUntilExpiration: number;

  @ApiProperty({ description: 'Creation date' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update date' })
  updatedAt: Date;
}

export class PromotionListResponseDto {
  @ApiProperty({ description: 'Promotion ID' })
  id: string;

  @ApiProperty({ description: 'Promotion name' })
  name: string;

  @ApiProperty({ description: 'Promotion code' })
  code: string;

  @ApiProperty({ description: 'Promotion type', enum: PromotionType })
  type: PromotionType;

  @ApiProperty({ description: 'Discount value' })
  discountValue: number;

  @ApiProperty({ description: 'Promotion status', enum: PromotionStatus })
  status: PromotionStatus;

  @ApiProperty({ description: 'Start date' })
  startDate: Date;

  @ApiProperty({ description: 'End date' })
  endDate: Date;

  @ApiProperty({ description: 'Current usage count' })
  currentUsage: number;

  @ApiProperty({ description: 'Maximum usage count' })
  maxUsage: number;

  @ApiProperty({ description: 'Is promotion currently active' })
  isActive: boolean;

  @ApiProperty({ description: 'Creation date' })
  createdAt: Date;
}

export class PromotionValidationResponseDto {
  @ApiProperty({ description: 'Is promotion valid' })
  isValid: boolean;

  @ApiProperty({ description: 'Validation message' })
  message: string;

  @ApiPropertyOptional({ description: 'Promotion details if valid' })
  promotion?: PromotionResponseDto;

  @ApiPropertyOptional({ description: 'Calculated discount amount' })
  discountAmount?: number;

  @ApiPropertyOptional({ description: 'Final amount after discount' })
  finalAmount?: number;

  @ApiProperty({ description: 'Validation errors', type: [String] })
  errors: string[];
}

export class PromotionStatsResponseDto {
  @ApiProperty({ description: 'Total promotions count' })
  totalPromotions: number;

  @ApiProperty({ description: 'Active promotions count' })
  activePromotions: number;

  @ApiProperty({ description: 'Scheduled promotions count' })
  scheduledPromotions: number;

  @ApiProperty({ description: 'Expired promotions count' })
  expiredPromotions: number;

  @ApiProperty({ description: 'Total discount amount given' })
  totalDiscountGiven: number;

  @ApiProperty({ description: 'Total promotion usage count' })
  totalUsageCount: number;

  @ApiProperty({ description: 'Most used promotion code' })
  mostUsedPromotion: string;

  @ApiProperty({ description: 'Average discount per order' })
  averageDiscountPerOrder: number;
}