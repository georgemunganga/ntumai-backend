import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../shared/infrastructure/prisma.service';
import { IMatchingEngine, MatchingCriteria } from './matching-engine.interface';
import { RiderInfo } from '../../domain/entities/booking.entity';
import { PricingService } from '../../../pricing/application/services/pricing.service';

type CandidateShift = {
  rider_user_id: string;
  vehicle_type: string;
  current_location: { lat: number; lng: number } | null;
};

@Injectable()
export class MockMatchingEngineAdapter implements IMatchingEngine {
  private readonly maxActiveJobsPerTasker = Number(
    process.env.MATCHING_MAX_ACTIVE_JOBS_PER_TASKER || 2,
  );
  private readonly maxCandidatePool = Number(
    process.env.MATCHING_MAX_CANDIDATE_POOL || 25,
  );

  constructor(
    private readonly prisma: PrismaService,
    private readonly pricingService: PricingService,
  ) {}

  async findCandidates(criteria: MatchingCriteria): Promise<RiderInfo[]> {
    const activeShifts = await this.prisma.shift.findMany({
      where: {
        status: 'active',
      },
      select: {
        rider_user_id: true,
        vehicle_type: true,
        current_location: true,
      },
      orderBy: { last_location_update: 'desc' },
      take: this.maxCandidatePool,
    });

    const parsedShifts = activeShifts
      .map((shift) => ({
        rider_user_id: shift.rider_user_id,
        vehicle_type: shift.vehicle_type,
        current_location: this.parseLocation(shift.current_location),
      }))
      .filter(
        (shift): shift is CandidateShift =>
          Boolean(shift.current_location) &&
          this.isVehicleCompatible(criteria.vehicle_type, shift.vehicle_type),
      );

    if (parsedShifts.length === 0) {
      return this.getMockRiders(criteria);
    }

    const riderIds = [...new Set(parsedShifts.map((shift) => shift.rider_user_id))];

    const [users, preferences, reviews, recentBookings] = await Promise.all([
      this.prisma.user.findMany({
        where: {
          id: { in: riderIds },
          role: 'DRIVER',
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          phone: true,
        },
      }),
      this.prisma.userPreference.findMany({
        where: { userId: { in: riderIds } },
        select: { userId: true, preferences: true },
      }),
      this.prisma.review.groupBy({
        by: ['driverId'],
        where: {
          driverId: { in: riderIds },
        },
        _avg: { rating: true },
      }),
      this.prisma.booking.findMany({
        select: {
          status: true,
          rider: true,
          offer: true,
        },
        orderBy: { updated_at: 'desc' },
        take: 500,
      }),
    ]);

    const userById = new Map(users.map((user) => [user.id, user]));
    const availabilityByUserId = new Map(
      preferences.map((preference) => [
        preference.userId,
        this.getAvailability(preference.preferences),
      ]),
    );
    const dispatchStatsByUserId = new Map(
      preferences.map((preference) => [
        preference.userId,
        this.getDispatchStats(preference.preferences),
      ]),
    );
    const ratingByUserId = new Map(
      reviews
        .filter((review) => review.driverId)
        .map((review) => [
          String(review.driverId),
          Number(review._avg.rating || 4.5),
        ]),
    );

    const workloadByUserId = new Map<string, number>();
    const offeredByUserId = new Map<string, number>();
    const acceptedByUserId = new Map<string, number>();

    for (const booking of recentBookings) {
      const riderId = this.parseRiderId(booking.rider);
      if (riderId && this.isActiveAssignedStatus(String(booking.status || ''))) {
        workloadByUserId.set(riderId, (workloadByUserId.get(riderId) || 0) + 1);
      }

      const offeredTo = this.parseOfferedTo(booking.offer);
      for (const offeredRiderId of offeredTo) {
        offeredByUserId.set(
          offeredRiderId,
          (offeredByUserId.get(offeredRiderId) || 0) + 1,
        );
      }
      if (riderId && String(booking.status || '') === 'accepted') {
        acceptedByUserId.set(
          riderId,
          (acceptedByUserId.get(riderId) || 0) + 1,
        );
      }
    }

    const scored = parsedShifts
      .map((shift) => {
        const user = userById.get(shift.rider_user_id);
        if (!user || !shift.current_location) {
          return null;
        }

        const availability =
          availabilityByUserId.get(shift.rider_user_id) || 'offline';
        if (availability !== 'online') {
          return null;
        }

        const workload = workloadByUserId.get(shift.rider_user_id) || 0;
        if (workload >= this.maxActiveJobsPerTasker) {
          return null;
        }

        const distanceKm = this.pricingService.calculateDistanceKm(
          {
            lat: criteria.pickup_lat,
            lng: criteria.pickup_lng,
          },
          shift.current_location,
        );
        const radiusKm = Math.max(1, Number(criteria.radius_km || 10));
        if (distanceKm > radiusKm) {
          return null;
        }

        const etaMin = Math.max(2, Math.round(distanceKm * 4));
        const rating = ratingByUserId.get(shift.rider_user_id) || 4.5;
        const persistedStats =
          dispatchStatsByUserId.get(shift.rider_user_id) || null;
        const offeredCount =
          persistedStats?.offersReceived ??
          offeredByUserId.get(shift.rider_user_id) ??
          0;
        const acceptedCount =
          persistedStats?.acceptedOffers ??
          acceptedByUserId.get(shift.rider_user_id) ??
          0;
        const declinedCount = persistedStats?.declinedOffers ?? 0;
        const timedOutCount = persistedStats?.timedOutOffers ?? 0;
        const acceptanceRate =
          offeredCount > 0 ? acceptedCount / offeredCount : 0.7;

        const etaScore = Math.max(0, 1 - etaMin / 25);
        const ratingScore = Math.min(1, Math.max(0, rating / 5));
        const acceptanceScore = Math.min(1, Math.max(0, acceptanceRate));
        const workloadScore = Math.max(
          0,
          1 - workload / this.maxActiveJobsPerTasker,
        );
        const finalScore =
          etaScore * 0.45 +
          ratingScore * 0.2 +
          acceptanceScore * 0.2 +
          workloadScore * 0.15 -
          Math.min(0.1, (declinedCount + timedOutCount) * 0.01);

        return {
          rider: {
            user_id: user.id,
            name:
              `${user.firstName || ''} ${user.lastName || ''}`.trim() ||
              'Tasker',
            vehicle: criteria.vehicle_type,
            phone: user.phone || '+260972000000',
            rating: Number(rating.toFixed(2)),
            eta_min: etaMin,
          } satisfies RiderInfo,
          score: finalScore,
        };
      })
      .filter(
        (
          entry,
        ): entry is {
          rider: {
            user_id: string;
            name: string;
            vehicle: string;
            phone: string;
            rating: number;
            eta_min: number;
          };
          score: number;
        } => entry !== null,
      )
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map((entry) => entry.rider);

    return scored.length > 0 ? scored : this.getMockRiders(criteria);
  }

