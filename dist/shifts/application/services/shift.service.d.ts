import type { IShiftRepository } from '../../domain/repositories/shift.repository.interface';
import { StartShiftDto, UpdateLocationDto, GetShiftsQueryDto, ShiftResponseDto, ShiftSummaryDto, ShiftPerformanceDto, HeatmapDataPointDto, ShiftStatisticsDto } from '../dtos/shift.dto';
export declare class ShiftService {
    private readonly shiftRepository;
    constructor(shiftRepository: IShiftRepository);
    startShift(riderUserId: string, dto: StartShiftDto): Promise<ShiftResponseDto>;
    endShift(shiftId: string, riderUserId: string): Promise<ShiftResponseDto>;
    pauseShift(shiftId: string, riderUserId: string): Promise<ShiftResponseDto>;
    resumeShift(shiftId: string, riderUserId: string, location?: {
        lat: number;
        lng: number;
    }): Promise<ShiftResponseDto>;
    getCurrentShift(riderUserId: string): Promise<ShiftResponseDto | null>;
    getShifts(riderUserId: string, query: GetShiftsQueryDto): Promise<{
        shifts: ShiftResponseDto[];
        total: number;
        page: number;
        size: number;
    }>;
    getShiftById(shiftId: string, riderUserId: string): Promise<ShiftResponseDto>;
    updateLocation(shiftId: string, riderUserId: string, dto: UpdateLocationDto): Promise<ShiftResponseDto>;
    getDailySummary(riderUserId: string, date?: string): Promise<ShiftSummaryDto>;
    getWeeklySummary(riderUserId: string): Promise<ShiftSummaryDto>;
    getMonthlySummary(riderUserId: string): Promise<ShiftSummaryDto>;
    getPerformanceAnalytics(riderUserId: string): Promise<ShiftPerformanceDto>;
    searchAllShifts(query: GetShiftsQueryDto): Promise<{
        shifts: ShiftResponseDto[];
        total: number;
        page: number;
        size: number;
    }>;
    getStatisticsOverview(): Promise<ShiftStatisticsDto>;
    getActiveCount(): Promise<{
        count: number;
    }>;
    bulkEndShifts(shiftIds: string[]): Promise<{
        ended_count: number;
    }>;
    getHeatmapData(): Promise<HeatmapDataPointDto[]>;
    exportData(riderUserId: string): Promise<any[]>;
    private calculateSummary;
    private toResponseDto;
}
