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
  IsUrl,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// Enums
export enum RatingType {
  CUSTOMER_TO_RIDER = 'CUSTOMER_TO_RIDER',
  RIDER_TO_CUSTOMER = 'RIDER_TO_CUSTOMER',
  VENDOR_TO_RIDER = 'VENDOR_TO_RIDER',
  RIDER_TO_VENDOR = 'RIDER_TO_VENDOR',
  SYSTEM_GENERATED = 'SYSTEM_GENERATED',
}

export enum RatingCategory {
  OVERALL = 'OVERALL',
  PUNCTUALITY = 'PUNCTUALITY',
  COMMUNICATION = 'COMMUNICATION',
  PROFESSIONALISM = 'PROFESSIONALISM',
  VEHICLE_CONDITION = 'VEHICLE_CONDITION',
  DELIVERY_QUALITY = 'DELIVERY_QUALITY',
  CUSTOMER_SERVICE = 'CUSTOMER_SERVICE',
  SAFETY = 'SAFETY',
  NAVIGATION = 'NAVIGATION',
  APPEARANCE = 'APPEARANCE',
}

export enum FeedbackStatus {
  PENDING = 'PENDING',
  REVIEWED = 'REVIEWED',
  ACKNOWLEDGED = 'ACKNOWLEDGED',
  DISPUTED = 'DISPUTED',
  RESOLVED = 'RESOLVED',
  ARCHIVED = 'ARCHIVED',
}

export enum FeedbackType {
  COMPLIMENT = 'COMPLIMENT',
  COMPLAINT = 'COMPLAINT',
  SUGGESTION = 'SUGGESTION',
  GENERAL = 'GENERAL',
  SAFETY_CONCERN = 'SAFETY_CONCERN',
  SERVICE_ISSUE = 'SERVICE_ISSUE',
}

export enum FeedbackPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

export enum DisputeStatus {
  OPEN = 'OPEN',
  UNDER_REVIEW = 'UNDER_REVIEW',
  RESOLVED = 'RESOLVED',
  REJECTED = 'REJECTED',
  ESCALATED = 'ESCALATED',
}

// Rating Criteria DTO
export class RatingCriteriaDto {
  @ApiProperty({ description: 'Rating category', enum: RatingCategory })
  @IsEnum(RatingCategory)
  category: RatingCategory;

  @ApiProperty({ description: 'Rating score (1-5)' })
  @IsNumber()
  @Min(1)
  @Max(5)
  score: number;

  @ApiPropertyOptional({ description: 'Comments for this criteria' })
  @IsOptional()
  @IsString()
  @Length(1, 500)
  comment?: string;
}

// Create Rating DTO
export class CreateRatingDto {
  @ApiProperty({ description: 'Order ID this rating is for' })
  @IsString()
  orderId: string;

  @ApiProperty({ description: 'Rating type', enum: RatingType })
  @IsEnum(RatingType)
  ratingType: RatingType;

  @ApiProperty({ description: 'Overall rating score (1-5)' })
  @IsNumber()
  @Min(1)
  @Max(5)
  overallRating: number;

