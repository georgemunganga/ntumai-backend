import { Booking } from '../entities/booking.entity';
export declare const BOOKING_REPOSITORY = "BOOKING_REPOSITORY";
export interface IBookingRepository {
    save(booking: Booking): Promise<Booking>;
    findById(bookingId: string): Promise<Booking | null>;
    findByDeliveryId(deliveryId: string): Promise<Booking | null>;
    findByCustomerUserId(customerUserId: string): Promise<Booking[]>;
    findActiveBookings(): Promise<Booking[]>;
    findBookingsByStatus(status: string): Promise<Booking[]>;
}
