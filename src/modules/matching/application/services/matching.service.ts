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
  EditBookingDto,
  CancelBookingDto,
  RespondToOfferDto,
  UpdateProgressDto,
  BookingResponseDto,
  CreateBookingResponseDto,
  RiderInfoDto,
} from '../dtos/booking.dto';

@Injectable()
export class MatchingService {
  constructor(
    @Inject(BOOKING_REPOSITORY)
    private readonly bookingRepository: IBookingRepository,
    @Inject('MATCHING_ENGINE')
    private readonly matchingEngine: IMatchingEngine,
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

  async getBooking(bookingId: string): Promise<BookingResponseDto> {
    const booking = await this.bookingRepository.findById(bookingId);
    if (!booking) {
      throw new NotFoundException('Booking not found');
    }
    return this.toResponseDto(booking);
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

    // Emit booking.cancelled event
    console.log('Booking cancelled:', bookingId, dto.reason);

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

    // Emit booking.progress event
    console.log('Booking progress updated:', bookingId, dto.stage);

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

    return this.toResponseDto(booking);
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

    // Find candidates using matching engine
    const candidates = await this.matchingEngine.findCandidates({
      pickup_lat: dto.pickup.geo.lat,
      pickup_lng: dto.pickup.geo.lng,
      vehicle_type: dto.vehicle_type,
      radius_km: 10,
    });

    if (candidates.length === 0) {
      console.log('No riders available for booking:', bookingId);
      return;
    }

    // Offer to first candidate
    const firstCandidate = candidates[0];
    booking.offerToRider(firstCandidate.user_id, 45);
    await this.bookingRepository.save(booking);

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
      await this.bookingRepository.save(booking);
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
      wait_times: data.wait_times,
      can_user_edit: data.can_user_edit,
      created_at: data.created_at.toISOString(),
      updated_at: data.updated_at.toISOString(),
    };
  }
}
