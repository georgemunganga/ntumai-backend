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

export class RateTable {
  constructor(
    public readonly rate_table_id: string,
    public readonly region: string,
    public readonly vehicle_type: string,
    public readonly currency: string,
    public readonly included_km: number,
    public readonly base: number,
    public readonly per_km: number,
    public readonly per_min: number,
    public readonly multistop_fee: number,
    public readonly vehicle_surcharge: number,
    public readonly service_levels: ServiceLevels,
    public readonly platform_fee: number,
    public readonly small_order_threshold: number,
    public readonly small_order_fee: number,
    public readonly vat_rate: number,
    public readonly surge: SurgeConfig,
    public readonly limits: VehicleLimits,
    public readonly ttl_seconds: number,
    public readonly active: boolean = true,
    public readonly created_at: Date = new Date(),
    public readonly updated_at: Date = new Date(),
  ) {}

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
  }): RateTable {
    return new RateTable(
      `rt_${params.region.toLowerCase()}_${params.vehicle_type}_v1`,
      params.region,
      params.vehicle_type,
      params.currency,
      params.included_km,
      params.base,
      params.per_km,
      params.per_min,
      params.multistop_fee || 0,
      params.vehicle_surcharge || 0,
      params.service_levels || { standard: 1.0 },
      params.platform_fee || 0,
      params.small_order_threshold || 0,
      params.small_order_fee || 0,
      params.vat_rate || 0,
      params.surge || { mode: 'factor', factor: 1.0, applies_to: 'subtotal' },
      params.limits || { max_stops: 8, max_weight_kg: 100, max_volume_l: 500 },
      params.ttl_seconds || 900,
    );
  }

  isWithinLimits(stops: number, weight_kg: number, volume_l: number): boolean {
    return (
      stops <= this.limits.max_stops &&
      weight_kg <= this.limits.max_weight_kg &&
      volume_l <= this.limits.max_volume_l
    );
  }

  getServiceLevelMultiplier(level: string): number {
    return this.service_levels[level as keyof ServiceLevels] || 1.0;
  }
}
