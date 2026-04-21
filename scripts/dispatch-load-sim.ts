import 'dotenv/config';
import { ConfigService } from '@nestjs/config';
import { DispatchService } from '../src/modules/dispatch/application/services/dispatch.service';
import { PricingService } from '../src/modules/pricing/application/services/pricing.service';
import { PrismaService } from '../src/shared/infrastructure/prisma.service';

type SimulationOptions = {
  jobs: number;
  concurrency: number;
  radiusKm: number;
  vehicleType: string;
  pickupLat?: number;
  pickupLng?: number;
  jitterKm: number;
  warmup: number;
};

type JobResult = {
  durationMs: number;
  candidateCount: number;
  topScore: number | null;
  topEtaMin: number | null;
};

const DEFAULT_SIM_PICKUP = {
  lat: -15.3875,
  lng: 28.3228,
};

function readNumberEnv(name: string, fallback: number): number {
  const value = Number(process.env[name] || fallback);
  return Number.isFinite(value) ? value : fallback;
}

function jitterCoordinate(
  lat: number,
  lng: number,
  jitterKm: number,
): { lat: number; lng: number } {
  if (jitterKm <= 0) {
    return { lat, lng };
  }

  const angle = Math.random() * Math.PI * 2;
  const distanceKm = Math.random() * jitterKm;
  const dLat = (distanceKm / 111) * Math.cos(angle);
  const dLng = (distanceKm / (111 * Math.cos((lat * Math.PI) / 180))) * Math.sin(angle);

  return {
    lat: Number((lat + dLat).toFixed(6)),
    lng: Number((lng + dLng).toFixed(6)),
  };
}

function percentile(sortedValues: number[], p: number): number {
  if (!sortedValues.length) return 0;
  const index = Math.min(
    sortedValues.length - 1,
    Math.max(0, Math.ceil((p / 100) * sortedValues.length) - 1),
  );
  return sortedValues[index];
}

function average(values: number[]): number {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

async function resolveBasePickup(
  prisma: PrismaService,
  options: SimulationOptions,
): Promise<{ lat: number; lng: number }> {
  if (
    typeof options.pickupLat === 'number' &&
    typeof options.pickupLng === 'number' &&
    Number.isFinite(options.pickupLat) &&
    Number.isFinite(options.pickupLng)
  ) {
    return {
      lat: options.pickupLat,
      lng: options.pickupLng,
    };
  }

  const activeShift = await prisma.shift.findFirst({
    where: {
      status: 'active',
    },
    orderBy: { last_location_update: 'desc' },
    select: {
      current_location: true,
    },
  });
  const latestShiftWithLocation =
    activeShift ||
    (await prisma.shift.findFirst({
      orderBy: { last_location_update: 'desc' },
      select: {
        current_location: true,
      },
    }));

  const candidate =
    latestShiftWithLocation?.current_location &&
    typeof latestShiftWithLocation.current_location === 'object'
      ? (latestShiftWithLocation.current_location as Record<string, unknown>)
      : null;
  const lat = Number(candidate?.lat);
  const lng = Number(candidate?.lng);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    console.warn(
      `[dispatch-load-sim] No shift with current location found. Falling back to default pickup ${DEFAULT_SIM_PICKUP.lat},${DEFAULT_SIM_PICKUP.lng}.`,
    );
    return DEFAULT_SIM_PICKUP;
  }

  return { lat, lng };
}

