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
exports.TrackingService = void 0;
const common_1 = require("@nestjs/common");
const tracking_repository_interface_1 = require("../../domain/repositories/tracking.repository.interface");
const tracking_event_entity_1 = require("../../domain/entities/tracking-event.entity");
let TrackingService = class TrackingService {
    trackingRepository;
    constructor(trackingRepository) {
        this.trackingRepository = trackingRepository;
    }
    async createEvent(dto) {
        const event = tracking_event_entity_1.TrackingEvent.create({
            booking_id: dto.booking_id,
            delivery_id: dto.delivery_id,
            event_type: dto.event_type,
            location: dto.location,
            rider_user_id: dto.rider_user_id,
        });
        const saved = await this.trackingRepository.save(event);
        return this.toResponseDto(saved);
    }
    async getTrackingByBooking(bookingId) {
        const events = await this.trackingRepository.findByBookingId(bookingId);
        const latestLocation = await this.trackingRepository.findLatestLocation(bookingId);
        const currentStatus = events.length > 0 ? events[events.length - 1].event_type : 'unknown';
        return {
            booking_id: bookingId,
            delivery_id: events[0]?.delivery_id || '',
            events: events.map((e) => this.toResponseDto(e)),
            current_location: latestLocation?.location || null,
            current_status: currentStatus,
        };
    }
    async getTrackingByDelivery(deliveryId) {
        const events = await this.trackingRepository.findByDeliveryId(deliveryId);
        const bookingId = events[0]?.booking_id || '';
        const latestLocation = bookingId
            ? await this.trackingRepository.findLatestLocation(bookingId)
            : null;
        const currentStatus = events.length > 0 ? events[events.length - 1].event_type : 'unknown';
        return {
            booking_id: bookingId,
            delivery_id: deliveryId,
            events: events.map((e) => this.toResponseDto(e)),
            current_location: latestLocation?.location || null,
            current_status: currentStatus,
        };
    }
    async getCurrentLocation(bookingId) {
        const latestLocation = await this.trackingRepository.findLatestLocation(bookingId);
        if (!latestLocation) {
            return null;
        }
        return {
            location: latestLocation.location,
            timestamp: latestLocation.timestamp.toISOString(),
        };
    }
    toResponseDto(event) {
        const data = event.toJSON();
        return {
            id: data.id,
            booking_id: data.booking_id,
            delivery_id: data.delivery_id,
            event_type: data.event_type,
            location: data.location,
            rider_user_id: data.rider_user_id,
            timestamp: data.timestamp.toISOString(),
        };
    }
};
exports.TrackingService = TrackingService;
exports.TrackingService = TrackingService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(tracking_repository_interface_1.TRACKING_REPOSITORY)),
    __metadata("design:paramtypes", [Object])
], TrackingService);
//# sourceMappingURL=tracking.service.js.map