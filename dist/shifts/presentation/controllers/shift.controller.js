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
exports.ShiftController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const shift_service_1 = require("../../application/services/shift.service");
const shift_dto_1 = require("../../application/dtos/shift.dto");
const jwt_auth_guard_1 = require("../../../auth/infrastructure/guards/jwt-auth.guard");
let ShiftController = class ShiftController {
    shiftService;
    constructor(shiftService) {
        this.shiftService = shiftService;
    }
    async startShift(req, dto) {
        return this.shiftService.startShift(req.user.userId, dto);
    }
    async endShift(req, shiftId, dto) {
        return this.shiftService.endShift(shiftId, req.user.userId);
    }
    async pauseShift(req, shiftId, dto) {
        return this.shiftService.pauseShift(shiftId, req.user.userId);
    }
    async resumeShift(req, shiftId, dto) {
        return this.shiftService.resumeShift(shiftId, req.user.userId, dto.current_location);
    }
    async getCurrentShift(req) {
        return this.shiftService.getCurrentShift(req.user.userId);
    }
    async getShifts(req, query) {
        return this.shiftService.getShifts(req.user.userId, query);
    }
    async getShiftById(req, shiftId) {
        return this.shiftService.getShiftById(shiftId, req.user.userId);
    }
    async updateLocation(req, shiftId, dto) {
        return this.shiftService.updateLocation(shiftId, req.user.userId, dto);
    }
    async getDailySummary(req, query) {
        return this.shiftService.getDailySummary(req.user.userId, query.date);
    }
    async getWeeklySummary(req) {
        return this.shiftService.getWeeklySummary(req.user.userId);
    }
    async getMonthlySummary(req) {
        return this.shiftService.getMonthlySummary(req.user.userId);
    }
    async getPerformanceAnalytics(req) {
        return this.shiftService.getPerformanceAnalytics(req.user.userId);
    }
    async searchAllShifts(query) {
        return this.shiftService.searchAllShifts(query);
    }
    async getStatisticsOverview() {
        return this.shiftService.getStatisticsOverview();
    }
    async getActiveCount() {
        return this.shiftService.getActiveCount();
    }
    async bulkEndShifts(dto) {
        return this.shiftService.bulkEndShifts(dto.shift_ids);
    }
    async exportData(req) {
        return this.shiftService.exportData(req.user.userId);
    }
    async getHeatmapData() {
        return this.shiftService.getHeatmapData();
    }
};
exports.ShiftController = ShiftController;
__decorate([
    (0, common_1.Post)('start'),
    (0, swagger_1.ApiOperation)({ summary: 'Start a new shift' }),
    (0, swagger_1.ApiResponse)({
        status: 201,
        description: 'Shift started successfully',
        type: shift_dto_1.ShiftResponseDto,
    }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, shift_dto_1.StartShiftDto]),
    __metadata("design:returntype", Promise)
], ShiftController.prototype, "startShift", null);
__decorate([
    (0, common_1.Post)(':shiftId/end'),
    (0, swagger_1.ApiOperation)({ summary: 'End a shift' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Shift ended successfully',
        type: shift_dto_1.ShiftResponseDto,
    }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('shiftId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, shift_dto_1.EndShiftDto]),
    __metadata("design:returntype", Promise)
], ShiftController.prototype, "endShift", null);
__decorate([
    (0, common_1.Post)(':shiftId/pause'),
    (0, swagger_1.ApiOperation)({ summary: 'Pause a shift' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Shift paused successfully',
        type: shift_dto_1.ShiftResponseDto,
    }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('shiftId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, shift_dto_1.PauseShiftDto]),
    __metadata("design:returntype", Promise)
], ShiftController.prototype, "pauseShift", null);
__decorate([
    (0, common_1.Post)(':shiftId/resume'),
    (0, swagger_1.ApiOperation)({ summary: 'Resume a paused shift' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Shift resumed successfully',
        type: shift_dto_1.ShiftResponseDto,
    }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('shiftId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, shift_dto_1.ResumeShiftDto]),
    __metadata("design:returntype", Promise)
], ShiftController.prototype, "resumeShift", null);
__decorate([
    (0, common_1.Get)('current'),
    (0, swagger_1.ApiOperation)({ summary: 'Get current active shift' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Current shift retrieved',
        type: shift_dto_1.ShiftResponseDto,
    }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ShiftController.prototype, "getCurrentShift", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get all shifts for the rider' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Shifts retrieved successfully' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, shift_dto_1.GetShiftsQueryDto]),
    __metadata("design:returntype", Promise)
], ShiftController.prototype, "getShifts", null);
__decorate([
    (0, common_1.Get)(':shiftId'),
    (0, swagger_1.ApiOperation)({ summary: 'Get shift by ID' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Shift retrieved successfully',
        type: shift_dto_1.ShiftResponseDto,
    }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('shiftId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], ShiftController.prototype, "getShiftById", null);
__decorate([
    (0, common_1.Put)(':shiftId/location'),
    (0, swagger_1.ApiOperation)({ summary: 'Update shift location' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Location updated successfully',
        type: shift_dto_1.ShiftResponseDto,
    }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('shiftId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, shift_dto_1.UpdateLocationDto]),
    __metadata("design:returntype", Promise)
], ShiftController.prototype, "updateLocation", null);
__decorate([
    (0, common_1.Get)('summary/daily'),
    (0, swagger_1.ApiOperation)({ summary: 'Get daily shift summary' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Daily summary retrieved',
        type: shift_dto_1.ShiftSummaryDto,
    }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, shift_dto_1.GetSummaryQueryDto]),
    __metadata("design:returntype", Promise)
], ShiftController.prototype, "getDailySummary", null);
__decorate([
    (0, common_1.Get)('summary/weekly'),
    (0, swagger_1.ApiOperation)({ summary: 'Get weekly shift summary' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Weekly summary retrieved',
        type: shift_dto_1.ShiftSummaryDto,
    }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ShiftController.prototype, "getWeeklySummary", null);
__decorate([
    (0, common_1.Get)('summary/monthly'),
    (0, swagger_1.ApiOperation)({ summary: 'Get monthly shift summary' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Monthly summary retrieved',
        type: shift_dto_1.ShiftSummaryDto,
    }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ShiftController.prototype, "getMonthlySummary", null);
__decorate([
    (0, common_1.Get)('analytics/performance'),
    (0, swagger_1.ApiOperation)({ summary: 'Get performance analytics' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Performance analytics retrieved',
        type: shift_dto_1.ShiftPerformanceDto,
    }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ShiftController.prototype, "getPerformanceAnalytics", null);
__decorate([
    (0, common_1.Get)('search/all'),
    (0, swagger_1.ApiOperation)({ summary: 'Search all shifts (admin)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Shifts search results' }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [shift_dto_1.GetShiftsQueryDto]),
    __metadata("design:returntype", Promise)
], ShiftController.prototype, "searchAllShifts", null);
__decorate([
    (0, common_1.Get)('statistics/overview'),
    (0, swagger_1.ApiOperation)({ summary: 'Get statistics overview (admin)' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Statistics retrieved',
        type: shift_dto_1.ShiftStatisticsDto,
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ShiftController.prototype, "getStatisticsOverview", null);
__decorate([
    (0, common_1.Get)('active/count'),
    (0, swagger_1.ApiOperation)({ summary: 'Get active shifts count' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Active count retrieved' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ShiftController.prototype, "getActiveCount", null);
__decorate([
    (0, common_1.Post)('bulk-end'),
    (0, swagger_1.ApiOperation)({ summary: 'Bulk end shifts (admin)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Shifts ended successfully' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [shift_dto_1.BulkEndShiftsDto]),
    __metadata("design:returntype", Promise)
], ShiftController.prototype, "bulkEndShifts", null);
__decorate([
    (0, common_1.Get)('export/data'),
    (0, swagger_1.ApiOperation)({ summary: 'Export shift data' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Data exported successfully' }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ShiftController.prototype, "exportData", null);
__decorate([
    (0, common_1.Get)('heatmap/data'),
    (0, swagger_1.ApiOperation)({ summary: 'Get heatmap data for active riders' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Heatmap data retrieved',
        type: [shift_dto_1.HeatmapDataPointDto],
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ShiftController.prototype, "getHeatmapData", null);
exports.ShiftController = ShiftController = __decorate([
    (0, swagger_1.ApiTags)('Shifts'),
    (0, common_1.Controller)('shifts'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [shift_service_1.ShiftService])
], ShiftController);
//# sourceMappingURL=shift.controller.js.map