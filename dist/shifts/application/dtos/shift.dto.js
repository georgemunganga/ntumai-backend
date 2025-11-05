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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ShiftStatisticsDto = exports.HeatmapDataPointDto = exports.ShiftPerformanceDto = exports.ShiftSummaryDto = exports.ShiftResponseDto = exports.BulkEndShiftsDto = exports.GetSummaryQueryDto = exports.GetShiftsQueryDto = exports.ResumeShiftDto = exports.PauseShiftDto = exports.EndShiftDto = exports.UpdateLocationDto = exports.StartShiftDto = exports.GeoLocationDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
class GeoLocationDto {
    lat;
    lng;
}
exports.GeoLocationDto = GeoLocationDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: -15.41 }),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], GeoLocationDto.prototype, "lat", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 28.28 }),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], GeoLocationDto.prototype, "lng", void 0);
class StartShiftDto {
    vehicle_type;
    current_location;
}
exports.StartShiftDto = StartShiftDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 'motorbike',
        enum: ['motorbike', 'bicycle', 'walking', 'truck'],
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsEnum)(['motorbike', 'bicycle', 'walking', 'truck']),
    __metadata("design:type", String)
], StartShiftDto.prototype, "vehicle_type", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => GeoLocationDto),
    __metadata("design:type", GeoLocationDto)
], StartShiftDto.prototype, "current_location", void 0);
class UpdateLocationDto {
    location;
}
exports.UpdateLocationDto = UpdateLocationDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => GeoLocationDto),
    __metadata("design:type", GeoLocationDto)
], UpdateLocationDto.prototype, "location", void 0);
class EndShiftDto {
    reason;
}
exports.EndShiftDto = EndShiftDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Shift completed' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], EndShiftDto.prototype, "reason", void 0);
class PauseShiftDto {
    reason;
}
exports.PauseShiftDto = PauseShiftDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Break time' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], PauseShiftDto.prototype, "reason", void 0);
class ResumeShiftDto {
    current_location;
}
exports.ResumeShiftDto = ResumeShiftDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => GeoLocationDto),
    __metadata("design:type", GeoLocationDto)
], ResumeShiftDto.prototype, "current_location", void 0);
class GetShiftsQueryDto {
    status;
    vehicle_type;
    start_date;
    end_date;
    page;
    size;
}
exports.GetShiftsQueryDto = GetShiftsQueryDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        example: 'active',
        enum: ['active', 'paused', 'ended'],
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], GetShiftsQueryDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'motorbike' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], GetShiftsQueryDto.prototype, "vehicle_type", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '2025-10-01' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], GetShiftsQueryDto.prototype, "start_date", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '2025-10-31' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], GetShiftsQueryDto.prototype, "end_date", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 1, minimum: 1 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], GetShiftsQueryDto.prototype, "page", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 20, minimum: 1, maximum: 100 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(100),
    __metadata("design:type", Number)
], GetShiftsQueryDto.prototype, "size", void 0);
class GetSummaryQueryDto {
    date;
}
exports.GetSummaryQueryDto = GetSummaryQueryDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '2025-10-19' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], GetSummaryQueryDto.prototype, "date", void 0);
class BulkEndShiftsDto {
    shift_ids;
    reason;
}
exports.BulkEndShiftsDto = BulkEndShiftsDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: ['shf_abc123', 'shf_def456'] }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], BulkEndShiftsDto.prototype, "shift_ids", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'End of day bulk close' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], BulkEndShiftsDto.prototype, "reason", void 0);
class ShiftResponseDto {
    id;
    rider_user_id;
    status;
    vehicle_type;
    start_time;
    end_time;
    current_location;
    total_deliveries;
    total_earnings;
    total_distance_km;
    duration_sec;
    active_duration_sec;
    total_pause_duration_sec;
}
exports.ShiftResponseDto = ShiftResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], ShiftResponseDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], ShiftResponseDto.prototype, "rider_user_id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], ShiftResponseDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], ShiftResponseDto.prototype, "vehicle_type", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], ShiftResponseDto.prototype, "start_time", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", Object)
], ShiftResponseDto.prototype, "end_time", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", Object)
], ShiftResponseDto.prototype, "current_location", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], ShiftResponseDto.prototype, "total_deliveries", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], ShiftResponseDto.prototype, "total_earnings", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], ShiftResponseDto.prototype, "total_distance_km", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], ShiftResponseDto.prototype, "duration_sec", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], ShiftResponseDto.prototype, "active_duration_sec", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], ShiftResponseDto.prototype, "total_pause_duration_sec", void 0);
class ShiftSummaryDto {
    total_shifts;
    active_shifts;
    ended_shifts;
    total_deliveries;
    total_earnings;
    total_distance_km;
    average_deliveries_per_shift;
    average_earnings_per_shift;
    total_active_time_hours;
}
exports.ShiftSummaryDto = ShiftSummaryDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], ShiftSummaryDto.prototype, "total_shifts", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], ShiftSummaryDto.prototype, "active_shifts", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], ShiftSummaryDto.prototype, "ended_shifts", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], ShiftSummaryDto.prototype, "total_deliveries", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], ShiftSummaryDto.prototype, "total_earnings", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], ShiftSummaryDto.prototype, "total_distance_km", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], ShiftSummaryDto.prototype, "average_deliveries_per_shift", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], ShiftSummaryDto.prototype, "average_earnings_per_shift", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], ShiftSummaryDto.prototype, "total_active_time_hours", void 0);
class ShiftPerformanceDto {
    rider_user_id;
    total_shifts;
    total_deliveries;
    total_earnings;
    average_deliveries_per_hour;
    average_earnings_per_hour;
    completion_rate;
    rating;
}
exports.ShiftPerformanceDto = ShiftPerformanceDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], ShiftPerformanceDto.prototype, "rider_user_id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], ShiftPerformanceDto.prototype, "total_shifts", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], ShiftPerformanceDto.prototype, "total_deliveries", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], ShiftPerformanceDto.prototype, "total_earnings", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], ShiftPerformanceDto.prototype, "average_deliveries_per_hour", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], ShiftPerformanceDto.prototype, "average_earnings_per_hour", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], ShiftPerformanceDto.prototype, "completion_rate", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], ShiftPerformanceDto.prototype, "rating", void 0);
class HeatmapDataPointDto {
    lat;
    lng;
    intensity;
}
exports.HeatmapDataPointDto = HeatmapDataPointDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], HeatmapDataPointDto.prototype, "lat", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], HeatmapDataPointDto.prototype, "lng", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], HeatmapDataPointDto.prototype, "intensity", void 0);
class ShiftStatisticsDto {
    total_active_riders;
    total_shifts_today;
    average_shift_duration_hours;
    total_deliveries_today;
    total_earnings_today;
    by_vehicle_type;
}
exports.ShiftStatisticsDto = ShiftStatisticsDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], ShiftStatisticsDto.prototype, "total_active_riders", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], ShiftStatisticsDto.prototype, "total_shifts_today", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], ShiftStatisticsDto.prototype, "average_shift_duration_hours", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], ShiftStatisticsDto.prototype, "total_deliveries_today", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], ShiftStatisticsDto.prototype, "total_earnings_today", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Object)
], ShiftStatisticsDto.prototype, "by_vehicle_type", void 0);
//# sourceMappingURL=shift.dto.js.map