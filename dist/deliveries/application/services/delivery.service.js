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
exports.DeliveryService = void 0;
const common_1 = require("@nestjs/common");
const nanoid_1 = require("nanoid");
const delivery_repository_interface_1 = require("../../domain/repositories/delivery.repository.interface");
const delivery_order_entity_1 = require("../../domain/entities/delivery-order.entity");
const stop_entity_1 = require("../../domain/entities/stop.entity");
const pricing_calculator_service_1 = require("../../../pricing/application/services/pricing-calculator.service");
let DeliveryService = class DeliveryService {
    deliveryRepository;
    pricingService;
    constructor(deliveryRepository, pricingService) {
        this.deliveryRepository = deliveryRepository;
        this.pricingService = pricingService;
    }
    async createDelivery(dto, userId, userRole) {
        this.validateStops(dto.stops);
        if (dto.is_scheduled) {
            this.validateScheduling(dto.scheduled_at);
        }
        const deliveryId = `del_${(0, nanoid_1.nanoid)(10)}`;
        const delivery = delivery_order_entity_1.DeliveryOrder.create({
            id: deliveryId,
            created_by_user_id: userId,
            placed_by_role: userRole,
            vehicle_type: dto.vehicle_type,
            courier_comment: dto.courier_comment,
            is_scheduled: dto.is_scheduled || false,
            scheduled_at: dto.scheduled_at ? new Date(dto.scheduled_at) : undefined,
            more_info: dto.more_info,
        });
        for (const stopDto of dto.stops) {
            const stop = stop_entity_1.Stop.create({
                id: `stp_${(0, nanoid_1.nanoid)(8)}`,
                type: stopDto.type,
                sequence: stopDto.sequence,
                contact_name: stopDto.contact_name,
                contact_phone: stopDto.contact_phone,
                notes: stopDto.notes,
                geo: stopDto.geo,
                address: stopDto.address,
            });
            delivery.addStop(stop);
        }
        if (dto.marketplace_order_id || dto.store_id) {
            const metadata = {
                marketplace_order_id: dto.marketplace_order_id,
                store_id: dto.store_id,
                source: 'marketplace',
            };
            delivery.more_info = JSON.stringify(metadata);
        }
        return this.deliveryRepository.create(delivery);
    }
    async attachPricing(deliveryId, dto, userId) {
        const delivery = await this.deliveryRepository.findById(deliveryId);
        if (!delivery) {
            throw new common_1.NotFoundException('Delivery not found');
        }
        if (delivery.created_by_user_id !== userId) {
            throw new common_1.ForbiddenException('Not authorized to modify this delivery');
        }
        const verification = this.pricingService.verifySignature(dto.calc_payload, dto.calc_sig, dto.calc_payload.sig_fields);
        if (!verification.valid) {
            throw new common_1.BadRequestException('Invalid pricing signature');
        }
        if (verification.expired) {
            throw new common_1.BadRequestException('Pricing has expired, please recalculate');
        }
        delivery.attachPricing(dto.calc_payload, dto.calc_sig, dto.calc_payload.currency, dto.calc_payload.total, new Date(dto.calc_payload.expires_at));
        return this.deliveryRepository.update(deliveryId, delivery);
    }
    async setPaymentMethod(deliveryId, dto, userId) {
        const delivery = await this.deliveryRepository.findById(deliveryId);
        if (!delivery) {
            throw new common_1.NotFoundException('Delivery not found');
        }
        if (delivery.created_by_user_id !== userId) {
            throw new common_1.ForbiddenException('Not authorized to modify this delivery');
        }
        delivery.setPaymentMethod(dto.method);
        return this.deliveryRepository.update(deliveryId, delivery);
    }
    async preflight(deliveryId, userId) {
        const delivery = await this.deliveryRepository.findById(deliveryId);
        if (!delivery) {
            throw new common_1.NotFoundException('Delivery not found');
        }
        if (delivery.created_by_user_id !== userId) {
            throw new common_1.ForbiddenException('Not authorized');
        }
        if (!delivery.payment.calc_sig) {
            throw new common_1.BadRequestException('Pricing not attached');
        }
        if (!delivery.isPricingValid()) {
            throw new common_1.BadRequestException('Pricing has expired');
        }
        if (!delivery.payment.method) {
            throw new common_1.BadRequestException('Payment method not set');
        }
        const readyToken = `rdy_${(0, nanoid_1.nanoid)(32)}`;
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
        delivery.setReadyToken(readyToken, expiresAt);
        await this.deliveryRepository.update(deliveryId, delivery);
        return {
            ready: true,
            ready_token: readyToken,
            expires_at: expiresAt.toISOString(),
        };
    }
    async submitDelivery(deliveryId, readyToken, userId, idempotencyKey) {
        const delivery = await this.deliveryRepository.findById(deliveryId);
        if (!delivery) {
            throw new common_1.NotFoundException('Delivery not found');
        }
        if (delivery.created_by_user_id !== userId) {
            throw new common_1.ForbiddenException('Not authorized');
        }
        if (delivery.ready_token !== readyToken) {
            throw new common_1.BadRequestException('Invalid ready token');
        }
        if (!delivery.isReadyTokenValid()) {
            throw new common_1.BadRequestException('Ready token has expired');
        }
        if (!delivery.canSubmit()) {
            throw new common_1.BadRequestException('Delivery is not ready to submit');
        }
        delivery.updated_at = new Date();
        return this.deliveryRepository.update(deliveryId, delivery);
    }
    async getMyDeliveries(userId, role, page = 1, size = 20) {
        return this.deliveryRepository.findAll({ created_by_user_id: userId, placed_by_role: role }, { page, size });
    }
    async getNearbyDeliveries(lat, lng, radius_km, vehicle_type) {
        return this.deliveryRepository.findNearby(lat, lng, radius_km, vehicle_type);
    }
    async acceptDelivery(deliveryId, riderId) {
        const delivery = await this.deliveryRepository.findById(deliveryId);
        if (!delivery) {
            throw new common_1.NotFoundException('Delivery not found');
        }
        if (delivery.rider_id) {
            throw new common_1.BadRequestException('Delivery already accepted by another rider');
        }
        delivery.assignRider(riderId);
        return this.deliveryRepository.update(deliveryId, delivery);
    }
    async markAsDelivery(deliveryId, riderId) {
        const delivery = await this.deliveryRepository.findById(deliveryId);
        if (!delivery) {
            throw new common_1.NotFoundException('Delivery not found');
        }
        if (delivery.rider_id !== riderId) {
            throw new common_1.ForbiddenException('Not assigned to this delivery');
        }
        delivery.markAsDelivery();
        return this.deliveryRepository.update(deliveryId, delivery);
    }
    async cancelDelivery(deliveryId, userId, reason) {
        const delivery = await this.deliveryRepository.findById(deliveryId);
        if (!delivery) {
            throw new common_1.NotFoundException('Delivery not found');
        }
        if (delivery.created_by_user_id !== userId) {
            throw new common_1.ForbiddenException('Not authorized to cancel this delivery');
        }
        delivery.more_info = JSON.stringify({
            ...(delivery.more_info ? JSON.parse(delivery.more_info) : {}),
            cancelled: true,
            cancellation_reason: reason,
            cancelled_at: new Date().toISOString(),
        });
        return this.deliveryRepository.update(deliveryId, delivery);
    }
    async getDeliveryById(deliveryId) {
        const delivery = await this.deliveryRepository.findById(deliveryId);
        if (!delivery) {
            throw new common_1.NotFoundException('Delivery not found');
        }
        return delivery;
    }
    getConfig() {
        return {
            max_stops: 8,
            max_photos: 10,
            max_schedule_ahead_hours: 48,
            vehicle_types: Object.values(delivery_order_entity_1.VehicleType),
            payment_methods: [
                'cash_on_delivery',
                'mobile_money',
                'card',
                'wallet',
                'bank_transfer',
            ],
        };
    }
    validateStops(stops) {
        const pickups = stops.filter((s) => s.type === stop_entity_1.StopType.PICKUP);
        const dropoffs = stops.filter((s) => s.type === stop_entity_1.StopType.DROPOFF);
        if (pickups.length !== 1) {
            throw new common_1.BadRequestException('Exactly one pickup stop required');
        }
        if (dropoffs.length < 1) {
            throw new common_1.BadRequestException('At least one dropoff stop required');
        }
        if (pickups[0].sequence !== 0) {
            throw new common_1.BadRequestException('Pickup must have sequence 0');
        }
        for (const stop of stops) {
            if (!stop.geo && !stop.address) {
                throw new common_1.BadRequestException('Each stop must include geo OR address');
            }
        }
    }
    validateScheduling(scheduled_at) {
        if (!scheduled_at) {
            throw new common_1.BadRequestException('scheduled_at required when is_scheduled is true');
        }
        const scheduledTime = new Date(scheduled_at);
        const now = new Date();
        const maxScheduleTime = new Date(now.getTime() + 48 * 60 * 60 * 1000);
        if (scheduledTime <= now || scheduledTime > maxScheduleTime) {
            throw new common_1.BadRequestException('scheduled_at must be within 48 hours from now');
        }
    }
};
exports.DeliveryService = DeliveryService;
exports.DeliveryService = DeliveryService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(delivery_repository_interface_1.DELIVERY_REPOSITORY)),
    __param(1, (0, common_1.Inject)(pricing_calculator_service_1.PricingCalculatorService)),
    __metadata("design:paramtypes", [Object, pricing_calculator_service_1.PricingCalculatorService])
], DeliveryService);
//# sourceMappingURL=delivery.service.js.map