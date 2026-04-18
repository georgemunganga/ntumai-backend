import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { NotificationsService } from '../../../notifications/application/services/notifications.service';
import { PrismaService } from '../../../../shared/infrastructure/prisma.service';
import {
  CreatePayoutRequestInputDto,
  FinanceSummaryResponseDto,
  FinanceTransactionDto,
  PayoutRequestDto,
} from '../dtos/finance.dto';

type FinanceRole = 'customer' | 'tasker' | 'vendor';

@Injectable()
export class FinanceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async getSummary(
    userId: string,
    role: FinanceRole,
  ): Promise<FinanceSummaryResponseDto> {
    await this.assertRoleAccess(userId, role);
    const payoutRequestModel = (this.prisma as any).payoutRequest;

    if (role === 'customer') {
      const payments = await this.prisma.payment.findMany({
        where: {
          Order: { userId },
          status: { in: ['PAID', 'REFUNDED'] as any },
        },
        include: {
          Order: {
            select: {
              id: true,
              trackingId: true,
              status: true,
              totalAmount: true,
              createdAt: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      const totalSpent = payments
        .filter((payment) => payment.status === 'PAID')
        .reduce((sum, payment) => sum + payment.amount, 0);
      const totalRefunded = payments
        .filter((payment) => payment.status === 'REFUNDED')
        .reduce((sum, payment) => sum + payment.amount, 0);

      return {
        role,
        currency: 'ZMW',
        availableBalance: 0,
        pendingBalance: 0,
        totalEarned: 0,
        totalPaidOut: 0,
        totalSpent,
        totalRefunded,
        transactionCount: payments.length,
        meta: {
          note: 'Customer finance currently reflects payment activity, not stored wallet value.',
        },
      };
    }

    if (role === 'tasker') {
      const [shifts, payoutRequests] = await Promise.all([
        this.prisma.shift.findMany({
          where: { rider_user_id: userId },
          orderBy: { start_time: 'desc' },
        }),
        payoutRequestModel.findMany({
          where: { userId, role: 'TASKER' as any },
        }),
      ]);

      const totalEarned = shifts.reduce((sum, shift) => sum + shift.total_earnings, 0);
      const pendingBalance = payoutRequests
        .filter((request) =>
          request.status === 'PENDING' || request.status === 'PROCESSING',
        )
        .reduce((sum, request) => sum + request.amount, 0);
      const totalPaidOut = payoutRequests
        .filter((request) => request.status === 'PAID')
        .reduce((sum, request) => sum + request.amount, 0);

      return {
        role,
        currency: 'ZMW',
        availableBalance: Math.max(0, totalEarned - pendingBalance - totalPaidOut),
        pendingBalance,
        totalEarned,
        totalPaidOut,
        totalSpent: 0,
        totalRefunded: 0,
        transactionCount:
          shifts.filter((shift) => shift.total_earnings > 0).length + payoutRequests.length,
        meta: {
          totalShifts: shifts.length,
          totalDeliveries: shifts.reduce(
            (sum, shift) => sum + shift.total_deliveries,
            0,
          ),
        },
      };
    }

    const [stores, orderItems, payoutRequests] = await Promise.all([
      this.prisma.store.findMany({
        where: { vendorId: userId },
        select: { id: true, name: true },
      }),
      this.prisma.orderItem.findMany({
        where: {
          Product: {
            Store: {
              vendorId: userId,
            },
          },
          Order: {
            status: { in: ['DELIVERED', 'COMPLETED'] as any },
          },
        },
        include: {
          Order: {
            select: {
              id: true,
              trackingId: true,
              status: true,
              createdAt: true,
            },
          },
          Product: {
            select: {
              id: true,
              name: true,
              storeId: true,
            },
          },
        },
      }),
      payoutRequestModel.findMany({
        where: { userId, role: 'VENDOR' as any },
      }),
    ]);

    const grossSales = orderItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );
    const pendingBalance = payoutRequests
      .filter((request) =>
        request.status === 'PENDING' || request.status === 'PROCESSING',
      )
      .reduce((sum, request) => sum + request.amount, 0);
    const totalPaidOut = payoutRequests
      .filter((request) => request.status === 'PAID')
      .reduce((sum, request) => sum + request.amount, 0);

    return {
      role,
      currency: 'ZMW',
      availableBalance: Math.max(0, grossSales - pendingBalance - totalPaidOut),
      pendingBalance,
      totalEarned: grossSales,
      totalPaidOut,
      totalSpent: 0,
      totalRefunded: 0,
      transactionCount: orderItems.length + payoutRequests.length,
      meta: {
        storeCount: stores.length,
        orderCount: new Set(orderItems.map((item) => item.orderId)).size,
      },
    };
  }

  async getTransactions(
    userId: string,
    role: FinanceRole,
    limit = 50,
  ): Promise<FinanceTransactionDto[]> {
    await this.assertRoleAccess(userId, role);
    const safeLimit = Math.min(Math.max(Number(limit) || 20, 1), 100);
    const payoutRequestModel = (this.prisma as any).payoutRequest;

    if (role === 'customer') {
      const payments = await this.prisma.payment.findMany({
        where: {
          Order: { userId },
          status: { in: ['PAID', 'REFUNDED', 'PENDING', 'FAILED'] as any },
        },
        include: {
          Order: {
            select: {
              trackingId: true,
              totalAmount: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: safeLimit,
      });

      return payments.map((payment) => ({
        id: payment.id,
        direction: payment.status === 'REFUNDED' ? 'credit' : 'debit',
        amount: payment.amount,
        currency: 'ZMW',
        description:
          payment.status === 'REFUNDED'
            ? `Refund for order ${payment.Order.trackingId}`
            : `Payment for order ${payment.Order.trackingId}`,
        timestamp: payment.createdAt.toISOString(),
        status: payment.status.toLowerCase(),
        reference: payment.reference,
        metadata: {
          orderTrackingId: payment.Order.trackingId,
          method: payment.method,
        },
      }));
    }

    if (role === 'tasker') {
      const [shifts, payoutRequests] = await Promise.all([
        this.prisma.shift.findMany({
          where: { rider_user_id: userId, total_earnings: { gt: 0 } },
          orderBy: { start_time: 'desc' },
          take: safeLimit,
        }),
        payoutRequestModel.findMany({
          where: { userId, role: 'TASKER' as any },
          orderBy: { createdAt: 'desc' },
          take: safeLimit,
        }),
      ]);

      const transactions: FinanceTransactionDto[] = [
        ...shifts.map((shift) => ({
          id: `shift:${shift.id}`,
          direction: 'credit' as const,
          amount: shift.total_earnings,
          currency: 'ZMW',
          description: 'Shift earnings',
          timestamp: (shift.end_time || shift.updated_at || shift.start_time).toISOString(),
          status: shift.status === 'ended' ? 'completed' : 'pending',
          reference: shift.id,
          metadata: {
            shiftId: shift.id,
            deliveries: shift.total_deliveries,
            distanceKm: shift.total_distance_km,
          },
        })),
        ...payoutRequests.map((request) => this.toPayoutTransaction(request)),
      ];

      return transactions
        .sort(
          (a, b) =>
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
        )
        .slice(0, safeLimit);
    }

    const [orderItems, payoutRequests] = await Promise.all([
      this.prisma.orderItem.findMany({
        where: {
          Product: {
            Store: {
              vendorId: userId,
            },
          },
          Order: {
            status: { in: ['DELIVERED', 'COMPLETED'] as any },
          },
        },
        include: {
          Order: {
            select: {
              trackingId: true,
              createdAt: true,
            },
          },
          Product: {
            select: {
              name: true,
              storeId: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: safeLimit * 2,
      }),
      payoutRequestModel.findMany({
        where: { userId, role: 'VENDOR' as any },
        orderBy: { createdAt: 'desc' },
        take: safeLimit,
      }),
    ]);

    const orderGroups = new Map<
      string,
      {
        amount: number;
        createdAt: Date;
        trackingId: string;
        itemCount: number;
      }
    >();

    orderItems.forEach((item) => {
      const existing = orderGroups.get(item.orderId);
      const lineTotal = item.price * item.quantity;
      if (existing) {
        existing.amount += lineTotal;
        existing.itemCount += item.quantity;
        return;
      }

      orderGroups.set(item.orderId, {
        amount: lineTotal,
        createdAt: item.Order.createdAt,
        trackingId: item.Order.trackingId,
        itemCount: item.quantity,
      });
    });

    const transactions: FinanceTransactionDto[] = [
      ...Array.from(orderGroups.entries()).map(([orderId, group]) => ({
        id: `vendor-order:${orderId}`,
        direction: 'credit' as const,
        amount: group.amount,
        currency: 'ZMW',
        description: `Marketplace sale ${group.trackingId}`,
        timestamp: group.createdAt.toISOString(),
        status: 'completed',
        reference: group.trackingId,
        metadata: {
          orderId,
          itemCount: group.itemCount,
        },
      })),
      ...payoutRequests.map((request) => this.toPayoutTransaction(request)),
    ];

    return transactions
      .sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
      )
      .slice(0, safeLimit);
  }

  async listPayoutRequests(
    userId: string,
    role: FinanceRole,
  ): Promise<PayoutRequestDto[]> {
    await this.assertRoleAccess(userId, role);
    if (role === 'customer') {
      return [];
    }

    const requests = await (this.prisma as any).payoutRequest.findMany({
      where: {
        userId,
        role: role === 'tasker' ? ('TASKER' as any) : ('VENDOR' as any),
      },
      orderBy: { createdAt: 'desc' },
    });

    return requests.map((request) => this.toPayoutDto(request));
  }

  async createPayoutRequest(
    userId: string,
    input: CreatePayoutRequestInputDto,
  ): Promise<PayoutRequestDto> {
    const role = input.role;
    await this.assertRoleAccess(userId, role);

    const summary = await this.getSummary(userId, role);
    if (summary.availableBalance <= 0) {
      throw new BadRequestException('No available balance for payout');
    }

    if (input.amount > summary.availableBalance) {
      throw new BadRequestException('Requested amount exceeds available balance');
    }

    const request = await (this.prisma as any).payoutRequest.create({
      data: {
        id: randomUUID(),
        userId,
        role: role === 'tasker' ? ('TASKER' as any) : ('VENDOR' as any),
        amount: input.amount,
        currency: input.currency || 'ZMW',
        destination: input.destination,
        notes: input.notes?.trim() || null,
        metadata: {
          requestedFrom: 'mobile_app',
        },
      },
    });

    await this.notificationsService.createNotification({
      userId,
      title: 'Payout request received',
      message: `Your ${role} payout request for K${input.amount.toFixed(2)} is pending review.`,
      type: 'SYSTEM',
      metadata: {
        targetRole: role,
        notificationType: 'payout_request',
        payoutRequestId: request.id,
      },
    });

    return this.toPayoutDto(request);
  }

  private toPayoutDto(request: any): PayoutRequestDto {
    return {
      id: request.id,
      role: String(request.role).toLowerCase() as 'customer' | 'tasker' | 'vendor',
      amount: request.amount,
      currency: request.currency,
      status: String(request.status).toLowerCase(),
      destination:
        request.destination && typeof request.destination === 'object'
          ? request.destination
          : null,
      notes: request.notes,
      processedAt: request.processedAt?.toISOString() || null,
      createdAt: request.createdAt.toISOString(),
    };
  }

  private toPayoutTransaction(request: any): FinanceTransactionDto {
    return {
      id: `payout:${request.id}`,
      direction: 'debit',
      amount: request.amount,
      currency: request.currency || 'ZMW',
      description: 'Payout request',
      timestamp: request.createdAt.toISOString(),
      status: String(request.status).toLowerCase(),
      reference: request.id,
      metadata:
        request.destination && typeof request.destination === 'object'
          ? request.destination
          : undefined,
    };
  }

  private async assertRoleAccess(userId: string, role: FinanceRole) {
    if (role === 'customer') {
      return;
    }

    if (role === 'vendor') {
      const store = await this.prisma.store.findFirst({
        where: { vendorId: userId },
        select: { id: true },
      });
      if (!store) {
        throw new ForbiddenException('Vendor finance is unavailable until store setup is complete');
      }
      return;
    }

    const assignment = await this.prisma.userRoleAssignment.findUnique({
      where: {
        userId_role: {
          userId,
          role: 'DRIVER' as any,
        },
      },
      select: { id: true, active: true },
    });

    if (!assignment?.active) {
      throw new ForbiddenException('Tasker finance is unavailable until tasker access is active');
    }
  }
}
