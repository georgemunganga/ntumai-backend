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
exports.PrismaTrackingRepository = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../shared/database/prisma.service");
const tracking_event_entity_1 = require("../../domain/entities/tracking-event.entity");
let PrismaTrackingRepository = class PrismaTrackingRepository {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async save(event) {
        const data = event.toJSON();
        const saved = await this.prisma.trackingEvent.create({
            data: {
                id: data.id,
                booking_id: data.booking_id,
                delivery_id: data.delivery_id,
                event_type: data.event_type,
                location: data.location,
                rider_user_id: data.rider_user_id,
                metadata: data.metadata,
                timestamp: data.timestamp,
            },
        });
        return tracking_event_entity_1.TrackingEvent.fromPersistence({
            ...saved,
            event_type: saved.event_type,
            location: saved.location,
            metadata: saved.metadata,
        });
    }
    async findByBookingId(bookingId) {
        const events = await this.prisma.trackingEvent.findMany({
            where: { booking_id: bookingId },
            orderBy: { timestamp: 'asc' },
        });
        return events.map((event) => tracking_event_entity_1.TrackingEvent.fromPersistence({
            ...event,
            event_type: event.event_type,
            location: event.location,
            metadata: event.metadata,
        }));
    }
    async findByDeliveryId(deliveryId) {
        const events = await this.prisma.trackingEvent.findMany({
            where: { delivery_id: deliveryId },
            orderBy: { timestamp: 'asc' },
        });
        return events.map((event) => tracking_event_entity_1.TrackingEvent.fromPersistence({
            ...event,
            event_type: event.event_type,
            location: event.location,
            metadata: event.metadata,
        }));
    }
    async findLatestLocation(bookingId) {
        const event = await this.prisma.trackingEvent.findFirst({
            where: {
                booking_id: bookingId,
                location: { not: null },
            },
            orderBy: { timestamp: 'desc' },
        });
        if (!event)
            return null;
        return tracking_event_entity_1.TrackingEvent.fromPersistence({
            ...event,
            event_type: event.event_type,
            location: event.location,
            metadata: event.metadata,
        });
    }
};
exports.PrismaTrackingRepository = PrismaTrackingRepository;
exports.PrismaTrackingRepository = PrismaTrackingRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PrismaTrackingRepository);
//# sourceMappingURL=prisma-tracking.repository.js.map