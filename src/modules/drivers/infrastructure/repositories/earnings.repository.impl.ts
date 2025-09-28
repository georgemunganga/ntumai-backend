import { Injectable } from '@nestjs/common';
import { PrismaService } from '@common/prisma/prisma.service';
import { EarningsRepository } from '../../domain/repositories/earnings.repository';
import { Earnings } from '../../domain/entities/earnings.entity';
import { Prisma } from '@prisma/client';

export interface EarningsSearchFilters {
  riderId?: string;
  type?: string;
  payoutStatus?: string;
  startDate?: Date;
  endDate?: Date;
  minAmount?: number;
  maxAmount?: number;
  currency?: string;
  orderId?: string;
  shiftId?: string;
}

export interface EarningsSearchResult {
  earnings: Earnings[];
  total: number;
}

export interface PaginationOptions {
  page: number;
  limit: number;
}

export interface EarningsSummary {
  period: string;
  totalEarnings: number;
  baseEarnings: number;
  tips: number;
  bonuses: number;
  incentives: number;
  adjustments: number;
  totalOrders: number;
  averageEarningsPerOrder: number;
}

export interface PayoutSummary {
  totalEarnings: number;
  paidAmount: number;
  pendingAmount: number;
  processingAmount: number;
  failedAmount: number;
  lastPayoutDate?: Date;
  nextPayoutDate?: Date;
}

@Injectable()
export class EarningsRepositoryImpl implements EarningsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async save(earnings: Earnings): Promise<Earnings> {
    const earningsData = this.mapToEarningsData(earnings);

