import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { BOOKING_REPOSITORY } from '../../domain/repositories/booking.repository.interface';
import type { IBookingRepository } from '../../domain/repositories/booking.repository.interface';
import { Booking, BookingStatus } from '../../domain/entities/booking.entity';
import type { IMatchingEngine } from '../../infrastructure/adapters/matching-engine.interface';
import {
  CreateBookingDto,
  EstimateBookingDto,
  EditBookingDto,
  CancelBookingDto,
  RespondToOfferDto,
  UpdateProgressDto,
  BookingResponseDto,
  CreateBookingResponseDto,
  RiderInfoDto,
} from '../dtos/booking.dto';
import { NotificationsService } from '../../../notifications/application/services/notifications.service';
import { MatchingGateway } from '../../infrastructure/websocket/matching.gateway';

@Injectable()
export class MatchingService {
  constructor(
    @Inject(BOOKING_REPOSITORY)
    private readonly bookingRepository: IBookingRepository,
    @Inject('MATCHING_ENGINE')
    private readonly matchingEngine: IMatchingEngine,
    private readonly notificationsService: NotificationsService,
    private readonly matchingGateway: MatchingGateway,
  ) {}

  async createBooking(
    dto: CreateBookingDto,
  ): Promise<CreateBookingResponseDto> {
    // Create booking entity
    const booking = Booking.create({
      delivery_id: dto.delivery_id,
      vehicle_type: dto.vehicle_type,
      pickup: dto.pickup,
      dropoffs: dto.dropoffs,
      customer_user_id: dto.customer_user_id,
      customer_name: dto.customer_name,
      customer_phone: dto.customer_phone,
      metadata: dto.metadata,
    });

    // Save booking
    const saved = await this.bookingRepository.save(booking);

    await this.notificationsService.createNotification({
      userId: dto.customer_user_id,
      title: 'Task created',
      message: `Your task ${saved.booking_id} is now searching for a tasker.`,
      type: 'SYSTEM',
      metadata: {
        entityType: 'booking',
        entityId: saved.booking_id,
        sourceStatus: 'searching',
        statusLabel: 'Matching Tasker',
      },
    });

    // Start matching process asynchronously
    this.startMatchingProcess(saved.booking_id, dto).catch((err) => {
      console.error('Matching process error:', err);
    });

    return {
      booking_id: saved.booking_id,
      status: 'searching',
      estimated_search_sec: 45,
    };
  }

