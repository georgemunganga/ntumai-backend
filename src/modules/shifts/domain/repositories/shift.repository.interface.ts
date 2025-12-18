import { Shift } from '../entities/shift.entity';

export const SHIFT_REPOSITORY = 'SHIFT_REPOSITORY';

export interface IShiftRepository {
  save(shift: Shift): Promise<Shift>;
  findById(id: string): Promise<Shift | null>;
  findByRiderUserId(riderUserId: string): Promise<Shift[]>;
  findActiveByRiderUserId(riderUserId: string): Promise<Shift | null>;
  findActiveShifts(): Promise<Shift[]>;
  findShiftsByDateRange(
    riderUserId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<Shift[]>;
  findAll(filters?: {
    status?: string;
    vehicle_type?: string;
    rider_user_id?: string;
    start_date?: Date;
    end_date?: Date;
    page?: number;
    size?: number;
  }): Promise<{ shifts: Shift[]; total: number }>;
  bulkEnd(shiftIds: string[]): Promise<number>;
}
