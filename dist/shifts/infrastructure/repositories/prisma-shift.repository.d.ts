import { PrismaService } from '../../../shared/database/prisma.service';
import { IShiftRepository } from '../../domain/repositories/shift.repository.interface';
import { Shift } from '../../domain/entities/shift.entity';
export declare class PrismaShiftRepository implements IShiftRepository {
    private readonly prisma;
    constructor(prisma: PrismaService);
    save(shift: Shift): Promise<Shift>;
    findById(id: string): Promise<Shift | null>;
    findByRiderUserId(riderUserId: string): Promise<Shift[]>;
    findActiveByRiderUserId(riderUserId: string): Promise<Shift | null>;
    findActiveShifts(): Promise<Shift[]>;
    findShiftsByDateRange(riderUserId: string, startDate: Date, endDate: Date): Promise<Shift[]>;
    findAll(filters?: {
        status?: string;
        vehicle_type?: string;
        rider_user_id?: string;
        start_date?: Date;
        end_date?: Date;
        page?: number;
        size?: number;
    }): Promise<{
        shifts: Shift[];
        total: number;
    }>;
    bulkEnd(shiftIds: string[]): Promise<number>;
}
