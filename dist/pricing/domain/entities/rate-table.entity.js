"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RateTable = void 0;
class RateTable {
    rate_table_id;
    region;
    vehicle_type;
    currency;
    included_km;
    base;
    per_km;
    per_min;
    multistop_fee;
    vehicle_surcharge;
    service_levels;
    platform_fee;
    small_order_threshold;
    small_order_fee;
    vat_rate;
    surge;
    limits;
    ttl_seconds;
    active;
    created_at;
    updated_at;
    constructor(rate_table_id, region, vehicle_type, currency, included_km, base, per_km, per_min, multistop_fee, vehicle_surcharge, service_levels, platform_fee, small_order_threshold, small_order_fee, vat_rate, surge, limits, ttl_seconds, active = true, created_at = new Date(), updated_at = new Date()) {
        this.rate_table_id = rate_table_id;
        this.region = region;
        this.vehicle_type = vehicle_type;
        this.currency = currency;
        this.included_km = included_km;
        this.base = base;
        this.per_km = per_km;
        this.per_min = per_min;
        this.multistop_fee = multistop_fee;
        this.vehicle_surcharge = vehicle_surcharge;
        this.service_levels = service_levels;
        this.platform_fee = platform_fee;
        this.small_order_threshold = small_order_threshold;
        this.small_order_fee = small_order_fee;
        this.vat_rate = vat_rate;
        this.surge = surge;
        this.limits = limits;
        this.ttl_seconds = ttl_seconds;
        this.active = active;
        this.created_at = created_at;
        this.updated_at = updated_at;
    }
    static create(params) {
        return new RateTable(`rt_${params.region.toLowerCase()}_${params.vehicle_type}_v1`, params.region, params.vehicle_type, params.currency, params.included_km, params.base, params.per_km, params.per_min, params.multistop_fee || 0, params.vehicle_surcharge || 0, params.service_levels || { standard: 1.0 }, params.platform_fee || 0, params.small_order_threshold || 0, params.small_order_fee || 0, params.vat_rate || 0, params.surge || { mode: 'factor', factor: 1.0, applies_to: 'subtotal' }, params.limits || { max_stops: 8, max_weight_kg: 100, max_volume_l: 500 }, params.ttl_seconds || 900);
    }
    isWithinLimits(stops, weight_kg, volume_l) {
        return (stops <= this.limits.max_stops &&
            weight_kg <= this.limits.max_weight_kg &&
            volume_l <= this.limits.max_volume_l);
    }
    getServiceLevelMultiplier(level) {
        return this.service_levels[level] || 1.0;
    }
}
exports.RateTable = RateTable;
//# sourceMappingURL=rate-table.entity.js.map