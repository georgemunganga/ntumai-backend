import { MatchingGateway } from './matching.gateway';

describe('MatchingGateway realtime fanout', () => {
  const makeGateway = () => {
    const gateway = new MatchingGateway();
    const to = jest.fn().mockReturnThis();
    const emit = jest.fn().mockReturnThis();
    (gateway as any).server = { to, emit };
    return {
      gateway: gateway as any,
      to,
      emit,
    };
  };

  it('indexes snapshots by rider and refreshes only related bookings', () => {
    const { gateway, to, emit } = makeGateway();

    gateway.emitMatchingSnapshot({
      bookingId: 'booking-a',
      customerId: 'customer-a',
      stage: 'offer_sent',
      candidateCount: 2,
      activeRiderId: 'rider-1',
      candidates: [
        { riderId: 'rider-1', name: 'Rider One' },
        { riderId: 'rider-2', name: 'Rider Two' },
      ],
      message: 'Looking',
    });

    gateway.emitMatchingSnapshot({
      bookingId: 'booking-b',
      customerId: 'customer-b',
      stage: 'offer_sent',
      candidateCount: 1,
      activeRiderId: 'rider-2',
      candidates: [{ riderId: 'rider-2', name: 'Rider Two' }],
      message: 'Looking',
    });

    gateway.riderLocations.set('rider-1', {
      lat: -15.4,
      lng: 28.28,
      updatedAt: new Date().toISOString(),
    });

    to.mockClear();
    emit.mockClear();

    gateway.refreshSnapshotsForRider('rider-1');

    expect(to).toHaveBeenCalledWith('booking:booking-a');
    expect(to).toHaveBeenCalledWith('customer:customer-a');
    expect(to).not.toHaveBeenCalledWith('booking:booking-b');
    expect(to).not.toHaveBeenCalledWith('customer:customer-b');
  });

  it('cleans rider index when booking snapshot is removed', () => {
    const { gateway } = makeGateway();

    gateway.emitMatchingSnapshot({
      bookingId: 'booking-a',
      customerId: 'customer-a',
      stage: 'offer_sent',
      candidateCount: 1,
      activeRiderId: 'rider-1',
      candidates: [{ riderId: 'rider-1', name: 'Rider One' }],
      message: 'Looking',
    });

    expect(Array.from(gateway.riderBookingIndex.get('rider-1') || [])).toEqual([
      'booking-a',
    ]);

    gateway.emitBookingAccepted('customer-a', {
      bookingId: 'booking-a',
      rider: { user_id: 'rider-1', name: 'Rider One' },
      status: 'accepted',
    });

    expect(gateway.bookingSnapshots.has('booking-a')).toBe(false);
    expect(gateway.riderBookingIndex.has('rider-1')).toBe(false);
  });
});
