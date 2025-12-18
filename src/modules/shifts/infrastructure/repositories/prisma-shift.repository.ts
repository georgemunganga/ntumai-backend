import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../shared/infrastructure/prisma.service';
import { IShiftRepository } from '../../domain/repositories/shift.repository.interface';
import { Shift, ShiftStatus } from '../../domain/entities/shift.entity';

@Injectable()
export class PrismaShiftRepository implements IShiftRepository {
  constructor(private readonly prisma: PrismaService) {}

  async save(shift: Shift): Promise<Shift> {
    const data = shift.toJSON();

    const saved = await this.prisma.shift.upsert({
      where: { id: data.id },
      create: {
        id: data.id,
        rider_user_id: data.rider_user_id,
        status: data.status,
        vehicle_type: data.vehicle_type,
        start_time: data.start_time,
        end_time: data.end_time,
        pause_time: data.pause_time,
        resume_time: data.resume_time,
        total_pause_duration_sec: data.total_pause_duration_sec,
        current_location: data.current_location as any,
        last_location_update: data.last_location_update,
        total_deliveries: data.total_deliveries,
        total_earnings: data.total_earnings,
        total_distance_km: data.total_distance_km,
        metadata: data.metadata as any,
        created_at: data.created_at,
        updated_at: data.updated_at,
      },
      update: {
        status: data.status,
        end_time: data.end_time,
        pause_time: data.pause_time,
        resume_time: data.resume_time,
        total_pause_duration_sec: data.total_pause_duration_sec,
        current_location: data.current_location as any,
        last_location_update: data.last_location_update,
        total_deliveries: data.total_deliveries,
        total_earnings: data.total_earnings,
        total_distance_km: data.total_distance_km,
        metadata: data.metadata as any,
        updated_at: data.updated_at,
      },
    });

    return Shift.fromPersistence({
      ...saved,
      status: saved.status as any,
      current_location: saved.current_location as any,
      metadata: saved.metadata as any,
    });
  }

  async findById(id: string): Promise<Shift | null> {
    const shift = await this.prisma.shift.findUnique({
      where: { id },
    });

    if (!shift) return null;

    return Shift.fromPersistence({
      ...shift,
      status: shift.status as any,
      current_location: shift.current_location as any,
      metadata: shift.metadata as any,
    });
  }

  async findByRiderUserId(riderUserId: string): Promise<Shift[]> {
    const shifts = await this.prisma.shift.findMany({
      where: { rider_user_id: riderUserId },
      orderBy: { created_at: 'desc' },
    });

    return shifts.map((shift) =>
      Shift.fromPersistence({
        ...shift,
        status: shift.status as any,
        current_location: shift.current_location as any,
        metadata: shift.metadata as any,
      }),
    );
  }

  async findActiveByRiderUserId(riderUserId: string): Promise<Shift | null> {
    const shift = await this.prisma.shift.findFirst({
      where: {
        rider_user_id: riderUserId,
        status: { in: [ShiftStatus.ACTIVE, ShiftStatus.PAUSED] },
      },
      orderBy: { created_at: 'desc' },
    });

    if (!shift) return null;

    return Shift.fromPersistence({
      ...shift,
      status: shift.status as any,
      current_location: shift.current_location as any,
      metadata: shift.metadata as any,
    });
  }

  async findActiveShifts(): Promise<Shift[]> {
    const shifts = await this.prisma.shift.findMany({
      where: {
        status: ShiftStatus.ACTIVE,
      },
      orderBy: { created_at: 'desc' },
    });

    return shifts.map((shift) =>
      Shift.fromPersistence({
        ...shift,
        status: shift.status as any,
        current_location: shift.current_location as any,
        metadata: shift.metadata as any,
      }),
    );
  }

  async findShiftsByDateRange(
    riderUserId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<Shift[]> {
    const shifts = await this.prisma.shift.findMany({
      where: {
        rider_user_id: riderUserId,
        start_time: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { start_time: 'desc' },
    });

    return shifts.map((shift) =>
      Shift.fromPersistence({
        ...shift,
        status: shift.status as any,
        current_location: shift.current_location as any,
        metadata: shift.metadata as any,
      }),
    );
  }

  async findAll(filters?: {
    status?: string;
    vehicle_type?: string;
    rider_user_id?: string;
    start_date?: Date;
    end_date?: Date;
    page?: number;
    size?: number;
  }): Promise<{ shifts: Shift[]; total: number }> {
    const page = filters?.page || 1;
    const size = filters?.size || 20;
    const skip = (page - 1) * size;

    const where: any = {};

    if (filters?.status) {
      where.status = filters.status;
    }
    if (filters?.vehicle_type) {
      where.vehicle_type = filters.vehicle_type;
    }
    if (filters?.rider_user_id) {
      where.rider_user_id = filters.rider_user_id;
    }
    if (filters?.start_date || filters?.end_date) {
      where.start_time = {};
      if (filters.start_date) {
        where.start_time.gte = filters.start_date;
      }
      if (filters.end_date) {
        where.start_time.lte = filters.end_date;
      }
    }

    const [shifts, total] = await Promise.all([
      this.prisma.shift.findMany({
        where,
        skip,
        take: size,
        orderBy: { created_at: 'desc' },
      }),
      this.prisma.shift.count({ where }),
    ]);

    return {
      shifts: shifts.map((shift) =>
        Shift.fromPersistence({
          ...shift,
          status: shift.status as any,
          current_location: shift.current_location as any,
          metadata: shift.metadata as any,
        }),
      ),
      total,
    };
  }

  async bulkEnd(shiftIds: string[]): Promise<number> {
    const result = await this.prisma.shift.updateMany({
      where: {
        id: { in: shiftIds },
        status: { not: ShiftStatus.ENDED },
      },
      data: {
        status: ShiftStatus.ENDED,
        end_time: new Date(),
        updated_at: new Date(),
      },
    });

    return result.count;
  }
}
