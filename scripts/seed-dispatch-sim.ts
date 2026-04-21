import 'dotenv/config';
import { ConfigService } from '@nestjs/config';
import { hash } from 'bcrypt';
import { PrismaService } from '../src/shared/infrastructure/prisma.service';

const DEFAULT_CENTER = {
  lat: -15.3875,
  lng: 28.3228,
};

type SeedOptions = {
  count: number;
  centerLat: number;
  centerLng: number;
  radiusKm: number;
  onlineRatio: number;
  busyRatio: number;
};

function readNumberEnv(name: string, fallback: number): number {
  const value = Number(process.env[name] || fallback);
  return Number.isFinite(value) ? value : fallback;
}

function clampRatio(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }
  return Math.max(0, Math.min(1, value));
}

function seededUnit(index: number, salt: number): number {
  const value = Math.sin(index * 12.9898 + salt * 78.233) * 43758.5453;
  return value - Math.floor(value);
}

function jitterCoordinate(
  lat: number,
  lng: number,
  radiusKm: number,
  index: number,
): { lat: number; lng: number } {
  const angle = seededUnit(index, 1) * Math.PI * 2;
  const distanceKm = seededUnit(index, 2) * radiusKm;
  const dLat = (distanceKm / 111) * Math.cos(angle);
  const cosLat = Math.cos((lat * Math.PI) / 180);
  const safeCosLat = Math.abs(cosLat) < 0.0001 ? 0.0001 : cosLat;
  const dLng = (distanceKm / (111 * safeCosLat)) * Math.sin(angle);

  return {
    lat: Number((lat + dLat).toFixed(6)),
    lng: Number((lng + dLng).toFixed(6)),
  };
}

function resolveAvailability(index: number, options: SeedOptions): {
  availability: 'online' | 'busy' | 'offline';
  shiftStatus: 'active' | 'paused' | 'ended';
} {
  const marker = ((index % 100) + 1) / 100;
  if (marker <= options.onlineRatio) {
    return { availability: 'online', shiftStatus: 'active' };
  }
  if (marker <= options.onlineRatio + options.busyRatio) {
    return { availability: 'busy', shiftStatus: 'active' };
  }
  return { availability: 'offline', shiftStatus: 'ended' };
}

