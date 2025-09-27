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
export enum PerformanceMetricType {
  ACCEPTANCE_RATE = 'ACCEPTANCE_RATE',
  COMPLETION_RATE = 'COMPLETION_RATE',
  ON_TIME_DELIVERY_RATE = 'ON_TIME_DELIVERY_RATE',
  CUSTOMER_RATING = 'CUSTOMER_RATING',
  AVERAGE_DELIVERY_TIME = 'AVERAGE_DELIVERY_TIME',
  ORDERS_PER_HOUR = 'ORDERS_PER_HOUR',
  EARNINGS_PER_HOUR = 'EARNINGS_PER_HOUR',
  CANCELLATION_RATE = 'CANCELLATION_RATE',
  RESPONSE_TIME = 'RESPONSE_TIME',
  DISTANCE_EFFICIENCY = 'DISTANCE_EFFICIENCY',
}

export enum PerformancePeriod {
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
  QUARTERLY = 'QUARTERLY',
  YEARLY = 'YEARLY',
  ALL_TIME = 'ALL_TIME',
}

export enum PerformanceGrade {
  EXCELLENT = 'EXCELLENT',
  GOOD = 'GOOD',
  AVERAGE = 'AVERAGE',
  BELOW_AVERAGE = 'BELOW_AVERAGE',
  POOR = 'POOR',
}

export enum GoalStatus {
  NOT_STARTED = 'NOT_STARTED',
  IN_PROGRESS = 'IN_PROGRESS',
  ACHIEVED = 'ACHIEVED',
  EXCEEDED = 'EXCEEDED',
  FAILED = 'FAILED',
}

// Performance Metric DTO
export class PerformanceMetricDto {
  @ApiProperty({ description: 'Metric type', enum: PerformanceMetricType })
  @IsEnum(PerformanceMetricType)
  type: PerformanceMetricType;

  @ApiProperty({ description: 'Metric value' })
  @IsNumber()
  value: number;

  @ApiProperty({ description: 'Metric unit (e.g., %, minutes, orders)' })
  @IsString()
  unit: string;

  @ApiPropertyOptional({ description: 'Target value for this metric' })
  @IsOptional()
  @IsNumber()
  target?: number;

  @ApiPropertyOptional({ description: 'Previous period value for comparison' })
  @IsOptional()
  @IsNumber()
  previousValue?: number;

  @ApiPropertyOptional({ description: 'Change from previous period' })
  @IsOptional()
  @IsNumber()
  change?: number;

  @ApiPropertyOptional({ description: 'Change percentage from previous period' })
  @IsOptional()
  @IsNumber()
  changePercentage?: number;

  @ApiProperty({ description: 'Performance grade', enum: PerformanceGrade })
  @IsEnum(PerformanceGrade)
  grade: PerformanceGrade;

  @ApiPropertyOptional({ description: 'Metric description' })
  @IsOptional()
  @IsString()
  description?: string;
}

// Performance Summary DTO
export class PerformanceSummaryDto {
  @ApiProperty({ description: 'Rider ID' })
  riderId: string;

  @ApiProperty({ description: 'Performance period', enum: PerformancePeriod })
  period: PerformancePeriod;

  @ApiProperty({ description: 'Period start date' })
  periodStart: string;

  @ApiProperty({ description: 'Period end date' })
  periodEnd: string;

  @ApiProperty({ description: 'Overall performance score (0-100)' })
  @IsNumber()
  @Min(0)
  @Max(100)
  overallScore: number;

  @ApiProperty({ description: 'Overall performance grade', enum: PerformanceGrade })
  overallGrade: PerformanceGrade;

  @ApiProperty({ description: 'Performance metrics', type: [PerformanceMetricDto] })
  metrics: PerformanceMetricDto[];

  @ApiProperty({ description: 'Total orders completed' })
  @IsNumber()
  @Min(0)
  totalOrders: number;

  @ApiProperty({ description: 'Total hours worked' })
  @IsNumber()
  @Min(0)
  totalHours: number;

