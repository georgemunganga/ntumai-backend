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

export class PriceCalculation {
  constructor(
    public readonly ok: boolean,
    public readonly currency: string,
    public readonly region: string,
    public readonly vehicle_type: string,
    public readonly service_level: string,
    public readonly distance_km: number,
    public readonly duration_min: number,
    public readonly rule_ids: string[],
    public readonly breakdown: PriceBreakdown,
    public readonly subtotal: number,
    public readonly total: number,
    public readonly constraints: PriceConstraints,
    public readonly advisories: string[],
    public readonly expires_at: Date,
    public readonly sig: string,
    public readonly sig_fields: SignatureFields,
    public readonly calculated_at: Date = new Date(),
  ) {}

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
  }): Omit<PriceCalculation, 'sig' | 'sig_fields'> {
    const subtotal = Object.values(params.breakdown).reduce(
      (sum, val) => sum + val,
      0,
    );
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
    } as any;
  }

  isExpired(): boolean {
    return new Date() > this.expires_at;
  }

  toCanonicalString(): string {
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