    if (earnings.getId()) {
      // Update existing earnings
      const updatedEarnings = await this.prisma.earnings.update({
        where: { id: earnings.getId() },
        data: earningsData,
        include: this.getIncludeOptions(),
      });
      return this.mapToDomainEntity(updatedEarnings);
    } else {
      // Create new earnings
      const createdEarnings = await this.prisma.earnings.create({
        data: {
          ...earningsData,
          id: undefined, // Let Prisma generate the ID
        },
        include: this.getIncludeOptions(),
      });
      return this.mapToDomainEntity(createdEarnings);
    }
  }

  async findById(id: string): Promise<Earnings | null> {
    const earnings = await this.prisma.earnings.findUnique({
      where: { id },
      include: this.getIncludeOptions(),
    });

    return earnings ? this.mapToDomainEntity(earnings) : null;
  }

  async findByRiderId(
    riderId: string,
    pagination?: PaginationOptions,
  ): Promise<EarningsSearchResult> {
    const where: Prisma.EarningsWhereInput = { riderId };

    const [earnings, total] = await Promise.all([
      this.prisma.earnings.findMany({
        where,
        include: this.getIncludeOptions(),
        skip: pagination ? (pagination.page - 1) * pagination.limit : undefined,
        take: pagination?.limit,
        orderBy: { earnedAt: 'desc' },
      }),
      this.prisma.earnings.count({ where }),
    ]);

    return {
      earnings: earnings.map(earning => this.mapToDomainEntity(earning)),
      total,
    };
  }

  async findByOrderId(orderId: string): Promise<Earnings[]> {
    const earnings = await this.prisma.earnings.findMany({
      where: { orderId },
      include: this.getIncludeOptions(),
      orderBy: { earnedAt: 'asc' },
    });

    return earnings.map(earning => this.mapToDomainEntity(earning));
  }

  async findByShiftId(shiftId: string): Promise<Earnings[]> {
    const earnings = await this.prisma.earnings.findMany({
      where: { shiftId },
      include: this.getIncludeOptions(),
      orderBy: { earnedAt: 'asc' },
    });

    return earnings.map(earning => this.mapToDomainEntity(earning));
  }

  async findByPayoutStatus(
    payoutStatus: string,
    pagination?: PaginationOptions,
  ): Promise<EarningsSearchResult> {
    const where: Prisma.EarningsWhereInput = { payoutStatus: payoutStatus as any };

    const [earnings, total] = await Promise.all([
      this.prisma.earnings.findMany({
        where,
        include: this.getIncludeOptions(),
        skip: pagination ? (pagination.page - 1) * pagination.limit : undefined,
        take: pagination?.limit,
        orderBy: { earnedAt: 'desc' },
      }),
      this.prisma.earnings.count({ where }),
    ]);

    return {
      earnings: earnings.map(earning => this.mapToDomainEntity(earning)),
      total,
    };
  }

  async searchEarnings(
    filters: EarningsSearchFilters,
    pagination: PaginationOptions,
  ): Promise<EarningsSearchResult> {
    const where: Prisma.EarningsWhereInput = {};

    if (filters.riderId) {
      where.riderId = filters.riderId;
    }

    if (filters.type) {
      where.type = filters.type as any;
    }

    if (filters.payoutStatus) {
      where.payoutStatus = filters.payoutStatus as any;
    }

    if (filters.startDate) {
      where.earnedAt = {
        gte: filters.startDate,
      };
    }

    if (filters.endDate) {
      where.earnedAt = {
        ...where.earnedAt,
        lte: filters.endDate,
      };
    }

    if (filters.minAmount !== undefined) {
      where.amount = {
        gte: filters.minAmount,
      };
    }

    if (filters.maxAmount !== undefined) {
      where.amount = {
        ...where.amount,
        lte: filters.maxAmount,
      };
    }

    if (filters.currency) {
      where.currency = filters.currency;
    }

    if (filters.orderId) {
      where.orderId = filters.orderId;
    }

    if (filters.shiftId) {
      where.shiftId = filters.shiftId;
    }

    const [earnings, total] = await Promise.all([
      this.prisma.earnings.findMany({
        where,
        include: this.getIncludeOptions(),
        skip: (pagination.page - 1) * pagination.limit,
        take: pagination.limit,
        orderBy: { earnedAt: 'desc' },
      }),
      this.prisma.earnings.count({ where }),
    ]);

    return {
      earnings: earnings.map(earning => this.mapToDomainEntity(earning)),
      total,
    };
  }

  async getEarningsSummary(
    riderId: string,
    startDate: Date,
    endDate: Date,
    groupBy: 'day' | 'week' | 'month' = 'day',
  ): Promise<EarningsSummary[]> {
    let dateFormat: string;
    switch (groupBy) {
      case 'week':
        dateFormat = '%Y-%u'; // Year-Week
        break;
      case 'month':
        dateFormat = '%Y-%m'; // Year-Month
        break;
      default:
        dateFormat = '%Y-%m-%d'; // Year-Month-Day
    }

    const query = `
      SELECT 
        DATE_FORMAT(earned_at, '${dateFormat}') as period,
        SUM(amount) as totalEarnings,
        SUM(CASE WHEN type = 'BASE_DELIVERY' THEN amount ELSE 0 END) as baseEarnings,
        SUM(CASE WHEN type = 'TIP' THEN amount ELSE 0 END) as tips,
        SUM(CASE WHEN type = 'BONUS' THEN amount ELSE 0 END) as bonuses,
        SUM(CASE WHEN type = 'INCENTIVE' THEN amount ELSE 0 END) as incentives,
        SUM(CASE WHEN type = 'ADJUSTMENT' THEN amount ELSE 0 END) as adjustments,
        COUNT(DISTINCT order_id) as totalOrders,
        AVG(amount) as averageEarningsPerOrder
      FROM earnings 
      WHERE rider_id = ? 
        AND earned_at >= ? 
        AND earned_at <= ?
      GROUP BY DATE_FORMAT(earned_at, '${dateFormat}')
      ORDER BY period ASC
    `;

    const results = await this.prisma.$queryRawUnsafe(
      query,
      riderId,
      startDate,
      endDate,
    ) as any[];

    return results.map(result => ({
      period: result.period,
      totalEarnings: Number(result.totalEarnings) || 0,
      baseEarnings: Number(result.baseEarnings) || 0,
      tips: Number(result.tips) || 0,
      bonuses: Number(result.bonuses) || 0,
      incentives: Number(result.incentives) || 0,
      adjustments: Number(result.adjustments) || 0,
      totalOrders: Number(result.totalOrders) || 0,
      averageEarningsPerOrder: Number(result.averageEarningsPerOrder) || 0,
    }));
  }

  async getPayoutSummary(
    riderId: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<PayoutSummary> {
    const where: Prisma.EarningsWhereInput = { riderId };

    if (startDate) {
      where.earnedAt = { gte: startDate };
    }

    if (endDate) {
      where.earnedAt = {
        ...where.earnedAt,
        lte: endDate,
      };
    }

    const [totalResult, paidResult, pendingResult, processingResult, failedResult, lastPayout] = await Promise.all([
      this.prisma.earnings.aggregate({
        where,
        _sum: { amount: true },
      }),
      this.prisma.earnings.aggregate({
        where: { ...where, payoutStatus: 'PAID' },
        _sum: { amount: true },
      }),
      this.prisma.earnings.aggregate({
        where: { ...where, payoutStatus: 'PENDING' },
        _sum: { amount: true },
      }),
      this.prisma.earnings.aggregate({
        where: { ...where, payoutStatus: 'PROCESSING' },
        _sum: { amount: true },
      }),
      this.prisma.earnings.aggregate({
        where: { ...where, payoutStatus: 'FAILED' },
        _sum: { amount: true },
      }),
      this.prisma.earnings.findFirst({
        where: { ...where, payoutStatus: 'PAID' },
        orderBy: { paidAt: 'desc' },
        select: { paidAt: true },
      }),
    ]);

    return {
      totalEarnings: Number(totalResult._sum.amount) || 0,
      paidAmount: Number(paidResult._sum.amount) || 0,
      pendingAmount: Number(pendingResult._sum.amount) || 0,
      processingAmount: Number(processingResult._sum.amount) || 0,
      failedAmount: Number(failedResult._sum.amount) || 0,
      lastPayoutDate: lastPayout?.paidAt || undefined,
      nextPayoutDate: this.calculateNextPayoutDate(),
    };
  }

  async getTotalEarningsByRiderId(
    riderId: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<number> {
    const where: Prisma.EarningsWhereInput = { riderId };

    if (startDate) {
      where.earnedAt = { gte: startDate };
    }

    if (endDate) {
      where.earnedAt = {
        ...where.earnedAt,
        lte: endDate,
      };
    }

    const result = await this.prisma.earnings.aggregate({
      where,
      _sum: { amount: true },
    });

    return Number(result._sum.amount) || 0;
  }

  async getTotalEarningsByType(
    riderId: string,
    type: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<number> {
    const where: Prisma.EarningsWhereInput = {
      riderId,
      type: type as any,
    };

    if (startDate) {
      where.earnedAt = { gte: startDate };
    }

    if (endDate) {
      where.earnedAt = {
        ...where.earnedAt,
        lte: endDate,
      };
    }

    const result = await this.prisma.earnings.aggregate({
      where,
      _sum: { amount: true },
    });

    return Number(result._sum.amount) || 0;
  }

  async getPendingPayoutAmount(riderId: string): Promise<number> {
    const result = await this.prisma.earnings.aggregate({
      where: {
        riderId,
        payoutStatus: 'PENDING',
      },
      _sum: { amount: true },
    });

    return Number(result._sum.amount) || 0;
  }

  async updatePayoutStatus(
    earningsIds: string[],
    payoutStatus: string,
    paidAt?: Date,
    payoutReference?: string,
  ): Promise<void> {
    const updateData: any = { payoutStatus };

    if (payoutStatus === 'PAID' && paidAt) {
      updateData.paidAt = paidAt;
    }

    if (payoutReference) {
      updateData.payoutReference = payoutReference;
    }

    await this.prisma.earnings.updateMany({
      where: {
        id: {
          in: earningsIds,
        },
      },
      data: updateData,
    });
  }

  async findEarningsForPayout(
    riderId?: string,
    maxAmount?: number,
  ): Promise<Earnings[]> {
    const where: Prisma.EarningsWhereInput = {
      payoutStatus: 'PENDING',
    };

    if (riderId) {
      where.riderId = riderId;
    }

    let earnings = await this.prisma.earnings.findMany({
      where,
      include: this.getIncludeOptions(),
      orderBy: { earnedAt: 'asc' },
    });

    if (maxAmount) {
      let totalAmount = 0;
      earnings = earnings.filter(earning => {
        if (totalAmount + earning.amount <= maxAmount) {
          totalAmount += earning.amount;
          return true;
        }
        return false;
      });
    }

    return earnings.map(earning => this.mapToDomainEntity(earning));
  }

  async findEarningsReadyForPayout(): Promise<Earnings[]> {
    // Find earnings that are pending and older than 24 hours
    const cutoffDate = new Date();
    cutoffDate.setHours(cutoffDate.getHours() - 24);

    const earnings = await this.prisma.earnings.findMany({
      where: {
        payoutStatus: 'PENDING',
        earnedAt: {
          lte: cutoffDate,
        },
      },
      include: this.getIncludeOptions(),
      orderBy: { earnedAt: 'asc' },
    });

    return earnings.map(earning => this.mapToDomainEntity(earning));
  }

  async delete(id: string): Promise<void> {
    await this.prisma.earnings.delete({
      where: { id },
    });
  }

  async findAll(): Promise<Earnings[]> {
    const earnings = await this.prisma.earnings.findMany({
      include: this.getIncludeOptions(),
      orderBy: { earnedAt: 'desc' },
    });

    return earnings.map(earning => this.mapToDomainEntity(earning));
  }

  async count(): Promise<number> {
    return this.prisma.earnings.count();
  }

  async countByRiderId(riderId: string): Promise<number> {
    return this.prisma.earnings.count({
      where: { riderId },
    });
  }

  async countByPayoutStatus(payoutStatus: string): Promise<number> {
    return this.prisma.earnings.count({
      where: { payoutStatus: payoutStatus as any },
    });
  }

  private calculateNextPayoutDate(): Date {
    // Assuming weekly payouts on Fridays
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0 = Sunday, 5 = Friday
    const daysUntilFriday = (5 - dayOfWeek + 7) % 7;
    const nextFriday = new Date(now);
    nextFriday.setDate(now.getDate() + (daysUntilFriday === 0 ? 7 : daysUntilFriday));
    nextFriday.setHours(12, 0, 0, 0); // Set to noon
    return nextFriday;
  }

  private getIncludeOptions() {
    return {
      rider: {
        select: {
          id: true,
          riderCode: true,
          firstName: true,
          lastName: true,
          email: true,
          phoneNumber: true,
        },
      },
      order: {
        select: {
          id: true,
          trackingId: true,
          totalAmount: true,
          deliveryFee: true,
        },
      },
      shift: {
        select: {
          id: true,
          startTime: true,
          endTime: true,
          status: true,
        },
      },
    };
  }

  private mapToEarningsData(earnings: Earnings): Prisma.EarningsCreateInput | Prisma.EarningsUpdateInput {
    return {
      riderId: earnings.getRiderId(),
      orderId: earnings.getOrderId(),
      shiftId: earnings.getShiftId(),
      type: earnings.getType() as any,
      amount: earnings.getAmount(),
      currency: earnings.getCurrency(),
      description: earnings.getDescription(),
      payoutStatus: earnings.getPayoutStatus() as any,
      payoutReference: earnings.getPayoutReference(),
      earnedAt: earnings.getEarnedAt(),
      paidAt: earnings.getPaidAt(),
      taxYear: earnings.getTaxYear(),
      taxCategory: earnings.getTaxCategory(),
      metadata: earnings.getMetadata() ? JSON.stringify(earnings.getMetadata()) : null,
    };
  }

  private mapToDomainEntity(data: any): Earnings {
    return new Earnings(
      data.id,
      data.riderId,
      data.orderId,
      data.shiftId,
      data.type,
      data.amount,
      data.currency,
      data.description,
      data.payoutStatus,
      data.payoutReference,
      data.earnedAt,
      data.paidAt,
      data.taxYear,
      data.taxCategory,
      data.metadata ? JSON.parse(data.metadata) : null,
      data.createdAt,
      data.updatedAt,
    );
  }
}