import 'dotenv/config';
import { ConfigService } from '@nestjs/config';
import type { DispatchJobType } from '../src/modules/dispatch/application/services/dispatch.service';
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
  statusReadsPerRound: number;
  maxOfferRounds: number;
  acceptRate: number;
  declineRate: number;
  timeoutRate: number;
  jobMix: Array<{ type: DispatchJobType; weight: number }>;
};

type JobResult = {
  jobType: DispatchJobType;
  rounds: number;
  assigned: boolean;
  failed: boolean;
  declinedCount: number;
  timedOutCount: number;
  offeredCount: number;
  statusReads: number;
  jobDurationMs: number;
  rankDurationsMs: number[];
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

function clampRate(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(1, value));
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
  const dLng =
    (distanceKm / (111 * Math.cos((lat * Math.PI) / 180))) * Math.sin(angle);

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

function chooseJobType(
  mix: Array<{ type: DispatchJobType; weight: number }>,
): DispatchJobType {
  const totalWeight = mix.reduce((sum, entry) => sum + entry.weight, 0);
  const draw = Math.random() * Math.max(totalWeight, 1);
  let cursor = 0;

  for (const entry of mix) {
    cursor += entry.weight;
    if (draw <= cursor) {
      return entry.type;
    }
  }

  return mix[0]?.type || 'delivery';
}

function parseJobMix(): Array<{ type: DispatchJobType; weight: number }> {
  const deliveryWeight = Math.max(0, readNumberEnv('DISPATCH_MIX_DELIVERY', 0.4));
  const taskWeight = Math.max(0, readNumberEnv('DISPATCH_MIX_TASK', 0.35));
  const marketplaceWeight = Math.max(
    0,
    readNumberEnv('DISPATCH_MIX_MARKETPLACE', 0.25),
  );

  const mix: Array<{ type: DispatchJobType; weight: number }> = [
    { type: 'delivery', weight: deliveryWeight },
    { type: 'task', weight: taskWeight },
    { type: 'marketplace_order', weight: marketplaceWeight },
  ];

  return mix.filter((entry) => entry.weight > 0);
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
    where: { status: 'active' },
    orderBy: { last_location_update: 'desc' },
    select: { current_location: true },
  });
  const latestShiftWithLocation =
    activeShift ||
    (await prisma.shift.findFirst({
      orderBy: { last_location_update: 'desc' },
      select: { current_location: true },
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
      `[dispatch-mixed-workload-sim] No shift with current location found. Falling back to default pickup ${DEFAULT_SIM_PICKUP.lat},${DEFAULT_SIM_PICKUP.lng}.`,
    );
    return DEFAULT_SIM_PICKUP;
  }

  return { lat, lng };
}

function simulateDecision(options: SimulationOptions): 'accept' | 'decline' | 'timeout' {
  const acceptRate = options.acceptRate;
  const declineRate = options.declineRate;
  const timeoutRate = options.timeoutRate;
  const draw = Math.random();

  if (draw < acceptRate) {
    return 'accept';
  }
  if (draw < acceptRate + declineRate) {
    return 'decline';
  }
  if (draw < acceptRate + declineRate + timeoutRate) {
    return 'timeout';
  }
  return 'accept';
}

async function runJobSimulation(
  dispatchService: DispatchService,
  options: SimulationOptions,
  basePickup: { lat: number; lng: number },
  jobIndex: number,
): Promise<JobResult> {
  const jobType = chooseJobType(options.jobMix);
  const pickup = jitterCoordinate(basePickup.lat, basePickup.lng, options.jitterKm);
  const startedAt = process.hrtime.bigint();
  const offeredTo = new Set<string>();
  const rankDurationsMs: number[] = [];
  let rounds = 0;
  let declinedCount = 0;
  let timedOutCount = 0;
  let offeredCount = 0;
  let statusReads = 0;
  let assigned = false;
  let failed = false;
  let topEtaMin: number | null = null;

  while (rounds < options.maxOfferRounds) {
    rounds += 1;
    const rankStartedAt = process.hrtime.bigint();
    const ranked = await dispatchService.rankTaskersForJob({
      jobId: `mixed-${jobIndex}-round-${rounds}`,
      jobType,
      pickup,
      vehicleType: options.vehicleType,
      radiusKm: options.radiusKm,
    });
    const rankEndedAt = process.hrtime.bigint();
    rankDurationsMs.push(Number(rankEndedAt - rankStartedAt) / 1_000_000);

    const nextCandidate = ranked.find((candidate) => !offeredTo.has(candidate.user_id));
    topEtaMin = topEtaMin ?? nextCandidate?.eta_min ?? null;

    statusReads += options.statusReadsPerRound;
    if (!nextCandidate) {
      failed = true;
      break;
    }

    offeredTo.add(nextCandidate.user_id);
    offeredCount += 1;

    const decision = simulateDecision(options);
    if (decision === 'accept') {
      assigned = true;
      break;
    }
    if (decision === 'decline') {
      declinedCount += 1;
      continue;
    }

    timedOutCount += 1;
  }

  if (!assigned && !failed) {
    failed = true;
  }

  const endedAt = process.hrtime.bigint();
  return {
    jobType,
    rounds,
    assigned,
    failed,
    declinedCount,
    timedOutCount,
    offeredCount,
    statusReads,
    jobDurationMs: Number(endedAt - startedAt) / 1_000_000,
    rankDurationsMs,
    topEtaMin,
  };
}

