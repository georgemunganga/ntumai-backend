import { ShiftService } from '../../application/services/shift.service';
import { StartShiftDto, EndShiftDto, PauseShiftDto, ResumeShiftDto, UpdateLocationDto, GetShiftsQueryDto, GetSummaryQueryDto, BulkEndShiftsDto, ShiftResponseDto, ShiftSummaryDto, ShiftPerformanceDto, HeatmapDataPointDto, ShiftStatisticsDto } from '../../application/dtos/shift.dto';
export declare class ShiftController {
    private readonly shiftService;
    constructor(shiftService: ShiftService);
    startShift(req: any, dto: StartShiftDto): Promise<ShiftResponseDto>;
    endShift(req: any, shiftId: string, dto: EndShiftDto): Promise<ShiftResponseDto>;
    pauseShift(req: any, shiftId: string, dto: PauseShiftDto): Promise<ShiftResponseDto>;
    resumeShift(req: any, shiftId: string, dto: ResumeShiftDto): Promise<ShiftResponseDto>;
    getCurrentShift(req: any): Promise<ShiftResponseDto | null>;
    getShifts(req: any, query: GetShiftsQueryDto): Promise<any>;
    getShiftById(req: any, shiftId: string): Promise<ShiftResponseDto>;
    updateLocation(req: any, shiftId: string, dto: UpdateLocationDto): Promise<ShiftResponseDto>;
    getDailySummary(req: any, query: GetSummaryQueryDto): Promise<ShiftSummaryDto>;
    getWeeklySummary(req: any): Promise<ShiftSummaryDto>;
    getMonthlySummary(req: any): Promise<ShiftSummaryDto>;
    getPerformanceAnalytics(req: any): Promise<ShiftPerformanceDto>;
    searchAllShifts(query: GetShiftsQueryDto): Promise<any>;
    getStatisticsOverview(): Promise<ShiftStatisticsDto>;
    getActiveCount(): Promise<{
        count: number;
    }>;
    bulkEndShifts(dto: BulkEndShiftsDto): Promise<{
        ended_count: number;
    }>;
    exportData(req: any): Promise<any[]>;
    getHeatmapData(): Promise<HeatmapDataPointDto[]>;
}
