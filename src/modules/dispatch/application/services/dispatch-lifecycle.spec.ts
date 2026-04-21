import { MatchingService } from '../../../matching/application/services/matching.service';
import { Booking } from '../../../matching/domain/entities/booking.entity';
import { DeliveryService } from '../../../deliveries/application/services/delivery.service';
import {
  DeliveryOrder,
  VehicleType,
} from '../../../deliveries/domain/entities/delivery-order.entity';
import {
  Stop,
  StopType,
} from '../../../deliveries/domain/entities/stop.entity';

describe('Dispatch lifecycle churn', () => {
  const createBooking = () => {
    const booking = Booking.create({
      delivery_id: 'del-sim',
      vehicle_type: 'motorbike',
      pickup: {
        sequence: 1,
        geo: { lat: -15.4, lng: 28.28 },
        address: 'Pickup',
      },
      dropoffs: [
        {
          sequence: 2,
          geo: { lat: -15.41, lng: 28.29 },
          address: 'Dropoff',
        },
      ],
      customer_user_id: 'customer-1',
      customer_name: 'Customer',
      customer_phone: '+260971111111',
      metadata: {},
    });
    booking.startSearching();
    booking.offerToRider('rider-1', 45);
    return booking;
  };

  const createDelivery = () => {
    const delivery = DeliveryOrder.create({
      id: 'del-lifecycle',
      created_by_user_id: 'customer-1',
      placed_by_role: 'customer',
      vehicle_type: VehicleType.MOTORBIKE,
      more_info: JSON.stringify({
        dispatch: {
          stage: 'offered',
          offeredTo: ['rider-1'],
          activeRiderId: 'rider-1',
          offerExpiresAt: new Date(Date.now() - 1000).toISOString(),
          lastOfferedAt: new Date(Date.now() - 2000).toISOString(),
          searchStartedAt: new Date(Date.now() - 4000).toISOString(),
        },
      }),
    });
    delivery.addStop(
      Stop.create({
        id: 'stop-pickup',
        type: StopType.PICKUP,
        sequence: 1,
        contact_name: 'Sender',
        contact_phone: '+260971111111',
        geo: { lat: -15.4, lng: 28.28 },
        address: { city: 'Lusaka', country: 'ZM', line1: 'Pickup' },
      }),
    );
    delivery.addStop(
      Stop.create({
        id: 'stop-dropoff',
        type: StopType.DROPOFF,
        sequence: 2,
        contact_name: 'Recipient',
        contact_phone: '+260972222222',
        geo: { lat: -15.41, lng: 28.29 },
        address: { city: 'Lusaka', country: 'ZM', line1: 'Dropoff' },
      }),
    );
    return delivery;
  };

  it('reoffers timed-out task bookings to the next candidate', async () => {
    const booking = createBooking();
    const bookingRepository = {
      findById: jest.fn().mockResolvedValue(booking),
      save: jest.fn().mockImplementation(async (nextBooking) => nextBooking),
      findBookingsByStatus: jest.fn(),
    } as any;
    const matchingEngine = {
      findCandidates: jest.fn().mockResolvedValue([
        {
          user_id: 'rider-1',
          name: 'Rider One',
          vehicle: 'motorbike',
          phone: '+260971000001',
          rating: 4.8,
          eta_min: 4,
        },
        {
          user_id: 'rider-2',
          name: 'Rider Two',
          vehicle: 'motorbike',
          phone: '+260971000002',
          rating: 4.9,
          eta_min: 6,
        },
      ]),
    } as any;
    const notificationsService = {
      createNotification: jest.fn().mockResolvedValue(undefined),
    } as any;
    const matchingGateway = {
      emitBookingRequest: jest.fn(),
      emitMatchingSnapshot: jest.fn(),
      emitBookingRejected: jest.fn(),
      getRiderLocation: jest.fn().mockReturnValue(null),
    } as any;
    const prisma = {
      user: { findUnique: jest.fn() },
      review: { aggregate: jest.fn() },
    } as any;
    const pricingService = {} as any;
    const dispatchService = {
      incrementTaskerDispatchStat: jest.fn().mockResolvedValue(undefined),
    } as any;

    const service = new MatchingService(
      bookingRepository,
      matchingEngine,
      notificationsService,
      matchingGateway,
      prisma,
      pricingService,
      dispatchService,
    );

    await (service as any).expireOfferAndReassign(booking, 'Offer timed out');

    expect(dispatchService.incrementTaskerDispatchStat).toHaveBeenCalledWith(
      'rider-1',
      'timedOutOffers',
    );
    expect(matchingEngine.findCandidates).toHaveBeenCalledTimes(1);
    expect(booking.toJSON().status).toBe('offered');
    expect(booking.toJSON().offer.offered_to).toEqual(['rider-1', 'rider-2']);
    expect(matchingGateway.emitMatchingSnapshot).toHaveBeenCalledWith(
      expect.objectContaining({
        bookingId: booking.booking_id,
        stage: 'reoffered',
        activeRiderId: 'rider-2',
      }),
    );
  });

  it('reoffers timed-out deliveries to the next rider', async () => {
    const delivery = createDelivery();
    const deliveryRepository = {
      findById: jest.fn().mockResolvedValue(delivery),
      update: jest.fn().mockImplementation(async (_id, nextDelivery) => nextDelivery),
      findAll: jest.fn(),
      findNearby: jest.fn(),
    } as any;
    const prisma = {
      review: { findFirst: jest.fn(), create: jest.fn() },
      conversation: { findFirst: jest.fn() },
    } as any;
    const notificationsService = {
      createNotification: jest.fn().mockResolvedValue(undefined),
    } as any;
    const pricingService = {
      estimateDelivery: jest.fn(),
    } as any;
    const dispatchService = {
      rankTaskersForJob: jest.fn().mockResolvedValue([
        {
          user_id: 'rider-1',
          name: 'Rider One',
          phone: '+260971000001',
          rating: 4.8,
          eta_min: 4,
          score: 0.9,
        },
        {
          user_id: 'rider-2',
          name: 'Rider Two',
          phone: '+260971000002',
          rating: 4.9,
          eta_min: 5,
          score: 0.85,
        },
      ]),
      incrementTaskerDispatchStat: jest.fn().mockResolvedValue(undefined),
    } as any;
    const deliveriesGateway = {
      emitDeliveryStatusUpdate: jest.fn(),
      emitRiderAssigned: jest.fn(),
      emitInTransit: jest.fn(),
    } as any;

    const service = new DeliveryService(
      deliveryRepository,
      prisma,
      notificationsService,
      pricingService,
      dispatchService,
      deliveriesGateway,
    );

    await (service as any).expireOfferAndReassign(
      delivery,
      'Delivery offer timed out',
    );

    const metadata = JSON.parse(String(delivery.more_info || '{}'));
    expect(dispatchService.incrementTaskerDispatchStat).toHaveBeenCalledWith(
      'rider-1',
      'timedOutOffers',
    );
    expect(dispatchService.rankTaskersForJob).toHaveBeenCalledTimes(1);
    expect(metadata.dispatch.stage).toBe('offered');
    expect(metadata.dispatch.activeRiderId).toBe('rider-2');
    expect(metadata.dispatch.offeredTo).toEqual(['rider-1', 'rider-2']);
    expect(deliveriesGateway.emitDeliveryStatusUpdate).toHaveBeenCalledWith(
      delivery.id,
      'offer_sent',
      expect.objectContaining({
        riderId: 'rider-2',
        customerId: delivery.created_by_user_id,
      }),
    );
  });
});
