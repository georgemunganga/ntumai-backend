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
exports.PricingCalculatorService = void 0;
const common_1 = require("@nestjs/common");
const rate_table_repository_interface_1 = require("../../domain/repositories/rate-table.repository.interface");
const signature_service_1 = require("../../infrastructure/crypto/signature.service");
const price_calculation_entity_1 = require("../../domain/entities/price-calculation.entity");
const geo_location_vo_1 = require("../../domain/value-objects/geo-location.vo");
const calculate_price_dto_1 = require("../dtos/calculate-price.dto");
let PricingCalculatorService = class PricingCalculatorService {
    rateTableRepository;
    signatureService;
    constructor(rateTableRepository, signatureService) {
        this.rateTableRepository = rateTableRepository;
        this.signatureService = signatureService;
    }
    async calculatePrice(dto) {
        this.validateStops(dto.stops);
        if (dto.is_scheduled) {
            this.validateScheduling(dto.scheduled_at);
        }
        const rateTable = await this.rateTableRepository.findByRegionAndVehicle(dto.region, dto.vehicle_type);
        if (!rateTable) {
            throw new common_1.NotFoundException(`No rate table found for region ${dto.region} and vehicle ${dto.vehicle_type}`);
        }
        let totalDistance = 0;
        let totalDuration = 0;
        if (dto.legs && dto.legs.length > 0) {
            totalDistance = dto.legs.reduce((sum, leg) => sum + leg.distance_km, 0);
            totalDuration = dto.legs.reduce((sum, leg) => sum + leg.duration_min, 0);
        }
        else {
            const geoStops = dto.stops.filter((s) => s.geo);
            if (geoStops.length >= 2) {
                for (let i = 0; i < geoStops.length - 1; i++) {
                    const from = new geo_location_vo_1.GeoLocation(geoStops[i].geo.lat, geoStops[i].geo.lng);
                    const to = new geo_location_vo_1.GeoLocation(geoStops[i + 1].geo.lat, geoStops[i + 1].geo.lng);
                    totalDistance += from.distanceTo(to);
                }
                totalDuration = (totalDistance / 30) * 60;
            }
            else {
                throw new common_1.BadRequestException('Provide legs or geo coordinates for all stops');
            }
        }
        const weight = dto.weight_kg || 0;
        const volume = dto.volume_l || 0;
        if (!rateTable.isWithinLimits(dto.stops.length, weight, volume)) {
            throw new common_1.BadRequestException(`Exceeds vehicle limits: max ${rateTable.limits.max_stops} stops, ${rateTable.limits.max_weight_kg}kg, ${rateTable.limits.max_volume_l}L`);
        }
        const breakdown = this.calculateBreakdown(rateTable, totalDistance, totalDuration, dto.stops.length, dto.service_level, dto.promo_code, dto.gift_card_hint);
        const subtotal = Object.values(breakdown).reduce((sum, val) => sum + val, 0);
        const total = Math.max(0, subtotal);
        const calculation = price_calculation_entity_1.PriceCalculation.create({
            currency: rateTable.currency,
            region: dto.region,
            vehicle_type: dto.vehicle_type,
            service_level: dto.service_level,
            distance_km: totalDistance,
            duration_min: totalDuration,
            rule_ids: [rateTable.rate_table_id],
            breakdown,
            constraints: {
                max_stops: rateTable.limits.max_stops,
                max_schedule_ahead_hours: 48,
                vehicle_limits: {
                    max_weight_kg: rateTable.limits.max_weight_kg,
                    max_volume_l: rateTable.limits.max_volume_l,
                },
            },
            advisories: this.generateAdvisories(dto, rateTable),
            ttl_seconds: rateTable.ttl_seconds,
        });
        const canonicalPayload = JSON.stringify({
            currency: calculation.currency,
            region: calculation.region,
            vehicle_type: calculation.vehicle_type,
            service_level: calculation.service_level,
            distance_km: calculation.distance_km,
            duration_min: calculation.duration_min,
            breakdown: calculation.breakdown,
            total,
            expires_at: calculation.expires_at.toISOString(),
        });
        const { sig, sig_fields } = this.signatureService.sign(canonicalPayload, rateTable.ttl_seconds);
        return {
            ok: true,
            currency: calculation.currency,
            region: calculation.region,
            vehicle_type: calculation.vehicle_type,
            service_level: calculation.service_level,
            distance_km: calculation.distance_km,
            duration_min: calculation.duration_min,
            rule_ids: calculation.rule_ids,
            breakdown: calculation.breakdown,
            subtotal,
            total,
            constraints: calculation.constraints,
            advisories: calculation.advisories,
            expires_at: calculation.expires_at.toISOString(),
            sig,
            sig_fields,
        };
    }
    validateStops(stops) {
        const pickups = stops.filter((s) => s.type === calculate_price_dto_1.StopType.PICKUP);
        const dropoffs = stops.filter((s) => s.type === calculate_price_dto_1.StopType.DROPOFF);
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
    calculateBreakdown(rateTable, distance_km, duration_min, stopCount, serviceLevel, promoCode, giftCardHint) {
        const base = rateTable.base;
        const chargeableDistance = Math.max(0, distance_km - rateTable.included_km);
        const distance = chargeableDistance * rateTable.per_km;
        const duration = duration_min * rateTable.per_min;
        const multistop = stopCount > 2 ? (stopCount - 2) * rateTable.multistop_fee : 0;
        const vehicle_surcharge = rateTable.vehicle_surcharge;
        const serviceLevelMultiplier = rateTable.getServiceLevelMultiplier(serviceLevel);
        const service_level = (base + distance + duration) * (serviceLevelMultiplier - 1);
        const platform_fee = rateTable.platform_fee;
        const subtotalBeforeFees = base +
            distance +
            duration +
            multistop +
            vehicle_surcharge +
            service_level;
        const small_order_fee = subtotalBeforeFees < rateTable.small_order_threshold
            ? rateTable.small_order_fee
            : 0;
        let surge = 0;
        if (rateTable.surge.mode === 'factor') {
            const surgeBase = rateTable.surge.applies_to === 'distance+duration'
                ? distance + duration
                : subtotalBeforeFees;
            surge = surgeBase * (rateTable.surge.factor - 1);
        }
        const promo_discount = promoCode ? -5.0 : 0;
        const gift_card_preview = giftCardHint ? -2.0 : 0;
        const taxableAmount = base +
            distance +
            duration +
            multistop +
            vehicle_surcharge +
            service_level +
            platform_fee +
            surge +
            small_order_fee;
        const tax = taxableAmount * rateTable.vat_rate;
        return {
            base: Math.round(base * 100) / 100,
            distance: Math.round(distance * 100) / 100,
            duration: Math.round(duration * 100) / 100,
            multistop: Math.round(multistop * 100) / 100,
            vehicle_surcharge: Math.round(vehicle_surcharge * 100) / 100,
            service_level: Math.round(service_level * 100) / 100,
            small_order_fee: Math.round(small_order_fee * 100) / 100,
            platform_fee: Math.round(platform_fee * 100) / 100,
            surge: Math.round(surge * 100) / 100,
            promo_discount: Math.round(promo_discount * 100) / 100,
            gift_card_preview: Math.round(gift_card_preview * 100) / 100,
            tax: Math.round(tax * 100) / 100,
        };
    }
    generateAdvisories(dto, rateTable) {
        const advisories = [];
        if (dto.stops.length > 5) {
            advisories.push('Large number of stops may increase delivery time');
        }
        if (dto.is_scheduled) {
            advisories.push('Scheduled deliveries are subject to rider availability');
        }
        if (rateTable.surge.factor > 1.1) {
            advisories.push('Surge pricing is currently active');
        }
        return advisories;
    }
    async getRateTable(region, vehicle_type) {
        const rateTable = await this.rateTableRepository.findByRegionAndVehicle(region, vehicle_type);
        if (!rateTable) {
            throw new common_1.NotFoundException(`No rate table found for region ${region} and vehicle ${vehicle_type}`);
        }
        return {
            rate_table_id: rateTable.rate_table_id,
            currency: rateTable.currency,
            included_km: rateTable.included_km,
            base: rateTable.base,
            per_km: rateTable.per_km,
            per_min: rateTable.per_min,
            multistop_fee: rateTable.multistop_fee,
            vehicle_surcharge: rateTable.vehicle_surcharge,
            service_levels: rateTable.service_levels,
            platform_fee: rateTable.platform_fee,
            small_order_threshold: rateTable.small_order_threshold,
            small_order_fee: rateTable.small_order_fee,
            vat_rate: rateTable.vat_rate,
            surge: rateTable.surge,
            limits: rateTable.limits,
            ttl_seconds: rateTable.ttl_seconds,
        };
    }
    verifySignature(calc_payload, sig, sig_fields) {
        const canonicalPayload = JSON.stringify({
            currency: calc_payload.currency,
            region: calc_payload.region,
            vehicle_type: calc_payload.vehicle_type,
            service_level: calc_payload.service_level,
            distance_km: calc_payload.distance_km,
            duration_min: calc_payload.duration_min,
            breakdown: calc_payload.breakdown,
            total: calc_payload.total,
            expires_at: calc_payload.expires_at,
        });
        const valid = this.signatureService.verify(canonicalPayload, sig, sig_fields);
        const expired = this.signatureService.isExpired(sig_fields.issued_at, sig_fields.ttl_seconds);
        return { valid, expired };
    }
};
exports.PricingCalculatorService = PricingCalculatorService;
exports.PricingCalculatorService = PricingCalculatorService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(rate_table_repository_interface_1.RATE_TABLE_REPOSITORY)),
    __metadata("design:paramtypes", [Object, signature_service_1.SignatureService])
], PricingCalculatorService);
//# sourceMappingURL=pricing-calculator.service.js.map