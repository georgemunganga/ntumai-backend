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
exports.TrackingController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const tracking_service_1 = require("../../application/services/tracking.service");
const tracking_dto_1 = require("../../application/dtos/tracking.dto");
const public_decorator_1 = require("../../../shared/common/decorators/public.decorator");
let TrackingController = class TrackingController {
    trackingService;
    constructor(trackingService) {
        this.trackingService = trackingService;
    }
    async createEvent(dto) {
        return this.trackingService.createEvent(dto);
    }
    async getTrackingByBooking(bookingId) {
        return this.trackingService.getTrackingByBooking(bookingId);
    }
    async getTrackingByDelivery(deliveryId) {
        return this.trackingService.getTrackingByDelivery(deliveryId);
    }
    async getCurrentLocation(bookingId) {
        return this.trackingService.getCurrentLocation(bookingId);
    }
};
exports.TrackingController = TrackingController;
__decorate([
    (0, common_1.Post)('events'),
    (0, swagger_1.ApiOperation)({ summary: 'Create tracking event' }),
    (0, swagger_1.ApiResponse)({
        status: 201,
        description: 'Event created',
        type: tracking_dto_1.TrackingEventResponseDto,
    }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [tracking_dto_1.CreateTrackingEventDto]),
    __metadata("design:returntype", Promise)
], TrackingController.prototype, "createEvent", null);
__decorate([
    (0, common_1.Get)('booking/:bookingId'),
    (0, swagger_1.ApiOperation)({ summary: 'Get tracking timeline by booking ID' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Timeline retrieved',
        type: tracking_dto_1.TrackingTimelineDto,
    }),
    __param(0, (0, common_1.Param)('bookingId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TrackingController.prototype, "getTrackingByBooking", null);
__decorate([
    (0, common_1.Get)('delivery/:deliveryId'),
    (0, swagger_1.ApiOperation)({ summary: 'Get tracking timeline by delivery ID' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Timeline retrieved',
        type: tracking_dto_1.TrackingTimelineDto,
    }),
    __param(0, (0, common_1.Param)('deliveryId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TrackingController.prototype, "getTrackingByDelivery", null);
__decorate([
    (0, common_1.Get)('booking/:bookingId/location'),
    (0, swagger_1.ApiOperation)({ summary: 'Get current location for booking' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Current location retrieved' }),
    __param(0, (0, common_1.Param)('bookingId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TrackingController.prototype, "getCurrentLocation", null);
exports.TrackingController = TrackingController = __decorate([
    (0, swagger_1.ApiTags)('Tracking'),
    (0, common_1.Controller)('tracking'),
    (0, public_decorator_1.Public)(),
    __metadata("design:paramtypes", [tracking_service_1.TrackingService])
], TrackingController);
//# sourceMappingURL=tracking.controller.js.map