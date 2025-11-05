import type { IBookingRepository } from '../../domain/repositories/booking.repository.interface';
import type { IMatchingEngine } from '../../infrastructure/adapters/matching-engine.interface';
import { CreateBookingDto, EditBookingDto, CancelBookingDto, RespondToOfferDto, UpdateProgressDto, BookingResponseDto, CreateBookingResponseDto } from '../dtos/booking.dto';
export declare class MatchingService {
    private readonly bookingRepository;
    private readonly matchingEngine;
    constructor(bookingRepository: IBookingRepository, matchingEngine: IMatchingEngine);
    createBooking(dto: CreateBookingDto): Promise<CreateBookingResponseDto>;
    getBooking(bookingId: string): Promise<BookingResponseDto>;
    editBooking(bookingId: string, dto: EditBookingDto): Promise<BookingResponseDto>;
    cancelBooking(bookingId: string, dto: CancelBookingDto): Promise<BookingResponseDto>;
    respondToOffer(bookingId: string, dto: RespondToOfferDto): Promise<BookingResponseDto>;
    updateProgress(bookingId: string, dto: UpdateProgressDto): Promise<BookingResponseDto>;
    getTimers(bookingId: string): Promise<{
        pickup_wait_sec: number;
        dropoff_wait_sec: number;
    }>;
    completeBooking(bookingId: string, pricingData?: any, paymentData?: any): Promise<BookingResponseDto>;
    private startMatchingProcess;
    private reofferBooking;
    private toResponseDto;
}
