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
exports.PrismaBookingRepository = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../shared/database/prisma.service");
const booking_entity_1 = require("../../domain/entities/booking.entity");
let PrismaBookingRepository = class PrismaBookingRepository {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async save(booking) {
        const data = booking.toJSON();
        const saved = await this.prisma.booking.upsert({
            where: { booking_id: data.booking_id },
            create: {
                booking_id: data.booking_id,
                delivery_id: data.delivery_id,
                status: data.status,
                vehicle_type: data.vehicle_type,
                pickup: data.pickup,
                dropoffs: data.dropoffs,
                rider: data.rider,
                offer: data.offer,
                wait_times: data.wait_times,
                can_user_edit: data.can_user_edit,
                customer_user_id: data.customer_user_id,
                customer_name: data.customer_name,
                customer_phone: data.customer_phone,
                metadata: data.metadata,
                created_at: data.created_at,
                updated_at: data.updated_at,
                pickup_wait_start: data.pickup_wait_start,
                dropoff_wait_start: data.dropoff_wait_start,
            },
            update: {
                status: data.status,
                pickup: data.pickup,
                dropoffs: data.dropoffs,
                rider: data.rider,
                offer: data.offer,
                wait_times: data.wait_times,
                can_user_edit: data.can_user_edit,
                metadata: data.metadata,
                updated_at: data.updated_at,
                pickup_wait_start: data.pickup_wait_start,
                dropoff_wait_start: data.dropoff_wait_start,
            },
        });
        return booking_entity_1.Booking.fromPersistence({
            ...saved,
            status: saved.status,
            pickup: saved.pickup,
            dropoffs: saved.dropoffs,
            rider: saved.rider,
            offer: saved.offer,
            wait_times: saved.wait_times,
            metadata: saved.metadata,
        });
    }
    async findById(bookingId) {
        const booking = await this.prisma.booking.findUnique({
            where: { booking_id: bookingId },
        });
        if (!booking)
            return null;
        return booking_entity_1.Booking.fromPersistence({
            ...booking,
            status: booking.status,
            pickup: booking.pickup,
            dropoffs: booking.dropoffs,
            rider: booking.rider,
            offer: booking.offer,
            wait_times: booking.wait_times,
            metadata: booking.metadata,
        });
    }
    async findByDeliveryId(deliveryId) {
        const booking = await this.prisma.booking.findFirst({
            where: { delivery_id: deliveryId },
        });
        if (!booking)
            return null;
        return booking_entity_1.Booking.fromPersistence({
            ...booking,
            status: booking.status,
            pickup: booking.pickup,
            dropoffs: booking.dropoffs,
            rider: booking.rider,
            offer: booking.offer,
            wait_times: booking.wait_times,
            metadata: booking.metadata,
        });
    }
    async findByCustomerUserId(customerUserId) {
        const bookings = await this.prisma.booking.findMany({
            where: { customer_user_id: customerUserId },
            orderBy: { created_at: 'desc' },
        });
        return bookings.map((booking) => booking_entity_1.Booking.fromPersistence({
            ...booking,
            status: booking.status,
            pickup: booking.pickup,
            dropoffs: booking.dropoffs,
            rider: booking.rider,
            offer: booking.offer,
            wait_times: booking.wait_times,
            metadata: booking.metadata,
        }));
    }
    async findActiveBookings() {
        const bookings = await this.prisma.booking.findMany({
            where: {
                status: {
                    in: [
                        booking_entity_1.BookingStatus.SEARCHING,
                        booking_entity_1.BookingStatus.OFFERED,
                        booking_entity_1.BookingStatus.ACCEPTED,
                        booking_entity_1.BookingStatus.EN_ROUTE,
                        booking_entity_1.BookingStatus.ARRIVED_PICKUP,
                        booking_entity_1.BookingStatus.PICKED_UP,
                        booking_entity_1.BookingStatus.EN_ROUTE_DROPOFF,
                    ],
                },
            },
            orderBy: { created_at: 'desc' },
        });
        return bookings.map((booking) => booking_entity_1.Booking.fromPersistence({
            ...booking,
            status: booking.status,
            pickup: booking.pickup,
            dropoffs: booking.dropoffs,
            rider: booking.rider,
            offer: booking.offer,
            wait_times: booking.wait_times,
            metadata: booking.metadata,
        }));
    }
    async findBookingsByStatus(status) {
        const bookings = await this.prisma.booking.findMany({
            where: { status },
            orderBy: { created_at: 'desc' },
        });
        return bookings.map((booking) => booking_entity_1.Booking.fromPersistence({
            ...booking,
            status: booking.status,
            pickup: booking.pickup,
            dropoffs: booking.dropoffs,
            rider: booking.rider,
            offer: booking.offer,
            wait_times: booking.wait_times,
            metadata: booking.metadata,
        }));
    }
};
exports.PrismaBookingRepository = PrismaBookingRepository;
exports.PrismaBookingRepository = PrismaBookingRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PrismaBookingRepository);
//# sourceMappingURL=prisma-booking.repository.js.map