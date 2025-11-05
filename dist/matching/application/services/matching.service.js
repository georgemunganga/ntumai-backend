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
exports.MatchingService = void 0;
const common_1 = require("@nestjs/common");
const booking_repository_interface_1 = require("../../domain/repositories/booking.repository.interface");
const booking_entity_1 = require("../../domain/entities/booking.entity");
let MatchingService = class MatchingService {
    bookingRepository;
    matchingEngine;
    constructor(bookingRepository, matchingEngine) {
        this.bookingRepository = bookingRepository;
        this.matchingEngine = matchingEngine;
    }
    async createBooking(dto) {
        const booking = booking_entity_1.Booking.create({
            delivery_id: dto.delivery_id,
            vehicle_type: dto.vehicle_type,
            pickup: dto.pickup,
            dropoffs: dto.dropoffs,
            customer_user_id: dto.customer_user_id,
            customer_name: dto.customer_name,
            customer_phone: dto.customer_phone,
            metadata: dto.metadata,
        });
        const saved = await this.bookingRepository.save(booking);
        this.startMatchingProcess(saved.booking_id, dto).catch((err) => {
            console.error('Matching process error:', err);
        });
        return {
            booking_id: saved.booking_id,
            status: 'searching',
            estimated_search_sec: 45,
        };
    }
    async getBooking(bookingId) {
        const booking = await this.bookingRepository.findById(bookingId);
        if (!booking) {
            throw new common_1.NotFoundException('Booking not found');
        }
        return this.toResponseDto(booking);
    }
    async editBooking(bookingId, dto) {
        const booking = await this.bookingRepository.findById(bookingId);
        if (!booking) {
            throw new common_1.NotFoundException('Booking not found');
        }
        booking.editDetails({
            pickup: dto.pickup,
            dropoffs: dto.dropoffs,
            metadata: dto.metadata,
        });
        const saved = await this.bookingRepository.save(booking);
        console.log('Booking edited:', bookingId);
        return this.toResponseDto(saved);
    }
    async cancelBooking(bookingId, dto) {
        const booking = await this.bookingRepository.findById(bookingId);
        if (!booking) {
            throw new common_1.NotFoundException('Booking not found');
        }
        booking.cancel(dto.reason);
        const saved = await this.bookingRepository.save(booking);
        console.log('Booking cancelled:', bookingId, dto.reason);
        return this.toResponseDto(saved);
    }
    async respondToOffer(bookingId, dto) {
        const booking = await this.bookingRepository.findById(bookingId);
        if (!booking) {
            throw new common_1.NotFoundException('Booking not found');
        }
        if (dto.decision === 'accept') {
            const riderInfo = {
                user_id: dto.rider_user_id,
                name: 'Mock Rider',
                vehicle: booking.toJSON().vehicle_type,
                phone: '+260972000000',
                rating: 4.8,
            };
            booking.acceptByRider(riderInfo);
            console.log('Booking accepted by rider:', dto.rider_user_id);
        }
        else {
            booking.declineByRider(dto.rider_user_id);
            this.reofferBooking(bookingId).catch((err) => {
                console.error('Reoffer error:', err);
            });
            console.log('Booking declined, reoffering:', bookingId);
        }
        const saved = await this.bookingRepository.save(booking);
        return this.toResponseDto(saved);
    }
    async updateProgress(bookingId, dto) {
        const booking = await this.bookingRepository.findById(bookingId);
        if (!booking) {
            throw new common_1.NotFoundException('Booking not found');
        }
        const statusMap = {
            en_route: booking_entity_1.BookingStatus.EN_ROUTE,
            arrived_pickup: booking_entity_1.BookingStatus.ARRIVED_PICKUP,
            picked_up: booking_entity_1.BookingStatus.PICKED_UP,
            en_route_dropoff: booking_entity_1.BookingStatus.EN_ROUTE_DROPOFF,
            delivered: booking_entity_1.BookingStatus.DELIVERED,
        };
        const newStatus = statusMap[dto.stage];
        if (!newStatus) {
            throw new common_1.BadRequestException('Invalid stage');
        }
        booking.updateProgress(newStatus);
        const saved = await this.bookingRepository.save(booking);
        console.log('Booking progress updated:', bookingId, dto.stage);
        return this.toResponseDto(saved);
    }
    async getTimers(bookingId) {
        const booking = await this.bookingRepository.findById(bookingId);
        if (!booking) {
            throw new common_1.NotFoundException('Booking not found');
        }
        return {
            pickup_wait_sec: booking.wait_times.pickup_sec,
            dropoff_wait_sec: booking.wait_times.dropoff_sec,
        };
    }
    async completeBooking(bookingId, pricingData, paymentData) {
        const booking = await this.bookingRepository.findById(bookingId);
        if (!booking) {
            throw new common_1.NotFoundException('Booking not found');
        }
        if (booking.status !== booking_entity_1.BookingStatus.DELIVERED) {
            throw new common_1.BadRequestException('Booking must be delivered before completion');
        }
        console.log('Booking completed:', bookingId, booking.wait_times);
        return this.toResponseDto(booking);
    }
    async startMatchingProcess(bookingId, dto) {
        const booking = await this.bookingRepository.findById(bookingId);
        if (!booking)
            return;
        booking.startSearching();
        await this.bookingRepository.save(booking);
        const candidates = await this.matchingEngine.findCandidates({
            pickup_lat: dto.pickup.geo.lat,
            pickup_lng: dto.pickup.geo.lng,
            vehicle_type: dto.vehicle_type,
            radius_km: 10,
        });
        if (candidates.length === 0) {
            console.log('No riders available for booking:', bookingId);
            return;
        }
        const firstCandidate = candidates[0];
        booking.offerToRider(firstCandidate.user_id, 45);
        await this.bookingRepository.save(booking);
        console.log('Booking offered to riders:', bookingId, candidates);
    }
    async reofferBooking(bookingId) {
        const booking = await this.bookingRepository.findById(bookingId);
        if (!booking)
            return;
        const bookingData = booking.toJSON();
        const candidates = await this.matchingEngine.findCandidates({
            pickup_lat: bookingData.pickup.geo.lat,
            pickup_lng: bookingData.pickup.geo.lng,
            vehicle_type: bookingData.vehicle_type,
            radius_km: 10,
        });
        const newCandidates = candidates.filter((c) => !bookingData.offer.offered_to.includes(c.user_id));
        if (newCandidates.length > 0) {
            booking.offerToRider(newCandidates[0].user_id, 45);
            await this.bookingRepository.save(booking);
        }
    }
    toResponseDto(booking) {
        const data = booking.toJSON();
        return {
            booking_id: data.booking_id,
            delivery_id: data.delivery_id,
            status: data.status,
            vehicle_type: data.vehicle_type,
            pickup: data.pickup,
            dropoffs: data.dropoffs,
            rider: data.rider,
            wait_times: data.wait_times,
            can_user_edit: data.can_user_edit,
            created_at: data.created_at.toISOString(),
            updated_at: data.updated_at.toISOString(),
        };
    }
};
exports.MatchingService = MatchingService;
exports.MatchingService = MatchingService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(booking_repository_interface_1.BOOKING_REPOSITORY)),
    __param(1, (0, common_1.Inject)('MATCHING_ENGINE')),
    __metadata("design:paramtypes", [Object, Object])
], MatchingService);
//# sourceMappingURL=matching.service.js.map