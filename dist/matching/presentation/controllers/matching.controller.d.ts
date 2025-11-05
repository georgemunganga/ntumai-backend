import { MatchingService } from '../../application/services/matching.service';
import { CreateBookingDto, EditBookingDto, CancelBookingDto, RespondToOfferDto, UpdateProgressDto, BookingResponseDto, CreateBookingResponseDto } from '../../application/dtos/booking.dto';
export declare class MatchingController {
    private readonly matchingService;
    constructor(matchingService: MatchingService);
    createBooking(dto: CreateBookingDto): Promise<CreateBookingResponseDto>;
    getBooking(bookingId: string): Promise<BookingResponseDto>;
    editBooking(bookingId: string, dto: EditBookingDto): Promise<BookingResponseDto>;
    cancelBooking(bookingId: string, dto: CancelBookingDto): Promise<BookingResponseDto>;
    respondToOffer(bookingId: string, dto: RespondToOfferDto): Promise<BookingResponseDto>;
    updateProgress(bookingId: string, dto: UpdateProgressDto): Promise<BookingResponseDto>;
    getTimers(bookingId: string): Promise<any>;
    completeBooking(bookingId: string, body: any): Promise<BookingResponseDto>;
}
