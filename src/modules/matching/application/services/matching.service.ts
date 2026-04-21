import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
  OnModuleDestroy,
  OnModuleInit,
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
import { PrismaService } from '../../../../shared/infrastructure/prisma.service';
import { PricingService } from '../../../pricing/application/services/pricing.service';

@Injectable()
export class MatchingService implements OnModuleInit, OnModuleDestroy {
  private readonly offerTimeoutSweepMs = Number(
    process.env.MATCHING_OFFER_SWEEP_MS || 5000,
  );
  private readonly activeOfferTimeouts = new Set<string>();
  private offerSweepTimer: NodeJS.Timeout | null = null;

  constructor(
    @Inject(BOOKING_REPOSITORY)
    private readonly bookingRepository: IBookingRepository,
    @Inject('MATCHING_ENGINE')
    private readonly matchingEngine: IMatchingEngine,
    private readonly notificationsService: NotificationsService,
    private readonly matchingGateway: MatchingGateway,
    private readonly prisma: PrismaService,
    private readonly pricingService: PricingService,
  ) {}

  onModuleInit() {
    this.offerSweepTimer = setInterval(() => {
      this.reassignExpiredOffers().catch((error) => {
        console.error('Offer timeout sweep failed:', error);
      });
    }, this.offerTimeoutSweepMs);
  }

  onModuleDestroy() {
    if (this.offerSweepTimer) {
      clearInterval(this.offerSweepTimer);
      this.offerSweepTimer = null;
    }
  }

  private toCandidateSnapshot(candidate: RiderInfoDto) {
    const location = this.matchingGateway.getRiderLocation(candidate.user_id);
    return {
      riderId: candidate.user_id,
      name: candidate.name,
      vehicle: candidate.vehicle,
      phone: candidate.phone,
      rating: candidate.rating,
      etaMin: candidate.eta_min,
      ...(location ? { location } : {}),
    };
  }

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
    return this.pricingService.estimateBooking({
      pickup: dto.pickup.geo,
      dropoffs: (dto.dropoffs || []).map((stop) => stop.geo),
      vehicleType: dto.vehicle_type,
      waitingMinutes: dto.waiting_minutes,
    });
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