  private getAvailability(preferences: unknown): 'online' | 'offline' | 'busy' {
    if (!preferences || typeof preferences !== 'object') {
      return 'offline';
    }
    const raw = (preferences as Record<string, unknown>).taskerAvailability;
    return raw === 'online' || raw === 'busy' ? raw : 'offline';
  }

  private getDispatchStats(preferences: unknown): {
    offersReceived: number;
    acceptedOffers: number;
    declinedOffers: number;
    timedOutOffers: number;
  } | null {
    if (!preferences || typeof preferences !== 'object') {
      return null;
    }
    const stats = (preferences as Record<string, unknown>).taskerDispatchStats;
    if (!stats || typeof stats !== 'object') {
      return null;
    }
    const raw = stats as Record<string, unknown>;
    return {
      offersReceived: Number(raw.offersReceived || 0),
      acceptedOffers: Number(raw.acceptedOffers || 0),
      declinedOffers: Number(raw.declinedOffers || 0),
      timedOutOffers: Number(raw.timedOutOffers || 0),
    };
  }

  private parseLocation(value: unknown): { lat: number; lng: number } | null {
    if (!value || typeof value !== 'object') {
      return null;
    }
    const candidate = value as Record<string, unknown>;
    const lat = Number(candidate.lat);
    const lng = Number(candidate.lng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return null;
    }
    return { lat, lng };
  }

  private parseRiderId(value: unknown): string | null {
    if (!value || typeof value !== 'object') {
      return null;
    }
    const riderId = (value as Record<string, unknown>).user_id;
    return typeof riderId === 'string' && riderId.length > 0 ? riderId : null;
  }

  private parseOfferedTo(value: unknown): string[] {
    if (!value || typeof value !== 'object') {
      return [];
    }
    const offeredTo = (value as Record<string, unknown>).offered_to;
    return Array.isArray(offeredTo)
      ? offeredTo.filter((entry): entry is string => typeof entry === 'string')
      : [];
  }

  private isActiveAssignedStatus(status: string): boolean {
    return [
      'accepted',
      'en_route',
      'arrived_pickup',
      'picked_up',
      'en_route_dropoff',
    ].includes(status);
  }

  private isVehicleCompatible(requested: string, activeShiftVehicle: string): boolean {
    if (!requested || !activeShiftVehicle) {
      return true;
    }
    return requested === activeShiftVehicle;
  }

  private getMockRiders(criteria: MatchingCriteria): RiderInfo[] {
    return [
      {
        user_id: 'usr_r_101',
        name: 'John Mwamba',
        vehicle: criteria.vehicle_type,
        phone: '+260972111111',
        rating: 4.8,
        eta_min: 5,
      },
      {
        user_id: 'usr_r_102',
        name: 'Jane Phiri',
        vehicle: criteria.vehicle_type,
        phone: '+260972222222',
        rating: 4.9,
        eta_min: 7,
      },
      {
        user_id: 'usr_r_103',
        name: 'Peter Banda',
        vehicle: criteria.vehicle_type,
        phone: '+260972333333',
        rating: 4.7,
        eta_min: 10,
      },
    ];
  }
}
