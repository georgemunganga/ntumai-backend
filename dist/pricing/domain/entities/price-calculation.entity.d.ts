export interface PriceBreakdown {
    base: number;
    distance: number;
    duration: number;
    multistop: number;
    vehicle_surcharge: number;
    service_level: number;
    small_order_fee: number;
    platform_fee: number;
    surge: number;
    promo_discount: number;
    gift_card_preview: number;
    tax: number;
}
export interface PriceConstraints {
    max_stops: number;
    max_schedule_ahead_hours: number;
    vehicle_limits: {
        max_weight_kg: number;
        max_volume_l: number;
    };
}
export interface SignatureFields {
    alg: string;
    key_id: string;
    issued_at: string;
    ttl_seconds: number;
    canon_hash: string;
}
export declare class PriceCalculation {
    readonly ok: boolean;
    readonly currency: string;
    readonly region: string;
    readonly vehicle_type: string;
    readonly service_level: string;
    readonly distance_km: number;
    readonly duration_min: number;
    readonly rule_ids: string[];
    readonly breakdown: PriceBreakdown;
    readonly subtotal: number;
    readonly total: number;
    readonly constraints: PriceConstraints;
    readonly advisories: string[];
    readonly expires_at: Date;
    readonly sig: string;
    readonly sig_fields: SignatureFields;
    readonly calculated_at: Date;
    constructor(ok: boolean, currency: string, region: string, vehicle_type: string, service_level: string, distance_km: number, duration_min: number, rule_ids: string[], breakdown: PriceBreakdown, subtotal: number, total: number, constraints: PriceConstraints, advisories: string[], expires_at: Date, sig: string, sig_fields: SignatureFields, calculated_at?: Date);
    static create(params: {
        currency: string;
        region: string;
        vehicle_type: string;
        service_level: string;
        distance_km: number;
        duration_min: number;
        rule_ids: string[];
        breakdown: PriceBreakdown;
        constraints: PriceConstraints;
        advisories?: string[];
        ttl_seconds: number;
    }): Omit<PriceCalculation, 'sig' | 'sig_fields'>;
    isExpired(): boolean;
    toCanonicalString(): string;
}
