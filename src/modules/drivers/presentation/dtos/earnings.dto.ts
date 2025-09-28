import {
  IsString,
  IsOptional,
  IsDateString,
  IsEnum,
  IsBoolean,
  IsNumber,
  ValidateNested,
  IsObject,
  IsArray,
  Min,
  Max,
  Length,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// Enums
export enum EarningsType {
  ORDER_DELIVERY = 'ORDER_DELIVERY',
  BASE_FEE = 'BASE_FEE',
  DISTANCE_FEE = 'DISTANCE_FEE',
  TIME_FEE = 'TIME_FEE',
  SURGE_BONUS = 'SURGE_BONUS',
  PEAK_HOUR_BONUS = 'PEAK_HOUR_BONUS',
  COMPLETION_BONUS = 'COMPLETION_BONUS',
  REFERRAL_BONUS = 'REFERRAL_BONUS',
  INCENTIVE_BONUS = 'INCENTIVE_BONUS',
  TIP = 'TIP',
  ADJUSTMENT = 'ADJUSTMENT',
  PENALTY = 'PENALTY',
  FUEL_ALLOWANCE = 'FUEL_ALLOWANCE',
  OTHER = 'OTHER',
}

export enum PayoutStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
  ON_HOLD = 'ON_HOLD',
}

export enum PayoutMethod {
  BANK_TRANSFER = 'BANK_TRANSFER',
  DIGITAL_WALLET = 'DIGITAL_WALLET',
  MOBILE_MONEY = 'MOBILE_MONEY',
  CASH = 'CASH',
  CHECK = 'CHECK',
  CRYPTO = 'CRYPTO',
}

export enum EarningsStatus {
  EARNED = 'EARNED',
  PENDING = 'PENDING',
  PAID = 'PAID',
  DISPUTED = 'DISPUTED',
  ADJUSTED = 'ADJUSTED',
  CANCELLED = 'CANCELLED',
}

// Earnings Breakdown DTO
export class EarningsBreakdownDto {
  @ApiProperty({ description: 'Base delivery fee' })
  @IsNumber()
  @Min(0)
  baseFee: number;

  @ApiProperty({ description: 'Distance-based fee' })
  @IsNumber()
  @Min(0)
  distanceFee: number;

  @ApiProperty({ description: 'Time-based fee' })
  @IsNumber()
  @Min(0)
  timeFee: number;

  @ApiProperty({ description: 'Surge pricing bonus' })
  @IsNumber()
  @Min(0)
  surgeBonus: number;

  @ApiProperty({ description: 'Peak hour bonus' })
  @IsNumber()
  @Min(0)
  peakHourBonus: number;

  @ApiProperty({ description: 'Completion bonus' })
  @IsNumber()
  @Min(0)
  completionBonus: number;

  @ApiProperty({ description: 'Customer tip amount' })
  @IsNumber()
  @Min(0)
  tip: number;

  @ApiProperty({ description: 'Other bonuses' })
  @IsNumber()
  @Min(0)
  otherBonuses: number;

  @ApiProperty({ description: 'Penalties or deductions' })
  @IsNumber()
  @Min(0)
  penalties: number;

  @ApiProperty({ description: 'Platform commission' })
  @IsNumber()
  @Min(0)
  platformCommission: number;

  @ApiProperty({ description: 'Net earnings after deductions' })
  @IsNumber()
  @Min(0)
  netEarnings: number;
}

// Payout Details DTO
export class PayoutDetailsDto {
  @ApiProperty({ description: 'Payout method', enum: PayoutMethod })
  @IsEnum(PayoutMethod)
  method: PayoutMethod;

  @ApiProperty({ description: 'Account number or identifier' })
  @IsString()
  @Length(1, 50)
  accountNumber: string;

  @ApiProperty({ description: 'Account holder name' })
  @IsString()
  @Length(1, 100)
  accountHolderName: string;

