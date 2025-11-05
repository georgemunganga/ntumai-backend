export interface SurgeConfig {
    mode: 'factor' | 'fixed';
    factor?: number;
    fixed?: number;
    applies_to: 'distance' | 'duration' | 'distance+duration' | 'subtotal';
}
export interface VehicleLimits {
    max_stops: number;
    max_weight_kg: number;
    max_volume_l: number;
}
export interface ServiceLevels {
    standard: number;
    express?: number;
    premium?: number;
}
export declare class RateTable {
    readonly rate_table_id: string;
    readonly region: string;
    readonly vehicle_type: string;
    readonly currency: string;
    readonly included_km: number;
    readonly base: number;
    readonly per_km: number;
    readonly per_min: number;
    readonly multistop_fee: number;
    readonly vehicle_surcharge: number;
    readonly service_levels: ServiceLevels;
    readonly platform_fee: number;
    readonly small_order_threshold: number;
    readonly small_order_fee: number;
    readonly vat_rate: number;
    readonly surge: SurgeConfig;
    readonly limits: VehicleLimits;
    readonly ttl_seconds: number;
    readonly active: boolean;
    readonly created_at: Date;
    readonly updated_at: Date;
    constructor(rate_table_id: string, region: string, vehicle_type: string, currency: string, included_km: number, base: number, per_km: number, per_min: number, multistop_fee: number, vehicle_surcharge: number, service_levels: ServiceLevels, platform_fee: number, small_order_threshold: number, small_order_fee: number, vat_rate: number, surge: SurgeConfig, limits: VehicleLimits, ttl_seconds: number, active?: boolean, created_at?: Date, updated_at?: Date);
    static create(params: {
        region: string;
        vehicle_type: string;
        currency: string;
        included_km: number;
        base: number;
        per_km: number;
        per_min: number;
        multistop_fee?: number;
        vehicle_surcharge?: number;
        service_levels?: ServiceLevels;
        platform_fee?: number;
        small_order_threshold?: number;
        small_order_fee?: number;
        vat_rate?: number;
        surge?: SurgeConfig;
        limits?: VehicleLimits;
        ttl_seconds?: number;
    }): RateTable;
    isWithinLimits(stops: number, weight_kg: number, volume_l: number): boolean;
    getServiceLevelMultiplier(level: string): number;
}
