"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ShiftService = void 0;
const common_1 = require("@nestjs/common");
const shift_repository_interface_1 = require("../../domain/repositories/shift.repository.interface");
const shift_entity_1 = require("../../domain/entities/shift.entity");
let ShiftService = class ShiftService {
    shiftRepository;
    constructor(shiftRepository) {
        this.shiftRepository = shiftRepository;
    }
    async startShift(riderUserId, dto) {
        const existingShift = await this.shiftRepository.findActiveByRiderUserId(riderUserId);
        if (existingShift) {
            throw new common_1.ConflictException('Rider already has an active shift. Please end the current shift first.');
        }
        const shift = shift_entity_1.Shift.create({
            rider_user_id: riderUserId,
            vehicle_type: dto.vehicle_type,
            current_location: dto.current_location,
        });
        const saved = await this.shiftRepository.save(shift);
        return this.toResponseDto(saved);
    }
    async endShift(shiftId, riderUserId) {
        const shift = await this.shiftRepository.findById(shiftId);
        if (!shift) {
            throw new common_1.NotFoundException('Shift not found');
        }
        if (shift.rider_user_id !== riderUserId) {
            throw new common_1.BadRequestException('You can only end your own shifts');
        }
        shift.end();
        const saved = await this.shiftRepository.save(shift);
        return this.toResponseDto(saved);
    }
    async pauseShift(shiftId, riderUserId) {
        const shift = await this.shiftRepository.findById(shiftId);
        if (!shift) {
            throw new common_1.NotFoundException('Shift not found');
        }
        if (shift.rider_user_id !== riderUserId) {
            throw new common_1.BadRequestException('You can only pause your own shifts');
        }
        shift.pause();
        const saved = await this.shiftRepository.save(shift);
        return this.toResponseDto(saved);
    }
    async resumeShift(shiftId, riderUserId, location) {
        const shift = await this.shiftRepository.findById(shiftId);
        if (!shift) {
            throw new common_1.NotFoundException('Shift not found');
        }
        if (shift.rider_user_id !== riderUserId) {
            throw new common_1.BadRequestException('You can only resume your own shifts');
        }
        shift.resume();
        if (location) {
            shift.updateLocation(location);
        }
        const saved = await this.shiftRepository.save(shift);
        return this.toResponseDto(saved);
    }
    async getCurrentShift(riderUserId) {
        const shift = await this.shiftRepository.findActiveByRiderUserId(riderUserId);
        if (!shift) {
            return null;
        }
        return this.toResponseDto(shift);
    }
    async getShifts(riderUserId, query) {
        const filters = {
            rider_user_id: riderUserId,
            status: query.status,
            vehicle_type: query.vehicle_type,
            start_date: query.start_date ? new Date(query.start_date) : undefined,
            end_date: query.end_date ? new Date(query.end_date) : undefined,
            page: query.page || 1,
            size: query.size || 20,
        };
        const { shifts, total } = await this.shiftRepository.findAll(filters);
        return {
            shifts: shifts.map((shift) => this.toResponseDto(shift)),
            total,
            page: filters.page,
            size: filters.size,
        };
    }
    async getShiftById(shiftId, riderUserId) {
        const shift = await this.shiftRepository.findById(shiftId);
        if (!shift) {
            throw new common_1.NotFoundException('Shift not found');
        }
        if (shift.rider_user_id !== riderUserId) {
            throw new common_1.BadRequestException('You can only view your own shifts');
        }
        return this.toResponseDto(shift);
    }
    async updateLocation(shiftId, riderUserId, dto) {
        const shift = await this.shiftRepository.findById(shiftId);
        if (!shift) {
            throw new common_1.NotFoundException('Shift not found');
        }
        if (shift.rider_user_id !== riderUserId) {
            throw new common_1.BadRequestException('You can only update your own shift location');
        }
        if (!shift.isActive()) {
            throw new common_1.BadRequestException('Can only update location for active shifts');
        }
        shift.updateLocation(dto.location);
        const saved = await this.shiftRepository.save(shift);
        return this.toResponseDto(saved);
    }
    async getDailySummary(riderUserId, date) {
        const targetDate = date ? new Date(date) : new Date();
        const startOfDay = new Date(targetDate);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(targetDate);
        endOfDay.setHours(23, 59, 59, 999);
        const shifts = await this.shiftRepository.findShiftsByDateRange(riderUserId, startOfDay, endOfDay);
        return this.calculateSummary(shifts);
    }
    async getWeeklySummary(riderUserId) {
        const now = new Date();
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());
        startOfWeek.setHours(0, 0, 0, 0);
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        endOfWeek.setHours(23, 59, 59, 999);
        const shifts = await this.shiftRepository.findShiftsByDateRange(riderUserId, startOfWeek, endOfWeek);
        return this.calculateSummary(shifts);
    }
    async getMonthlySummary(riderUserId) {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
        const shifts = await this.shiftRepository.findShiftsByDateRange(riderUserId, startOfMonth, endOfMonth);
        return this.calculateSummary(shifts);
    }
    async getPerformanceAnalytics(riderUserId) {
        const shifts = await this.shiftRepository.findByRiderUserId(riderUserId);
        const totalShifts = shifts.length;
        const totalDeliveries = shifts.reduce((sum, s) => sum + s.total_deliveries, 0);
        const totalEarnings = shifts.reduce((sum, s) => sum + s.total_earnings, 0);
        const totalActiveHours = shifts.reduce((sum, s) => sum + s.getActiveDuration(), 0) / 3600;
        return {
            rider_user_id: riderUserId,
            total_shifts: totalShifts,
            total_deliveries: totalDeliveries,
            total_earnings: totalEarnings,
            average_deliveries_per_hour: totalActiveHours > 0 ? totalDeliveries / totalActiveHours : 0,
            average_earnings_per_hour: totalActiveHours > 0 ? totalEarnings / totalActiveHours : 0,
            completion_rate: 100,
            rating: 4.8,
        };
    }
    async searchAllShifts(query) {
        const filters = {
            status: query.status,
            vehicle_type: query.vehicle_type,
            start_date: query.start_date ? new Date(query.start_date) : undefined,
            end_date: query.end_date ? new Date(query.end_date) : undefined,
            page: query.page || 1,
            size: query.size || 20,
        };
        const { shifts, total } = await this.shiftRepository.findAll(filters);
        return {
            shifts: shifts.map((shift) => this.toResponseDto(shift)),
            total,
            page: filters.page,
            size: filters.size,
        };
    }
    async getStatisticsOverview() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);
        const activeShifts = await this.shiftRepository.findActiveShifts();
        const { shifts: todayShifts } = await this.shiftRepository.findAll({
            start_date: today,
            end_date: tomorrow,
        });
        const totalDeliveries = todayShifts.reduce((sum, s) => sum + s.total_deliveries, 0);
        const totalEarnings = todayShifts.reduce((sum, s) => sum + s.total_earnings, 0);
        const totalDuration = todayShifts.reduce((sum, s) => sum + s.getDuration(), 0);
        const avgDuration = todayShifts.length > 0 ? totalDuration / todayShifts.length / 3600 : 0;
        const byVehicleType = {};
        activeShifts.forEach((shift) => {
            byVehicleType[shift.vehicle_type] =
                (byVehicleType[shift.vehicle_type] || 0) + 1;
        });
        return {
            total_active_riders: activeShifts.length,
            total_shifts_today: todayShifts.length,
            average_shift_duration_hours: avgDuration,
            total_deliveries_today: totalDeliveries,
            total_earnings_today: totalEarnings,
            by_vehicle_type: byVehicleType,
        };
    }
    async getActiveCount() {
        const activeShifts = await this.shiftRepository.findActiveShifts();
        return { count: activeShifts.length };
    }
    async bulkEndShifts(shiftIds) {
        const count = await this.shiftRepository.bulkEnd(shiftIds);
        return { ended_count: count };
    }
    async getHeatmapData() {
        const activeShifts = await this.shiftRepository.findActiveShifts();
        const heatmap = [];
        activeShifts.forEach((shift) => {
            if (shift.current_location) {
                heatmap.push({
                    lat: shift.current_location.lat,
                    lng: shift.current_location.lng,
                    intensity: 1,
                });
            }
        });
        return heatmap;
    }
    async exportData(riderUserId) {
        const shifts = await this.shiftRepository.findByRiderUserId(riderUserId);
        return shifts.map((shift) => this.toResponseDto(shift));
    }
    calculateSummary(shifts) {
        const totalShifts = shifts.length;
        const activeShifts = shifts.filter((s) => s.status === shift_entity_1.ShiftStatus.ACTIVE).length;
        const endedShifts = shifts.filter((s) => s.status === shift_entity_1.ShiftStatus.ENDED).length;
        const totalDeliveries = shifts.reduce((sum, s) => sum + s.total_deliveries, 0);
        const totalEarnings = shifts.reduce((sum, s) => sum + s.total_earnings, 0);
        const totalDistance = shifts.reduce((sum, s) => sum + s.total_distance_km, 0);
        const totalActiveTime = shifts.reduce((sum, s) => sum + s.getActiveDuration(), 0) / 3600;
        return {
            total_shifts: totalShifts,
            active_shifts: activeShifts,
            ended_shifts: endedShifts,
            total_deliveries: totalDeliveries,
            total_earnings: totalEarnings,
            total_distance_km: totalDistance,
            average_deliveries_per_shift: totalShifts > 0 ? totalDeliveries / totalShifts : 0,
            average_earnings_per_shift: totalShifts > 0 ? totalEarnings / totalShifts : 0,
            total_active_time_hours: totalActiveTime,
        };
    }
    toResponseDto(shift) {
        return {
            id: shift.id,
            rider_user_id: shift.rider_user_id,
            status: shift.status,
            vehicle_type: shift.vehicle_type,
            start_time: shift.start_time.toISOString(),
            end_time: shift.end_time?.toISOString() || null,
            current_location: shift.current_location,
            total_deliveries: shift.total_deliveries,
            total_earnings: shift.total_earnings,
            total_distance_km: shift.total_distance_km,
            duration_sec: shift.getDuration(),
            active_duration_sec: shift.getActiveDuration(),
            total_pause_duration_sec: shift.total_pause_duration_sec,
        };
    }
};
exports.ShiftService = ShiftService;
exports.ShiftService = ShiftService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(shift_repository_interface_1.SHIFT_REPOSITORY)),
    __metadata("design:paramtypes", [Object])
], ShiftService);
//# sourceMappingURL=shift.service.js.map