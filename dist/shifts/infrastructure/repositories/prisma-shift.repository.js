"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrismaShiftRepository = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../shared/database/prisma.service");
const shift_entity_1 = require("../../domain/entities/shift.entity");
let PrismaShiftRepository = class PrismaShiftRepository {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async save(shift) {
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
                current_location: data.current_location,
                last_location_update: data.last_location_update,
                total_deliveries: data.total_deliveries,
                total_earnings: data.total_earnings,
                total_distance_km: data.total_distance_km,
                metadata: data.metadata,
                created_at: data.created_at,
                updated_at: data.updated_at,
            },
            update: {
                status: data.status,
                end_time: data.end_time,
                pause_time: data.pause_time,
                resume_time: data.resume_time,
                total_pause_duration_sec: data.total_pause_duration_sec,
                current_location: data.current_location,
                last_location_update: data.last_location_update,
                total_deliveries: data.total_deliveries,
                total_earnings: data.total_earnings,
                total_distance_km: data.total_distance_km,
                metadata: data.metadata,
                updated_at: data.updated_at,
            },
        });
        return shift_entity_1.Shift.fromPersistence({
            ...saved,
            status: saved.status,
            current_location: saved.current_location,
            metadata: saved.metadata,
        });
    }
    async findById(id) {
        const shift = await this.prisma.shift.findUnique({
            where: { id },
        });
        if (!shift)
            return null;
        return shift_entity_1.Shift.fromPersistence({
            ...shift,
            status: shift.status,
            current_location: shift.current_location,
            metadata: shift.metadata,
        });
    }
    async findByRiderUserId(riderUserId) {
        const shifts = await this.prisma.shift.findMany({
            where: { rider_user_id: riderUserId },
            orderBy: { created_at: 'desc' },
        });
        return shifts.map((shift) => shift_entity_1.Shift.fromPersistence({
            ...shift,
            status: shift.status,
            current_location: shift.current_location,
            metadata: shift.metadata,
        }));
    }
    async findActiveByRiderUserId(riderUserId) {
        const shift = await this.prisma.shift.findFirst({
            where: {
                rider_user_id: riderUserId,
                status: { in: [shift_entity_1.ShiftStatus.ACTIVE, shift_entity_1.ShiftStatus.PAUSED] },
            },
            orderBy: { created_at: 'desc' },
        });
        if (!shift)
            return null;
        return shift_entity_1.Shift.fromPersistence({
            ...shift,
            status: shift.status,
            current_location: shift.current_location,
            metadata: shift.metadata,
        });
    }
    async findActiveShifts() {
        const shifts = await this.prisma.shift.findMany({
            where: {
                status: shift_entity_1.ShiftStatus.ACTIVE,
            },
            orderBy: { created_at: 'desc' },
        });
        return shifts.map((shift) => shift_entity_1.Shift.fromPersistence({
            ...shift,
            status: shift.status,
            current_location: shift.current_location,
            metadata: shift.metadata,
        }));
    }
    async findShiftsByDateRange(riderUserId, startDate, endDate) {
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
        return shifts.map((shift) => shift_entity_1.Shift.fromPersistence({
            ...shift,
            status: shift.status,
            current_location: shift.current_location,
            metadata: shift.metadata,
        }));
    }
    async findAll(filters) {
        const page = filters?.page || 1;
        const size = filters?.size || 20;
        const skip = (page - 1) * size;
        const where = {};
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
            shifts: shifts.map((shift) => shift_entity_1.Shift.fromPersistence({
                ...shift,
                status: shift.status,
                current_location: shift.current_location,
                metadata: shift.metadata,
            })),
            total,
        };
    }
    async bulkEnd(shiftIds) {
        const result = await this.prisma.shift.updateMany({
            where: {
                id: { in: shiftIds },
                status: { not: shift_entity_1.ShiftStatus.ENDED },
            },
            data: {
                status: shift_entity_1.ShiftStatus.ENDED,
                end_time: new Date(),
                updated_at: new Date(),
            },
        });
        return result.count;
    }
};
exports.PrismaShiftRepository = PrismaShiftRepository;
exports.PrismaShiftRepository = PrismaShiftRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PrismaShiftRepository);
//# sourceMappingURL=prisma-shift.repository.js.map