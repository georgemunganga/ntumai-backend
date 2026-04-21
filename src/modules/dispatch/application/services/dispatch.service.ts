import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { PrismaService } from '../../../../shared/infrastructure/prisma.service';
import { PricingService } from '../../../pricing/application/services/pricing.service';

export type DispatchJobType = 'task' | 'delivery' | 'marketplace_order';

export interface DispatchJob {
  jobId: string;
  jobType: DispatchJobType;
  pickup: { lat: number; lng: number };
  vehicleType: string;
  radiusKm?: number;
}

export interface RankedTaskerCandidate {
  user_id: string;
  name: string;
  vehicle: string;
  phone: string;
  rating: number;
  eta_min: number;
  score: number;
}

interface TaskerDispatchStats {
  offersReceived: number;
  acceptedOffers: number;
  declinedOffers: number;
  timedOutOffers: number;
  releasedDeliveries: number;
  acceptedDeliveries: number;
}

type CandidateShift = {
  rider_user_id: string;
  vehicle_type: string;
  current_location: { lat: number; lng: number } | null;
};

@Injectable()
export class DispatchService {
  private readonly maxActiveJobsPerTasker = Number(
    process.env.MATCHING_MAX_ACTIVE_JOBS_PER_TASKER || 2,
  );
  private readonly maxCandidatePool = Number(
    process.env.MATCHING_MAX_CANDIDATE_POOL || 25,
  );
  private readonly etaRefinementPool = Number(
    process.env.MATCHING_ROUTE_ETA_POOL || 3,
  );
  private readonly googleMapsApiKey =
    process.env.GOOGLE_MAPS_API_KEY ||
    process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ||
    '';

  constructor(
    private readonly prisma: PrismaService,
    private readonly pricingService: PricingService,
  ) {}

  async rankTaskersForJob(job: DispatchJob): Promise<RankedTaskerCandidate[]> {
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
          this.isVehicleCompatible(job.vehicleType, shift.vehicle_type),
      );

    if (parsedShifts.length === 0) {
      return [];
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

    const ranked = parsedShifts
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
          job.pickup,
          shift.current_location,
        );
        const radiusKm = Math.max(1, Number(job.radiusKm || 10));
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
          user_id: user.id,
          name:
            `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Tasker',
          vehicle: job.vehicleType,
          phone: user.phone || '+260972000000',
          rating: Number(rating.toFixed(2)),
          eta_min: etaMin,
          score: Number(finalScore.toFixed(4)),
        } satisfies RankedTaskerCandidate;
      })
      .filter((entry): entry is RankedTaskerCandidate => entry !== null)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);

    return this.refineCandidatesWithRouteEta(job, ranked);
  }

  async incrementTaskerDispatchStat(
    riderUserId: string,
    key: keyof TaskerDispatchStats,
  ): Promise<void> {
    const existing = await this.prisma.userPreference.findUnique({
      where: { userId: riderUserId },
      select: { id: true, preferences: true },
    });

    const currentPreferences =
      existing?.preferences && typeof existing.preferences === 'object'
        ? (existing.preferences as Record<string, any>)
        : {};
    const currentDispatchStats =
      currentPreferences.taskerDispatchStats &&
      typeof currentPreferences.taskerDispatchStats === 'object'
        ? (currentPreferences.taskerDispatchStats as Record<string, any>)
        : {};

    const dispatchStats: Record<string, number | string> = {
      offersReceived: Number(currentDispatchStats.offersReceived || 0),
      acceptedOffers: Number(currentDispatchStats.acceptedOffers || 0),
      declinedOffers: Number(currentDispatchStats.declinedOffers || 0),
      timedOutOffers: Number(currentDispatchStats.timedOutOffers || 0),
      releasedDeliveries: Number(currentDispatchStats.releasedDeliveries || 0),
      acceptedDeliveries: Number(currentDispatchStats.acceptedDeliveries || 0),
      [key]: Number(currentDispatchStats[key] || 0) + 1,
      updatedAt: new Date().toISOString(),
    };

    const preferences = {
      ...currentPreferences,
      taskerDispatchStats: dispatchStats,
    };

    if (existing) {
      await this.prisma.userPreference.update({
        where: { userId: riderUserId },
        data: { preferences },
      });
      return;
    }

    await this.prisma.userPreference.create({
      data: {
        userId: riderUserId,
        preferences,
      },
    });
  }

  private getAvailability(preferences: unknown): 'online' | 'offline' | 'busy' {
    if (!preferences || typeof preferences !== 'object') {
      return 'offline';
    }
    const raw = (preferences as Record<string, unknown>).taskerAvailability;
    return raw === 'online' || raw === 'busy' ? raw : 'offline';
  }

  private getDispatchStats(preferences: unknown): TaskerDispatchStats | null {
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
      releasedDeliveries: Number(raw.releasedDeliveries || 0),
      acceptedDeliveries: Number(raw.acceptedDeliveries || 0),
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

  private async refineCandidatesWithRouteEta(
    job: DispatchJob,
    ranked: RankedTaskerCandidate[],
  ): Promise<RankedTaskerCandidate[]> {
    if (!this.googleMapsApiKey || ranked.length <= 1) {
      return ranked;
    }

    const refineCount = Math.min(
      Math.max(1, this.etaRefinementPool),
      ranked.length,
    );
    const candidatesToRefine = ranked.slice(0, refineCount);

    const refined = await Promise.all(
      candidatesToRefine.map(async (candidate) => {
        const routeEta = await this.fetchRouteEtaMinutes(candidate.user_id, job.pickup);
        if (routeEta == null) {
          return candidate;
        }

        const previousEtaScore = Math.max(0, 1 - candidate.eta_min / 25);
        const etaScore = Math.max(0, 1 - routeEta / 25);
        const nonEtaScore = candidate.score - previousEtaScore * 0.45;

        return {
          ...candidate,
          eta_min: routeEta,
          score: Number((nonEtaScore + etaScore * 0.45).toFixed(4)),
        };
      }),
    );

    return [...refined, ...ranked.slice(refineCount)].sort(
      (a, b) => b.score - a.score,
    );
  }

  private async fetchRouteEtaMinutes(
    riderUserId: string,
    destination: { lat: number; lng: number },
  ): Promise<number | null> {
    const shift = await this.prisma.shift.findFirst({
      where: {
        rider_user_id: riderUserId,
        status: 'active',
      },
      select: {
        current_location: true,
      },
      orderBy: { last_location_update: 'desc' },
    });

    const origin = this.parseLocation(shift?.current_location);
    if (!origin) {
      return null;
    }

    try {
      const response = await axios.get(
        'https://maps.googleapis.com/maps/api/directions/json',
        {
          params: {
            origin: `${origin.lat},${origin.lng}`,
            destination: `${destination.lat},${destination.lng}`,
            key: this.googleMapsApiKey,
          },
          timeout: 3000,
        },
      );

      const durationValue =
        response.data?.routes?.[0]?.legs?.[0]?.duration?.value ?? null;
      if (!durationValue || !Number.isFinite(Number(durationValue))) {
        return null;
      }

      return Math.max(2, Math.round(Number(durationValue) / 60));
    } catch {
      return null;
    }
  }
}
