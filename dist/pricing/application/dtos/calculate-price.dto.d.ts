export declare enum StopType {
    PICKUP = "pickup",
    DROPOFF = "dropoff"
}
export declare enum VehicleType {
    MOTORBIKE = "motorbike",
    BICYCLE = "bicycle",
    WALKING = "walking",
    TRUCK = "truck"
}
export declare enum ServiceLevel {
    STANDARD = "standard",
    EXPRESS = "express",
    PREMIUM = "premium"
}
export declare class GeoDto {
    lat: number;
    lng: number;
}
export declare class AddressDto {
    line1?: string;
    line2?: string;
    city: string;
    province?: string;
    country: string;
    postal_code?: string;
}
export declare class StopDto {
    type: StopType;
    sequence: number;
    geo?: GeoDto;
    address?: AddressDto;
}
export declare class LegDto {
    from: number;
    to: number;
    distance_km: number;
    duration_min: number;
}
export declare class CalculatePriceDto {
    currency: string;
    region: string;
    vehicle_type: VehicleType;
    service_level: ServiceLevel;
    is_scheduled?: boolean;
    scheduled_at?: string;
    stops: StopDto[];
    legs?: LegDto[];
    weight_kg?: number;
    volume_l?: number;
    promo_code?: string;
    gift_card_hint?: string;
}
export declare class PriceBreakdownDto {
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
export declare class VehicleLimitsDto {
    max_weight_kg: number;
    max_volume_l: number;
}
export declare class PriceConstraintsDto {
    max_stops: number;
    max_schedule_ahead_hours: number;
    vehicle_limits: VehicleLimitsDto;
}
export declare class SignatureFieldsDto {
    alg: string;
    key_id: string;
    issued_at: string;
    ttl_seconds: number;
    canon_hash: string;
}
export declare class CalculatePriceResponseDto {
    ok: boolean;
    currency: string;
    region: string;
    vehicle_type: string;
    service_level: string;
    distance_km: number;
    duration_min: number;
    rule_ids: string[];
    breakdown: PriceBreakdownDto;
    subtotal: number;
    total: number;
    constraints: PriceConstraintsDto;
    advisories: string[];
    expires_at: string;
    sig: string;
    sig_fields: SignatureFieldsDto;
}