  @ApiPropertyOptional({ description: 'Bank name' })
  @IsOptional()
  @IsString()
  @Length(1, 100)
  bankName?: string;

  @ApiPropertyOptional({ description: 'Bank code or routing number' })
  @IsOptional()
  @IsString()
  @Length(1, 20)
  bankCode?: string;

  @ApiPropertyOptional({ description: 'Branch name' })
  @IsOptional()
  @IsString()
  @Length(1, 100)
  branchName?: string;

  @ApiPropertyOptional({ description: 'SWIFT code for international transfers' })
  @IsOptional()
  @IsString()
  @Length(8, 11)
  swiftCode?: string;

  @ApiPropertyOptional({ description: 'Additional payout instructions' })
  @IsOptional()
  @IsString()
  @Length(1, 500)
  instructions?: string;
}

// Create Earnings DTO
export class CreateEarningsDto {
  @ApiProperty({ description: 'Rider ID' })
  @IsString()
  riderId: string;

  @ApiProperty({ description: 'Shift ID' })
  @IsString()
  shiftId: string;

  @ApiPropertyOptional({ description: 'Order ID if earnings from order' })
  @IsOptional()
  @IsString()
  orderId?: string;

  @ApiProperty({ description: 'Earnings type', enum: EarningsType })
  @IsEnum(EarningsType)
  earningsType: EarningsType;

  @ApiProperty({ description: 'Gross earnings amount' })
  @IsNumber()
  @Min(0)
  grossAmount: number;

  @ApiProperty({ description: 'Net earnings amount after deductions' })
  @IsNumber()
  @Min(0)
  netAmount: number;

  @ApiProperty({ description: 'Currency code' })
  @IsString()
  @Length(3, 3)
  currency: string;

  @ApiProperty({ description: 'Earnings breakdown', type: EarningsBreakdownDto })
  @ValidateNested()
  @Type(() => EarningsBreakdownDto)
  breakdown: EarningsBreakdownDto;

  @ApiPropertyOptional({ description: 'Earnings description' })
  @IsOptional()
  @IsString()
  @Length(1, 500)
  description?: string;

  @ApiPropertyOptional({ description: 'Additional metadata' })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

// Update Earnings DTO
export class UpdateEarningsDto {
  @ApiPropertyOptional({ description: 'Earnings status', enum: EarningsStatus })
  @IsOptional()
  @IsEnum(EarningsStatus)
  status?: EarningsStatus;

