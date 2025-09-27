import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
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
import { PerformanceService } from '../../application/services/performance.service';
import {
  PerformanceSummaryDto,
  GetPerformanceDto,
  PerformanceGoalDto,
  CreatePerformanceGoalDto,
  UpdatePerformanceGoalDto,
  PerformanceTrendDto,
  PerformanceAnalyticsDto,
  GetPerformanceAnalyticsDto,
  PerformanceComparisonDto,
  PerformanceLeaderboardDto,
  GetPerformanceLeaderboardDto,
} from '../dtos';

@ApiTags('Performance Management')
@Controller('performance')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class PerformanceController {
  constructor(private readonly performanceService: PerformanceService) {}

  @Get('summary')
  @Roles('DRIVER')
  @ApiOperation({ summary: 'Get rider performance summary' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Performance summary retrieved successfully',
    type: PerformanceSummaryDto,
  })
  async getPerformanceSummary(
    @Request() req: any,
    @Query() getPerformanceDto: GetPerformanceDto,
  ): Promise<PerformanceSummaryDto> {
    const riderId = req.user.id;
    return this.performanceService.getPerformanceSummary(riderId, getPerformanceDto);
  }

  @Get('metrics')
  @Roles('DRIVER')
  @ApiOperation({ summary: 'Get detailed performance metrics' })
  @ApiQuery({ name: 'period', description: 'Performance period', required: false })
  @ApiQuery({ name: 'startDate', description: 'Start date for metrics', required: false })
  @ApiQuery({ name: 'endDate', description: 'End date for metrics', required: false })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Performance metrics retrieved successfully',
  })
  async getPerformanceMetrics(
    @Request() req: any,
    @Query('period') period: 'daily' | 'weekly' | 'monthly' = 'weekly',
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<any> {
    const riderId = req.user.id;
    return this.performanceService.getPerformanceMetrics(riderId, {
      period,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    });
  }

  @Get('trends')
  @Roles('DRIVER')
  @ApiOperation({ summary: 'Get performance trends' })
  @ApiQuery({ name: 'period', description: 'Trend period', required: false })
  @ApiQuery({ name: 'metricType', description: 'Metric type for trends', required: false })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Performance trends retrieved successfully',
    type: PerformanceTrendDto,
  })
  async getPerformanceTrends(
    @Request() req: any,
    @Query('period') period: 'daily' | 'weekly' | 'monthly' = 'weekly',
    @Query('metricType') metricType?: string,
  ): Promise<PerformanceTrendDto> {
    const riderId = req.user.id;
    return this.performanceService.getPerformanceTrends(riderId, { period, metricType });
  }

  @Get('analytics')
  @Roles('DRIVER')
  @ApiOperation({ summary: 'Get comprehensive performance analytics' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Performance analytics retrieved successfully',
    type: PerformanceAnalyticsDto,
  })
  async getPerformanceAnalytics(
    @Request() req: any,
    @Query() getAnalyticsDto: GetPerformanceAnalyticsDto,
  ): Promise<PerformanceAnalyticsDto> {
    const riderId = req.user.id;
    return this.performanceService.getPerformanceAnalytics(riderId, getAnalyticsDto);
  }

  @Get('comparison')
  @Roles('DRIVER')
  @ApiOperation({ summary: 'Get performance comparison with peers' })
  @ApiQuery({ name: 'period', description: 'Comparison period', required: false })
  @ApiQuery({ name: 'city', description: 'City for comparison', required: false })
  @ApiQuery({ name: 'vehicleType', description: 'Vehicle type for comparison', required: false })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Performance comparison retrieved successfully',
    type: PerformanceComparisonDto,
  })
  async getPerformanceComparison(
    @Request() req: any,
    @Query('period') period: 'daily' | 'weekly' | 'monthly' = 'weekly',
    @Query('city') city?: string,
    @Query('vehicleType') vehicleType?: string,
  ): Promise<PerformanceComparisonDto> {
    const riderId = req.user.id;
    return this.performanceService.getPerformanceComparison(riderId, {
      period,
      city,
      vehicleType,
    });
  }

  @Get('goals')
  @Roles('DRIVER')
  @ApiOperation({ summary: 'Get rider performance goals' })
  @ApiQuery({ name: 'status', description: 'Filter by goal status', required: false })
  @ApiQuery({ name: 'type', description: 'Filter by goal type', required: false })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Performance goals retrieved successfully',
    type: [PerformanceGoalDto],
  })
  async getPerformanceGoals(
    @Request() req: any,
    @Query('status') status?: string,
    @Query('type') type?: string,
  ): Promise<PerformanceGoalDto[]> {
    const riderId = req.user.id;
    return this.performanceService.getPerformanceGoals(riderId, { status, type });
  }

  @Post('goals')
  @Roles('DRIVER')
  @ApiOperation({ summary: 'Create performance goal' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Performance goal created successfully',
    type: PerformanceGoalDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid goal data',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Similar goal already exists',
  })
  async createPerformanceGoal(
    @Request() req: any,
    @Body() createGoalDto: CreatePerformanceGoalDto,
  ): Promise<PerformanceGoalDto> {
    const riderId = req.user.id;
    return this.performanceService.createPerformanceGoal(riderId, createGoalDto);
  }

  @Get('goals/:goalId')
  @Roles('DRIVER', 'ADMIN', 'SUPPORT')
  @ApiOperation({ summary: 'Get performance goal by ID' })
  @ApiParam({ name: 'goalId', description: 'Goal ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Performance goal retrieved successfully',
    type: PerformanceGoalDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Goal not found',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Access denied',
  })
  async getPerformanceGoalById(
    @Request() req: any,
    @Param('goalId') goalId: string,
  ): Promise<PerformanceGoalDto> {
    const riderId = req.user.role === 'DRIVER' ? req.user.id : undefined;
    return this.performanceService.getPerformanceGoalById(goalId, riderId);
  }

  @Put('goals/:goalId')
  @Roles('DRIVER')
  @ApiOperation({ summary: 'Update performance goal' })
  @ApiParam({ name: 'goalId', description: 'Goal ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Performance goal updated successfully',
    type: PerformanceGoalDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Goal not found',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Cannot update goal owned by another rider',
  })
  async updatePerformanceGoal(
    @Request() req: any,
    @Param('goalId') goalId: string,
    @Body() updateGoalDto: UpdatePerformanceGoalDto,
  ): Promise<PerformanceGoalDto> {
    const riderId = req.user.id;
    return this.performanceService.updatePerformanceGoal(goalId, riderId, updateGoalDto);
  }

  @Delete('goals/:goalId')
  @Roles('DRIVER')
  @ApiOperation({ summary: 'Delete performance goal' })
  @ApiParam({ name: 'goalId', description: 'Goal ID' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Performance goal deleted successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Goal not found',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Cannot delete goal owned by another rider',
  })
  @HttpCode(HttpStatus.NO_CONTENT)
  async deletePerformanceGoal(
    @Request() req: any,
    @Param('goalId') goalId: string,
  ): Promise<void> {
    const riderId = req.user.id;
    return this.performanceService.deletePerformanceGoal(goalId, riderId);
  }

  @Get('leaderboard/city')
  @Roles('DRIVER')
  @ApiOperation({ summary: 'Get city leaderboard' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'City leaderboard retrieved successfully',
    type: PerformanceLeaderboardDto,
  })
  async getCityLeaderboard(
    @Request() req: any,
    @Query() getLeaderboardDto: GetPerformanceLeaderboardDto,
  ): Promise<PerformanceLeaderboardDto> {
    const riderId = req.user.id;
    return this.performanceService.getCityLeaderboard(riderId, getLeaderboardDto);
  }

  @Get('leaderboard/global')
  @Roles('DRIVER')
  @ApiOperation({ summary: 'Get global leaderboard' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Global leaderboard retrieved successfully',
    type: PerformanceLeaderboardDto,
  })
  async getGlobalLeaderboard(
    @Query() getLeaderboardDto: GetPerformanceLeaderboardDto,
  ): Promise<PerformanceLeaderboardDto> {
    return this.performanceService.getGlobalLeaderboard(getLeaderboardDto);
  }

  @Get('ranking/current')
  @Roles('DRIVER')
  @ApiOperation({ summary: 'Get current rider ranking' })
  @ApiQuery({ name: 'scope', description: 'Ranking scope (city, global)', required: false })
  @ApiQuery({ name: 'period', description: 'Ranking period', required: false })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Current ranking retrieved successfully',
  })
  async getCurrentRanking(
    @Request() req: any,
    @Query('scope') scope: 'city' | 'global' = 'city',
    @Query('period') period: 'daily' | 'weekly' | 'monthly' = 'weekly',
  ): Promise<any> {
    const riderId = req.user.id;
    return this.performanceService.getCurrentRanking(riderId, { scope, period });
  }

  @Get('badges/earned')
  @Roles('DRIVER')
  @ApiOperation({ summary: 'Get earned performance badges' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Earned badges retrieved successfully',
  })
  async getEarnedBadges(@Request() req: any): Promise<any> {
    const riderId = req.user.id;
    return this.performanceService.getEarnedBadges(riderId);
  }

  @Get('badges/available')
  @Roles('DRIVER')
  @ApiOperation({ summary: 'Get available performance badges' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Available badges retrieved successfully',
  })
  async getAvailableBadges(@Request() req: any): Promise<any> {
    const riderId = req.user.id;
    return this.performanceService.getAvailableBadges(riderId);
  }

  @Get('insights/personalized')
  @Roles('DRIVER')
  @ApiOperation({ summary: 'Get personalized performance insights' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Personalized insights retrieved successfully',
  })
  async getPersonalizedInsights(@Request() req: any): Promise<any> {
    const riderId = req.user.id;
    return this.performanceService.getPersonalizedInsights(riderId);
  }

  @Get('recommendations/improvement')
  @Roles('DRIVER')
  @ApiOperation({ summary: 'Get performance improvement recommendations' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Improvement recommendations retrieved successfully',
  })
  async getImprovementRecommendations(@Request() req: any): Promise<any> {
    const riderId = req.user.id;
    return this.performanceService.getImprovementRecommendations(riderId);
  }

  @Get('search/all')
  @Roles('ADMIN', 'SUPPORT')
  @ApiOperation({ summary: 'Search all performance data (Admin only)' })
  @ApiQuery({ name: 'riderId', description: 'Filter by rider ID', required: false })
  @ApiQuery({ name: 'city', description: 'Filter by city', required: false })
  @ApiQuery({ name: 'period', description: 'Filter by period', required: false })
  @ApiQuery({ name: 'minRating', description: 'Minimum rating filter', required: false })
  @ApiQuery({ name: 'page', description: 'Page number', required: false })
  @ApiQuery({ name: 'limit', description: 'Items per page', required: false })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Performance data retrieved successfully',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Access denied',
  })
  async searchAllPerformance(
    @Query('riderId') riderId?: string,
    @Query('city') city?: string,
    @Query('period') period?: string,
    @Query('minRating') minRating?: number,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ): Promise<any> {
    return this.performanceService.searchAllPerformance({
      riderId,
      city,
      period,
      minRating,
      page,
      limit,
    });
  }

  @Get('statistics/overview')
  @Roles('ADMIN', 'SUPPORT')
  @ApiOperation({ summary: 'Get performance statistics overview (Admin only)' })
  @ApiQuery({ name: 'period', description: 'Statistics period', required: false })
  @ApiQuery({ name: 'city', description: 'Filter by city', required: false })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Performance statistics retrieved successfully',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Access denied',
  })
  async getPerformanceStatistics(
    @Query('period') period: 'daily' | 'weekly' | 'monthly' = 'daily',
    @Query('city') city?: string,
  ): Promise<any> {
    return this.performanceService.getPerformanceStatistics(period, city);
  }

  @Post('goals/bulk-create')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Bulk create performance goals (Admin only)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Goals created successfully',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Access denied',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid bulk creation data',
  })
  async bulkCreateGoals(
    @Body() bulkCreateData: {
      riderIds: string[];
      goalTemplate: CreatePerformanceGoalDto;
    },
  ): Promise<{ created: number; failed: string[] }> {
    return this.performanceService.bulkCreateGoals(bulkCreateData);
  }

  @Get('export/data')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Export performance data (Admin only)' })
  @ApiQuery({ name: 'format', description: 'Export format (csv, xlsx)', required: false })
  @ApiQuery({ name: 'type', description: 'Export type (summary, detailed)', required: false })
  @ApiQuery({ name: 'filters', description: 'Export filters', required: false })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Performance data exported successfully',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Access denied',
  })
  async exportPerformanceData(
    @Query('format') format: 'csv' | 'xlsx' = 'csv',
    @Query('type') type: 'summary' | 'detailed' = 'summary',
    @Query('filters') filters?: string,
  ): Promise<any> {
    const parsedFilters = filters ? JSON.parse(filters) : {};
    return this.performanceService.exportPerformanceData(format, type, parsedFilters);
  }

  @Get('benchmarks/industry')
  @Roles('DRIVER')
  @ApiOperation({ summary: 'Get industry performance benchmarks' })
  @ApiQuery({ name: 'city', description: 'City for benchmarks', required: false })
  @ApiQuery({ name: 'vehicleType', description: 'Vehicle type for benchmarks', required: false })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Industry benchmarks retrieved successfully',
  })
  async getIndustryBenchmarks(
    @Query('city') city?: string,
    @Query('vehicleType') vehicleType?: string,
  ): Promise<any> {
    return this.performanceService.getIndustryBenchmarks({ city, vehicleType });
  }

  @Get('forecast/earnings')
  @Roles('DRIVER')
  @ApiOperation({ summary: 'Get earnings forecast based on performance' })
  @ApiQuery({ name: 'period', description: 'Forecast period', required: false })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Earnings forecast retrieved successfully',
  })
  async getEarningsForecast(
    @Request() req: any,
    @Query('period') period: 'weekly' | 'monthly' = 'weekly',
  ): Promise<any> {
    const riderId = req.user.id;
    return this.performanceService.getEarningsForecast(riderId, period);
  }
}