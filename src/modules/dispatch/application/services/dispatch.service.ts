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

type CachedRiderProfile = {
  user: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    phone: string | null;
  } | null;
  availability: 'online' | 'offline' | 'busy';
  dispatchStats: TaskerDispatchStats | null;
  rating: number;
};

type DispatchRankMetrics = {
  shiftCacheHit: boolean;
  riderProfileCacheHits: number;
  riderProfileCacheMisses: number;
  workloadCacheHit: boolean;
  shiftFetchMs: number;
  profileFetchMs: number;
  workloadFetchMs: number;
  scoreLoopMs: number;
  routeRefineMs: number;
  totalMs: number;
  candidateShiftCount: number;
  rankedCount: number;
  routeRefinementSkipped: boolean;
  activeRankCalls: number;
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
  private readonly shiftCacheTtlMs = Number(
    process.env.DISPATCH_SHIFT_CACHE_TTL_MS || 3000,
  );
  private readonly riderProfileCacheTtlMs = Number(
    process.env.DISPATCH_RIDER_PROFILE_CACHE_TTL_MS || 15000,
  );
  private readonly workloadCacheTtlMs = Number(
    process.env.DISPATCH_WORKLOAD_CACHE_TTL_MS || 5000,
  );
  private readonly dispatchProfilingEnabled =
    process.env.DISPATCH_PROFILE_LOGGING === 'true';
  private readonly dispatchProfilingSlowMs = Number(
    process.env.DISPATCH_PROFILE_SLOW_MS || 250,
  );
  private readonly routeRefinementMaxActiveCalls = Number(
    process.env.DISPATCH_ROUTE_REFINEMENT_MAX_ACTIVE_CALLS || 12,
  );
  private readonly googleMapsApiKey =
    process.env.GOOGLE_MAPS_API_KEY ||
    process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ||
    '';
  private shiftCache:
    | {
        expiresAt: number;
        value: CandidateShift[];
      }
    | null = null;
  private shiftCachePromise: Promise<CandidateShift[]> | null = null;
  private workloadCache:
    | {
        expiresAt: number;
        value: Map<string, number>;
      }
    | null = null;
  private workloadCachePromise: Promise<Map<string, number>> | null = null;
  private readonly riderProfileCache = new Map<
    string,
    {
      expiresAt: number;
      value: CachedRiderProfile;
    }
  >();
  private activeRankCalls = 0;

  constructor(
    private readonly prisma: PrismaService,
    private readonly pricingService: PricingService,
  ) {}

  async rankTaskersForJob(job: DispatchJob): Promise<RankedTaskerCandidate[]> {
    this.activeRankCalls += 1;
    const rankStartedAt = process.hrtime.bigint();
    const metrics: DispatchRankMetrics = {
      shiftCacheHit: false,
      riderProfileCacheHits: 0,
      riderProfileCacheMisses: 0,
      workloadCacheHit: false,
      shiftFetchMs: 0,
      profileFetchMs: 0,
      workloadFetchMs: 0,
      scoreLoopMs: 0,
      routeRefineMs: 0,
      totalMs: 0,
      candidateShiftCount: 0,
      rankedCount: 0,
      routeRefinementSkipped: false,
      activeRankCalls: this.activeRankCalls,
    };
    try {
      const shiftFetchStartedAt = process.hrtime.bigint();
      const parsedShifts = (await this.getActiveCandidateShifts(metrics)).filter(
        (shift): shift is CandidateShift =>
          Boolean(shift.current_location) &&
          this.isVehicleCompatible(job.vehicleType, shift.vehicle_type),
      );
      metrics.shiftFetchMs =
        Number(process.hrtime.bigint() - shiftFetchStartedAt) / 1_000_000;
      metrics.candidateShiftCount = parsedShifts.length;

      if (parsedShifts.length === 0) {
        metrics.totalMs =
          Number(process.hrtime.bigint() - rankStartedAt) / 1_000_000;
        this.logRankMetrics(job, metrics);
        return [];
      }

      const riderIds = [...new Set(parsedShifts.map((shift) => shift.rider_user_id))];

      const profileFetchStartedAt = process.hrtime.bigint();
      const workloadFetchStartedAt = process.hrtime.bigint();
      const [riderProfiles, workloadByUserId] = await Promise.all([
        this.getRiderProfiles(riderIds, metrics),
        this.getActiveWorkloadMap(metrics),
      ]);
      metrics.profileFetchMs =
        Number(process.hrtime.bigint() - profileFetchStartedAt) / 1_000_000;
      metrics.workloadFetchMs =
        Number(process.hrtime.bigint() - workloadFetchStartedAt) / 1_000_000;

      const scoreLoopStartedAt = process.hrtime.bigint();
      const ranked = parsedShifts
        .map((shift) => {
          const profile = riderProfiles.get(shift.rider_user_id);
          const user = profile?.user;
          if (!user || !shift.current_location || !profile) {
            return null;
          }

          const availability = profile.availability;
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
          const rating = profile.rating;
          const persistedStats = profile.dispatchStats;
          const offeredCount = persistedStats?.offersReceived ?? 0;
          const acceptedCount = persistedStats?.acceptedOffers ?? 0;
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
      metrics.scoreLoopMs =
        Number(process.hrtime.bigint() - scoreLoopStartedAt) / 1_000_000;
      metrics.rankedCount = ranked.length;

      const locationByRiderId = new Map(
        parsedShifts
          .filter((shift) => shift.current_location)
          .map((shift) => [shift.rider_user_id, shift.current_location!]),
      );

      const routeRefineStartedAt = process.hrtime.bigint();
      const refined = await this.refineCandidatesWithRouteEta(
        job,
        ranked,
        locationByRiderId,
        metrics,
      );
      metrics.routeRefineMs =
        Number(process.hrtime.bigint() - routeRefineStartedAt) / 1_000_000;
      metrics.totalMs = Number(process.hrtime.bigint() - rankStartedAt) / 1_000_000;
      this.logRankMetrics(job, metrics);
      return refined;
    } finally {
      this.activeRankCalls = Math.max(0, this.activeRankCalls - 1);
    }
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
      const cachedProfile = this.riderProfileCache.get(riderUserId);
      if (cachedProfile) {
        this.riderProfileCache.set(riderUserId, {
          expiresAt: Date.now() + this.riderProfileCacheTtlMs,
          value: {
            ...cachedProfile.value,
            availability: this.getAvailability(preferences),
            dispatchStats: this.getDispatchStats(preferences),
          },
        });
      }
      return;
    }

    await this.prisma.userPreference.create({
      data: {
        userId: riderUserId,
        preferences,
      },
    });
    this.riderProfileCache.delete(riderUserId);
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
    locationByRiderId: Map<string, { lat: number; lng: number }>,
    metrics?: DispatchRankMetrics,
  ): Promise<RankedTaskerCandidate[]> {
    if (!this.googleMapsApiKey || ranked.length <= 1) {
      return ranked;
    }

    if (this.activeRankCalls > this.routeRefinementMaxActiveCalls) {
      if (metrics) {
        metrics.routeRefinementSkipped = true;
      }
      return ranked;
    }

    const refineCount = Math.min(
      Math.max(1, this.etaRefinementPool),
      ranked.length,
    );
    const candidatesToRefine = ranked.slice(0, refineCount);

    const refined = await Promise.all(
      candidatesToRefine.map(async (candidate) => {
        const origin = locationByRiderId.get(candidate.user_id);
        const routeEta = origin
          ? await this.fetchRouteEtaMinutes(origin, job.pickup)
          : null;
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

  private async getActiveCandidateShifts(
    metrics?: DispatchRankMetrics,
  ): Promise<CandidateShift[]> {
    const now = Date.now();
    if (this.shiftCache && this.shiftCache.expiresAt > now) {
      if (metrics) {
        metrics.shiftCacheHit = true;
      }
      return this.shiftCache.value;
    }
    if (this.shiftCachePromise) {
      if (metrics) {
        metrics.shiftCacheHit = true;
      }
      return this.shiftCachePromise;
    }

    this.shiftCachePromise = this.prisma.shift
      .findMany({
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
      })
      .then((activeShifts) => {
        const parsed = activeShifts
          .map((shift) => ({
            rider_user_id: shift.rider_user_id,
            vehicle_type: shift.vehicle_type,
            current_location: this.parseLocation(shift.current_location),
          }))
          .filter(
            (shift): shift is CandidateShift => Boolean(shift.current_location),
          );
        this.shiftCache = {
          expiresAt: Date.now() + this.shiftCacheTtlMs,
          value: parsed,
        };
        return parsed;
      })
      .finally(() => {
        this.shiftCachePromise = null;
      });

    return this.shiftCachePromise;
  }

  private async getRiderProfiles(
    riderIds: string[],
    metrics?: DispatchRankMetrics,
  ): Promise<Map<string, CachedRiderProfile>> {
    const now = Date.now();
    const result = new Map<string, CachedRiderProfile>();
    const missingRiderIds: string[] = [];

    for (const riderId of riderIds) {
      const cached = this.riderProfileCache.get(riderId);
      if (cached && cached.expiresAt > now) {
        result.set(riderId, cached.value);
        if (metrics) {
          metrics.riderProfileCacheHits += 1;
        }
      } else {
        missingRiderIds.push(riderId);
        if (metrics) {
          metrics.riderProfileCacheMisses += 1;
        }
      }
    }

    if (missingRiderIds.length === 0) {
      return result;
    }

    const [users, preferences, reviews] = await Promise.all([
      this.prisma.user.findMany({
        where: {
          id: { in: missingRiderIds },
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
        where: { userId: { in: missingRiderIds } },
        select: { userId: true, preferences: true },
      }),
      this.prisma.review.groupBy({
        by: ['driverId'],
        where: {
          driverId: { in: missingRiderIds },
        },
        _avg: { rating: true },
      }),
    ]);

    const userById = new Map(users.map((user) => [user.id, user]));
    const preferenceByUserId = new Map(
      preferences.map((preference) => [preference.userId, preference.preferences]),
    );
    const ratingByUserId = new Map(
      reviews
        .filter((review) => review.driverId)
        .map((review) => [
          String(review.driverId),
          Number(review._avg.rating || 4.5),
        ]),
    );

    for (const riderId of missingRiderIds) {
      const preferencesRaw = preferenceByUserId.get(riderId);
      const profile: CachedRiderProfile = {
        user: userById.get(riderId) || null,
        availability: this.getAvailability(preferencesRaw),
        dispatchStats: this.getDispatchStats(preferencesRaw),
        rating: ratingByUserId.get(riderId) || 4.5,
      };
      this.riderProfileCache.set(riderId, {
        expiresAt: now + this.riderProfileCacheTtlMs,
        value: profile,
      });
      result.set(riderId, profile);
    }

    return result;
  }

  private async getActiveWorkloadMap(
    metrics?: DispatchRankMetrics,
  ): Promise<Map<string, number>> {
    const now = Date.now();
    if (this.workloadCache && this.workloadCache.expiresAt > now) {
      if (metrics) {
        metrics.workloadCacheHit = true;
      }
      return this.workloadCache.value;
    }
    if (this.workloadCachePromise) {
      if (metrics) {
        metrics.workloadCacheHit = true;
      }
      return this.workloadCachePromise;
    }

    this.workloadCachePromise = this.prisma.booking
      .findMany({
        where: {
          status: {
            in: [
              'accepted',
              'en_route',
              'arrived_pickup',
              'picked_up',
              'en_route_dropoff',
            ],
          },
        },
        select: {
          rider: true,
        },
      })
      .then((bookings) => {
        const workloadByUserId = new Map<string, number>();
        for (const booking of bookings) {
          const riderId = this.parseRiderId(booking.rider);
          if (!riderId) {
            continue;
          }
          workloadByUserId.set(
            riderId,
            (workloadByUserId.get(riderId) || 0) + 1,
          );
        }
        this.workloadCache = {
          expiresAt: Date.now() + this.workloadCacheTtlMs,
          value: workloadByUserId,
        };
        return workloadByUserId;
      })
      .finally(() => {
        this.workloadCachePromise = null;
      });

    return this.workloadCachePromise;
  }

  private async fetchRouteEtaMinutes(
    origin: { lat: number; lng: number },
    destination: { lat: number; lng: number },
  ): Promise<number | null> {
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

  private logRankMetrics(
    job: DispatchJob,
    metrics: DispatchRankMetrics,
  ): void {
    if (!this.dispatchProfilingEnabled) {
      return;
    }

    if (metrics.totalMs < this.dispatchProfilingSlowMs) {
      return;
    }

    console.log(
      JSON.stringify({
        component: 'dispatch.rank',
        jobId: job.jobId,
        jobType: job.jobType,
        vehicleType: job.vehicleType,
        radiusKm: job.radiusKm ?? null,
        metrics: {
          totalMs: Number(metrics.totalMs.toFixed(2)),
          shiftFetchMs: Number(metrics.shiftFetchMs.toFixed(2)),
          profileFetchMs: Number(metrics.profileFetchMs.toFixed(2)),
          workloadFetchMs: Number(metrics.workloadFetchMs.toFixed(2)),
          scoreLoopMs: Number(metrics.scoreLoopMs.toFixed(2)),
          routeRefineMs: Number(metrics.routeRefineMs.toFixed(2)),
          routeRefinementSkipped: metrics.routeRefinementSkipped,
          activeRankCalls: metrics.activeRankCalls,
          shiftCacheHit: metrics.shiftCacheHit,
          workloadCacheHit: metrics.workloadCacheHit,
          riderProfileCacheHits: metrics.riderProfileCacheHits,
          riderProfileCacheMisses: metrics.riderProfileCacheMisses,
          candidateShiftCount: metrics.candidateShiftCount,
          rankedCount: metrics.rankedCount,
        },
      }),
    );
  }
}
