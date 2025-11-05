import {
  Injectable,
  Inject,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { RATE_TABLE_REPOSITORY } from '../../domain/repositories/rate-table.repository.interface';
import type { IRateTableRepository } from '../../domain/repositories/rate-table.repository.interface';
import { SignatureService } from '../../infrastructure/crypto/signature.service';
import { PriceCalculation } from '../../domain/entities/price-calculation.entity';
import type { PriceBreakdown } from '../../domain/entities/price-calculation.entity';
import { GeoLocation } from '../../domain/value-objects/geo-location.vo';
import {
  CalculatePriceDto,
  CalculatePriceResponseDto,
  StopType,
} from '../dtos/calculate-price.dto';

@Injectable()
export class PricingCalculatorService {
  constructor(
    @Inject(RATE_TABLE_REPOSITORY)
    private readonly rateTableRepository: IRateTableRepository,
    private readonly signatureService: SignatureService,
  ) {}

  async calculatePrice(
    dto: CalculatePriceDto,
  ): Promise<CalculatePriceResponseDto> {
    // Validate stops
    this.validateStops(dto.stops);

    // Validate scheduling
    if (dto.is_scheduled) {
      this.validateScheduling(dto.scheduled_at);
    }

    // Get rate table
    const rateTable = await this.rateTableRepository.findByRegionAndVehicle(
      dto.region,
      dto.vehicle_type,
    );

    if (!rateTable) {
      throw new NotFoundException(
        `No rate table found for region ${dto.region} and vehicle ${dto.vehicle_type}`,
      );
    }

    // Calculate or use provided legs
    let totalDistance = 0;
    let totalDuration = 0;

    if (dto.legs && dto.legs.length > 0) {
      totalDistance = dto.legs.reduce((sum, leg) => sum + leg.distance_km, 0);
      totalDuration = dto.legs.reduce((sum, leg) => sum + leg.duration_min, 0);
    } else {
      // Calculate distance from geo coordinates if available
      const geoStops = dto.stops.filter((s) => s.geo);
      if (geoStops.length >= 2) {
        for (let i = 0; i < geoStops.length - 1; i++) {
          const from = new GeoLocation(
            geoStops[i].geo!.lat,
            geoStops[i].geo!.lng,
          );
          const to = new GeoLocation(
            geoStops[i + 1].geo!.lat,
            geoStops[i + 1].geo!.lng,
          );
          totalDistance += from.distanceTo(to);
        }
        // Estimate duration (assuming 30 km/h average speed)
        totalDuration = (totalDistance / 30) * 60;
      } else {
        throw new BadRequestException(
          'Provide legs or geo coordinates for all stops',
        );
      }
    }

    // Validate vehicle limits
    const weight = dto.weight_kg || 0;
    const volume = dto.volume_l || 0;
    if (!rateTable.isWithinLimits(dto.stops.length, weight, volume)) {
      throw new BadRequestException(
        `Exceeds vehicle limits: max ${rateTable.limits.max_stops} stops, ${rateTable.limits.max_weight_kg}kg, ${rateTable.limits.max_volume_l}L`,
      );
    }

    // Calculate breakdown
    const breakdown = this.calculateBreakdown(
      rateTable,
      totalDistance,
      totalDuration,
      dto.stops.length,
      dto.service_level,
      dto.promo_code,
      dto.gift_card_hint,
    );

    const subtotal = Object.values(breakdown).reduce(
      (sum, val) => sum + val,
      0,
    );
    const total = Math.max(0, subtotal);

    // Create calculation result
    const calculation = PriceCalculation.create({
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

    // Generate signature
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
    const { sig, sig_fields } = this.signatureService.sign(
      canonicalPayload,
      rateTable.ttl_seconds,
    );

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

  private validateStops(stops: any[]): void {
    const pickups = stops.filter((s) => s.type === StopType.PICKUP);
    const dropoffs = stops.filter((s) => s.type === StopType.DROPOFF);

    if (pickups.length !== 1) {
      throw new BadRequestException('Exactly one pickup stop required');
    }

    if (dropoffs.length < 1) {
      throw new BadRequestException('At least one dropoff stop required');
    }

    if (pickups[0].sequence !== 0) {
      throw new BadRequestException('Pickup must have sequence 0');
    }

    // Validate each stop has geo or address
    for (const stop of stops) {
      if (!stop.geo && !stop.address) {
        throw new BadRequestException('Each stop must include geo OR address');
      }
    }
  }

  private validateScheduling(scheduled_at?: string): void {
    if (!scheduled_at) {
      throw new BadRequestException(
        'scheduled_at required when is_scheduled is true',
      );
    }

    const scheduledTime = new Date(scheduled_at);
    const now = new Date();
    const maxScheduleTime = new Date(now.getTime() + 48 * 60 * 60 * 1000);

    if (scheduledTime <= now || scheduledTime > maxScheduleTime) {
      throw new BadRequestException(
        'scheduled_at must be within 48 hours from now',
      );
    }
  }

  private calculateBreakdown(
    rateTable: any,
    distance_km: number,
    duration_min: number,
    stopCount: number,
    serviceLevel: string,
    promoCode?: string,
    giftCardHint?: string,
  ): PriceBreakdown {
    // Base fare
    const base = rateTable.base;

    // Distance charge (after included km)
    const chargeableDistance = Math.max(0, distance_km - rateTable.included_km);
    const distance = chargeableDistance * rateTable.per_km;

    // Duration charge
    const duration = duration_min * rateTable.per_min;

    // Multi-stop fee
    const multistop =
      stopCount > 2 ? (stopCount - 2) * rateTable.multistop_fee : 0;

    // Vehicle surcharge
    const vehicle_surcharge = rateTable.vehicle_surcharge;

    // Service level multiplier
    const serviceLevelMultiplier =
      rateTable.getServiceLevelMultiplier(serviceLevel);
    const service_level =
      (base + distance + duration) * (serviceLevelMultiplier - 1);

    // Platform fee
    const platform_fee = rateTable.platform_fee;

    // Small order fee
    const subtotalBeforeFees =
      base +
      distance +
      duration +
      multistop +
      vehicle_surcharge +
      service_level;
    const small_order_fee =
      subtotalBeforeFees < rateTable.small_order_threshold
        ? rateTable.small_order_fee
        : 0;

    // Surge
    let surge = 0;
    if (rateTable.surge.mode === 'factor') {
      const surgeBase =
        rateTable.surge.applies_to === 'distance+duration'
          ? distance + duration
          : subtotalBeforeFees;
      surge = surgeBase * (rateTable.surge.factor - 1);
    }

    // Promo discount (mock)
    const promo_discount = promoCode ? -5.0 : 0;

    // Gift card preview (mock)
    const gift_card_preview = giftCardHint ? -2.0 : 0;

    // Tax (VAT)
    const taxableAmount =
      base +
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

  private generateAdvisories(dto: CalculatePriceDto, rateTable: any): string[] {
    const advisories: string[] = [];

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

  async getRateTable(region: string, vehicle_type: string): Promise<any> {
    const rateTable = await this.rateTableRepository.findByRegionAndVehicle(
      region,
      vehicle_type,
    );

    if (!rateTable) {
      throw new NotFoundException(
        `No rate table found for region ${region} and vehicle ${vehicle_type}`,
      );
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

  verifySignature(
    calc_payload: any,
    sig: string,
    sig_fields: any,
  ): { valid: boolean; expired: boolean } {
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

    const valid = this.signatureService.verify(
      canonicalPayload,
      sig,
      sig_fields,
    );

    const expired = this.signatureService.isExpired(
      sig_fields.issued_at,
      sig_fields.ttl_seconds,
    );

    return { valid, expired };
  }
}
