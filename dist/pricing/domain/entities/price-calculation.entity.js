"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PriceCalculation = void 0;
class PriceCalculation {
    ok;
    currency;
    region;
    vehicle_type;
    service_level;
    distance_km;
    duration_min;
    rule_ids;
    breakdown;
    subtotal;
    total;
    constraints;
    advisories;
    expires_at;
    sig;
    sig_fields;
    calculated_at;
    constructor(ok, currency, region, vehicle_type, service_level, distance_km, duration_min, rule_ids, breakdown, subtotal, total, constraints, advisories, expires_at, sig, sig_fields, calculated_at = new Date()) {
        this.ok = ok;
        this.currency = currency;
        this.region = region;
        this.vehicle_type = vehicle_type;
        this.service_level = service_level;
        this.distance_km = distance_km;
        this.duration_min = duration_min;
        this.rule_ids = rule_ids;
        this.breakdown = breakdown;
        this.subtotal = subtotal;
        this.total = total;
        this.constraints = constraints;
        this.advisories = advisories;
        this.expires_at = expires_at;
        this.sig = sig;
        this.sig_fields = sig_fields;
        this.calculated_at = calculated_at;
    }
    static create(params) {
        const subtotal = Object.values(params.breakdown).reduce((sum, val) => sum + val, 0);
        const total = subtotal;
        const expires_at = new Date(Date.now() + params.ttl_seconds * 1000);
        return {
            ok: true,
            currency: params.currency,
            region: params.region,
            vehicle_type: params.vehicle_type,
            service_level: params.service_level,
            distance_km: params.distance_km,
            duration_min: params.duration_min,
            rule_ids: params.rule_ids,
            breakdown: params.breakdown,
            subtotal,
            total,
            constraints: params.constraints,
            advisories: params.advisories || [],
            expires_at,
            calculated_at: new Date(),
        };
    }
    isExpired() {
        return new Date() > this.expires_at;
    }
    toCanonicalString() {
        return JSON.stringify({
            currency: this.currency,
            region: this.region,
            vehicle_type: this.vehicle_type,
            service_level: this.service_level,
            distance_km: this.distance_km,
            duration_min: this.duration_min,
            breakdown: this.breakdown,
            total: this.total,
            expires_at: this.expires_at.toISOString(),
        });
    }
}
exports.PriceCalculation = PriceCalculation;
//# sourceMappingURL=price-calculation.entity.js.map