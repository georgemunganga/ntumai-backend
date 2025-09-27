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
import { EarningsService } from '../../application/services/earnings.service';
import {
  CreateEarningsDto,
  UpdateEarningsDto,
  EarningsResponseDto,
  GetEarningsDto,
  PaginatedEarningsResponseDto,
  EarningsSummaryDto,
  GetEarningsSummaryDto,
  RequestPayoutDto,
  PayoutResponseDto,
  GetPayoutsDto,
  PaginatedPayoutsResponseDto,
  FinancialAnalyticsDto,
} from '../dtos';

@ApiTags('Earnings Management')
@Controller('earnings')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class EarningsController {
  constructor(private readonly earningsService: EarningsService) {}

  @Get()
  @Roles('DRIVER')
  @ApiOperation({ summary: 'Get rider earnings' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Earnings retrieved successfully',
    type: PaginatedEarningsResponseDto,
  })
  async getRiderEarnings(
    @Request() req: any,
    @Query() getEarningsDto: GetEarningsDto,
  ): Promise<PaginatedEarningsResponseDto> {
    const riderId = req.user.id;
    return this.earningsService.getRiderEarnings(riderId, getEarningsDto);
  }

  @Get('current')
  @Roles('DRIVER')
  @ApiOperation({ summary: 'Get current earnings balance' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Current earnings retrieved successfully',
    type: EarningsResponseDto,
  })
  async getCurrentEarnings(@Request() req: any): Promise<EarningsResponseDto> {
    const riderId = req.user.id;
    return this.earningsService.getCurrentEarnings(riderId);
  }

  @Get(':earningsId')
  @Roles('DRIVER', 'ADMIN', 'SUPPORT')
  @ApiOperation({ summary: 'Get earnings by ID' })
  @ApiParam({ name: 'earningsId', description: 'Earnings ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Earnings retrieved successfully',
    type: EarningsResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Earnings not found',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Access denied',
  })
  async getEarningsById(
    @Request() req: any,
    @Param('earningsId') earningsId: string,
  ): Promise<EarningsResponseDto> {
    const riderId = req.user.role === 'DRIVER' ? req.user.id : undefined;
    return this.earningsService.getEarningsById(earningsId, riderId);
  }

  @Post()
  @Roles('ADMIN', 'SYSTEM')
  @ApiOperation({ summary: 'Create earnings record (Admin/System only)' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Earnings created successfully',
    type: EarningsResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid earnings data',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Access denied',
  })
  async createEarnings(
    @Body() createEarningsDto: CreateEarningsDto,
  ): Promise<EarningsResponseDto> {
    return this.earningsService.createEarnings(createEarningsDto);
  }

  @Put(':earningsId')
  @Roles('ADMIN', 'SUPPORT')
  @ApiOperation({ summary: 'Update earnings record (Admin only)' })
  @ApiParam({ name: 'earningsId', description: 'Earnings ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Earnings updated successfully',
    type: EarningsResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Earnings not found',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Access denied',
  })
  async updateEarnings(
    @Param('earningsId') earningsId: string,
    @Body() updateEarningsDto: UpdateEarningsDto,
  ): Promise<EarningsResponseDto> {
    return this.earningsService.updateEarnings(earningsId, updateEarningsDto);
  }

  @Get('summary/daily')
  @Roles('DRIVER')
  @ApiOperation({ summary: 'Get daily earnings summary' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Daily earnings summary retrieved successfully',
    type: EarningsSummaryDto,
  })
  async getDailyEarningsSummary(
    @Request() req: any,
    @Query() getSummaryDto: GetEarningsSummaryDto,
  ): Promise<EarningsSummaryDto> {
    const riderId = req.user.id;
    return this.earningsService.getDailyEarningsSummary(riderId, getSummaryDto);
  }

  @Get('summary/weekly')
  @Roles('DRIVER')
  @ApiOperation({ summary: 'Get weekly earnings summary' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Weekly earnings summary retrieved successfully',
    type: EarningsSummaryDto,
  })
  async getWeeklyEarningsSummary(
    @Request() req: any,
    @Query() getSummaryDto: GetEarningsSummaryDto,
  ): Promise<EarningsSummaryDto> {
    const riderId = req.user.id;
    return this.earningsService.getWeeklyEarningsSummary(riderId, getSummaryDto);
  }

  @Get('summary/monthly')
  @Roles('DRIVER')
  @ApiOperation({ summary: 'Get monthly earnings summary' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Monthly earnings summary retrieved successfully',
    type: EarningsSummaryDto,
  })
  async getMonthlyEarningsSummary(
    @Request() req: any,
    @Query() getSummaryDto: GetEarningsSummaryDto,
  ): Promise<EarningsSummaryDto> {
    const riderId = req.user.id;
    return this.earningsService.getMonthlyEarningsSummary(riderId, getSummaryDto);
  }

  @Get('analytics/financial')
  @Roles('DRIVER')
  @ApiOperation({ summary: 'Get financial analytics' })
  @ApiQuery({ name: 'period', description: 'Analytics period', required: false })
  @ApiQuery({ name: 'startDate', description: 'Start date for analytics', required: false })
  @ApiQuery({ name: 'endDate', description: 'End date for analytics', required: false })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Financial analytics retrieved successfully',
    type: FinancialAnalyticsDto,
  })
  async getFinancialAnalytics(
    @Request() req: any,
    @Query('period') period: 'daily' | 'weekly' | 'monthly' = 'weekly',
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<FinancialAnalyticsDto> {
    const riderId = req.user.id;
    return this.earningsService.getFinancialAnalytics(riderId, {
      period,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    });
  }

  @Post('payouts/request')
  @Roles('DRIVER')
  @ApiOperation({ summary: 'Request payout' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Payout requested successfully',
    type: PayoutResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid payout request - insufficient balance or invalid data',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Pending payout request already exists',
  })
  async requestPayout(
    @Request() req: any,
    @Body() requestPayoutDto: RequestPayoutDto,
  ): Promise<PayoutResponseDto> {
    const riderId = req.user.id;
    return this.earningsService.requestPayout(riderId, requestPayoutDto);
  }

  @Get('payouts')
  @Roles('DRIVER')
  @ApiOperation({ summary: 'Get rider payouts' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Payouts retrieved successfully',
    type: PaginatedPayoutsResponseDto,
  })
  async getRiderPayouts(
    @Request() req: any,
    @Query() getPayoutsDto: GetPayoutsDto,
  ): Promise<PaginatedPayoutsResponseDto> {
    const riderId = req.user.id;
    return this.earningsService.getRiderPayouts(riderId, getPayoutsDto);
  }

  @Get('payouts/:payoutId')
  @Roles('DRIVER', 'ADMIN', 'SUPPORT')
  @ApiOperation({ summary: 'Get payout by ID' })
  @ApiParam({ name: 'payoutId', description: 'Payout ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Payout retrieved successfully',
    type: PayoutResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Payout not found',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Access denied',
  })
  async getPayoutById(
    @Request() req: any,
    @Param('payoutId') payoutId: string,
  ): Promise<PayoutResponseDto> {
    const riderId = req.user.role === 'DRIVER' ? req.user.id : undefined;
    return this.earningsService.getPayoutById(payoutId, riderId);
  }

  @Put('payouts/:payoutId/approve')
  @Roles('ADMIN', 'FINANCE')
  @ApiOperation({ summary: 'Approve payout (Admin only)' })
  @ApiParam({ name: 'payoutId', description: 'Payout ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Payout approved successfully',
    type: PayoutResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Payout not found',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Cannot approve payout - invalid status',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Access denied',
  })
  async approvePayout(
    @Param('payoutId') payoutId: string,
    @Body() approvalData?: { notes?: string; processedBy?: string },
  ): Promise<PayoutResponseDto> {
    return this.earningsService.approvePayout(payoutId, approvalData);
  }

  @Put('payouts/:payoutId/reject')
  @Roles('ADMIN', 'FINANCE')
  @ApiOperation({ summary: 'Reject payout (Admin only)' })
  @ApiParam({ name: 'payoutId', description: 'Payout ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Payout rejected successfully',
    type: PayoutResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Payout not found',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Cannot reject payout - invalid status',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Access denied',
  })
  async rejectPayout(
    @Param('payoutId') payoutId: string,
    @Body() rejectionData: { reason: string; notes?: string; rejectedBy?: string },
  ): Promise<PayoutResponseDto> {
    return this.earningsService.rejectPayout(payoutId, rejectionData);
  }

  @Put('payouts/:payoutId/complete')
  @Roles('ADMIN', 'FINANCE')
  @ApiOperation({ summary: 'Mark payout as completed (Admin only)' })
  @ApiParam({ name: 'payoutId', description: 'Payout ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Payout completed successfully',
    type: PayoutResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Payout not found',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Cannot complete payout - invalid status',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Access denied',
  })
  async completePayout(
    @Param('payoutId') payoutId: string,
    @Body() completionData?: {
      transactionId?: string;
      completedBy?: string;
      notes?: string;
    },
  ): Promise<PayoutResponseDto> {
    return this.earningsService.completePayout(payoutId, completionData);
  }

  @Get('search/all')
  @Roles('ADMIN', 'SUPPORT', 'FINANCE')
  @ApiOperation({ summary: 'Search all earnings (Admin only)' })
  @ApiQuery({ name: 'riderId', description: 'Filter by rider ID', required: false })
  @ApiQuery({ name: 'type', description: 'Filter by earnings type', required: false })
  @ApiQuery({ name: 'status', description: 'Filter by earnings status', required: false })
  @ApiQuery({ name: 'startDate', description: 'Filter by start date', required: false })
  @ApiQuery({ name: 'endDate', description: 'Filter by end date', required: false })
  @ApiQuery({ name: 'page', description: 'Page number', required: false })
  @ApiQuery({ name: 'limit', description: 'Items per page', required: false })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Earnings retrieved successfully',
    type: PaginatedEarningsResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Access denied',
  })
  async searchAllEarnings(
    @Query('riderId') riderId?: string,
    @Query('type') type?: string,
    @Query('status') status?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ): Promise<PaginatedEarningsResponseDto> {
    return this.earningsService.searchAllEarnings({
      riderId,
      type,
      status,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      page,
      limit,
    });
  }

  @Get('payouts/search/all')
  @Roles('ADMIN', 'SUPPORT', 'FINANCE')
  @ApiOperation({ summary: 'Search all payouts (Admin only)' })
  @ApiQuery({ name: 'riderId', description: 'Filter by rider ID', required: false })
  @ApiQuery({ name: 'status', description: 'Filter by payout status', required: false })
  @ApiQuery({ name: 'method', description: 'Filter by payout method', required: false })
  @ApiQuery({ name: 'startDate', description: 'Filter by start date', required: false })
  @ApiQuery({ name: 'endDate', description: 'Filter by end date', required: false })
  @ApiQuery({ name: 'page', description: 'Page number', required: false })
  @ApiQuery({ name: 'limit', description: 'Items per page', required: false })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Payouts retrieved successfully',
    type: PaginatedPayoutsResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Access denied',
  })
  async searchAllPayouts(
    @Query('riderId') riderId?: string,
    @Query('status') status?: string,
    @Query('method') method?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ): Promise<PaginatedPayoutsResponseDto> {
    return this.earningsService.searchAllPayouts({
      riderId,
      status,
      method,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      page,
      limit,
    });
  }

  @Get('statistics/overview')
  @Roles('ADMIN', 'SUPPORT', 'FINANCE')
  @ApiOperation({ summary: 'Get earnings statistics overview (Admin only)' })
  @ApiQuery({ name: 'period', description: 'Statistics period', required: false })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Earnings statistics retrieved successfully',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Access denied',
  })
  async getEarningsStatistics(
    @Query('period') period: 'daily' | 'weekly' | 'monthly' = 'daily',
  ): Promise<any> {
    return this.earningsService.getEarningsStatistics(period);
  }

  @Post('bulk-payout')
  @Roles('ADMIN', 'FINANCE')
  @ApiOperation({ summary: 'Process bulk payouts (Admin only)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Bulk payouts processed successfully',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Access denied',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid bulk payout data',
  })
  async processBulkPayouts(
    @Body() bulkPayoutData: {
      payoutIds: string[];
      method?: string;
      notes?: string;
    },
  ): Promise<{ processed: number; failed: string[] }> {
    return this.earningsService.processBulkPayouts(bulkPayoutData);
  }

  @Get('export/data')
  @Roles('ADMIN', 'FINANCE')
  @ApiOperation({ summary: 'Export earnings data (Admin only)' })
  @ApiQuery({ name: 'format', description: 'Export format (csv, xlsx)', required: false })
  @ApiQuery({ name: 'type', description: 'Export type (earnings, payouts)', required: false })
  @ApiQuery({ name: 'filters', description: 'Export filters', required: false })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Earnings data exported successfully',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Access denied',
  })
  async exportEarningsData(
    @Query('format') format: 'csv' | 'xlsx' = 'csv',
    @Query('type') type: 'earnings' | 'payouts' = 'earnings',
    @Query('filters') filters?: string,
  ): Promise<any> {
    const parsedFilters = filters ? JSON.parse(filters) : {};
    return this.earningsService.exportEarningsData(format, type, parsedFilters);
  }

  @Get('tax/summary')
  @Roles('DRIVER')
  @ApiOperation({ summary: 'Get tax summary for rider' })
  @ApiQuery({ name: 'year', description: 'Tax year', required: false })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Tax summary retrieved successfully',
  })
  async getTaxSummary(
    @Request() req: any,
    @Query('year') year?: number,
  ): Promise<any> {
    const riderId = req.user.id;
    const taxYear = year || new Date().getFullYear();
    return this.earningsService.getTaxSummary(riderId, taxYear);
  }

  @Get('incentives/available')
  @Roles('DRIVER')
  @ApiOperation({ summary: 'Get available incentives for rider' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Available incentives retrieved successfully',
  })
  async getAvailableIncentives(@Request() req: any): Promise<any> {
    const riderId = req.user.id;
    return this.earningsService.getAvailableIncentives(riderId);
  }
}