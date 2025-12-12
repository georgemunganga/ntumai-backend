import {
  Controller,
  Post,
  Get,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ShiftService } from '../../application/services/shift.service';
import {
  StartShiftDto,
  EndShiftDto,
  PauseShiftDto,
  ResumeShiftDto,
  UpdateLocationDto,
  GetShiftsQueryDto,
  GetSummaryQueryDto,
  BulkEndShiftsDto,
  ShiftResponseDto,
  ShiftSummaryDto,
  ShiftPerformanceDto,
  HeatmapDataPointDto,
  ShiftStatisticsDto,
} from '../../application/dtos/shift.dto';
import { JwtAuthGuard } from '../../../auth/infrastructure/guards/jwt-auth.guard';

@ApiTags('Shifts')
@Controller('shifts')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ShiftController {
  constructor(private readonly shiftService: ShiftService) {}

  @Post('start')
  @ApiOperation({ summary: 'Start a new shift' })
  @ApiResponse({
    status: 201,
    description: 'Shift started successfully',
    type: ShiftResponseDto,
  })
  async startShift(
    @Req() req: any,
    @Body() dto: StartShiftDto,
  ): Promise<ShiftResponseDto> {
    return this.shiftService.startShift(req.user.userId, dto);
  }

  @Post(':shiftId/end')
  @ApiOperation({ summary: 'End a shift' })
  @ApiResponse({
    status: 200,
    description: 'Shift ended successfully',
    type: ShiftResponseDto,
  })
  async endShift(
    @Req() req: any,
    @Param('shiftId') shiftId: string,
    @Body() dto: EndShiftDto,
  ): Promise<ShiftResponseDto> {
    return this.shiftService.endShift(shiftId, req.user.userId);
  }

  @Post(':shiftId/pause')
  @ApiOperation({ summary: 'Pause a shift' })
  @ApiResponse({
    status: 200,
    description: 'Shift paused successfully',
    type: ShiftResponseDto,
  })
  async pauseShift(
    @Req() req: any,
    @Param('shiftId') shiftId: string,
    @Body() dto: PauseShiftDto,
  ): Promise<ShiftResponseDto> {
    return this.shiftService.pauseShift(shiftId, req.user.userId);
  }

  @Post(':shiftId/resume')
  @ApiOperation({ summary: 'Resume a paused shift' })
  @ApiResponse({
    status: 200,
    description: 'Shift resumed successfully',
    type: ShiftResponseDto,
  })
  async resumeShift(
    @Req() req: any,
    @Param('shiftId') shiftId: string,
    @Body() dto: ResumeShiftDto,
  ): Promise<ShiftResponseDto> {
    return this.shiftService.resumeShift(
      shiftId,
      req.user.userId,
      dto.current_location,
    );
  }

  @Get('current')
  @ApiOperation({ summary: 'Get current active shift' })
  @ApiResponse({
    status: 200,
    description: 'Current shift retrieved',
    type: ShiftResponseDto,
  })
  async getCurrentShift(@Req() req: any): Promise<ShiftResponseDto | null> {
    return this.shiftService.getCurrentShift(req.user.userId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all shifts for the rider' })
  @ApiResponse({ status: 200, description: 'Shifts retrieved successfully' })
  async getShifts(
    @Req() req: any,
    @Query() query: GetShiftsQueryDto,
  ): Promise<any> {
    return this.shiftService.getShifts(req.user.userId, query);
  }

  @Get(':shiftId')
  @ApiOperation({ summary: 'Get shift by ID' })
  @ApiResponse({
    status: 200,
    description: 'Shift retrieved successfully',
    type: ShiftResponseDto,
  })
  async getShiftById(
    @Req() req: any,
    @Param('shiftId') shiftId: string,
  ): Promise<ShiftResponseDto> {
    return this.shiftService.getShiftById(shiftId, req.user.userId);
  }

  @Put(':shiftId/location')
  @ApiOperation({ summary: 'Update shift location' })
  @ApiResponse({
    status: 200,
    description: 'Location updated successfully',
    type: ShiftResponseDto,
  })
  async updateLocation(
    @Req() req: any,
    @Param('shiftId') shiftId: string,
    @Body() dto: UpdateLocationDto,
  ): Promise<ShiftResponseDto> {
    return this.shiftService.updateLocation(shiftId, req.user.userId, dto);
  }

  @Get('summary/daily')
  @ApiOperation({ summary: 'Get daily shift summary' })
  @ApiResponse({
    status: 200,
    description: 'Daily summary retrieved',
    type: ShiftSummaryDto,
  })
  async getDailySummary(
    @Req() req: any,
    @Query() query: GetSummaryQueryDto,
  ): Promise<ShiftSummaryDto> {
    return this.shiftService.getDailySummary(req.user.userId, query.date);
  }

  @Get('summary/weekly')
  @ApiOperation({ summary: 'Get weekly shift summary' })
  @ApiResponse({
    status: 200,
    description: 'Weekly summary retrieved',
    type: ShiftSummaryDto,
  })
  async getWeeklySummary(@Req() req: any): Promise<ShiftSummaryDto> {
    return this.shiftService.getWeeklySummary(req.user.userId);
  }

  @Get('summary/monthly')
  @ApiOperation({ summary: 'Get monthly shift summary' })
  @ApiResponse({
    status: 200,
    description: 'Monthly summary retrieved',
    type: ShiftSummaryDto,
  })
  async getMonthlySummary(@Req() req: any): Promise<ShiftSummaryDto> {
    return this.shiftService.getMonthlySummary(req.user.userId);
  }

  @Get('analytics/performance')
  @ApiOperation({ summary: 'Get performance analytics' })
  @ApiResponse({
    status: 200,
    description: 'Performance analytics retrieved',
    type: ShiftPerformanceDto,
  })
  async getPerformanceAnalytics(@Req() req: any): Promise<ShiftPerformanceDto> {
    return this.shiftService.getPerformanceAnalytics(req.user.userId);
  }

  @Get('search/all')
  @ApiOperation({ summary: 'Search all shifts (admin)' })
  @ApiResponse({ status: 200, description: 'Shifts search results' })
  async searchAllShifts(@Query() query: GetShiftsQueryDto): Promise<any> {
    return this.shiftService.searchAllShifts(query);
  }

  @Get('statistics/overview')
  @ApiOperation({ summary: 'Get statistics overview (admin)' })
  @ApiResponse({
    status: 200,
    description: 'Statistics retrieved',
    type: ShiftStatisticsDto,
  })
  async getStatisticsOverview(): Promise<ShiftStatisticsDto> {
    return this.shiftService.getStatisticsOverview();
  }

  @Get('active/count')
  @ApiOperation({ summary: 'Get active shifts count' })
  @ApiResponse({ status: 200, description: 'Active count retrieved' })
  async getActiveCount(): Promise<{ count: number }> {
    return this.shiftService.getActiveCount();
  }

  @Post('bulk-end')
  @ApiOperation({ summary: 'Bulk end shifts (admin)' })
  @ApiResponse({ status: 200, description: 'Shifts ended successfully' })
  async bulkEndShifts(
    @Body() dto: BulkEndShiftsDto,
  ): Promise<{ ended_count: number }> {
    return this.shiftService.bulkEndShifts(dto.shift_ids);
  }

  @Get('export/data')
  @ApiOperation({ summary: 'Export shift data' })
  @ApiResponse({ status: 200, description: 'Data exported successfully' })
  async exportData(@Req() req: any): Promise<any[]> {
    return this.shiftService.exportData(req.user.userId);
  }

  @Get('heatmap/data')
  @ApiOperation({ summary: 'Get heatmap data for active riders' })
  @ApiResponse({
    status: 200,
    description: 'Heatmap data retrieved',
    type: [HeatmapDataPointDto],
  })
  async getHeatmapData(): Promise<HeatmapDataPointDto[]> {
    return this.shiftService.getHeatmapData();
  }
}
