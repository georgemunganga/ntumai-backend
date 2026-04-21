import { DispatchService } from './dispatch.service';

describe('DispatchService simulation', () => {
  const freshDate = new Date();
  const staleDate = new Date(Date.now() - 5 * 60 * 1000);

  const makeService = () => {
    const prisma = {
      shift: {
        findMany: jest.fn(),
      },
      user: {
        findMany: jest.fn(),
      },
      userPreference: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        create: jest.fn(),
      },
      review: {
        groupBy: jest.fn(),
      },
      booking: {
        findMany: jest.fn(),
      },
    } as any;

    const pricingService = {
      calculateDistanceKm: jest.fn(
        (
          a: { lat: number; lng: number },
          b: { lat: number; lng: number },
        ) => {
          const dLat = a.lat - b.lat;
          const dLng = a.lng - b.lng;
          return Math.sqrt(dLat * dLat + dLng * dLng) * 111;
        },
      ),
    } as any;

    return {
      prisma,
      pricingService,
      service: new DispatchService(prisma, pricingService),
    };
  };

  it('prefers available riders under workload cap and closer ETA', async () => {
    const { prisma, service } = makeService();

    prisma.shift.findMany.mockResolvedValue([
      {
        rider_user_id: 'rider-near',
        vehicle_type: 'motorbike',
        current_location: { lat: -15.4001, lng: 28.2801 },
        last_location_update: freshDate,
      },
      {
        rider_user_id: 'rider-far',
        vehicle_type: 'motorbike',
        current_location: { lat: -15.49, lng: 28.39 },
        last_location_update: freshDate,
      },
      {
        rider_user_id: 'rider-busy',
        vehicle_type: 'motorbike',
        current_location: { lat: -15.4002, lng: 28.2802 },
        last_location_update: freshDate,
      },
      {
        rider_user_id: 'rider-offline',
        vehicle_type: 'motorbike',
        current_location: { lat: -15.4003, lng: 28.2803 },
        last_location_update: freshDate,
      },
    ]);
    prisma.user.findMany.mockResolvedValue([
      {
        id: 'rider-near',
        firstName: 'Near',
        lastName: 'Rider',
        phone: '+260111111111',
        role: 'DRIVER',
      },
      {
        id: 'rider-far',
        firstName: 'Far',
        lastName: 'Rider',
        phone: '+260222222222',
        role: 'DRIVER',
      },
      {
        id: 'rider-busy',
        firstName: 'Busy',
        lastName: 'Rider',
        phone: '+260333333333',
        role: 'DRIVER',
      },
      {
        id: 'rider-offline',
        firstName: 'Offline',
        lastName: 'Rider',
        phone: '+260444444444',
        role: 'DRIVER',
      },
    ]);
    prisma.userPreference.findMany.mockResolvedValue([
      {
        userId: 'rider-near',
        preferences: { taskerAvailability: 'online' },
      },
      {
        userId: 'rider-far',
        preferences: { taskerAvailability: 'online' },
      },
      {
        userId: 'rider-busy',
        preferences: { taskerAvailability: 'online' },
      },
      {
        userId: 'rider-offline',
        preferences: { taskerAvailability: 'offline' },
      },
    ]);
    prisma.review.groupBy.mockResolvedValue([
      { driverId: 'rider-near', _avg: { rating: 4.8 } },
      { driverId: 'rider-far', _avg: { rating: 4.6 } },
      { driverId: 'rider-busy', _avg: { rating: 4.9 } },
    ]);
    prisma.booking.findMany.mockResolvedValue([
      {
        status: 'accepted',
        rider: { user_id: 'rider-busy' },
        offer: { offered_to: ['rider-busy'] },
      },
      {
        status: 'en_route',
        rider: { user_id: 'rider-busy' },
        offer: { offered_to: [] },
      },
    ]);

    const ranked = await service.rankTaskersForJob({
      jobId: 'job-1',
      jobType: 'delivery',
      pickup: { lat: -15.4, lng: 28.28 },
      vehicleType: 'motorbike',
      radiusKm: 20,
    });

    expect(ranked.map((candidate) => candidate.user_id)).toEqual([
      'rider-near',
      'rider-far',
    ]);
  });

  it('stays stable across concurrent ranking requests', async () => {
    const { prisma, service } = makeService();

    const shifts = Array.from({ length: 20 }, (_, index) => ({
      rider_user_id: `rider-${index}`,
      vehicle_type: 'motorbike',
      current_location: {
        lat: -15.4 + index * 0.0005,
        lng: 28.28 + index * 0.0005,
      },
      last_location_update: freshDate,
    }));

    prisma.shift.findMany.mockResolvedValue(shifts);
    prisma.user.findMany.mockResolvedValue(
      shifts.map((shift, index) => ({
        id: shift.rider_user_id,
        firstName: `Rider${index}`,
        lastName: 'Load',
        phone: `+26097${String(index).padStart(8, '0')}`,
        role: 'DRIVER',
      })),
    );
    prisma.userPreference.findMany.mockResolvedValue(
      shifts.map((shift, index) => ({
        userId: shift.rider_user_id,
        preferences: {
          taskerAvailability: 'online',
          taskerDispatchStats: {
            offersReceived: 5 + index,
            acceptedOffers: 3 + (index % 3),
            declinedOffers: index % 2,
            timedOutOffers: 0,
          },
        },
      })),
    );
    prisma.review.groupBy.mockResolvedValue(
      shifts.map((shift, index) => ({
        driverId: shift.rider_user_id,
        _avg: { rating: 4.2 + (index % 5) * 0.1 },
      })),
    );
    prisma.booking.findMany.mockResolvedValue([]);

    const results = await Promise.all(
      Array.from({ length: 25 }, (_, index) =>
        service.rankTaskersForJob({
          jobId: `job-${index}`,
          jobType: 'task',
          pickup: { lat: -15.4, lng: 28.28 },
          vehicleType: 'motorbike',
          radiusKm: 15,
        }),
      ),
    );

    expect(results).toHaveLength(25);
    for (const ranked of results) {
      expect(ranked.length).toBeGreaterThan(0);
      expect(ranked.length).toBeLessThanOrEqual(5);
      expect(ranked[0].score).toBeGreaterThanOrEqual(ranked[ranked.length - 1].score);
    }
  });

  it('filters out taskers with stale location updates', async () => {
    const { prisma, service } = makeService();

    prisma.shift.findMany.mockResolvedValue([
      {
        rider_user_id: 'rider-fresh',
        vehicle_type: 'motorbike',
        current_location: { lat: -15.4001, lng: 28.2801 },
        last_location_update: freshDate,
      },
      {
        rider_user_id: 'rider-stale',
        vehicle_type: 'motorbike',
        current_location: { lat: -15.40005, lng: 28.28005 },
        last_location_update: staleDate,
      },
    ]);
    prisma.user.findMany.mockResolvedValue([
      {
        id: 'rider-fresh',
        firstName: 'Fresh',
        lastName: 'Rider',
        phone: '+260111111111',
        role: 'DRIVER',
      },
      {
        id: 'rider-stale',
        firstName: 'Stale',
        lastName: 'Rider',
        phone: '+260222222222',
        role: 'DRIVER',
      },
    ]);
    prisma.userPreference.findMany.mockResolvedValue([
      {
        userId: 'rider-fresh',
        preferences: { taskerAvailability: 'online' },
      },
      {
        userId: 'rider-stale',
        preferences: { taskerAvailability: 'online' },
      },
    ]);
    prisma.review.groupBy.mockResolvedValue([
      { driverId: 'rider-fresh', _avg: { rating: 4.8 } },
      { driverId: 'rider-stale', _avg: { rating: 4.9 } },
    ]);
    prisma.booking.findMany.mockResolvedValue([]);

    const ranked = await service.rankTaskersForJob({
      jobId: 'job-freshness',
      jobType: 'delivery',
      pickup: { lat: -15.4, lng: 28.28 },
      vehicleType: 'motorbike',
      radiusKm: 20,
    });

    expect(ranked.map((candidate) => candidate.user_id)).toEqual(['rider-fresh']);
  });
});