  @ApiPropertyOptional({ description: 'Gross earnings amount' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  grossAmount?: number;

  @ApiPropertyOptional({ description: 'Net earnings amount after deductions' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  netAmount?: number;

  @ApiPropertyOptional({ description: 'Earnings breakdown', type: EarningsBreakdownDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => EarningsBreakdownDto)
  breakdown?: EarningsBreakdownDto;

  @ApiPropertyOptional({ description: 'Earnings description' })
  @IsOptional()
  @IsString()
  @Length(1, 500)
  description?: string;

  @ApiPropertyOptional({ description: 'Additional metadata' })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

// Earnings Response DTO
export class EarningsResponseDto {
  @ApiProperty({ description: 'Earnings ID' })
  id: string;

  @ApiProperty({ description: 'Rider ID' })
  riderId: string;

  @ApiProperty({ description: 'Shift ID' })
  shiftId: string;

  @ApiPropertyOptional({ description: 'Order ID if earnings from order' })
  orderId?: string;

  @ApiProperty({ description: 'Earnings type', enum: EarningsType })
  earningsType: EarningsType;

  @ApiProperty({ description: 'Earnings status', enum: EarningsStatus })
  status: EarningsStatus;

  @ApiProperty({ description: 'Gross earnings amount' })
  grossAmount: number;

  @ApiProperty({ description: 'Net earnings amount after deductions' })
  netAmount: number;

  @ApiProperty({ description: 'Currency code' })
  currency: string;

  @ApiProperty({ description: 'Earnings breakdown', type: EarningsBreakdownDto })
  breakdown: EarningsBreakdownDto;

  @ApiProperty({ description: 'Payout status', enum: PayoutStatus })
  payoutStatus: PayoutStatus;

  @ApiPropertyOptional({ description: 'Payout date' })
  payoutDate?: string;

  @ApiPropertyOptional({ description: 'Payout reference number' })
  payoutReference?: string;

  @ApiPropertyOptional({ description: 'Earnings description' })
  description?: string;

  @ApiProperty({ description: 'Earnings date' })
  earnedAt: string;

  @ApiProperty({ description: 'Creation date' })
  createdAt: string;

  @ApiProperty({ description: 'Last update date' })
  updatedAt: string;

  @ApiPropertyOptional({ description: 'Additional metadata' })
  metadata?: Record<string, any>;
}

// Get Earnings DTO
export class GetEarningsDto {
  @ApiPropertyOptional({ description: 'Filter by rider ID' })
  @IsOptional()
  @IsString()
  riderId?: string;

  @ApiPropertyOptional({ description: 'Filter by shift ID' })
  @IsOptional()
  @IsString()
  shiftId?: string;

  @ApiPropertyOptional({ description: 'Filter by order ID' })
  @IsOptional()
  @IsString()
  orderId?: string;

  @ApiPropertyOptional({ description: 'Filter by earnings type', enum: EarningsType })
  @IsOptional()
  @IsEnum(EarningsType)
  earningsType?: EarningsType;

  @ApiPropertyOptional({ description: 'Filter by earnings status', enum: EarningsStatus })
  @IsOptional()
  @IsEnum(EarningsStatus)
  status?: EarningsStatus;

  @ApiPropertyOptional({ description: 'Filter by payout status', enum: PayoutStatus })
  @IsOptional()
  @IsEnum(PayoutStatus)
  payoutStatus?: PayoutStatus;

  @ApiPropertyOptional({ description: 'Filter by earnings date (from)' })
  @IsOptional()
  @IsDateString()
  earnedDateFrom?: string;

  @ApiPropertyOptional({ description: 'Filter by earnings date (to)' })
  @IsOptional()
  @IsDateString()
  earnedDateTo?: string;

  @ApiPropertyOptional({ description: 'Filter by minimum amount' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  minAmount?: number;

  @ApiPropertyOptional({ description: 'Filter by maximum amount' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  maxAmount?: number;

  @ApiPropertyOptional({ description: 'Page number for pagination', default: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Number of items per page', default: 20 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiPropertyOptional({ description: 'Sort field' })
  @IsOptional()
  @IsString()
  sortBy?: string;

  @ApiPropertyOptional({ description: 'Sort order', enum: ['asc', 'desc'] })
  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc';
}

// Paginated Earnings Response DTO
export class PaginatedEarningsResponseDto {
  @ApiProperty({ description: 'List of earnings', type: [EarningsResponseDto] })
  earnings: EarningsResponseDto[];

  @ApiProperty({ description: 'Total number of earnings records' })
  total: number;

  @ApiProperty({ description: 'Current page number' })
  page: number;

  @ApiProperty({ description: 'Number of items per page' })
  limit: number;

  @ApiProperty({ description: 'Total number of pages' })
  totalPages: number;

  @ApiProperty({ description: 'Whether there is a next page' })
  hasNext: boolean;

  @ApiProperty({ description: 'Whether there is a previous page' })
  hasPrev: boolean;
}

// Earnings Summary DTO
export class EarningsSummaryDto {
  @ApiProperty({ description: 'Summary period' })
  period: string;

  @ApiProperty({ description: 'Total gross earnings' })
  totalGrossEarnings: number;

  @ApiProperty({ description: 'Total net earnings' })
  totalNetEarnings: number;

  @ApiProperty({ description: 'Total deductions' })
  totalDeductions: number;

  @ApiProperty({ description: 'Total tips received' })
  totalTips: number;

  @ApiProperty({ description: 'Total bonuses earned' })
  totalBonuses: number;

  @ApiProperty({ description: 'Total penalties' })
  totalPenalties: number;

  @ApiProperty({ description: 'Number of completed orders' })
  completedOrders: number;

  @ApiProperty({ description: 'Average earnings per order' })
  averageEarningsPerOrder: number;

  @ApiProperty({ description: 'Average earnings per hour' })
  averageEarningsPerHour: number;

  @ApiProperty({ description: 'Total hours worked' })
  totalHoursWorked: number;

  @ApiProperty({ description: 'Currency code' })
  currency: string;

  @ApiProperty({ description: 'Earnings breakdown by type' })
  earningsByType: Record<string, number>;

  @ApiProperty({ description: 'Daily earnings breakdown' })
  dailyBreakdown: Array<{
    date: string;
    grossEarnings: number;
    netEarnings: number;
    orders: number;
  }>;
}

// Get Earnings Summary DTO
export class GetEarningsSummaryDto {
  @ApiPropertyOptional({ description: 'Filter by rider ID' })
  @IsOptional()
  @IsString()
  riderId?: string;

  @ApiPropertyOptional({ description: 'Summary period start date' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'Summary period end date' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Grouping period', enum: ['day', 'week', 'month', 'year'] })
  @IsOptional()
  @IsEnum(['day', 'week', 'month', 'year'])
  groupBy?: 'day' | 'week' | 'month' | 'year';

  @ApiPropertyOptional({ description: 'Include earnings breakdown by type' })
  @IsOptional()
  @IsBoolean()
  includeBreakdown?: boolean;

  @ApiPropertyOptional({ description: 'Include daily breakdown' })
  @IsOptional()
  @IsBoolean()
  includeDailyBreakdown?: boolean;
}

// Request Payout DTO
export class RequestPayoutDto {
  @ApiProperty({ description: 'Payout amount' })
  @IsNumber()
  @Min(0.01)
  amount: number;

  @ApiProperty({ description: 'Currency code' })
  @IsString()
  @Length(3, 3)
  currency: string;

  @ApiProperty({ description: 'Payout details', type: PayoutDetailsDto })
  @ValidateNested()
  @Type(() => PayoutDetailsDto)
  payoutDetails: PayoutDetailsDto;

  @ApiPropertyOptional({ description: 'Payout description or notes' })
  @IsOptional()
  @IsString()
  @Length(1, 500)
  description?: string;

  @ApiPropertyOptional({ description: 'Preferred payout date' })
  @IsOptional()
  @IsDateString()
  preferredPayoutDate?: string;
}

// Payout Response DTO
export class PayoutResponseDto {
  @ApiProperty({ description: 'Payout ID' })
  id: string;

  @ApiProperty({ description: 'Rider ID' })
  riderId: string;

  @ApiProperty({ description: 'Payout amount' })
  amount: number;

  @ApiProperty({ description: 'Currency code' })
  currency: string;

  @ApiProperty({ description: 'Payout status', enum: PayoutStatus })
  status: PayoutStatus;

  @ApiProperty({ description: 'Payout method', enum: PayoutMethod })
  method: PayoutMethod;

  @ApiProperty({ description: 'Payout details', type: PayoutDetailsDto })
  payoutDetails: PayoutDetailsDto;

  @ApiPropertyOptional({ description: 'Payout reference number' })
  reference?: string;

  @ApiPropertyOptional({ description: 'Transaction ID from payment provider' })
  transactionId?: string;

  @ApiPropertyOptional({ description: 'Payout description or notes' })
  description?: string;

  @ApiPropertyOptional({ description: 'Processing fee charged' })
  processingFee?: number;

  @ApiPropertyOptional({ description: 'Net amount after fees' })
  netAmount?: number;

  @ApiPropertyOptional({ description: 'Failure reason if payout failed' })
  failureReason?: string;

  @ApiProperty({ description: 'Payout request date' })
  requestedAt: string;

  @ApiPropertyOptional({ description: 'Payout processing date' })
  processedAt?: string;

  @ApiPropertyOptional({ description: 'Payout completion date' })
  completedAt?: string;

  @ApiProperty({ description: 'Creation date' })
  createdAt: string;

  @ApiProperty({ description: 'Last update date' })
  updatedAt: string;
}

// Get Payouts DTO
export class GetPayoutsDto {
  @ApiPropertyOptional({ description: 'Filter by rider ID' })
  @IsOptional()
  @IsString()
  riderId?: string;

  @ApiPropertyOptional({ description: 'Filter by payout status', enum: PayoutStatus })
  @IsOptional()
  @IsEnum(PayoutStatus)
  status?: PayoutStatus;

  @ApiPropertyOptional({ description: 'Filter by payout method', enum: PayoutMethod })
  @IsOptional()
  @IsEnum(PayoutMethod)
  method?: PayoutMethod;

  @ApiPropertyOptional({ description: 'Filter by request date (from)' })
  @IsOptional()
  @IsDateString()
  requestDateFrom?: string;

  @ApiPropertyOptional({ description: 'Filter by request date (to)' })
  @IsOptional()
  @IsDateString()
  requestDateTo?: string;

  @ApiPropertyOptional({ description: 'Filter by minimum amount' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  minAmount?: number;

  @ApiPropertyOptional({ description: 'Filter by maximum amount' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  maxAmount?: number;

  @ApiPropertyOptional({ description: 'Page number for pagination', default: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Number of items per page', default: 20 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiPropertyOptional({ description: 'Sort field' })
  @IsOptional()
  @IsString()
  sortBy?: string;

  @ApiPropertyOptional({ description: 'Sort order', enum: ['asc', 'desc'] })
  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc';
}

// Paginated Payouts Response DTO
export class PaginatedPayoutsResponseDto {
  @ApiProperty({ description: 'List of payouts', type: [PayoutResponseDto] })
  payouts: PayoutResponseDto[];

  @ApiProperty({ description: 'Total number of payouts' })
  total: number;

  @ApiProperty({ description: 'Current page number' })
  page: number;

  @ApiProperty({ description: 'Number of items per page' })
  limit: number;

  @ApiProperty({ description: 'Total number of pages' })
  totalPages: number;

  @ApiProperty({ description: 'Whether there is a next page' })
  hasNext: boolean;

  @ApiProperty({ description: 'Whether there is a previous page' })
  hasPrev: boolean;
}

// Financial Analytics DTO
export class FinancialAnalyticsDto {
  @ApiProperty({ description: 'Analysis period' })
  period: string;

  @ApiProperty({ description: 'Total earnings' })
  totalEarnings: number;

  @ApiProperty({ description: 'Total payouts' })
  totalPayouts: number;

  @ApiProperty({ description: 'Pending payout amount' })
  pendingPayouts: number;

  @ApiProperty({ description: 'Average daily earnings' })
  averageDailyEarnings: number;

  @ApiProperty({ description: 'Highest single day earnings' })
  highestDayEarnings: number;

  @ApiProperty({ description: 'Lowest single day earnings' })
  lowestDayEarnings: number;

  @ApiProperty({ description: 'Earnings growth percentage' })
  earningsGrowth: number;

  @ApiProperty({ description: 'Most profitable day of week' })
  mostProfitableDay: string;

  @ApiProperty({ description: 'Most profitable hour of day' })
  mostProfitableHour: number;

  @ApiProperty({ description: 'Currency code' })
  currency: string;

  @ApiProperty({ description: 'Earnings trend data' })
  trendData: Array<{
    date: string;
    earnings: number;
    orders: number;
  }>;

  @ApiProperty({ description: 'Earnings distribution by type' })
  earningsDistribution: Record<string, number>;
}