  async rateCustomer(
    bookingId: string,
    riderUserId: string,
    input: { rating: number; comment?: string; metadata?: Record<string, any> },
  ) {
    const booking = await this.bookingRepository.findById(bookingId);
    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    const data = booking.toJSON();
    const assignedRiderId =
      data.rider && typeof data.rider === 'object'
        ? (data.rider as { user_id?: string | null }).user_id
        : null;

    if (String(assignedRiderId || '') !== String(riderUserId)) {
      throw new ForbiddenException('Not assigned to this booking');
    }

    const status = String(data.status || '').toLowerCase();
    if (!['completed', 'delivered'].includes(status)) {
      throw new ConflictException('Can only rate customers for completed tasks');
    }

    const customerId = String(data.customer_user_id || '');
    if (!customerId) {
      throw new NotFoundException('No customer is linked to this booking');
    }

    const existingReview = await this.prisma.review.findFirst({
      where: {
        userId: riderUserId,
        entityType: 'CUSTOMER',
        customerId,
        contextType: 'booking',
        contextId: bookingId,
      },
    });

    if (existingReview) {
      throw new ConflictException('You have already rated this customer');
    }

    const review = await this.prisma.review.create({
      data: {
        id: uuidv4(),
        userId: riderUserId,
        entityType: 'CUSTOMER',
        entityId: customerId,
        customerId,
        contextType: 'booking',
        contextId: bookingId,
        metadata: input.metadata,
        rating: input.rating,
        comment: input.comment?.trim() || undefined,
        updatedAt: new Date(),
      },
    });

    return {
      reviewId: review.id,
      rating: review.rating,
      comment: review.comment,
      customerId,
    };
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

    const bookingData = booking.toJSON();
    if (bookingData.status !== BookingStatus.OFFERED) {
      throw new ConflictException('Booking is no longer awaiting a tasker response');
    }

    const offeredTo = Array.isArray(bookingData.offer?.offered_to)
      ? bookingData.offer.offered_to
      : [];
    if (!offeredTo.includes(dto.rider_user_id)) {
      throw new ForbiddenException('This task offer is not assigned to the tasker');
    }

    const expiresAt = bookingData.offer?.expires_at
      ? new Date(bookingData.offer.expires_at)
      : null;
    if (
      expiresAt &&
      !Number.isNaN(expiresAt.getTime()) &&
      expiresAt.getTime() <= Date.now()
    ) {
      await this.expireOfferAndReassign(booking, 'Offer response time elapsed');
      throw new ConflictException('Offer expired before it was accepted');
    }

    if (dto.decision === 'accept') {
      const riderInfo = await this.buildRiderInfo(
        dto.rider_user_id,
        bookingData.vehicle_type,
      );

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

    await this.notificationsService.createNotification({
      userId: bookingData.customer_user_id,
      title:
        dto.decision === 'accept' ? 'Task offer accepted' : 'Matching tasker',
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
          dto.decision === 'accept' ? 'Tasker Accepted' : 'Matching Tasker',
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
    this.matchingGateway.emitMatchingSnapshot({
      bookingId,
      customerId: dto.customer_user_id,
      stage: 'searching',
      candidateCount: 0,
      candidates: [],
      message: 'Looking for nearby taskers now.',
    });

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

    this.matchingGateway.emitMatchingSnapshot({
      bookingId,
      customerId: dto.customer_user_id,
      stage: 'candidates_found',
      candidateCount: candidates.length,
      candidates: candidates.map((candidate) => this.toCandidateSnapshot(candidate)),
      message: `Found ${candidates.length} nearby tasker${candidates.length === 1 ? '' : 's'}.`,
    });

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

    this.matchingGateway.emitMatchingSnapshot({
      bookingId,
      customerId: dto.customer_user_id,
      stage: 'offer_sent',
      candidateCount: candidates.length,
      activeRiderId: firstCandidate.user_id,
      candidates: candidates.map((candidate) => this.toCandidateSnapshot(candidate)),
      message: `${firstCandidate.name} is reviewing the request.`,
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

      this.matchingGateway.emitMatchingSnapshot({
        bookingId,
        customerId: bookingData.customer_user_id,
        stage: 'reoffered',
        candidateCount: newCandidates.length,
        activeRiderId: newCandidates[0].user_id,
        candidates: newCandidates.map((candidate) => this.toCandidateSnapshot(candidate)),
        message: `${newCandidates[0].name} is reviewing the request now.`,
      });
      return;
    }

    await this.notificationsService.createNotification({
      userId: bookingData.customer_user_id,
      title: 'No tasker available',
      message: `Task ${bookingId} could not find another available tasker right now.`,
      type: 'SYSTEM',
      metadata: {
        entityType: 'booking',
        entityId: bookingId,
        sourceStatus: 'searching_failed',
        statusLabel: 'No Tasker Available',
      },
    });

    this.matchingGateway.emitMatchingFailed(
      bookingData.customer_user_id,
      bookingId,
      'No more available taskers right now',
    );
  }

  private async reassignExpiredOffers(): Promise<void> {
    const offeredBookings = await this.bookingRepository.findBookingsByStatus(
      BookingStatus.OFFERED,
    );
    const now = Date.now();

    await Promise.all(
      offeredBookings.map(async (booking) => {
        const bookingId = booking.booking_id;
        if (this.activeOfferTimeouts.has(bookingId)) {
          return;
        }

        const offerExpiresAt = booking.toJSON().offer?.expires_at;
        const expiresAt = offerExpiresAt ? new Date(offerExpiresAt) : null;
        if (
          !expiresAt ||
          Number.isNaN(expiresAt.getTime()) ||
          expiresAt.getTime() > now
        ) {
          return;
        }

        this.activeOfferTimeouts.add(bookingId);
        try {
          await this.expireOfferAndReassign(booking, 'Offer timed out');
        } finally {
          this.activeOfferTimeouts.delete(bookingId);
        }
      }),
    );
  }

  private async expireOfferAndReassign(
    booking: Booking,
    reason: string,
  ): Promise<void> {
    const bookingData = booking.toJSON();
    if (bookingData.status !== BookingStatus.OFFERED) {
      return;
    }

    booking.declineByRider('timeout');
    await this.bookingRepository.save(booking);

    await this.notificationsService.createNotification({
      userId: bookingData.customer_user_id,
      title: 'Looking for another tasker',
      message: `The previous tasker did not respond in time for task ${booking.booking_id}.`,
      type: 'SYSTEM',
      metadata: {
        entityType: 'booking',
        entityId: booking.booking_id,
        sourceStatus: 'searching',
        statusLabel: 'Matching Tasker',
        reason,
      },
    });

    this.matchingGateway.emitBookingRejected(
      bookingData.customer_user_id,
      booking.booking_id,
      reason,
    );

    await this.reofferBooking(booking.booking_id);
  }

  private async buildRiderInfo(
    riderUserId: string,
    vehicleType: string,
  ): Promise<RiderInfoDto> {
    const [user, aggregateRating] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: riderUserId },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          phone: true,
        },
      }),
      this.prisma.review.aggregate({
        where: { driverId: riderUserId },
        _avg: { rating: true },
      }),
    ]);

    if (!user) {
      throw new NotFoundException('Tasker not found');
    }

    return {
      user_id: user.id,
      name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Tasker',
      vehicle: vehicleType,
      phone: user.phone || '+260000000000',
      rating: Number(aggregateRating._avg.rating || 4.5),
    };
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