async function main() {
  const options: SeedOptions = {
    count: Math.max(1, Math.floor(readNumberEnv('DISPATCH_SIM_TASKERS', 200))),
    centerLat: readNumberEnv('DISPATCH_SIM_PICKUP_LAT', DEFAULT_CENTER.lat),
    centerLng: readNumberEnv('DISPATCH_SIM_PICKUP_LNG', DEFAULT_CENTER.lng),
    radiusKm: Math.max(0.2, readNumberEnv('DISPATCH_SIM_SEED_RADIUS_KM', 8)),
    onlineRatio: clampRatio(readNumberEnv('DISPATCH_SIM_ONLINE_RATIO', 0.7)),
    busyRatio: clampRatio(readNumberEnv('DISPATCH_SIM_BUSY_RATIO', 0.15)),
  };

  const totalAvailabilityRatio = options.onlineRatio + options.busyRatio;
  if (totalAvailabilityRatio > 1) {
    throw new Error('DISPATCH_SIM_ONLINE_RATIO + DISPATCH_SIM_BUSY_RATIO must be <= 1');
  }

  const configService = new ConfigService();
  const prisma = new PrismaService(configService);
  await prisma.onModuleInit();

  try {
    const passwordHash = await hash('password123', 10);
    const now = new Date();
    let onlineCount = 0;
    let busyCount = 0;
    let offlineCount = 0;

    for (let index = 1; index <= options.count; index += 1) {
      const suffix = String(index).padStart(4, '0');
      const userId = `sim-tasker-${suffix}`;
      const shiftId = `sim-shift-${suffix}`;
      const location = jitterCoordinate(
        options.centerLat,
        options.centerLng,
        options.radiusKm,
        index,
      );
      const { availability, shiftStatus } = resolveAvailability(index, options);
      const vehicleType =
        index % 10 === 0 ? 'bicycle' : index % 7 === 0 ? 'walking' : 'motorbike';
      const dispatchStats = {
        offersReceived: 8 + (index % 11),
        acceptedOffers: 4 + (index % 5),
        declinedOffers: index % 3,
        timedOutOffers: index % 2,
        releasedDeliveries: index % 2,
        acceptedDeliveries: 3 + (index % 4),
      };

      if (availability === 'online') onlineCount += 1;
      else if (availability === 'busy') busyCount += 1;
      else offlineCount += 1;

      await prisma.user.upsert({
        where: { id: userId },
        update: {
          email: `${userId}@ntumai-sim.local`,
          phone: `+26096${suffix}`,
          firstName: 'Sim',
          lastName: `Tasker${suffix}`,
          role: 'DRIVER',
          isEmailVerified: true,
          isPhoneVerified: true,
          updatedAt: now,
        },
        create: {
          id: userId,
          email: `${userId}@ntumai-sim.local`,
          phone: `+26096${suffix}`,
          firstName: 'Sim',
          lastName: `Tasker${suffix}`,
          password: passwordHash,
          role: 'DRIVER',
          isEmailVerified: true,
          isPhoneVerified: true,
          updatedAt: now,
        },
      });

      await prisma.userRoleAssignment.upsert({
        where: {
          userId_role: {
            userId,
            role: 'DRIVER',
          },
        },
        update: {
          active: true,
          metadata: { source: 'dispatch-sim' },
        },
        create: {
          userId,
          role: 'DRIVER',
          active: true,
          metadata: { source: 'dispatch-sim' },
        },
      });

      await prisma.userPreference.upsert({
        where: { userId },
        update: {
          preferences: {
            taskerAvailability: availability,
            taskerDispatchStats: dispatchStats,
            source: 'dispatch-sim',
          } as any,
          updatedAt: now,
        },
        create: {
          userId,
          preferences: {
            taskerAvailability: availability,
            taskerDispatchStats: dispatchStats,
            source: 'dispatch-sim',
          } as any,
        },
      });

      await prisma.shift.upsert({
        where: { id: shiftId },
        update: {
          rider_user_id: userId,
          status: shiftStatus,
          vehicle_type: vehicleType,
          start_time: new Date(now.getTime() - 60 * 60 * 1000),
          end_time:
            shiftStatus === 'ended'
              ? new Date(now.getTime() - 5 * 60 * 1000)
              : null,
          pause_time: availability === 'busy' ? now : null,
          resume_time: null,
          total_pause_duration_sec: availability === 'busy' ? 300 : 0,
          current_location: location as any,
          last_location_update: now,
          total_deliveries: index % 9,
          total_earnings: Number((50 + index * 3.5).toFixed(2)),
          total_distance_km: Number((5 + (index % 20) * 1.2).toFixed(2)),
          metadata: {
            source: 'dispatch-sim',
            availability,
          } as any,
          updated_at: now,
        },
        create: {
          id: shiftId,
          rider_user_id: userId,
          status: shiftStatus,
          vehicle_type: vehicleType,
          start_time: new Date(now.getTime() - 60 * 60 * 1000),
          end_time:
            shiftStatus === 'ended'
              ? new Date(now.getTime() - 5 * 60 * 1000)
              : null,
          pause_time: availability === 'busy' ? now : null,
          resume_time: null,
          total_pause_duration_sec: availability === 'busy' ? 300 : 0,
          current_location: location as any,
          last_location_update: now,
          total_deliveries: index % 9,
          total_earnings: Number((50 + index * 3.5).toFixed(2)),
          total_distance_km: Number((5 + (index % 20) * 1.2).toFixed(2)),
          metadata: {
            source: 'dispatch-sim',
            availability,
          } as any,
        },
      });
    }

    const extraSimulationShifts = await prisma.shift.findMany({
      where: {
        id: {
          startsWith: 'sim-shift-',
        },
      },
      select: {
        id: true,
        rider_user_id: true,
      },
    });

    for (const shift of extraSimulationShifts) {
      const suffix = Number(shift.id.replace('sim-shift-', ''));
      if (Number.isFinite(suffix) && suffix > options.count) {
        await prisma.shift.update({
          where: { id: shift.id },
          data: {
            status: 'ended',
            end_time: now,
            metadata: {
              source: 'dispatch-sim',
              deactivated: true,
            } as any,
          },
        });
        await prisma.userPreference.updateMany({
          where: { userId: shift.rider_user_id },
          data: {
            preferences: {
              taskerAvailability: 'offline',
              source: 'dispatch-sim',
            } as any,
          },
        });
      }
    }

    console.log(
      JSON.stringify(
        {
          seededTaskers: options.count,
          center: {
            lat: options.centerLat,
            lng: options.centerLng,
          },
          radiusKm: options.radiusKm,
          availability: {
            online: onlineCount,
            busy: busyCount,
            offline: offlineCount,
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
  console.error('[seed-dispatch-sim] failed', error);
  process.exitCode = 1;
});
