import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { NotificationsService } from '../../../notifications/application/services/notifications.service';
import { PrismaService } from '../../../../shared/infrastructure/prisma.service';
import {
  CreatePayoutRequestInputDto,
  FinanceSummaryResponseDto,
  FinanceTransactionDto,
  LoyaltyResponseDto,
  PayoutRequestDto,
  RedeemLoyaltyRewardDto,
  SelectVendorSubscriptionPlanDto,
  UpdatePayoutRequestStatusDto,
  VendorSubscriptionResponseDto,
} from '../dtos/finance.dto';

type FinanceRole = 'customer' | 'tasker' | 'vendor';

@Injectable()
export class FinanceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  private readonly vendorPlans = [
    {
      code: 'starter',
      name: 'Starter',
      monthlyPrice: 0,
      description: 'Basic store presence for development and low-volume sellers.',
      features: [
        'Store listing',
        'Product management',
        'Order management',
      ],
      recommended: false,
    },
    {
      code: 'growth',
      name: 'Growth',
      monthlyPrice: 149,
      description: 'Extra visibility and reporting for active vendors.',
      features: [
        'Everything in Starter',
        'Promo code management',
        'Sales analytics',
        'Priority support',
      ],
      recommended: true,
    },
    {
      code: 'pro',
      name: 'Pro',
      monthlyPrice: 299,
      description: 'High-volume plan for larger stores and restaurant groups.',
      features: [
        'Everything in Growth',
        'Advanced reporting',
        'Dedicated support routing',
        'Higher promotional capacity',
      ],
      recommended: false,
    },
  ];

  private readonly loyaltyTiers = [
    {
      name: 'Bronze',
      minPoints: 0,
      color: '#CD7F32',
      benefits: ['Earn 1 point per K10 spent', 'Birthday bonus'],
    },
    {
      name: 'Silver',
      minPoints: 500,
      color: '#C0C0C0',
      benefits: ['Earn 1.5 points per K10 spent', 'Priority support', 'Exclusive deals'],
    },
    {
      name: 'Gold',
      minPoints: 2000,
      color: '#FFD700',
      benefits: ['Earn 2 points per K10 spent', 'Free delivery on orders over K50', 'Early access to promotions'],
    },
    {
      name: 'Platinum',
      minPoints: 5000,
      color: '#E5E4E2',
      benefits: ['Earn 3 points per K10 spent', 'Always free delivery', 'Dedicated support', 'VIP events'],
    },
  ];

  private readonly loyaltyRewards = [
    {
      id: 'reward-001',
      title: 'K10 Off',
      description: 'Get K10 off your next order',
      pointsCost: 100,
      type: 'discount' as const,
      value: 10,
      expiryDays: 30,
      icon: 'tag',
    },
    {
      id: 'reward-002',
      title: 'Free Delivery',
      description: 'Free delivery on your next order',
      pointsCost: 150,
      type: 'free_delivery' as const,
      value: 100,
      expiryDays: 14,
      icon: 'truck',
    },
    {
      id: 'reward-003',
      title: 'K25 Off',
      description: 'Get K25 off your next order',
      pointsCost: 250,
      type: 'discount' as const,
      value: 25,
      expiryDays: 30,
      icon: 'gift',
    },
    {
      id: 'reward-004',
      title: '20% Off',
      description: 'Get 20% off your next order (max K50)',
      pointsCost: 400,
      type: 'discount' as const,
      value: 20,
      expiryDays: 30,
      icon: 'percent',
    },
    {
      id: 'reward-005',
      title: 'K50 Voucher',
      description: 'Get K50 voucher for any order',
      pointsCost: 500,
      type: 'voucher' as const,
      value: 50,
      expiryDays: 60,
      icon: 'award',
    },
  ];

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

  async getVendorSubscription(userId: string): Promise<VendorSubscriptionResponseDto> {
    await this.assertRoleAccess(userId, 'vendor');

    let subscription = await (this.prisma as any).vendorSubscription.findUnique({
      where: { userId },
    });

    if (!subscription) {
      const starterPlan = this.vendorPlans[0];
      const renewsAt = new Date();
      renewsAt.setMonth(renewsAt.getMonth() + 1);

      subscription = await (this.prisma as any).vendorSubscription.create({
        data: {
          userId,
          planCode: starterPlan.code,
          planName: starterPlan.name,
          monthlyPrice: starterPlan.monthlyPrice,
          billingCycle: 'monthly',
          status: 'active',
          renewsAt,
          metadata: {
            source: 'default_seed',
          },
        },
      });
    }

    return {
      subscription: this.toVendorSubscriptionDto(subscription),
      availablePlans: this.vendorPlans,
    };
  }

  async getLoyalty(userId: string): Promise<LoyaltyResponseDto> {
    const [points, redeemedRewards] = await Promise.all([
      this.prisma.loyaltyPoint.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 100,
      }),
      this.prisma.reward.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
    ]);

    const totalPoints = points
      .filter((item) => item.points > 0)
      .reduce((sum, item) => sum + item.points, 0);
    const availablePoints = points.reduce((sum, item) => sum + item.points, 0);

    let currentTier = this.loyaltyTiers[0];
    let nextTier = this.loyaltyTiers[1] || null;
    for (let index = this.loyaltyTiers.length - 1; index >= 0; index -= 1) {
      if (totalPoints >= this.loyaltyTiers[index].minPoints) {
        currentTier = this.loyaltyTiers[index];
        nextTier = this.loyaltyTiers[index + 1] || null;
        break;
      }
    }

    return {
      totalPoints,
      availablePoints,
      currentTier,
      nextTier,
      pointsToNextTier: nextTier ? Math.max(0, nextTier.minPoints - totalPoints) : 0,
      transactions: points.map((item) => ({
        id: item.id,
        type: item.points >= 0 ? 'earned' : 'redeemed',
        amount: item.points,
        description: item.reason,
        orderId: null,
        timestamp: item.createdAt.toISOString(),
      })),
      rewards: this.loyaltyRewards.map((reward) => ({
        ...reward,
        available: availablePoints >= reward.pointsCost,
      })),
    };
  }

  async redeemLoyaltyReward(
    userId: string,
    input: RedeemLoyaltyRewardDto,
  ): Promise<LoyaltyResponseDto> {
    const reward = this.loyaltyRewards.find((item) => item.id === input.rewardId);
    if (!reward) {
      throw new NotFoundException('Reward not found');
    }

    const availablePoints = await this.prisma.loyaltyPoint.aggregate({
      where: { userId },
      _sum: { points: true },
    });

    const currentPoints = Number(availablePoints._sum.points ?? 0);
    if (currentPoints < reward.pointsCost) {
      throw new BadRequestException('Insufficient loyalty points');
    }

    await this.prisma.$transaction([
      this.prisma.loyaltyPoint.create({
        data: {
          id: randomUUID(),
          userId,
          points: -reward.pointsCost,
          reason: `Redeemed: ${reward.title}`,
          updatedAt: new Date(),
        },
      }),
      this.prisma.reward.create({
        data: {
          id: randomUUID(),
          userId,
          type:
            reward.type === 'free_delivery'
              ? 'FREE_DELIVERY'
              : reward.type === 'voucher'
                ? 'OTHER'
                : 'DISCOUNT',
          value: reward.value,
          description: reward.title,
          isRedeemed: false,
          updatedAt: new Date(),
        },
      }),
    ]);

    await this.notificationsService.createNotification({
      userId,
      title: 'Reward redeemed',
      message: `${reward.title} has been added to your rewards.`,
      type: 'PROMOTION',
      metadata: {
        notificationType: 'loyalty_reward_redeemed',
        rewardId: reward.id,
      },
    });

    return this.getLoyalty(userId);
  }

  async selectVendorSubscriptionPlan(
    userId: string,
    input: SelectVendorSubscriptionPlanDto,
  ): Promise<VendorSubscriptionResponseDto> {
    await this.assertRoleAccess(userId, 'vendor');

    const plan = this.vendorPlans.find(
      (item) => item.code === String(input.planCode).trim().toLowerCase(),
    );

    if (!plan) {
      throw new NotFoundException('Subscription plan not found');
    }

    const renewsAt = new Date();
    renewsAt.setMonth(renewsAt.getMonth() + 1);

    const subscription = await (this.prisma as any).vendorSubscription.upsert({
      where: { userId },
      update: {
        planCode: plan.code,
        planName: plan.name,
        monthlyPrice: plan.monthlyPrice,
        billingCycle: 'monthly',
        status: 'active',
        renewsAt,
        metadata: {
          changedAt: new Date().toISOString(),
          source: 'vendor_self_service',
        },
      },
      create: {
        userId,
        planCode: plan.code,
        planName: plan.name,
        monthlyPrice: plan.monthlyPrice,
        billingCycle: 'monthly',
        status: 'active',
        renewsAt,
        metadata: {
          source: 'vendor_self_service',
        },
      },
    });

    await this.notificationsService.createNotification({
      userId,
      title: 'Subscription updated',
      message: `Your vendor plan is now ${plan.name}.`,
      type: 'SYSTEM',
      metadata: {
        notificationType: 'vendor_subscription_update',
        planCode: plan.code,
      },
    });

    return {
      subscription: this.toVendorSubscriptionDto(subscription),
      availablePlans: this.vendorPlans,
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

  async updatePayoutRequestStatus(
    adminUserId: string,
    payoutRequestId: string,
    input: UpdatePayoutRequestStatusDto,
  ): Promise<PayoutRequestDto> {
    const request = await (this.prisma as any).payoutRequest.findUnique({
      where: { id: payoutRequestId },
    });

    if (!request) {
      throw new NotFoundException('Payout request not found');
    }

    const nextStatus = input.status.toUpperCase();
    const updated = await (this.prisma as any).payoutRequest.update({
      where: { id: payoutRequestId },
      data: {
        status: nextStatus,
        notes: input.notes?.trim() || request.notes,
        processedAt:
          nextStatus === 'PAID' || nextStatus === 'REJECTED' || nextStatus === 'CANCELLED'
            ? new Date()
            : request.processedAt,
        metadata: {
          ...(request.metadata && typeof request.metadata === 'object' ? request.metadata : {}),
          lastUpdatedBy: adminUserId,
        },
      },
    });

    if (input.notifyUser !== false) {
      await this.notificationsService.createNotification({
        userId: updated.userId,
        title: this.getPayoutNotificationTitle(input.status),
        message: this.getPayoutNotificationMessage(updated.amount, input.status),
        type: 'SYSTEM',
        metadata: {
          targetRole: String(updated.role).toLowerCase(),
          notificationType: 'payout_update',
          payoutRequestId: updated.id,
          financeRole: String(updated.role).toLowerCase(),
          payoutStatus: String(updated.status).toLowerCase(),
          entityType: 'payout_request',
          entityId: updated.id,
        },
      });
    }

    return this.toPayoutDto(updated);
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

  private getPayoutNotificationTitle(status: string) {
    switch (status) {
      case 'paid':
        return 'Payout completed';
      case 'processing':
        return 'Payout processing';
      case 'rejected':
        return 'Payout rejected';
      case 'cancelled':
        return 'Payout cancelled';
      default:
        return 'Payout updated';
    }
  }

  private getPayoutNotificationMessage(amount: number, status: string) {
    switch (status) {
      case 'paid':
        return `Your payout of K${amount.toFixed(2)} has been completed.`;
      case 'processing':
        return `Your payout of K${amount.toFixed(2)} is now being processed.`;
      case 'rejected':
        return `Your payout of K${amount.toFixed(2)} was rejected.`;
      case 'cancelled':
        return `Your payout of K${amount.toFixed(2)} was cancelled.`;
      default:
        return `Your payout request for K${amount.toFixed(2)} was updated.`;
    }
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

  private toVendorSubscriptionDto(subscription: any) {
    return {
      id: subscription.id,
      planCode: subscription.planCode,
      planName: subscription.planName,
      monthlyPrice: Number(subscription.monthlyPrice ?? 0),
      billingCycle: subscription.billingCycle,
      status: subscription.status,
      startedAt: subscription.startedAt.toISOString(),
      renewsAt: subscription.renewsAt.toISOString(),
      metadata:
        subscription.metadata &&
        typeof subscription.metadata === 'object' &&
        !Array.isArray(subscription.metadata)
          ? subscription.metadata
          : null,
    };
  }
}
