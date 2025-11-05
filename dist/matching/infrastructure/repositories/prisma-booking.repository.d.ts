import { PrismaService } from '../../../shared/database/prisma.service';
import { IBookingRepository } from '../../domain/repositories/booking.repository.interface';
import { Booking } from '../../domain/entities/booking.entity';
export declare class PrismaBookingRepository implements IBookingRepository {
    private readonly prisma;
    constructor(prisma: PrismaService);
    save(booking: Booking): Promise<Booking>;
    findById(bookingId: string): Promise<Booking | null>;
    findByDeliveryId(deliveryId: string): Promise<Booking | null>;
    findByCustomerUserId(customerUserId: string): Promise<Booking[]>;
    findActiveBookings(): Promise<Booking[]>;
    findBookingsByStatus(status: string): Promise<Booking[]>;
}