  @ApiProperty({ description: 'Total earnings' })
  @IsNumber()
  @Min(0)
  totalEarnings: number;

  @ApiProperty({ description: 'Currency code' })
  currency: string;

  @ApiPropertyOptional({ description: 'Rank among all riders' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  rank?: number;

  @ApiPropertyOptional({ description: 'Total number of riders for ranking' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  totalRiders?: number;

  @ApiPropertyOptional({ description: 'Percentile ranking' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  percentile?: number;

  @ApiProperty({ description: 'Performance calculation date' })
  calculatedAt: string;
}

// Get Performance DTO
export class GetPerformanceDto {
  @ApiPropertyOptional({ description: 'Filter by rider ID' })
  @IsOptional()
  @IsString()
  riderId?: string;

  @ApiPropertyOptional({ description: 'Performance period', enum: PerformancePeriod })
  @IsOptional()
  @IsEnum(PerformancePeriod)
  period?: PerformancePeriod;

  @ApiPropertyOptional({ description: 'Custom period start date' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'Custom period end date' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Include ranking information' })
  @IsOptional()
  @IsBoolean()
  includeRanking?: boolean;

  @ApiPropertyOptional({ description: 'Include comparison with previous period' })
  @IsOptional()
  @IsBoolean()
  includeComparison?: boolean;

  @ApiPropertyOptional({ description: 'Specific metrics to include', enum: PerformanceMetricType, isArray: true })
  @IsOptional()
  @IsArray()
  @IsEnum(PerformanceMetricType, { each: true })
  metrics?: PerformanceMetricType[];
}

// Performance Goal DTO
export class PerformanceGoalDto {
  @ApiProperty({ description: 'Goal ID' })
  id: string;

  @ApiProperty({ description: 'Rider ID' })
  riderId: string;

  @ApiProperty({ description: 'Goal metric type', enum: PerformanceMetricType })
  @IsEnum(PerformanceMetricType)
  metricType: PerformanceMetricType;

  @ApiProperty({ description: 'Target value to achieve' })
  @IsNumber()
  targetValue: number;

  @ApiProperty({ description: 'Current progress value' })
  @IsNumber()
  currentValue: number;

  @ApiProperty({ description: 'Goal status', enum: GoalStatus })
  status: GoalStatus;

  @ApiProperty({ description: 'Goal period', enum: PerformancePeriod })
  period: PerformancePeriod;

  @ApiProperty({ description: 'Goal start date' })
  startDate: string;

  @ApiProperty({ description: 'Goal end date' })
  endDate: string;

  @ApiProperty({ description: 'Progress percentage (0-100)' })
  @IsNumber()
  @Min(0)
  progressPercentage: number;

  @ApiPropertyOptional({ description: 'Reward for achieving goal' })
  @IsOptional()
  @IsString()
  reward?: string;

  @ApiPropertyOptional({ description: 'Goal description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Goal creation date' })
  createdAt: string;

  @ApiProperty({ description: 'Last update date' })
  updatedAt: string;
}

// Create Performance Goal DTO
export class CreatePerformanceGoalDto {
  @ApiProperty({ description: 'Goal metric type', enum: PerformanceMetricType })
  @IsEnum(PerformanceMetricType)
  metricType: PerformanceMetricType;

  @ApiProperty({ description: 'Target value to achieve' })
  @IsNumber()
  @Min(0)
  targetValue: number;

  @ApiProperty({ description: 'Goal period', enum: PerformancePeriod })
  @IsEnum(PerformancePeriod)
  period: PerformancePeriod;

  @ApiPropertyOptional({ description: 'Custom goal start date' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'Custom goal end date' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Reward for achieving goal' })
  @IsOptional()
  @IsString()
  @Length(1, 200)
  reward?: string;

  @ApiPropertyOptional({ description: 'Goal description' })
  @IsOptional()
  @IsString()
  @Length(1, 500)
  description?: string;
}

// Update Performance Goal DTO
export class UpdatePerformanceGoalDto {
  @ApiPropertyOptional({ description: 'Target value to achieve' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  targetValue?: number;

  @ApiPropertyOptional({ description: 'Goal status', enum: GoalStatus })
  @IsOptional()
  @IsEnum(GoalStatus)
  status?: GoalStatus;

  @ApiPropertyOptional({ description: 'Goal end date' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Reward for achieving goal' })
  @IsOptional()
  @IsString()
  @Length(1, 200)
  reward?: string;

  @ApiPropertyOptional({ description: 'Goal description' })
  @IsOptional()
  @IsString()
  @Length(1, 500)
  description?: string;
}

// Performance Trend DTO
export class PerformanceTrendDto {
  @ApiProperty({ description: 'Date of the data point' })
  date: string;

  @ApiProperty({ description: 'Performance metrics for this date', type: [PerformanceMetricDto] })
  metrics: PerformanceMetricDto[];

  @ApiProperty({ description: 'Overall score for this date' })
  @IsNumber()
  @Min(0)
  @Max(100)
  overallScore: number;

  @ApiProperty({ description: 'Number of orders completed' })
  @IsNumber()
  @Min(0)
  ordersCompleted: number;

  @ApiProperty({ description: 'Hours worked' })
  @IsNumber()
  @Min(0)
  hoursWorked: number;

  @ApiProperty({ description: 'Earnings for this date' })
  @IsNumber()
  @Min(0)
  earnings: number;
}

// Performance Analytics DTO
export class PerformanceAnalyticsDto {
  @ApiProperty({ description: 'Rider ID' })
  riderId: string;

  @ApiProperty({ description: 'Analysis period' })
  period: string;

  @ApiProperty({ description: 'Performance trend data', type: [PerformanceTrendDto] })
  trendData: PerformanceTrendDto[];

  @ApiProperty({ description: 'Best performing day' })
  bestDay: {
    date: string;
    score: number;
    metrics: PerformanceMetricDto[];
  };

  @ApiProperty({ description: 'Worst performing day' })
  worstDay: {
    date: string;
    score: number;
    metrics: PerformanceMetricDto[];
  };

  @ApiProperty({ description: 'Performance insights and recommendations' })
  insights: Array<{
    type: string;
    message: string;
    priority: 'high' | 'medium' | 'low';
    actionable: boolean;
  }>;

  @ApiProperty({ description: 'Strengths identified' })
  strengths: string[];

  @ApiProperty({ description: 'Areas for improvement' })
  improvementAreas: string[];

  @ApiProperty({ description: 'Recommended actions' })
  recommendations: Array<{
    action: string;
    expectedImpact: string;
    difficulty: 'easy' | 'medium' | 'hard';
  }>;

  @ApiProperty({ description: 'Currency code' })
  currency: string;
}

// Get Performance Analytics DTO
export class GetPerformanceAnalyticsDto {
  @ApiPropertyOptional({ description: 'Filter by rider ID' })
  @IsOptional()
  @IsString()
  riderId?: string;

  @ApiPropertyOptional({ description: 'Analysis period', enum: PerformancePeriod })
  @IsOptional()
  @IsEnum(PerformancePeriod)
  period?: PerformancePeriod;

  @ApiPropertyOptional({ description: 'Custom period start date' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'Custom period end date' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Include insights and recommendations' })
  @IsOptional()
  @IsBoolean()
  includeInsights?: boolean;

  @ApiPropertyOptional({ description: 'Include trend analysis' })
  @IsOptional()
  @IsBoolean()
  includeTrends?: boolean;

  @ApiPropertyOptional({ description: 'Specific metrics to analyze', enum: PerformanceMetricType, isArray: true })
  @IsOptional()
  @IsArray()
  @IsEnum(PerformanceMetricType, { each: true })
  metrics?: PerformanceMetricType[];
}

// Performance Comparison DTO
export class PerformanceComparisonDto {
  @ApiProperty({ description: 'Rider ID' })
  riderId: string;

  @ApiProperty({ description: 'Current period performance', type: PerformanceSummaryDto })
  currentPeriod: PerformanceSummaryDto;

  @ApiProperty({ description: 'Previous period performance', type: PerformanceSummaryDto })
  previousPeriod: PerformanceSummaryDto;

  @ApiProperty({ description: 'Performance changes by metric' })
  changes: Array<{
    metric: PerformanceMetricType;
    currentValue: number;
    previousValue: number;
    change: number;
    changePercentage: number;
    improvement: boolean;
  }>;

  @ApiProperty({ description: 'Overall improvement status' })
  overallImprovement: boolean;

  @ApiProperty({ description: 'Score change' })
  scoreChange: number;

  @ApiProperty({ description: 'Score change percentage' })
  scoreChangePercentage: number;

  @ApiProperty({ description: 'Rank change' })
  rankChange: number;

  @ApiProperty({ description: 'Key improvements' })
  keyImprovements: string[];

  @ApiProperty({ description: 'Key declines' })
  keyDeclines: string[];
}

// Performance Leaderboard Entry DTO
export class PerformanceLeaderboardEntryDto {
  @ApiProperty({ description: 'Rank position' })
  @IsNumber()
  @Min(1)
  rank: number;

  @ApiProperty({ description: 'Rider ID' })
  riderId: string;

  @ApiProperty({ description: 'Rider name' })
  riderName: string;

  @ApiProperty({ description: 'Overall performance score' })
  @IsNumber()
  @Min(0)
  @Max(100)
  score: number;

  @ApiProperty({ description: 'Performance grade', enum: PerformanceGrade })
  grade: PerformanceGrade;

  @ApiProperty({ description: 'Total orders completed' })
  @IsNumber()
  @Min(0)
  totalOrders: number;

  @ApiProperty({ description: 'Total earnings' })
  @IsNumber()
  @Min(0)
  totalEarnings: number;

  @ApiProperty({ description: 'Customer rating average' })
  @IsNumber()
  @Min(0)
  @Max(5)
  averageRating: number;

  @ApiPropertyOptional({ description: 'Rider profile picture URL' })
  @IsOptional()
  @IsString()
  profilePictureUrl?: string;

  @ApiPropertyOptional({ description: 'Badge or achievement' })
  @IsOptional()
  @IsString()
  badge?: string;
}

// Performance Leaderboard DTO
export class PerformanceLeaderboardDto {
  @ApiProperty({ description: 'Leaderboard period' })
  period: string;

  @ApiProperty({ description: 'Period start date' })
  periodStart: string;

  @ApiProperty({ description: 'Period end date' })
  periodEnd: string;

  @ApiProperty({ description: 'Leaderboard entries', type: [PerformanceLeaderboardEntryDto] })
  entries: PerformanceLeaderboardEntryDto[];

  @ApiProperty({ description: 'Total number of riders' })
  totalRiders: number;

  @ApiPropertyOptional({ description: 'Current rider rank' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  currentRiderRank?: number;

  @ApiPropertyOptional({ description: 'Current rider entry', type: PerformanceLeaderboardEntryDto })
  @IsOptional()
  currentRiderEntry?: PerformanceLeaderboardEntryDto;

  @ApiProperty({ description: 'Currency code' })
  currency: string;

  @ApiProperty({ description: 'Last update date' })
  lastUpdated: string;
}

// Get Performance Leaderboard DTO
export class GetPerformanceLeaderboardDto {
  @ApiPropertyOptional({ description: 'Leaderboard period', enum: PerformancePeriod })
  @IsOptional()
  @IsEnum(PerformancePeriod)
  period?: PerformancePeriod;

  @ApiPropertyOptional({ description: 'Custom period start date' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'Custom period end date' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Number of top riders to include', default: 50 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 50;

  @ApiPropertyOptional({ description: 'Include current rider position' })
  @IsOptional()
  @IsBoolean()
  includeCurrentRider?: boolean;

  @ApiPropertyOptional({ description: 'Current rider ID for position lookup' })
  @IsOptional()
  @IsString()
  currentRiderId?: string;

  @ApiPropertyOptional({ description: 'Filter by city' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ description: 'Filter by minimum orders' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  minOrders?: number;
}