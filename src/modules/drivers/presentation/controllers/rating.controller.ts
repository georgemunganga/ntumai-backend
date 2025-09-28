import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../../shared/guards/jwt-auth.guard';
import { RolesGuard } from '../../../../shared/guards/roles.guard';
import { Roles } from '../../../../shared/decorators/roles.decorator';
import { RatingService } from '../../application/services/rating.service';
import {
  CreateRatingDto,
  UpdateRatingDto,
  RatingResponseDto,
  GetRatingsDto,
  PaginatedRatingsResponseDto,
  RatingSummaryDto,
  CreateFeedbackDto,
  UpdateFeedbackDto,
  FeedbackResponseDto,
  GetFeedbackDto,
  PaginatedFeedbackResponseDto,
  DisputeRatingDto,
  DisputeResponseDto,
} from '../dtos';

@ApiTags('Rating & Feedback Management')
@Controller('ratings')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class RatingController {
  constructor(private readonly ratingService: RatingService) {}

  // Rating Management
  @Post()
  @Roles('CUSTOMER', 'DRIVER', 'ADMIN')
  @ApiOperation({ summary: 'Create rating' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Rating created successfully',
    type: RatingResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid rating data',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Cannot rate this order or rider',
  })
  async createRating(
    @Request() req: any,
    @Body() createRatingDto: CreateRatingDto,
  ): Promise<RatingResponseDto> {
    const raterId = req.user.id;
    const raterRole = req.user.role;
    return this.ratingService.createRating(raterId, raterRole, createRatingDto);
  }

  @Get()
  @Roles('DRIVER')
  @ApiOperation({ summary: 'Get rider ratings' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Ratings retrieved successfully',
    type: PaginatedRatingsResponseDto,
  })
  async getRiderRatings(
    @Request() req: any,
    @Query() getRatingsDto: GetRatingsDto,
  ): Promise<PaginatedRatingsResponseDto> {
    const riderId = req.user.id;
    return this.ratingService.getRiderRatings(riderId, getRatingsDto);
  }

  @Get(':ratingId')
  @Roles('DRIVER', 'CUSTOMER', 'ADMIN', 'SUPPORT')
  @ApiOperation({ summary: 'Get rating by ID' })
  @ApiParam({ name: 'ratingId', description: 'Rating ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Rating retrieved successfully',
    type: RatingResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Rating not found',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Access denied',
  })
  async getRatingById(
    @Request() req: any,
    @Param('ratingId') ratingId: string,
  ): Promise<RatingResponseDto> {
    const userId = req.user.id;
    const userRole = req.user.role;
    return this.ratingService.getRatingById(ratingId, userId, userRole);
  }

  @Put(':ratingId')
  @Roles('CUSTOMER', 'DRIVER')
  @ApiOperation({ summary: 'Update rating' })
  @ApiParam({ name: 'ratingId', description: 'Rating ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Rating updated successfully',
    type: RatingResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Rating not found',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Cannot update this rating',
  })
  async updateRating(
    @Request() req: any,
    @Param('ratingId') ratingId: string,
    @Body() updateRatingDto: UpdateRatingDto,
  ): Promise<RatingResponseDto> {
    const userId = req.user.id;
    return this.ratingService.updateRating(ratingId, userId, updateRatingDto);
  }

  @Get('summary/overall')
  @Roles('DRIVER')
  @ApiOperation({ summary: 'Get rider rating summary' })
  @ApiQuery({ name: 'period', description: 'Summary period', required: false })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Rating summary retrieved successfully',
    type: RatingSummaryDto,
  })
  async getRiderRatingSummary(
    @Request() req: any,
    @Query('period') period: 'all' | 'monthly' | 'weekly' = 'all',
  ): Promise<RatingSummaryDto> {
    const riderId = req.user.id;
    return this.ratingService.getRiderRatingSummary(riderId, period);
  }

  @Get('analytics/trends')
  @Roles('DRIVER')
  @ApiOperation({ summary: 'Get rating trends analytics' })
  @ApiQuery({ name: 'period', description: 'Analysis period', required: false })
  @ApiQuery({ name: 'category', description: 'Rating category filter', required: false })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Rating trends retrieved successfully',
  })
  async getRatingTrends(
    @Request() req: any,
    @Query('period') period: 'weekly' | 'monthly' | 'quarterly' = 'monthly',
    @Query('category') category?: string,
  ): Promise<any> {
    const riderId = req.user.id;
    return this.ratingService.getRatingTrends(riderId, period, category);
  }

  @Get('categories/breakdown')
  @Roles('DRIVER')
  @ApiOperation({ summary: 'Get rating category breakdown' })
  @ApiQuery({ name: 'startDate', description: 'Start date (YYYY-MM-DD)', required: false })
  @ApiQuery({ name: 'endDate', description: 'End date (YYYY-MM-DD)', required: false })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Rating category breakdown retrieved successfully',
  })
  async getRatingCategoryBreakdown(
    @Request() req: any,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<any> {
    const riderId = req.user.id;
    return this.ratingService.getRatingCategoryBreakdown(
      riderId,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }

  @Get('improvement/suggestions')
  @Roles('DRIVER')
  @ApiOperation({ summary: 'Get rating improvement suggestions' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Improvement suggestions retrieved successfully',
  })
  async getRatingImprovementSuggestions(@Request() req: any): Promise<any> {
    const riderId = req.user.id;
    return this.ratingService.getRatingImprovementSuggestions(riderId);
  }

  // Feedback Management
  @Post('feedback')
  @Roles('DRIVER', 'CUSTOMER', 'ADMIN')
  @ApiOperation({ summary: 'Create feedback' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Feedback created successfully',
    type: FeedbackResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid feedback data',
  })
  async createFeedback(
    @Request() req: any,
    @Body() createFeedbackDto: CreateFeedbackDto,
  ): Promise<FeedbackResponseDto> {
    const userId = req.user.id;
    const userRole = req.user.role;
    return this.ratingService.createFeedback(userId, userRole, createFeedbackDto);
  }

  @Get('feedback')
  @Roles('DRIVER')
  @ApiOperation({ summary: 'Get rider feedback' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Feedback retrieved successfully',
    type: PaginatedFeedbackResponseDto,
  })
  async getRiderFeedback(
    @Request() req: any,
    @Query() getFeedbackDto: GetFeedbackDto,
  ): Promise<PaginatedFeedbackResponseDto> {
    const riderId = req.user.id;
    return this.ratingService.getRiderFeedback(riderId, getFeedbackDto);
  }

  @Get('feedback/:feedbackId')
  @Roles('DRIVER', 'CUSTOMER', 'ADMIN', 'SUPPORT')
  @ApiOperation({ summary: 'Get feedback by ID' })
  @ApiParam({ name: 'feedbackId', description: 'Feedback ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Feedback retrieved successfully',
    type: FeedbackResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Feedback not found',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Access denied',
  })
  async getFeedbackById(
    @Request() req: any,
    @Param('feedbackId') feedbackId: string,
  ): Promise<FeedbackResponseDto> {
    const userId = req.user.id;
    const userRole = req.user.role;
    return this.ratingService.getFeedbackById(feedbackId, userId, userRole);
  }

  @Put('feedback/:feedbackId')
  @Roles('DRIVER', 'CUSTOMER', 'ADMIN', 'SUPPORT')
  @ApiOperation({ summary: 'Update feedback' })
  @ApiParam({ name: 'feedbackId', description: 'Feedback ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Feedback updated successfully',
    type: FeedbackResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Feedback not found',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Access denied',
  })
  async updateFeedback(
    @Request() req: any,
    @Param('feedbackId') feedbackId: string,
    @Body() updateFeedbackDto: UpdateFeedbackDto,
  ): Promise<FeedbackResponseDto> {
    const userId = req.user.id;
    const userRole = req.user.role;
    return this.ratingService.updateFeedback(feedbackId, userId, userRole, updateFeedbackDto);
  }

  @Get('feedback/analytics/sentiment')
  @Roles('DRIVER')
  @ApiOperation({ summary: 'Get feedback sentiment analysis' })
  @ApiQuery({ name: 'period', description: 'Analysis period', required: false })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Feedback sentiment analysis retrieved successfully',
  })
  async getFeedbackSentimentAnalysis(
    @Request() req: any,
    @Query('period') period: 'weekly' | 'monthly' | 'quarterly' = 'monthly',
  ): Promise<any> {
    const riderId = req.user.id;
    return this.ratingService.getFeedbackSentimentAnalysis(riderId, period);
  }

  @Get('feedback/common/themes')
  @Roles('DRIVER')
  @ApiOperation({ summary: 'Get common feedback themes' })
  @ApiQuery({ name: 'limit', description: 'Number of themes to return', required: false })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Common feedback themes retrieved successfully',
  })
  async getCommonFeedbackThemes(
    @Request() req: any,
    @Query('limit') limit: number = 10,
  ): Promise<any> {
    const riderId = req.user.id;
    return this.ratingService.getCommonFeedbackThemes(riderId, limit);
  }

  // Rating Disputes
  @Post(':ratingId/dispute')
  @Roles('DRIVER')
  @ApiOperation({ summary: 'Dispute rating' })
  @ApiParam({ name: 'ratingId', description: 'Rating ID' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Rating dispute created successfully',
    type: DisputeResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Rating not found',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Cannot dispute this rating',
  })
  async disputeRating(
    @Request() req: any,
    @Param('ratingId') ratingId: string,
    @Body() disputeRatingDto: DisputeRatingDto,
  ): Promise<DisputeResponseDto> {
    const riderId = req.user.id;
    return this.ratingService.disputeRating(ratingId, riderId, disputeRatingDto);
  }

  @Get('disputes')
  @Roles('DRIVER')
  @ApiOperation({ summary: 'Get rider rating disputes' })
  @ApiQuery({ name: 'status', description: 'Filter by dispute status', required: false })
  @ApiQuery({ name: 'page', description: 'Page number', required: false })
  @ApiQuery({ name: 'limit', description: 'Items per page', required: false })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Rating disputes retrieved successfully',
    type: [DisputeResponseDto],
  })
  async getRiderRatingDisputes(
    @Request() req: any,
    @Query('status') status?: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ): Promise<DisputeResponseDto[]> {
    const riderId = req.user.id;
    return this.ratingService.getRiderRatingDisputes(riderId, { status, page, limit });
  }

  @Get('disputes/:disputeId')
  @Roles('DRIVER', 'ADMIN', 'SUPPORT')
  @ApiOperation({ summary: 'Get rating dispute by ID' })
  @ApiParam({ name: 'disputeId', description: 'Dispute ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Rating dispute retrieved successfully',
    type: DisputeResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Dispute not found',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Access denied',
  })
  async getRatingDisputeById(
    @Request() req: any,
    @Param('disputeId') disputeId: string,
  ): Promise<DisputeResponseDto> {
    const userId = req.user.id;
    const userRole = req.user.role;
    return this.ratingService.getRatingDisputeById(disputeId, userId, userRole);
  }

  // Admin/Support Endpoints
  @Get('search/all')
  @Roles('ADMIN', 'SUPPORT')
  @ApiOperation({ summary: 'Search all ratings (Admin only)' })
  @ApiQuery({ name: 'riderId', description: 'Filter by rider ID', required: false })
  @ApiQuery({ name: 'raterId', description: 'Filter by rater ID', required: false })
  @ApiQuery({ name: 'orderId', description: 'Filter by order ID', required: false })
  @ApiQuery({ name: 'category', description: 'Filter by rating category', required: false })
  @ApiQuery({ name: 'minRating', description: 'Filter by minimum rating', required: false })
  @ApiQuery({ name: 'maxRating', description: 'Filter by maximum rating', required: false })
  @ApiQuery({ name: 'startDate', description: 'Filter by start date', required: false })
  @ApiQuery({ name: 'endDate', description: 'Filter by end date', required: false })
  @ApiQuery({ name: 'page', description: 'Page number', required: false })
  @ApiQuery({ name: 'limit', description: 'Items per page', required: false })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Ratings retrieved successfully',
    type: PaginatedRatingsResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Access denied',
  })
  async searchAllRatings(
    @Query('riderId') riderId?: string,
    @Query('raterId') raterId?: string,
    @Query('orderId') orderId?: string,
    @Query('category') category?: string,
    @Query('minRating') minRating?: number,
    @Query('maxRating') maxRating?: number,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ): Promise<PaginatedRatingsResponseDto> {
    return this.ratingService.searchAllRatings({
      riderId,
      raterId,
      orderId,
      category,
      minRating,
      maxRating,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      page,
      limit,
    });
  }

  @Get('feedback/search/all')
  @Roles('ADMIN', 'SUPPORT')
  @ApiOperation({ summary: 'Search all feedback (Admin only)' })
  @ApiQuery({ name: 'riderId', description: 'Filter by rider ID', required: false })
  @ApiQuery({ name: 'providerId', description: 'Filter by feedback provider ID', required: false })
  @ApiQuery({ name: 'type', description: 'Filter by feedback type', required: false })
  @ApiQuery({ name: 'priority', description: 'Filter by feedback priority', required: false })
  @ApiQuery({ name: 'status', description: 'Filter by feedback status', required: false })
  @ApiQuery({ name: 'startDate', description: 'Filter by start date', required: false })
  @ApiQuery({ name: 'endDate', description: 'Filter by end date', required: false })
  @ApiQuery({ name: 'page', description: 'Page number', required: false })
  @ApiQuery({ name: 'limit', description: 'Items per page', required: false })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Feedback retrieved successfully',
    type: PaginatedFeedbackResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Access denied',
  })
  async searchAllFeedback(
    @Query('riderId') riderId?: string,
    @Query('providerId') providerId?: string,
    @Query('type') type?: string,
    @Query('priority') priority?: string,
    @Query('status') status?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ): Promise<PaginatedFeedbackResponseDto> {
    return this.ratingService.searchAllFeedback({
      riderId,
      providerId,
      type,
      priority,
      status,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      page,
      limit,
    });
  }

  @Get('disputes/search/all')
  @Roles('ADMIN', 'SUPPORT')
  @ApiOperation({ summary: 'Search all rating disputes (Admin only)' })
  @ApiQuery({ name: 'riderId', description: 'Filter by rider ID', required: false })
  @ApiQuery({ name: 'ratingId', description: 'Filter by rating ID', required: false })
  @ApiQuery({ name: 'status', description: 'Filter by dispute status', required: false })
  @ApiQuery({ name: 'startDate', description: 'Filter by start date', required: false })
  @ApiQuery({ name: 'endDate', description: 'Filter by end date', required: false })
  @ApiQuery({ name: 'page', description: 'Page number', required: false })
  @ApiQuery({ name: 'limit', description: 'Items per page', required: false })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Rating disputes retrieved successfully',
    type: [DisputeResponseDto],
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Access denied',
  })
  async searchAllRatingDisputes(
    @Query('riderId') riderId?: string,
    @Query('ratingId') ratingId?: string,
    @Query('status') status?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ): Promise<DisputeResponseDto[]> {
    return this.ratingService.searchAllRatingDisputes({
      riderId,
      ratingId,
      status,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      page,
      limit,
    });
  }

  @Get('statistics/overview')
  @Roles('ADMIN', 'SUPPORT')
  @ApiOperation({ summary: 'Get rating statistics overview (Admin only)' })
  @ApiQuery({ name: 'period', description: 'Statistics period', required: false })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Rating statistics retrieved successfully',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Access denied',
  })
  async getRatingStatistics(
    @Query('period') period: 'daily' | 'weekly' | 'monthly' = 'daily',
  ): Promise<any> {
    return this.ratingService.getRatingStatistics(period);
  }

  @Put('disputes/:disputeId/resolve')
  @Roles('ADMIN', 'SUPPORT')
  @ApiOperation({ summary: 'Resolve rating dispute (Admin only)' })
  @ApiParam({ name: 'disputeId', description: 'Dispute ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Rating dispute resolved successfully',
    type: DisputeResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Dispute not found',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Access denied',
  })
  async resolveRatingDispute(
    @Request() req: any,
    @Param('disputeId') disputeId: string,
    @Body() resolutionData: {
      resolution: string;
      adjustedRating?: number;
      notes?: string;
    },
  ): Promise<DisputeResponseDto> {
    const resolvedBy = req.user.id;
    return this.ratingService.resolveRatingDispute(disputeId, resolvedBy, resolutionData);
  }

  @Put('feedback/:feedbackId/respond')
  @Roles('ADMIN', 'SUPPORT')
  @ApiOperation({ summary: 'Respond to feedback (Admin only)' })
  @ApiParam({ name: 'feedbackId', description: 'Feedback ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Feedback response added successfully',
    type: FeedbackResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Feedback not found',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Access denied',
  })
  async respondToFeedback(
    @Request() req: any,
    @Param('feedbackId') feedbackId: string,
    @Body() responseData: { response: string; actionTaken?: string },
  ): Promise<FeedbackResponseDto> {
    const respondedBy = req.user.id;
    return this.ratingService.respondToFeedback(feedbackId, respondedBy, responseData);
  }

  @Get('export/data')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Export rating data (Admin only)' })
  @ApiQuery({ name: 'format', description: 'Export format (csv, xlsx)', required: false })
  @ApiQuery({ name: 'type', description: 'Export type (ratings, feedback, disputes)', required: false })
  @ApiQuery({ name: 'filters', description: 'Export filters', required: false })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Rating data exported successfully',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Access denied',
  })
  async exportRatingData(
    @Query('format') format: 'csv' | 'xlsx' = 'csv',
    @Query('type') type: 'ratings' | 'feedback' | 'disputes' = 'ratings',
    @Query('filters') filters?: string,
  ): Promise<any> {
    const parsedFilters = filters ? JSON.parse(filters) : {};
    return this.ratingService.exportRatingData(format, type, parsedFilters);
  }
}