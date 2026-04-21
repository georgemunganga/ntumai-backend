import { BadRequestException, Injectable } from '@nestjs/common';

type DeliveryVehicleType = 'walking' | 'bicycle' | 'motorbike' | 'car' | 'truck';
type BookingVehicleType = 'walking' | 'bicycle' | 'motorbike' | 'truck';

@Injectable()
export class PricingService {
  estimateDelivery(input: {
    points: Array<{ lat: number; lng: number }>;
    vehicleType: DeliveryVehicleType | string;
    parcelSize?: string;
    fragile?: boolean;
  }) {
    if (!Array.isArray(input.points) || input.points.length < 2) {
      throw new BadRequestException(
        'At least pickup and dropoff points are required',
      );
    }

    const pricingConfig = this.getDeliveryPricingConfig();
    const vehicleConfig =
      pricingConfig.vehicles[input.vehicleType as DeliveryVehicleType];
    if (!vehicleConfig) {
      throw new BadRequestException('Unsupported vehicle type');
    }

    const distanceKm = Number(
      this.calculateRouteDistanceKm(input.points).toFixed(2),
    );
    const routeBase = vehicleConfig.base_fare + distanceKm * vehicleConfig.per_km;
    const routeCharge = Math.max(vehicleConfig.minimum_fare, routeBase);
    const sizeSurcharge =
      pricingConfig.size_surcharges[input.parcelSize || 'medium'] ?? 0;
    const fragileSurcharge = input.fragile ? pricingConfig.fragile_surcharge : 0;
    const extraStopCount = Math.max(0, input.points.length - 2);
    const extraStopSurcharge = extraStopCount * pricingConfig.extra_stop_fee;
    const total = Number(
      (
        routeCharge +
        sizeSurcharge +
        fragileSurcharge +
        extraStopSurcharge
      ).toFixed(2),
    );
    const estimatedDurationMinutes = Math.max(
      10,
      Math.round(distanceKm * vehicleConfig.minutes_per_km),
    );
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    const calcPayload = {
      currency: 'ZMW',
      total,
      expires_at: expiresAt,
      vehicle_type: input.vehicleType,
      distance_km: distanceKm,
      estimated_duration_minutes: estimatedDurationMinutes,
      parcel_size: input.parcelSize || 'medium',
      fragile: Boolean(input.fragile),
      breakdown: {
        base_fare: vehicleConfig.base_fare,
        distance_charge: Number(
          (routeCharge - vehicleConfig.base_fare).toFixed(2),
        ),
        minimum_fare_applied: routeCharge === vehicleConfig.minimum_fare,
        route_charge: Number(routeCharge.toFixed(2)),
        size_surcharge: sizeSurcharge,
        fragile_surcharge: fragileSurcharge,
        extra_stop_surcharge: extraStopSurcharge,
      },
    };

    return {
      currency: 'ZMW',
      distance_km: distanceKm,
      estimated_duration_minutes: estimatedDurationMinutes,
      pricing_rules: pricingConfig,
      calc_payload: calcPayload,
    };
  }

  estimateBooking(input: {
    pickup: { lat: number; lng: number };
    dropoffs: Array<{ lat: number; lng: number }>;
    vehicleType: BookingVehicleType | string;
    waitingMinutes?: number;
  }) {
    const routePoints = [input.pickup, ...(input.dropoffs || [])];
    if (routePoints.length < 2) {
      throw new BadRequestException(
        'Pickup and at least one dropoff are required',
      );
    }

    const pricingConfig = this.getBookingPricingConfig();
    const vehicleConfig =
      pricingConfig.vehicles[input.vehicleType as BookingVehicleType];
    if (!vehicleConfig) {
      throw new BadRequestException('Unsupported vehicle type');
    }

    const distanceKm = Number(
      this.calculateRouteDistanceKm(routePoints).toFixed(2),
    );
    const waitingMinutes = Math.max(0, Number(input.waitingMinutes || 0));
    const waitingBlocks = Math.ceil(
      waitingMinutes / pricingConfig.waiting_block_minutes,
    );
    const waitingFee = waitingBlocks * pricingConfig.waiting_fee_per_block;
    const routeBase = vehicleConfig.base_fare + distanceKm * vehicleConfig.per_km;
    const routeCharge = Math.max(vehicleConfig.minimum_fare, routeBase);
    const total = Number((routeCharge + waitingFee).toFixed(2));

    return {
      currency: 'ZMW',
      distance_km: distanceKm,
      waiting_minutes: waitingMinutes,
      service_estimate: total,
      pricing_rules: pricingConfig,
      breakdown: {
        base_fare: vehicleConfig.base_fare,
        route_charge: Number(routeCharge.toFixed(2)),
        minimum_fare_applied: routeCharge === vehicleConfig.minimum_fare,
        waiting_fee: waitingFee,
      },
    };
  }

  getDeliveryPricingConfig() {
    return {
      currency: 'ZMW',
      pricing_model: 'distance_plus_vehicle',
      size_surcharges: {
        small: 0,
        medium: 5,
        large: 10,
        extra_large: 20,
      },
      fragile_surcharge: 10,
      extra_stop_fee: 8,
      vehicles: {
        walking: {
          base_fare: 12,
          per_km: 5,
          minimum_fare: 27,
          minutes_per_km: 18,
        },
        bicycle: {
          base_fare: 12,
          per_km: 5,
          minimum_fare: 27,
          minutes_per_km: 12,
        },
        motorbike: {
          base_fare: 12,
          per_km: 5,
          minimum_fare: 27,
          minutes_per_km: 6,
        },
        car: {
          base_fare: 50,
          per_km: 7,
          minimum_fare: 50,
          minutes_per_km: 5,
        },
        truck: {
          base_fare: 80,
          per_km: 10,
          minimum_fare: 80,
          minutes_per_km: 7,
        },
      },
    };
  }

  getBookingPricingConfig() {
    return {
      currency: 'ZMW',
      pricing_model: 'errand_service_plus_distance',
      waiting_block_minutes: 15,
      waiting_fee_per_block: 20,
      vehicles: {
        walking: {
          base_fare: 20,
          per_km: 6,
          minimum_fare: 27,
        },
        bicycle: {
          base_fare: 20,
          per_km: 6,
          minimum_fare: 27,
        },
        motorbike: {
          base_fare: 50,
          per_km: 6,
          minimum_fare: 50,
        },
        truck: {
          base_fare: 100,
          per_km: 10,
          minimum_fare: 100,
        },
      },
    };
  }

  calculateDistanceKm(
    origin: { lat: number; lng: number },
    destination: { lat: number; lng: number },
  ): number {
    const earthRadiusKm = 6371;
    const dLat = this.toRadians(destination.lat - origin.lat);
    const dLng = this.toRadians(destination.lng - origin.lng);
    const lat1 = this.toRadians(origin.lat);
    const lat2 = this.toRadians(destination.lat);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.sin(dLng / 2) *
        Math.sin(dLng / 2) *
        Math.cos(lat1) *
        Math.cos(lat2);

    return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  calculateRouteDistanceKm(points: Array<{ lat: number; lng: number }>): number {
    let total = 0;
    for (let index = 1; index < points.length; index += 1) {
      total += this.calculateDistanceKm(points[index - 1], points[index]);
    }
    return total;
  }

  private toRadians(value: number): number {
    return (value * Math.PI) / 180;
  }
}