async function main() {
  const options: SimulationOptions = {
    jobs: readNumberEnv('DISPATCH_SIM_JOBS', 200),
    concurrency: Math.max(1, readNumberEnv('DISPATCH_SIM_CONCURRENCY', 20)),
    radiusKm: readNumberEnv('DISPATCH_SIM_RADIUS_KM', 10),
    vehicleType: process.env.DISPATCH_SIM_VEHICLE_TYPE || 'motorbike',
    pickupLat: process.env.DISPATCH_SIM_PICKUP_LAT
      ? Number(process.env.DISPATCH_SIM_PICKUP_LAT)
      : undefined,
    pickupLng: process.env.DISPATCH_SIM_PICKUP_LNG
      ? Number(process.env.DISPATCH_SIM_PICKUP_LNG)
      : undefined,
    jitterKm: readNumberEnv('DISPATCH_SIM_PICKUP_JITTER_KM', 1.5),
    warmup: Math.max(0, readNumberEnv('DISPATCH_SIM_WARMUP', 5)),
  };

  const configService = new ConfigService();
  const prisma = new PrismaService(configService);
  const pricingService = new PricingService();
  const dispatchService = new DispatchService(prisma, pricingService);

  try {
    await prisma.onModuleInit();
    const basePickup = await resolveBasePickup(prisma, options);

    console.log(
      JSON.stringify(
        {
          phase: 'setup',
          jobs: options.jobs,
          concurrency: options.concurrency,
          radiusKm: options.radiusKm,
          vehicleType: options.vehicleType,
          basePickup,
          jitterKm: options.jitterKm,
          warmup: options.warmup,
        },
        null,
        2,
      ),
    );

    for (let i = 0; i < options.warmup; i += 1) {
      const pickup = jitterCoordinate(
        basePickup.lat,
        basePickup.lng,
        options.jitterKm,
      );
      await dispatchService.rankTaskersForJob({
        jobId: `warmup-${i}`,
        jobType: 'delivery',
        pickup,
        vehicleType: options.vehicleType,
        radiusKm: options.radiusKm,
      });
    }

    const startedAt = process.hrtime.bigint();
    const results: JobResult[] = new Array(options.jobs);
    let cursor = 0;

    await Promise.all(
      Array.from({ length: options.concurrency }, async (_, workerIndex) => {
        while (true) {
          const currentIndex = cursor;
          cursor += 1;
          if (currentIndex >= options.jobs) {
            return;
          }

          const pickup = jitterCoordinate(
            basePickup.lat,
            basePickup.lng,
            options.jitterKm,
          );
          const started = process.hrtime.bigint();
          const ranked = await dispatchService.rankTaskersForJob({
            jobId: `sim-${workerIndex}-${currentIndex}`,
            jobType: currentIndex % 3 === 0 ? 'delivery' : currentIndex % 3 === 1 ? 'task' : 'marketplace_order',
            pickup,
            vehicleType: options.vehicleType,
            radiusKm: options.radiusKm,
          });
          const ended = process.hrtime.bigint();
          results[currentIndex] = {
            durationMs: Number(ended - started) / 1_000_000,
            candidateCount: ranked.length,
            topScore: ranked[0]?.score ?? null,
            topEtaMin: ranked[0]?.eta_min ?? null,
          };
        }
      }),
    );

    const completedAt = process.hrtime.bigint();
    const totalDurationMs = Number(completedAt - startedAt) / 1_000_000;
    const durations = results.map((result) => result.durationMs).sort((a, b) => a - b);
    const withCandidates = results.filter((result) => result.candidateCount > 0);
    const topEtas = withCandidates
      .map((result) => result.topEtaMin)
      .filter((value): value is number => typeof value === 'number');
    const sortedTopEtas = [...topEtas].sort((a, b) => a - b);

    console.log(
      JSON.stringify(
        {
          phase: 'summary',
          jobs: options.jobs,
          concurrency: options.concurrency,
          totalDurationMs: Number(totalDurationMs.toFixed(2)),
          throughputJobsPerSec: Number(
            ((options.jobs / totalDurationMs) * 1000).toFixed(2),
          ),
          candidateHitRate: Number(
            (withCandidates.length / Math.max(1, options.jobs)).toFixed(4),
          ),
          latencyMs: {
            avg: Number(average(durations).toFixed(2)),
            p50: Number(percentile(durations, 50).toFixed(2)),
            p95: Number(percentile(durations, 95).toFixed(2)),
            p99: Number(percentile(durations, 99).toFixed(2)),
            max: Number((durations[durations.length - 1] || 0).toFixed(2)),
          },
          topEtaMin: {
            avg: Number(average(topEtas).toFixed(2)),
            p50: Number(percentile(sortedTopEtas, 50).toFixed(2)),
            p95: Number(percentile(sortedTopEtas, 95).toFixed(2)),
          },
        },
        null,
        2,
      ),
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error('[dispatch-load-sim] failed', error);
  process.exitCode = 1;
});