async function main() {
  const options: SimulationOptions = {
    jobs: readNumberEnv('DISPATCH_SIM_JOBS', 300),
    concurrency: Math.max(1, readNumberEnv('DISPATCH_SIM_CONCURRENCY', 25)),
    radiusKm: readNumberEnv('DISPATCH_SIM_RADIUS_KM', 10),
    vehicleType: process.env.DISPATCH_SIM_VEHICLE_TYPE || 'motorbike',
    pickupLat: process.env.DISPATCH_SIM_PICKUP_LAT
      ? Number(process.env.DISPATCH_SIM_PICKUP_LAT)
      : undefined,
    pickupLng: process.env.DISPATCH_SIM_PICKUP_LNG
      ? Number(process.env.DISPATCH_SIM_PICKUP_LNG)
      : undefined,
    jitterKm: readNumberEnv('DISPATCH_SIM_PICKUP_JITTER_KM', 2),
    warmup: Math.max(0, readNumberEnv('DISPATCH_SIM_WARMUP', 5)),
    statusReadsPerRound: Math.max(
      0,
      readNumberEnv('DISPATCH_SIM_STATUS_READS_PER_ROUND', 8),
    ),
    maxOfferRounds: Math.max(1, readNumberEnv('DISPATCH_SIM_MAX_OFFER_ROUNDS', 4)),
    acceptRate: clampRate(readNumberEnv('DISPATCH_SIM_ACCEPT_RATE', 0.55)),
    declineRate: clampRate(readNumberEnv('DISPATCH_SIM_DECLINE_RATE', 0.25)),
    timeoutRate: clampRate(readNumberEnv('DISPATCH_SIM_TIMEOUT_RATE', 0.2)),
    jobMix: parseJobMix(),
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
          statusReadsPerRound: options.statusReadsPerRound,
          maxOfferRounds: options.maxOfferRounds,
          rates: {
            accept: options.acceptRate,
            decline: options.declineRate,
            timeout: options.timeoutRate,
          },
          jobMix: options.jobMix,
        },
        null,
        2,
      ),
    );

    for (let i = 0; i < options.warmup; i += 1) {
      await runJobSimulation(dispatchService, options, basePickup, i);
    }

    const startedAt = process.hrtime.bigint();
    const results: JobResult[] = new Array(options.jobs);
    let cursor = 0;

    await Promise.all(
      Array.from({ length: options.concurrency }, async () => {
        while (true) {
          const currentIndex = cursor;
          cursor += 1;
          if (currentIndex >= options.jobs) {
            return;
          }
          results[currentIndex] = await runJobSimulation(
            dispatchService,
            options,
            basePickup,
            currentIndex,
          );
        }
      }),
    );

    const completedAt = process.hrtime.bigint();
    const totalDurationMs = Number(completedAt - startedAt) / 1_000_000;
    const jobDurations = results
      .map((result) => result.jobDurationMs)
      .sort((a, b) => a - b);
    const rankDurations = results
      .flatMap((result) => result.rankDurationsMs)
      .sort((a, b) => a - b);
    const topEtas = results
      .map((result) => result.topEtaMin)
      .filter((value): value is number => typeof value === 'number')
      .sort((a, b) => a - b);
    const assignedJobs = results.filter((result) => result.assigned);
    const failedJobs = results.filter((result) => result.failed);
    const perType = ['delivery', 'task', 'marketplace_order'].map((jobType) => {
      const typed = results.filter((result) => result.jobType === jobType);
      return {
        jobType,
        jobs: typed.length,
        assigned: typed.filter((result) => result.assigned).length,
        failed: typed.filter((result) => result.failed).length,
        avgRounds: Number(average(typed.map((result) => result.rounds)).toFixed(2)),
      };
    });

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
          assignedRate: Number(
            (assignedJobs.length / Math.max(1, options.jobs)).toFixed(4),
          ),
          failedRate: Number(
            (failedJobs.length / Math.max(1, options.jobs)).toFixed(4),
          ),
          totalOffers: results.reduce((sum, result) => sum + result.offeredCount, 0),
          totalDeclines: results.reduce(
            (sum, result) => sum + result.declinedCount,
            0,
          ),
          totalTimeouts: results.reduce(
            (sum, result) => sum + result.timedOutCount,
            0,
          ),
          totalStatusReads: results.reduce(
            (sum, result) => sum + result.statusReads,
            0,
          ),
          avgRoundsPerJob: Number(
            average(results.map((result) => result.rounds)).toFixed(2),
          ),
          jobLatencyMs: {
            avg: Number(average(jobDurations).toFixed(2)),
            p50: Number(percentile(jobDurations, 50).toFixed(2)),
            p95: Number(percentile(jobDurations, 95).toFixed(2)),
            p99: Number(percentile(jobDurations, 99).toFixed(2)),
            max: Number((jobDurations[jobDurations.length - 1] || 0).toFixed(2)),
          },
          rankLatencyMs: {
            avg: Number(average(rankDurations).toFixed(2)),
            p50: Number(percentile(rankDurations, 50).toFixed(2)),
            p95: Number(percentile(rankDurations, 95).toFixed(2)),
            p99: Number(percentile(rankDurations, 99).toFixed(2)),
            max: Number((rankDurations[rankDurations.length - 1] || 0).toFixed(2)),
          },
          topEtaMin: {
            avg: Number(average(topEtas).toFixed(2)),
            p50: Number(percentile(topEtas, 50).toFixed(2)),
            p95: Number(percentile(topEtas, 95).toFixed(2)),
          },
          perType,
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
  console.error('[dispatch-mixed-workload-sim] failed', error);
  process.exitCode = 1;
});
