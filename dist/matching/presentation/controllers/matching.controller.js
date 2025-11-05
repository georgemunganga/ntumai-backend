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
exports.MatchingController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const matching_service_1 = require("../../application/services/matching.service");
const booking_dto_1 = require("../../application/dtos/booking.dto");
const jwt_auth_guard_1 = require("../../../auth/infrastructure/guards/jwt-auth.guard");
const public_decorator_1 = require("../../../shared/common/decorators/public.decorator");
let MatchingController = class MatchingController {
    matchingService;
    constructor(matchingService) {
        this.matchingService = matchingService;
    }
    async createBooking(dto) {
        return this.matchingService.createBooking(dto);
    }
    async getBooking(bookingId) {
        return this.matchingService.getBooking(bookingId);
    }
    async editBooking(bookingId, dto) {
        return this.matchingService.editBooking(bookingId, dto);
    }
    async cancelBooking(bookingId, dto) {
        return this.matchingService.cancelBooking(bookingId, dto);
    }
    async respondToOffer(bookingId, dto) {
        return this.matchingService.respondToOffer(bookingId, dto);
    }
    async updateProgress(bookingId, dto) {
        return this.matchingService.updateProgress(bookingId, dto);
    }
    async getTimers(bookingId) {
        return this.matchingService.getTimers(bookingId);
    }
    async completeBooking(bookingId, body) {
        return this.matchingService.completeBooking(bookingId, body.pricing, body.payment);
    }
};
exports.MatchingController = MatchingController;
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Create booking and start matching' }),
    (0, swagger_1.ApiResponse)({
        status: 201,
        description: 'Booking created',
        type: booking_dto_1.CreateBookingResponseDto,
    }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [booking_dto_1.CreateBookingDto]),
    __metadata("design:returntype", Promise)
], MatchingController.prototype, "createBooking", null);
__decorate([
    (0, common_1.Get)(':bookingId'),
    (0, public_decorator_1.Public)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get booking details' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Booking retrieved',
        type: booking_dto_1.BookingResponseDto,
    }),
    __param(0, (0, common_1.Param)('bookingId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], MatchingController.prototype, "getBooking", null);
__decorate([
    (0, common_1.Patch)(':bookingId'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Edit booking details' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Booking updated',
        type: booking_dto_1.BookingResponseDto,
    }),
    __param(0, (0, common_1.Param)('bookingId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, booking_dto_1.EditBookingDto]),
    __metadata("design:returntype", Promise)
], MatchingController.prototype, "editBooking", null);
__decorate([
    (0, common_1.Post)(':bookingId/cancel'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Cancel booking' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Booking cancelled',
        type: booking_dto_1.BookingResponseDto,
    }),
    __param(0, (0, common_1.Param)('bookingId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, booking_dto_1.CancelBookingDto]),
    __metadata("design:returntype", Promise)
], MatchingController.prototype, "cancelBooking", null);
__decorate([
    (0, common_1.Post)(':bookingId/respond'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Rider accept/decline offer' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Response recorded',
        type: booking_dto_1.BookingResponseDto,
    }),
    __param(0, (0, common_1.Param)('bookingId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, booking_dto_1.RespondToOfferDto]),
    __metadata("design:returntype", Promise)
], MatchingController.prototype, "respondToOffer", null);
__decorate([
    (0, common_1.Post)(':bookingId/progress'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Update booking progress' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Progress updated',
        type: booking_dto_1.BookingResponseDto,
    }),
    __param(0, (0, common_1.Param)('bookingId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, booking_dto_1.UpdateProgressDto]),
    __metadata("design:returntype", Promise)
], MatchingController.prototype, "updateProgress", null);
__decorate([
    (0, common_1.Get)(':bookingId/timers'),
    (0, public_decorator_1.Public)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get wait timers' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Timers retrieved' }),
    __param(0, (0, common_1.Param)('bookingId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], MatchingController.prototype, "getTimers", null);
__decorate([
    (0, common_1.Post)(':bookingId/complete'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Complete booking with pricing/payment' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Booking completed',
        type: booking_dto_1.BookingResponseDto,
    }),
    __param(0, (0, common_1.Param)('bookingId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], MatchingController.prototype, "completeBooking", null);
exports.MatchingController = MatchingController = __decorate([
    (0, swagger_1.ApiTags)('Matching & Booking'),
    (0, common_1.Controller)('matching/bookings'),
    __metadata("design:paramtypes", [matching_service_1.MatchingService])
], MatchingController);
//# sourceMappingURL=matching.controller.js.map