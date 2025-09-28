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
import { ShiftService } from '../../application/services/shift.service';
import {
  StartShiftDto,
  EndShiftDto,
  PauseShiftDto,
  ResumeShiftDto,
  UpdateShiftLocationDto,
  ShiftResponseDto,
  GetShiftsDto,
  PaginatedShiftsResponseDto,
  ShiftSummaryDto,
  GetShiftSummaryDto,
  ShiftAnalyticsDto,
} from '../dtos';

@ApiTags('Shift Management')
@Controller('shifts')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class ShiftController {
  constructor(private readonly shiftService: ShiftService) {}

  @Post('start')
  @Roles('DRIVER')
  @ApiOperation({ summary: 'Start a new shift' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Shift started successfully',
    type: ShiftResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Cannot start shift - rider has active shift or invalid data',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Rider not eligible to start shift',
  })
  async startShift(
    @Request() req: any,
    @Body() startShiftDto: StartShiftDto,
  ): Promise<ShiftResponseDto> {
    const riderId = req.user.id;
    return this.shiftService.startShift(riderId, startShiftDto);
  }

  @Post(':shiftId/end')
  @Roles('DRIVER')
  @ApiOperation({ summary: 'End current shift' })
  @ApiParam({ name: 'shiftId', description: 'Shift ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Shift ended successfully',
    type: ShiftResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Shift not found',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Cannot end shift - shift not active or has pending orders',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Cannot end shift owned by another rider',
  })
  async endShift(
    @Request() req: any,
    @Param('shiftId') shiftId: string,
    @Body() endShiftDto: EndShiftDto,
  ): Promise<ShiftResponseDto> {
    const riderId = req.user.id;
    return this.shiftService.endShift(shiftId, riderId, endShiftDto);
  }

  @Post(':shiftId/pause')
  @Roles('DRIVER')
  @ApiOperation({ summary: 'Pause current shift' })
  @ApiParam({ name: 'shiftId', description: 'Shift ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Shift paused successfully',
    type: ShiftResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Shift not found',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Cannot pause shift - shift not active',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Cannot pause shift owned by another rider',
  })
  async pauseShift(
    @Request() req: any,
    @Param('shiftId') shiftId: string,
    @Body() pauseShiftDto: PauseShiftDto,
  ): Promise<ShiftResponseDto> {
    const riderId = req.user.id;
    return this.shiftService.pauseShift(shiftId, riderId, pauseShiftDto);
  }

  @Post(':shiftId/resume')
  @Roles('DRIVER')
  @ApiOperation({ summary: 'Resume paused shift' })
  @ApiParam({ name: 'shiftId', description: 'Shift ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Shift resumed successfully',
    type: ShiftResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Shift not found',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Cannot resume shift - shift not paused',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Cannot resume shift owned by another rider',
  })
  async resumeShift(
    @Request() req: any,
    @Param('shiftId') shiftId: string,
    @Body() resumeShiftDto: ResumeShiftDto,
  ): Promise<ShiftResponseDto> {
    const riderId = req.user.id;
    return this.shiftService.resumeShift(shiftId, riderId, resumeShiftDto);
  }

  @Get('current')
  @Roles('DRIVER')
  @ApiOperation({ summary: 'Get current active shift' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Current shift retrieved successfully',
    type: ShiftResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'No active shift found',
  })
  async getCurrentShift(@Request() req: any): Promise<ShiftResponseDto> {
    const riderId = req.user.id;
    return this.shiftService.getCurrentShift(riderId);
  }

  @Get()
  @Roles('DRIVER')
  @ApiOperation({ summary: 'Get rider shift history' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Shifts retrieved successfully',
    type: PaginatedShiftsResponseDto,
  })
  async getRiderShifts(
    @Request() req: any,
    @Query() getShiftsDto: GetShiftsDto,
  ): Promise<PaginatedShiftsResponseDto> {
    const riderId = req.user.id;
    return this.shiftService.getRiderShifts(riderId, getShiftsDto);
  }

  @Get(':shiftId')
  @Roles('DRIVER', 'ADMIN', 'SUPPORT')
  @ApiOperation({ summary: 'Get shift by ID' })
  @ApiParam({ name: 'shiftId', description: 'Shift ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Shift retrieved successfully',
    type: ShiftResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Shift not found',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Access denied',
  })
  async getShiftById(
    @Request() req: any,
    @Param('shiftId') shiftId: string,
  ): Promise<ShiftResponseDto> {
    const riderId = req.user.role === 'DRIVER' ? req.user.id : undefined;
    return this.shiftService.getShiftById(shiftId, riderId);
  }

  @Put(':shiftId/location')
  @Roles('DRIVER')
  @ApiOperation({ summary: 'Update shift location' })
  @ApiParam({ name: 'shiftId', description: 'Shift ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Shift location updated successfully',
    type: ShiftResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Shift not found',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Cannot update location - shift not active',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Cannot update location for shift owned by another rider',
  })
  async updateShiftLocation(
    @Request() req: any,
    @Param('shiftId') shiftId: string,
    @Body() updateLocationDto: UpdateShiftLocationDto,
  ): Promise<ShiftResponseDto> {
    const riderId = req.user.id;
    return this.shiftService.updateShiftLocation(shiftId, riderId, updateLocationDto);
  }

  @Get('summary/daily')
  @Roles('DRIVER')
  @ApiOperation({ summary: 'Get daily shift summary' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Daily shift summary retrieved successfully',
    type: ShiftSummaryDto,
  })
  async getDailyShiftSummary(
    @Request() req: any,
    @Query() getSummaryDto: GetShiftSummaryDto,
  ): Promise<ShiftSummaryDto> {
    const riderId = req.user.id;
    return this.shiftService.getDailyShiftSummary(riderId, getSummaryDto);
  }

  @Get('summary/weekly')
  @Roles('DRIVER')
  @ApiOperation({ summary: 'Get weekly shift summary' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Weekly shift summary retrieved successfully',
    type: ShiftSummaryDto,
  })
  async getWeeklyShiftSummary(
    @Request() req: any,
    @Query() getSummaryDto: GetShiftSummaryDto,
  ): Promise<ShiftSummaryDto> {
    const riderId = req.user.id;
    return this.shiftService.getWeeklyShiftSummary(riderId, getSummaryDto);
  }

  @Get('summary/monthly')
  @Roles('DRIVER')
  @ApiOperation({ summary: 'Get monthly shift summary' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Monthly shift summary retrieved successfully',
    type: ShiftSummaryDto,
  })
  async getMonthlyShiftSummary(
    @Request() req: any,
    @Query() getSummaryDto: GetShiftSummaryDto,
  ): Promise<ShiftSummaryDto> {
    const riderId = req.user.id;
    return this.shiftService.getMonthlyShiftSummary(riderId, getSummaryDto);
  }

  @Get('analytics/performance')
  @Roles('DRIVER')
  @ApiOperation({ summary: 'Get shift performance analytics' })
  @ApiQuery({ name: 'period', description: 'Analytics period (daily, weekly, monthly)', required: false })
  @ApiQuery({ name: 'startDate', description: 'Start date for analytics', required: false })
  @ApiQuery({ name: 'endDate', description: 'End date for analytics', required: false })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Shift analytics retrieved successfully',
    type: ShiftAnalyticsDto,
  })
  async getShiftAnalytics(
    @Request() req: any,
    @Query('period') period: 'daily' | 'weekly' | 'monthly' = 'weekly',
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<ShiftAnalyticsDto> {
    const riderId = req.user.id;
    return this.shiftService.getShiftAnalytics(riderId, {
      period,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    });
  }

  @Get('search/all')
  @Roles('ADMIN', 'SUPPORT')
  @ApiOperation({ summary: 'Search all shifts (Admin only)' })
  @ApiQuery({ name: 'riderId', description: 'Filter by rider ID', required: false })
  @ApiQuery({ name: 'status', description: 'Filter by shift status', required: false })
  @ApiQuery({ name: 'startDate', description: 'Filter by start date', required: false })
  @ApiQuery({ name: 'endDate', description: 'Filter by end date', required: false })
  @ApiQuery({ name: 'page', description: 'Page number', required: false })
  @ApiQuery({ name: 'limit', description: 'Items per page', required: false })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Shifts retrieved successfully',
    type: PaginatedShiftsResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Access denied',
  })
  async searchAllShifts(
    @Query('riderId') riderId?: string,
    @Query('status') status?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ): Promise<PaginatedShiftsResponseDto> {
    return this.shiftService.searchAllShifts({
      riderId,
      status,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      page,
      limit,
    });
  }

  @Get('statistics/overview')
  @Roles('ADMIN', 'SUPPORT')
  @ApiOperation({ summary: 'Get shift statistics overview (Admin only)' })
  @ApiQuery({ name: 'period', description: 'Statistics period', required: false })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Shift statistics retrieved successfully',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Access denied',
  })
  async getShiftStatistics(
    @Query('period') period: 'daily' | 'weekly' | 'monthly' = 'daily',
  ): Promise<any> {
    return this.shiftService.getShiftStatistics(period);
  }

  @Get('active/count')
  @Roles('ADMIN', 'SUPPORT')
  @ApiOperation({ summary: 'Get active shifts count (Admin only)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Active shifts count retrieved successfully',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Access denied',
  })
  async getActiveShiftsCount(): Promise<{ count: number; riders: any[] }> {
    return this.shiftService.getActiveShiftsCount();
  }

  @Post('bulk-end')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Bulk end shifts (Admin only)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Shifts ended successfully',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Access denied',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid bulk end data',
  })
  async bulkEndShifts(
    @Body() bulkEndData: {
      shiftIds: string[];
      reason: string;
      endLocation?: { latitude: number; longitude: number };
    },
  ): Promise<{ ended: number; failed: string[] }> {
    return this.shiftService.bulkEndShifts(bulkEndData);
  }

  @Get('export/data')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Export shift data (Admin only)' })
  @ApiQuery({ name: 'format', description: 'Export format (csv, xlsx)', required: false })
  @ApiQuery({ name: 'filters', description: 'Export filters', required: false })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Shift data exported successfully',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Access denied',
  })
  async exportShifts(
    @Query('format') format: 'csv' | 'xlsx' = 'csv',
    @Query('filters') filters?: string,
  ): Promise<any> {
    const parsedFilters = filters ? JSON.parse(filters) : {};
    return this.shiftService.exportShifts(format, parsedFilters);
  }

  @Get('heatmap/data')
  @Roles('ADMIN', 'SUPPORT')
  @ApiOperation({ summary: 'Get shift heatmap data (Admin only)' })
  @ApiQuery({ name: 'period', description: 'Heatmap period', required: false })
  @ApiQuery({ name: 'city', description: 'Filter by city', required: false })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Shift heatmap data retrieved successfully',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Access denied',
  })
  async getShiftHeatmapData(
    @Query('period') period: 'daily' | 'weekly' | 'monthly' = 'daily',
    @Query('city') city?: string,
  ): Promise<any> {
    return this.shiftService.getShiftHeatmapData(period, city);
  }
}