  estimateBooking(dto: EstimateBookingDto) {
    const routePoints = [dto.pickup, ...(dto.dropoffs || [])].map((stop) => stop.geo);
    if (routePoints.length < 2) {
      throw new BadRequestException('Pickup and at least one dropoff are required');
    }

    const pricingConfig = this.getBookingPricingConfig();
    const vehicleConfig = pricingConfig.vehicles[dto.vehicle_type];
    if (!vehicleConfig) {
      throw new BadRequestException('Unsupported vehicle type');
    }

    const distanceKm = Number(this.calculateRouteDistanceKm(routePoints).toFixed(2));
    const waitingMinutes = Math.max(0, Number(dto.waiting_minutes || 0));
    const waitingBlocks = Math.ceil(waitingMinutes / pricingConfig.waiting_block_minutes);
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

  async getBooking(bookingId: string): Promise<BookingResponseDto> {
    const booking = await this.bookingRepository.findById(bookingId);
    if (!booking) {
      throw new NotFoundException('Booking not found');
    }
    return this.toResponseDto(booking);
  }

  async listCustomerBookings(
    customerUserId: string,
    status?: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<{
    bookings: BookingResponseDto[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    const allBookings =
      await this.bookingRepository.findByCustomerUserId(customerUserId);

    const normalizedStatus = status?.trim().toLowerCase();
    const filtered = normalizedStatus
      ? allBookings.filter(
          (booking) =>
            String(booking.status).toLowerCase() === normalizedStatus,
        )
      : allBookings;

    const sorted = [...filtered].sort(
      (a, b) =>
        b.toJSON().updated_at.getTime() - a.toJSON().updated_at.getTime(),
    );
    const total = sorted.length;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const start = (page - 1) * limit;
    const paged = sorted.slice(start, start + limit);

    return {
      bookings: paged.map((booking) => this.toResponseDto(booking)),
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    };
  }

  async listRiderOffers(riderUserId: string): Promise<BookingResponseDto[]> {
    const offeredBookings = await this.bookingRepository.findBookingsByStatus(
      BookingStatus.OFFERED,
    );

    return offeredBookings
      .filter((booking) => {
        const data = booking.toJSON();
        return Array.isArray(data.offer?.offered_to)
          ? data.offer.offered_to.includes(riderUserId)
          : false;
      })
      .sort(
        (a, b) =>
          b.toJSON().updated_at.getTime() - a.toJSON().updated_at.getTime(),
      )
      .map((booking) => this.toResponseDto(booking));
  }

  async listRiderActiveBookings(
    riderUserId: string,
  ): Promise<BookingResponseDto[]> {
    const activeBookings = await this.bookingRepository.findActiveBookings();

    return activeBookings
      .filter((booking) => {
        const data = booking.toJSON();
        const rider =
          data.rider && typeof data.rider === 'object'
            ? (data.rider as { user_id?: string | null })
            : null;

        return (
          rider?.user_id === riderUserId &&
          [
            BookingStatus.ACCEPTED,
            BookingStatus.EN_ROUTE,
            BookingStatus.ARRIVED_PICKUP,
            BookingStatus.PICKED_UP,
            BookingStatus.EN_ROUTE_DROPOFF,
          ].includes(data.status)
        );
      })
      .sort(
        (a, b) =>
          b.toJSON().updated_at.getTime() - a.toJSON().updated_at.getTime(),
      )
      .map((booking) => this.toResponseDto(booking));
  }

  async editBooking(
    bookingId: string,
    dto: EditBookingDto,
  ): Promise<BookingResponseDto> {
    const booking = await this.bookingRepository.findById(bookingId);
    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    booking.editDetails({
      pickup: dto.pickup,
      dropoffs: dto.dropoffs,
      metadata: dto.metadata,
    });

    const saved = await this.bookingRepository.save(booking);

    // Emit booking.edited event (in real app, use WebSocket/EventEmitter)
    console.log('Booking edited:', bookingId);

    return this.toResponseDto(saved);
  }

  async cancelBooking(
    bookingId: string,
    dto: CancelBookingDto,
  ): Promise<BookingResponseDto> {
    const booking = await this.bookingRepository.findById(bookingId);
    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    booking.cancel(dto.reason);
    const saved = await this.bookingRepository.save(booking);
    const bookingData = booking.toJSON();

    // Emit booking.cancelled event
    console.log('Booking cancelled:', bookingId, dto.reason);
    this.matchingGateway.emitBookingCancelled(
      bookingData.customer_user_id,
      bookingId,
      dto.reason,
    );

    return this.toResponseDto(saved);
  }

  async respondToOffer(
    bookingId: string,
    dto: RespondToOfferDto,
  ): Promise<BookingResponseDto> {
    const booking = await this.bookingRepository.findById(bookingId);
    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    if (dto.decision === 'accept') {
      // In real app, get rider info from database
      const riderInfo: RiderInfoDto = {
        user_id: dto.rider_user_id,
        name: 'Mock Rider',
        vehicle: booking.toJSON().vehicle_type,
        phone: '+260972000000',
        rating: 4.8,
      };

      booking.acceptByRider(riderInfo);

      // Emit booking.accepted event
      console.log('Booking accepted by rider:', dto.rider_user_id);
    } else {
      booking.declineByRider(dto.rider_user_id);

      // Re-offer to another rider
      this.reofferBooking(bookingId).catch((err) => {
        console.error('Reoffer error:', err);
      });

      // Emit booking.reoffered event
      console.log('Booking declined, reoffering:', bookingId);
    }

    const saved = await this.bookingRepository.save(booking);
    const bookingData = booking.toJSON();

    await this.notificationsService.createNotification({
      userId: bookingData.customer_user_id,
      title:
        dto.decision === 'accept' ? 'Tasker assigned' : 'Matching tasker',
      message:
        dto.decision === 'accept'
          ? `A tasker has accepted task ${bookingId}.`
          : `Task ${bookingId} was declined and is being reoffered.`,
      type: 'SYSTEM',
      metadata: {
        entityType: 'booking',
        entityId: bookingId,
        sourceStatus: dto.decision === 'accept' ? 'accepted' : 'searching',
        statusLabel:
          dto.decision === 'accept' ? 'Tasker Assigned' : 'Matching Tasker',
      },
    });

    if (dto.decision === 'accept') {
      this.matchingGateway.emitBookingAccepted(bookingData.customer_user_id, {
        bookingId,
        rider: bookingData.rider,
        status: bookingData.status,
      });
    } else {
      this.matchingGateway.emitBookingRejected(
        bookingData.customer_user_id,
        bookingId,
        'Rider declined offer',
      );
    }

    return this.toResponseDto(saved);
  }

  async updateProgress(
    bookingId: string,
    dto: UpdateProgressDto,
  ): Promise<BookingResponseDto> {
    const booking = await this.bookingRepository.findById(bookingId);
    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    const statusMap: Record<string, BookingStatus> = {
      en_route: BookingStatus.EN_ROUTE,
      arrived_pickup: BookingStatus.ARRIVED_PICKUP,
      picked_up: BookingStatus.PICKED_UP,
      en_route_dropoff: BookingStatus.EN_ROUTE_DROPOFF,
      delivered: BookingStatus.DELIVERED,
    };

    const newStatus = statusMap[dto.stage];
    if (!newStatus) {
      throw new BadRequestException('Invalid stage');
    }

    booking.updateProgress(newStatus);
    const saved = await this.bookingRepository.save(booking);
    const bookingData = booking.toJSON();

    // Emit booking.progress event
    console.log('Booking progress updated:', bookingId, dto.stage);
    this.matchingGateway.emitBookingProgress(bookingData.customer_user_id, {
      bookingId,
      status: bookingData.status,
      stage: dto.stage,
      rider: bookingData.rider,
    });

    const progressNotification = this.toBookingProgressNotification(dto.stage);

    await this.notificationsService.createNotification({
      userId: bookingData.customer_user_id,
      title: progressNotification.title,
      message: progressNotification.message(bookingId),
      type: 'SYSTEM',
      metadata: {
        entityType: 'booking',
        entityId: bookingId,
        sourceStatus: dto.stage,
        statusLabel: progressNotification.statusLabel,
      },
    });

    return this.toResponseDto(saved);
  }

  async getTimers(
    bookingId: string,
  ): Promise<{ pickup_wait_sec: number; dropoff_wait_sec: number }> {
    const booking = await this.bookingRepository.findById(bookingId);
    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    return {
      pickup_wait_sec: booking.wait_times.pickup_sec,
      dropoff_wait_sec: booking.wait_times.dropoff_sec,
    };
  }

  async completeBooking(
    bookingId: string,
    pricingData?: any,
    paymentData?: any,
  ): Promise<BookingResponseDto> {
    const booking = await this.bookingRepository.findById(bookingId);
    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    if (booking.status !== BookingStatus.DELIVERED) {
      throw new BadRequestException(
        'Booking must be delivered before completion',
      );
    }

    // Emit booking.completed event with wait times
    console.log('Booking completed:', bookingId, booking.wait_times);
    const bookingData = booking.toJSON();

    await this.notificationsService.createNotification({
      userId: bookingData.customer_user_id,
      title: 'Task completed',
      message: `Task ${bookingId} has been completed.`,
      type: 'SYSTEM',
      metadata: {
        entityType: 'booking',
        entityId: bookingId,
        sourceStatus: 'completed',
        statusLabel: 'Task Completed',
      },
    });

    this.matchingGateway.emitBookingCompleted(bookingData.customer_user_id, {
      bookingId,
      status: bookingData.status,
      rider: bookingData.rider,
      waitTimes: bookingData.wait_times,
    });

    return this.toResponseDto(booking);
  }

  private getBookingPricingConfig() {
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

  private calculateRouteDistanceKm(points: Array<{ lat: number; lng: number }>): number {
    let total = 0;
    for (let index = 1; index < points.length; index += 1) {
      total += this.calculateDistanceKm(points[index - 1], points[index]);
    }
    return total;
  }

  private calculateDistanceKm(
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

  private toRadians(value: number): number {
    return (value * Math.PI) / 180;
  }

  private toBookingProgressNotification(stage: string) {
    switch (stage) {
      case 'en_route':
        return {
          title: 'Tasker on the way',
          statusLabel: 'Tasker On the Way',
          message: (bookingId: string) =>
            `Your tasker is on the way for task ${bookingId}.`,
        };
      case 'arrived_pickup':
        return {
          title: 'Tasker arrived',
          statusLabel: 'Tasker Arrived',
          message: (bookingId: string) =>
            `Your tasker has arrived for task ${bookingId}.`,
        };
      case 'picked_up':
        return {
          title: 'Task in progress',
          statusLabel: 'Task In Progress',
          message: (bookingId: string) =>
            `Task ${bookingId} is now in progress.`,
        };
      case 'en_route_dropoff':
        return {
          title: 'Heading to you',
          statusLabel: 'Heading to You',
          message: (bookingId: string) =>
            `Your tasker is heading to you for task ${bookingId}.`,
        };
      case 'delivered':
        return {
          title: 'Task delivered',
          statusLabel: 'Delivered',
          message: (bookingId: string) =>
            `Task ${bookingId} has been delivered.`,
        };
      default:
        return {
          title: 'Task update',
          statusLabel: 'Task Update',
          message: (bookingId: string) =>
            `Task ${bookingId} moved to ${stage.replace(/_/g, ' ')}.`,
        };
    }
  }

  private async startMatchingProcess(
    bookingId: string,
    dto: CreateBookingDto,
  ): Promise<void> {
    const booking = await this.bookingRepository.findById(bookingId);
    if (!booking) return;

    // Start searching
    booking.startSearching();
    await this.bookingRepository.save(booking);
    this.matchingGateway.emitMatchingInProgress(dto.customer_user_id, bookingId);

    // Find candidates using matching engine
    const candidates = await this.matchingEngine.findCandidates({
      pickup_lat: dto.pickup.geo.lat,
      pickup_lng: dto.pickup.geo.lng,
      vehicle_type: dto.vehicle_type,
      radius_km: 10,
    });

    if (candidates.length === 0) {
      console.log('No riders available for booking:', bookingId);
      this.matchingGateway.emitMatchingFailed(
        dto.customer_user_id,
        bookingId,
        'No riders available right now',
      );
      return;
    }

    // Offer to first candidate
    const firstCandidate = candidates[0];
    booking.offerToRider(firstCandidate.user_id, 45);
    const saved = await this.bookingRepository.save(booking);

    await this.notificationsService.createNotification({
      userId: firstCandidate.user_id,
      title: 'New task offer',
      message: `${dto.customer_name} needs help with a task near you.`,
      type: 'SYSTEM',
      metadata: {
        entityType: 'booking',
        entityId: saved.booking_id,
        targetRole: 'tasker',
        notificationType: 'job_offer',
        jobId: saved.booking_id,
        jobType: 'task',
        contextType: 'booking',
        contextId: saved.booking_id,
        customerName: dto.customer_name,
        customerPhone: dto.customer_phone,
        pickupAddress: dto.pickup.address,
        dropoffAddress: dto.dropoffs?.[0]?.address,
        title: dto.metadata?.title,
        description: dto.metadata?.description,
        estimatedEarnings:
          dto.metadata?.budgetMax ??
          dto.metadata?.budget?.max ??
          dto.metadata?.commitmentAmount ??
          0,
      },
    });

    this.matchingGateway.emitBookingRequest(firstCandidate.user_id, {
      booking: this.toResponseDto(saved),
      customer_name: dto.customer_name,
      customer_phone: dto.customer_phone,
      metadata: dto.metadata || {},
    });

    // Emit booking.offered event
    console.log('Booking offered to riders:', bookingId, candidates);
  }

  private async reofferBooking(bookingId: string): Promise<void> {
    const booking = await this.bookingRepository.findById(bookingId);
    if (!booking) return;

    const bookingData = booking.toJSON();

    // Find new candidates
    const candidates = await this.matchingEngine.findCandidates({
      pickup_lat: bookingData.pickup.geo.lat,
      pickup_lng: bookingData.pickup.geo.lng,
      vehicle_type: bookingData.vehicle_type,
      radius_km: 10,
    });

    // Filter out riders who already declined
    const newCandidates = candidates.filter(
      (c) => !bookingData.offer.offered_to.includes(c.user_id),
    );

    if (newCandidates.length > 0) {
      booking.offerToRider(newCandidates[0].user_id, 45);
      const saved = await this.bookingRepository.save(booking);

      await this.notificationsService.createNotification({
        userId: newCandidates[0].user_id,
        title: 'New task offer',
        message: `${bookingData.customer_name} needs help with a task near you.`,
        type: 'SYSTEM',
        metadata: {
          entityType: 'booking',
          entityId: saved.booking_id,
          targetRole: 'tasker',
          notificationType: 'job_offer',
          jobId: saved.booking_id,
          jobType: 'task',
          contextType: 'booking',
          contextId: saved.booking_id,
          customerName: bookingData.customer_name,
          customerPhone: bookingData.customer_phone,
          pickupAddress: bookingData.pickup?.address,
          dropoffAddress: bookingData.dropoffs?.[0]?.address,
          title: bookingData.metadata?.title,
          description: bookingData.metadata?.description,
          estimatedEarnings:
            bookingData.metadata?.budgetMax ??
            bookingData.metadata?.budget?.max ??
            bookingData.metadata?.commitmentAmount ??
            0,
        },
      });

      this.matchingGateway.emitBookingRequest(newCandidates[0].user_id, {
        booking: this.toResponseDto(saved),
        customer_name: bookingData.customer_name,
        customer_phone: bookingData.customer_phone,
        metadata: bookingData.metadata || {},
      });
    }
  }

  private toResponseDto(booking: Booking): BookingResponseDto {
    const data = booking.toJSON();
    return {
      booking_id: data.booking_id,
      delivery_id: data.delivery_id,
      status: data.status,
      vehicle_type: data.vehicle_type,
      pickup: data.pickup as any,
      dropoffs: data.dropoffs as any,
      rider: data.rider as any,
      customer_name: data.customer_name,
      customer_user_id: data.customer_user_id,
      customer_phone: data.customer_phone,
      wait_times: data.wait_times,
      can_user_edit: data.can_user_edit,
      created_at: data.created_at.toISOString(),
      updated_at: data.updated_at.toISOString(),
      metadata: data.metadata,
    };
  }
}