  @ApiPropertyOptional({ description: 'Detailed rating criteria', type: [RatingCriteriaDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RatingCriteriaDto)
  criteria?: RatingCriteriaDto[];

  @ApiPropertyOptional({ description: 'Written review/comment' })
  @IsOptional()
  @IsString()
  @Length(1, 1000)
  review?: string;

  @ApiPropertyOptional({ description: 'Tags associated with the rating' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({ description: 'Whether this is an anonymous rating' })
  @IsOptional()
  @IsBoolean()
  isAnonymous?: boolean;

  @ApiPropertyOptional({ description: 'Photo attachments for the rating' })
  @IsOptional()
  @IsArray()
  @IsUrl({}, { each: true })
  photoAttachments?: string[];

  @ApiPropertyOptional({ description: 'Additional metadata' })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

// Update Rating DTO
export class UpdateRatingDto {
  @ApiPropertyOptional({ description: 'Overall rating score (1-5)' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  overallRating?: number;

  @ApiPropertyOptional({ description: 'Updated detailed rating criteria', type: [RatingCriteriaDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RatingCriteriaDto)
  criteria?: RatingCriteriaDto[];

  @ApiPropertyOptional({ description: 'Updated written review/comment' })
  @IsOptional()
  @IsString()
  @Length(1, 1000)
  review?: string;

  @ApiPropertyOptional({ description: 'Updated tags associated with the rating' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({ description: 'Additional photo attachments' })
  @IsOptional()
  @IsArray()
  @IsUrl({}, { each: true })
  additionalPhotos?: string[];
}

// Rating Response DTO
export class RatingResponseDto {
  @ApiProperty({ description: 'Rating ID' })
  id: string;

  @ApiProperty({ description: 'Order ID' })
  orderId: string;

  @ApiProperty({ description: 'Rider ID' })
  riderId: string;

  @ApiProperty({ description: 'Rater ID (customer, vendor, or system)' })
  raterId: string;

  @ApiProperty({ description: 'Rater name' })
  raterName: string;

  @ApiProperty({ description: 'Rating type', enum: RatingType })
  ratingType: RatingType;

  @ApiProperty({ description: 'Overall rating score (1-5)' })
  overallRating: number;

  @ApiPropertyOptional({ description: 'Detailed rating criteria', type: [RatingCriteriaDto] })
  criteria?: RatingCriteriaDto[];

  @ApiPropertyOptional({ description: 'Written review/comment' })
  review?: string;

  @ApiPropertyOptional({ description: 'Tags associated with the rating' })
  tags?: string[];

  @ApiPropertyOptional({ description: 'Whether this is an anonymous rating' })
  isAnonymous?: boolean;

  @ApiPropertyOptional({ description: 'Photo attachments for the rating' })
  photoAttachments?: string[];

  @ApiPropertyOptional({ description: 'Whether the rating has been disputed' })
  isDisputed?: boolean;

  @ApiPropertyOptional({ description: 'Dispute details if any' })
  disputeDetails?: {
    disputeId: string;
    status: DisputeStatus;
    reason: string;
    submittedAt: string;
  };

  @ApiPropertyOptional({ description: 'Admin response to the rating' })
  adminResponse?: {
    responseText: string;
    respondedBy: string;
    respondedAt: string;
  };

  @ApiProperty({ description: 'Rating creation date' })
  createdAt: string;

  @ApiProperty({ description: 'Last update date' })
  updatedAt: string;

  @ApiPropertyOptional({ description: 'Additional metadata' })
  metadata?: Record<string, any>;
}

// Get Ratings DTO
export class GetRatingsDto {
  @ApiPropertyOptional({ description: 'Filter by rider ID' })
  @IsOptional()
  @IsString()
  riderId?: string;

  @ApiPropertyOptional({ description: 'Filter by order ID' })
  @IsOptional()
  @IsString()
  orderId?: string;

  @ApiPropertyOptional({ description: 'Filter by rating type', enum: RatingType })
  @IsOptional()
  @IsEnum(RatingType)
  ratingType?: RatingType;

  @ApiPropertyOptional({ description: 'Filter by minimum rating' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  minRating?: number;

  @ApiPropertyOptional({ description: 'Filter by maximum rating' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  maxRating?: number;

  @ApiPropertyOptional({ description: 'Filter by date range (from)' })
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @ApiPropertyOptional({ description: 'Filter by date range (to)' })
  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @ApiPropertyOptional({ description: 'Filter by disputed ratings only' })
  @IsOptional()
  @IsBoolean()
  disputedOnly?: boolean;

  @ApiPropertyOptional({ description: 'Search in review text' })
  @IsOptional()
  @IsString()
  @Length(1, 100)
  search?: string;

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
  sortOrder?: 'asc' | 'desc' = 'desc';
}

// Paginated Ratings Response DTO
export class PaginatedRatingsResponseDto {
  @ApiProperty({ description: 'List of ratings', type: [RatingResponseDto] })
  ratings: RatingResponseDto[];

  @ApiProperty({ description: 'Total number of ratings' })
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

// Rating Summary DTO
export class RatingSummaryDto {
  @ApiProperty({ description: 'Rider ID' })
  riderId: string;

  @ApiProperty({ description: 'Summary period' })
  period: string;

  @ApiProperty({ description: 'Overall average rating' })
  averageRating: number;

  @ApiProperty({ description: 'Total number of ratings' })
  totalRatings: number;

  @ApiProperty({ description: 'Rating distribution' })
  ratingDistribution: {
    '1': number;
    '2': number;
    '3': number;
    '4': number;
    '5': number;
  };

  @ApiProperty({ description: 'Average ratings by category' })
  categoryAverages: Record<string, number>;

  @ApiProperty({ description: 'Most common positive tags' })
  positiveTags: Array<{
    tag: string;
    count: number;
    percentage: number;
  }>;

  @ApiProperty({ description: 'Most common negative tags' })
  negativeTags: Array<{
    tag: string;
    count: number;
    percentage: number;
  }>;

  @ApiProperty({ description: 'Rating trends over time' })
  trends: Array<{
    period: string;
    averageRating: number;
    totalRatings: number;
  }>;

  @ApiProperty({ description: 'Comparison with platform average' })
  platformComparison: {
    platformAverage: number;
    difference: number;
    percentile: number;
  };
}

// Create Feedback DTO
export class CreateFeedbackDto {
  @ApiPropertyOptional({ description: 'Related order ID' })
  @IsOptional()
  @IsString()
  orderId?: string;

  @ApiPropertyOptional({ description: 'Related rating ID' })
  @IsOptional()
  @IsString()
  ratingId?: string;

  @ApiProperty({ description: 'Feedback type', enum: FeedbackType })
  @IsEnum(FeedbackType)
  feedbackType: FeedbackType;

  @ApiProperty({ description: 'Feedback priority', enum: FeedbackPriority })
  @IsEnum(FeedbackPriority)
  priority: FeedbackPriority;

  @ApiProperty({ description: 'Feedback subject/title' })
  @IsString()
  @Length(1, 200)
  subject: string;

  @ApiProperty({ description: 'Feedback message' })
  @IsString()
  @Length(1, 2000)
  message: string;

  @ApiPropertyOptional({ description: 'Feedback category/topic' })
  @IsOptional()
  @IsString()
  @Length(1, 100)
  category?: string;

  @ApiPropertyOptional({ description: 'Tags associated with the feedback' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({ description: 'Photo attachments' })
  @IsOptional()
  @IsArray()
  @IsUrl({}, { each: true })
  photoAttachments?: string[];

  @ApiPropertyOptional({ description: 'Document attachments' })
  @IsOptional()
  @IsArray()
  @IsUrl({}, { each: true })
  documentAttachments?: string[];

  @ApiPropertyOptional({ description: 'Whether feedback is anonymous' })
  @IsOptional()
  @IsBoolean()
  isAnonymous?: boolean;

  @ApiPropertyOptional({ description: 'Contact preference for follow-up' })
  @IsOptional()
  @IsEnum(['email', 'phone', 'in_app', 'none'])
  contactPreference?: 'email' | 'phone' | 'in_app' | 'none';

  @ApiPropertyOptional({ description: 'Additional metadata' })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

// Update Feedback DTO
export class UpdateFeedbackDto {
  @ApiPropertyOptional({ description: 'Updated feedback priority', enum: FeedbackPriority })
  @IsOptional()
  @IsEnum(FeedbackPriority)
  priority?: FeedbackPriority;

  @ApiPropertyOptional({ description: 'Additional message or update' })
  @IsOptional()
  @IsString()
  @Length(1, 2000)
  additionalMessage?: string;

  @ApiPropertyOptional({ description: 'Updated tags' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({ description: 'Additional photo attachments' })
  @IsOptional()
  @IsArray()
  @IsUrl({}, { each: true })
  additionalPhotos?: string[];

  @ApiPropertyOptional({ description: 'Additional document attachments' })
  @IsOptional()
  @IsArray()
  @IsUrl({}, { each: true })
  additionalDocuments?: string[];
}

// Feedback Response DTO
export class FeedbackResponseDto {
  @ApiProperty({ description: 'Feedback ID' })
  id: string;

  @ApiProperty({ description: 'Feedback ticket number' })
  ticketNumber: string;

  @ApiProperty({ description: 'Rider ID' })
  riderId: string;

  @ApiPropertyOptional({ description: 'Related order ID' })
  orderId?: string;

  @ApiPropertyOptional({ description: 'Related rating ID' })
  ratingId?: string;

  @ApiProperty({ description: 'Feedback type', enum: FeedbackType })
  feedbackType: FeedbackType;

  @ApiProperty({ description: 'Feedback priority', enum: FeedbackPriority })
  priority: FeedbackPriority;

  @ApiProperty({ description: 'Feedback status', enum: FeedbackStatus })
  status: FeedbackStatus;

  @ApiProperty({ description: 'Feedback subject/title' })
  subject: string;

  @ApiProperty({ description: 'Feedback message' })
  message: string;

  @ApiPropertyOptional({ description: 'Feedback category/topic' })
  category?: string;

  @ApiPropertyOptional({ description: 'Tags associated with the feedback' })
  tags?: string[];

  @ApiPropertyOptional({ description: 'Photo attachments' })
  photoAttachments?: string[];

  @ApiPropertyOptional({ description: 'Document attachments' })
  documentAttachments?: string[];

  @ApiPropertyOptional({ description: 'Whether feedback is anonymous' })
  isAnonymous?: boolean;

  @ApiPropertyOptional({ description: 'Contact preference for follow-up' })
  contactPreference?: 'email' | 'phone' | 'in_app' | 'none';

  @ApiPropertyOptional({ description: 'Assigned agent ID' })
  assignedAgentId?: string;

  @ApiPropertyOptional({ description: 'Assigned agent name' })
  assignedAgentName?: string;

  @ApiPropertyOptional({ description: 'Admin response' })
  adminResponse?: {
    responseText: string;
    respondedBy: string;
    respondedAt: string;
  };

  @ApiPropertyOptional({ description: 'Resolution notes' })
  resolutionNotes?: string;

  @ApiPropertyOptional({ description: 'Resolution date' })
  resolvedAt?: string;

  @ApiPropertyOptional({ description: 'Feedback acknowledgment date' })
  acknowledgedAt?: string;

  @ApiProperty({ description: 'Feedback creation date' })
  createdAt: string;

  @ApiProperty({ description: 'Last update date' })
  updatedAt: string;

  @ApiPropertyOptional({ description: 'Additional metadata' })
  metadata?: Record<string, any>;
}

// Get Feedback DTO
export class GetFeedbackDto {
  @ApiPropertyOptional({ description: 'Filter by rider ID' })
  @IsOptional()
  @IsString()
  riderId?: string;

  @ApiPropertyOptional({ description: 'Filter by feedback type', enum: FeedbackType })
  @IsOptional()
  @IsEnum(FeedbackType)
  feedbackType?: FeedbackType;

  @ApiPropertyOptional({ description: 'Filter by priority', enum: FeedbackPriority })
  @IsOptional()
  @IsEnum(FeedbackPriority)
  priority?: FeedbackPriority;

  @ApiPropertyOptional({ description: 'Filter by status', enum: FeedbackStatus })
  @IsOptional()
  @IsEnum(FeedbackStatus)
  status?: FeedbackStatus;

  @ApiPropertyOptional({ description: 'Filter by category' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ description: 'Filter by date range (from)' })
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @ApiPropertyOptional({ description: 'Filter by date range (to)' })
  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @ApiPropertyOptional({ description: 'Search in subject and message' })
  @IsOptional()
  @IsString()
  @Length(1, 100)
  search?: string;

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
  sortOrder?: 'asc' | 'desc' = 'desc';
}

// Paginated Feedback Response DTO
export class PaginatedFeedbackResponseDto {
  @ApiProperty({ description: 'List of feedback', type: [FeedbackResponseDto] })
  feedback: FeedbackResponseDto[];

  @ApiProperty({ description: 'Total number of feedback items' })
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

// Dispute Rating DTO
export class DisputeRatingDto {
  @ApiProperty({ description: 'Rating ID to dispute' })
  @IsString()
  ratingId: string;

  @ApiProperty({ description: 'Reason for disputing the rating' })
  @IsString()
  @Length(1, 1000)
  reason: string;

  @ApiPropertyOptional({ description: 'Supporting evidence/explanation' })
  @IsOptional()
  @IsString()
  @Length(1, 2000)
  evidence?: string;

  @ApiPropertyOptional({ description: 'Supporting document attachments' })
  @IsOptional()
  @IsArray()
  @IsUrl({}, { each: true })
  supportingDocuments?: string[];

  @ApiPropertyOptional({ description: 'Additional metadata' })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

// Dispute Response DTO
export class DisputeResponseDto {
  @ApiProperty({ description: 'Dispute ID' })
  id: string;

  @ApiProperty({ description: 'Rating ID being disputed' })
  ratingId: string;

  @ApiProperty({ description: 'Rider ID who submitted the dispute' })
  riderId: string;

  @ApiProperty({ description: 'Dispute status', enum: DisputeStatus })
  status: DisputeStatus;

  @ApiProperty({ description: 'Reason for disputing the rating' })
  reason: string;

  @ApiPropertyOptional({ description: 'Supporting evidence/explanation' })
  evidence?: string;

  @ApiPropertyOptional({ description: 'Supporting document attachments' })
  supportingDocuments?: string[];

  @ApiPropertyOptional({ description: 'Admin review notes' })
  adminNotes?: string;

  @ApiPropertyOptional({ description: 'Resolution details' })
  resolution?: {
    outcome: 'upheld' | 'overturned' | 'partial';
    explanation: string;
    resolvedBy: string;
    resolvedAt: string;
  };

  @ApiProperty({ description: 'Dispute creation date' })
  createdAt: string;

  @ApiProperty({ description: 'Last update date' })
  updatedAt: string;

  @ApiPropertyOptional({ description: 'Additional metadata' })
  metadata?: Record<string, any>;
}