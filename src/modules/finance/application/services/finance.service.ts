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
  CreateCustomerSubscriptionDto,
  CreateEarningsGoalDto,
  CreatePayoutRequestInputDto,
  CreateTipDto,
  CustomerSubscriptionDto,
  CustomerSubscriptionsResponseDto,
  EarningsGoalDto,
  FinanceSummaryResponseDto,
  FinanceTransactionDto,
  LoyaltyResponseDto,
  PauseCustomerSubscriptionDto,
  PayoutRequestDto,
  RedeemLoyaltyRewardDto,
  SelectVendorSubscriptionPlanDto,
  TipHistoryItemDto,
  TipHistoryResponseDto,
  UpdateFinancePayoutRulesDto,
  UpdatePayoutRequestStatusDto,
  VendorSubscriptionResponseDto,
} from '../dtos/finance.dto';

type FinanceRole = 'customer' | 'tasker' | 'vendor';
type PayoutMethod = 'mtn' | 'airtel' | 'bank';
type PayoutRules = {
  minWithdrawal: number;
  methods: Array<{
    id: PayoutMethod;
    minLength: number;
  }>;
};
const FINANCE_PAYOUT_RULES_SETTING_KEY = 'finance.payoutRules';

@Injectable()
export class FinanceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  private readonly defaultPayoutRulesByRole: Record<Exclude<FinanceRole, 'customer'>, PayoutRules> = {
    tasker: {
      minWithdrawal: 20,
      methods: [
        { id: 'mtn', minLength: 10 },
        { id: 'airtel', minLength: 10 },
      ],
    },
    vendor: {
      minWithdrawal: 20,
      methods: [
        { id: 'mtn', minLength: 10 },
        { id: 'airtel', minLength: 10 },
        { id: 'bank', minLength: 6 },
      ],
    },
  };

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

  private readonly customerSubscriptionPlans = [
    {
      code: 'fresh-weekly',
      vendorName: 'Fresh Farms Market',
      name: 'Weekly Fresh Box',
      description: 'Fresh vegetables and fruits delivered every week.',
      frequency: 'weekly' as const,
      price: 150,
      discountPercent: 15,
      deliveryDay: 'Monday',
      items: [
        { name: 'Tomatoes', quantity: 2 },
        { name: 'Onions', quantity: 1 },
        { name: 'Cabbage', quantity: 1 },
        { name: 'Seasonal Fruits', quantity: 1 },
      ],
    },
    {
      code: 'staples-monthly',
      vendorName: 'Zambia Foods',
      name: 'Monthly Staples Pack',
      description: 'Essential groceries delivered monthly.',
      frequency: 'monthly' as const,
      price: 550,
      discountPercent: 20,
      deliveryDay: '1st of month',
      items: [
        { name: 'Mealie Meal (25kg)', quantity: 1 },
        { name: 'Cooking Oil (5L)', quantity: 1 },
        { name: 'Rice (10kg)', quantity: 1 },
        { name: 'Sugar (2kg)', quantity: 1 },
      ],
    },
    {
      code: 'meals-biweekly',
      vendorName: 'Mama Kitchen',
      name: 'Biweekly Meal Prep',
      description: 'Ready-to-eat meals delivered every two weeks.',
      frequency: 'biweekly' as const,
      price: 280,
      discountPercent: 12,
      deliveryDay: 'Wednesday',
      items: [
        { name: 'Nshima Meals (10 packs)', quantity: 1 },
        { name: 'Relish Variety Pack', quantity: 1 },
        { name: 'Soup (5 containers)', quantity: 1 },
      ],
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

  private async getStoredPayoutRules(): Promise<
    Record<Exclude<FinanceRole, 'customer'>, PayoutRules> | null
  > {
    const setting = await (this.prisma as any).appSetting?.findUnique?.({
      where: { key: FINANCE_PAYOUT_RULES_SETTING_KEY },
    });

    if (!setting?.value || typeof setting.value !== 'object') {
      return null;
    }

    const value = setting.value as Record<string, unknown>;
    const candidate =
      value.tasker || value.vendor
        ? value
        : typeof value.rules === 'object' && value.rules
          ? (value.rules as Record<string, unknown>)
          : null;

    return candidate as Record<Exclude<FinanceRole, 'customer'>, PayoutRules> | null;
  }

  private normalizePayoutRules(
    raw: unknown,
    fallback: Record<Exclude<FinanceRole, 'customer'>, PayoutRules>,
  ): Record<Exclude<FinanceRole, 'customer'>, PayoutRules> {
    const input = raw && typeof raw === "object" ? (raw as Record<string, any>) : {};
    const roles: Array<Exclude<FinanceRole, 'customer'>> = ['tasker', 'vendor'];

    return roles.reduce((acc, role) => {
      const roleRaw = input[role] && typeof input[role] === 'object' ? input[role] : {};
      const fallbackRole = fallback[role];
      const methods = Array.isArray(roleRaw.methods)
        ? roleRaw.methods
            .filter((item: any) => item && typeof item.id === 'string')
            .map((item: any) => ({
              id: item.id as PayoutMethod,
              minLength: Math.max(1, Number(item.minLength ?? 0) || 0),
            }))
            .filter((item) => ['mtn', 'airtel', 'bank'].includes(item.id))
        : fallbackRole.methods;

      acc[role] = {
        minWithdrawal:
          Number(roleRaw.minWithdrawal ?? fallbackRole.minWithdrawal) ||
          fallbackRole.minWithdrawal,
        methods: methods.length ? methods : fallbackRole.methods,
      };
      return acc;
    }, {} as Record<Exclude<FinanceRole, 'customer'>, PayoutRules>);
  }

  async getAdminPayoutRules(): Promise<Record<Exclude<FinanceRole, 'customer'>, PayoutRules>> {
    const stored = await this.getStoredPayoutRules();
    return this.normalizePayoutRules(stored, this.defaultPayoutRulesByRole);
  }

  async updateAdminPayoutRules(
    adminUserId: string,
    payload: Record<Exclude<FinanceRole, 'customer'>, UpdateFinancePayoutRulesDto>,
  ): Promise<Record<Exclude<FinanceRole, 'customer'>, PayoutRules>> {
    const normalized = this.normalizePayoutRules(payload, this.defaultPayoutRulesByRole);
    await (this.prisma as any).appSetting.upsert({
      where: { key: FINANCE_PAYOUT_RULES_SETTING_KEY },
      update: {
        value: {
          rules: normalized,
          updatedBy: adminUserId,
          updatedAt: new Date().toISOString(),
        },
      },
      create: {
        key: FINANCE_PAYOUT_RULES_SETTING_KEY,
        value: {
          rules: normalized,
          updatedBy: adminUserId,
          updatedAt: new Date().toISOString(),
        },
      },
    });

    return normalized;
  }

  private async getPayoutRules(role: Exclude<FinanceRole, 'customer'>): Promise<PayoutRules> {
    const stored = await this.getStoredPayoutRules();
    const merged = this.normalizePayoutRules(stored, this.defaultPayoutRulesByRole);
    return merged[role];
  }

  private normalizePayoutTarget(value: unknown) {
    return typeof value === 'string' ? value.trim() : '';
  }

  private async validatePayoutDestinationAsync(
    role: Exclude<FinanceRole, 'customer'>,
    destination: Record<string, unknown>,
  ) {
    const rules = await this.getPayoutRules(role);
    const method = this.normalizePayoutTarget(destination.method) as PayoutMethod;
    const methodRule = rules.methods.find((item) => item.id === method);

    if (!methodRule) {
      throw new BadRequestException('Selected payout method is not supported for this account');
    }

    const accountNumber = this.normalizePayoutTarget(destination.accountNumber);
    if (!accountNumber) {
      throw new BadRequestException('Payout destination is required');
    }

    if (method === 'bank') {
      if (accountNumber.length < methodRule.minLength) {
        throw new BadRequestException('Bank account or reference is too short');
      }
      return { method, accountNumber };
    }

    const normalizedPhone = accountNumber.replace(/\D/g, '');
    if (normalizedPhone.length < methodRule.minLength) {
      throw new BadRequestException('Mobile money number is invalid');
    }

    return { method, accountNumber: normalizedPhone };
  }

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
          payoutRules: await this.getPayoutRules('tasker'),
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
        payoutRules: await this.getPayoutRules('vendor'),
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

  async getCustomerSubscriptions(
    userId: string,
  ): Promise<CustomerSubscriptionsResponseDto> {
    const subscriptions = await (this.prisma as any).customerSubscription.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return {
      availablePlans: this.customerSubscriptionPlans,
      subscriptions: subscriptions.map((subscription: any) =>
        this.toCustomerSubscriptionDto(subscription),
      ),
    };
  }

  async createCustomerSubscription(
    userId: string,
    input: CreateCustomerSubscriptionDto,
  ): Promise<CustomerSubscriptionDto> {
    const plan = this.customerSubscriptionPlans.find(
      (item) => item.code === String(input.planCode).trim().toLowerCase(),
    );

    if (!plan) {
      throw new NotFoundException('Subscription plan not found');
    }

    const startDate = input.startDate ? new Date(input.startDate) : new Date();
    if (Number.isNaN(startDate.getTime())) {
      throw new BadRequestException('Invalid subscription start date');
    }

    const subscription = await (this.prisma as any).customerSubscription.create({
      data: {
        userId,
        planCode: plan.code,
        vendorName: plan.vendorName,
        name: plan.name,
        description: plan.description,
        frequency: plan.frequency,
        price: plan.price,
        discountPercent: plan.discountPercent,
        deliveryAddress: input.deliveryAddress.trim(),
        items: plan.items,
        status: 'active',
        startDate,
        nextDeliveryDate: this.computeNextDeliveryDate(plan.frequency, startDate),
        metadata: {
          deliveryDay: plan.deliveryDay,
          source: 'customer_self_service',
        },
      },
    });

    await this.notificationsService.createNotification({
      userId,
      title: 'Subscription started',
      message: `${plan.name} is now active for ${plan.vendorName}.`,
      type: 'SYSTEM',
      metadata: {
        notificationType: 'customer_subscription_created',
        subscriptionId: subscription.id,
        planCode: plan.code,
      },
    });

    return this.toCustomerSubscriptionDto(subscription);
  }

  async pauseCustomerSubscription(
    userId: string,
    subscriptionId: string,
    input: PauseCustomerSubscriptionDto,
  ): Promise<CustomerSubscriptionDto> {
    const subscription = await this.getOwnedCustomerSubscription(userId, subscriptionId);
    const pauseUntil = new Date(input.pauseUntil);
    if (Number.isNaN(pauseUntil.getTime())) {
      throw new BadRequestException('Invalid pause date');
    }

    const updated = await (this.prisma as any).customerSubscription.update({
      where: { id: subscriptionId },
      data: {
        status: 'paused',
        pausedUntil: pauseUntil,
        metadata: {
          ...(this.toRecordMetadata(subscription.metadata) || {}),
          pausedAt: new Date().toISOString(),
        },
      },
    });

    return this.toCustomerSubscriptionDto(updated);
  }

  async resumeCustomerSubscription(
    userId: string,
    subscriptionId: string,
  ): Promise<CustomerSubscriptionDto> {
    const subscription = await this.getOwnedCustomerSubscription(userId, subscriptionId);
    const frequency = this.toSubscriptionFrequency(subscription.frequency);

    const updated = await (this.prisma as any).customerSubscription.update({
      where: { id: subscriptionId },
      data: {
        status: 'active',
        pausedUntil: null,
        nextDeliveryDate: this.computeNextDeliveryDate(frequency, new Date()),
        metadata: {
          ...(this.toRecordMetadata(subscription.metadata) || {}),
          resumedAt: new Date().toISOString(),
        },
      },
    });

    return this.toCustomerSubscriptionDto(updated);
  }

  async cancelCustomerSubscription(
    userId: string,
    subscriptionId: string,
  ): Promise<CustomerSubscriptionDto> {
    await this.getOwnedCustomerSubscription(userId, subscriptionId);

    const updated = await (this.prisma as any).customerSubscription.update({
      where: { id: subscriptionId },
      data: {
        status: 'cancelled',
        cancelledAt: new Date(),
      },
    });

    return this.toCustomerSubscriptionDto(updated);
  }

  async getTipHistory(userId: string): Promise<TipHistoryResponseDto> {
    const tips = await (this.prisma as any).customerTip.findMany({
      where: { userId },
      include: {
        order: {
          select: {
            trackingId: true,
            totalAmount: true,
          },
        },
        driver: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return {
      tips: tips.map((tip: any) => this.toTipHistoryItemDto(tip)),
    };
  }

  async createTip(userId: string, input: CreateTipDto): Promise<TipHistoryItemDto> {
    const amount = Number(input.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new BadRequestException('Tip amount must be greater than zero');
    }

    const { orderId, deliveryId, bookingId, driverId, orderTotal, metadata } =
      await this.resolveTipContext(userId, input.contextType, input.contextId);

    const existingTip = await (this.prisma as any).customerTip.findFirst({
      where: {
        userId,
        ...(orderId ? { orderId } : {}),
        ...(deliveryId ? { deliveryId } : {}),
        ...(bookingId ? { bookingId } : {}),
      },
    });

    if (existingTip) {
      throw new BadRequestException('A tip has already been added for this job');
    }

    const percentage =
      orderTotal && orderTotal > 0 ? Number(((amount / orderTotal) * 100).toFixed(2)) : 0;

    const tip = await (this.prisma as any).customerTip.create({
      data: {
        userId,
        orderId,
        deliveryId,
        bookingId,
        driverId,
        amount,
        currency: 'ZMW',
        orderTotal,
        percentage,
        metadata,
      },
      include: {
        order: {
          select: {
            trackingId: true,
            totalAmount: true,
          },
        },
        driver: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (driverId) {
      await this.notificationsService.createNotification({
        userId: driverId,
        title: 'You received a tip',
        message: `A customer added a tip of K${amount.toFixed(2)} for your service.`,
        type: 'SYSTEM',
        metadata: {
          notificationType: 'customer_tip_received',
          tipId: tip.id,
          amount,
          orderId: orderId || null,
          deliveryId: deliveryId || null,
          bookingId: bookingId || null,
        },
      });
    }

    return this.toTipHistoryItemDto(tip);
  }

  async getTaskerEarningsGoals(userId: string): Promise<EarningsGoalDto[]> {
    await this.assertRoleAccess(userId, 'tasker');
    const goals = await (this.prisma as any).earningsGoal.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return Promise.all(goals.map((goal: any) => this.toEarningsGoalDto(goal, userId)));
  }

  async createTaskerEarningsGoal(
    userId: string,
    dto: CreateEarningsGoalDto,
  ): Promise<EarningsGoalDto> {
    await this.assertRoleAccess(userId, 'tasker');
    const startDate = new Date();
    const endDate = this.computeEarningsGoalEndDate(dto.period, startDate);

    const goal = await (this.prisma as any).earningsGoal.create({
      data: {
        id: randomUUID(),
        userId,
        period: dto.period,
        targetAmount: dto.targetAmount,
        status: 'active',
        startDate,
        endDate,
      },
    });

    return this.toEarningsGoalDto(goal, userId);
  }

  async cancelTaskerEarningsGoal(userId: string, goalId: string): Promise<EarningsGoalDto> {
    await this.assertRoleAccess(userId, 'tasker');
    const goal = await (this.prisma as any).earningsGoal.findUnique({
      where: { id: goalId },
    });

    if (!goal || goal.userId !== userId) {
      throw new NotFoundException('Earnings goal not found');
    }

    const updated = await (this.prisma as any).earningsGoal.update({
      where: { id: goalId },
      data: {
        status:
          goal.status === 'achieved' || goal.status === 'missed'
            ? goal.status
            : 'cancelled',
      },
    });

    return this.toEarningsGoalDto(updated, userId);
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
    const payoutRules = await this.getPayoutRules(role);

    const summary = await this.getSummary(userId, role);
    if (summary.availableBalance <= 0) {
      throw new BadRequestException('No available balance for payout');
    }

    if (input.amount < payoutRules.minWithdrawal) {
      throw new BadRequestException(
        `Minimum withdrawal amount is K${payoutRules.minWithdrawal.toFixed(2)}`,
      );
    }

    if (input.amount > summary.availableBalance) {
      throw new BadRequestException('Requested amount exceeds available balance');
    }

    const destination = await this.validatePayoutDestinationAsync(role, input.destination);

    const request = await (this.prisma as any).payoutRequest.create({
      data: {
        id: randomUUID(),
        userId,
        role: role === 'tasker' ? ('TASKER' as any) : ('VENDOR' as any),
        amount: input.amount,
        currency: input.currency || 'ZMW',
        destination,
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

  private computeEarningsGoalEndDate(
    period: 'daily' | 'weekly' | 'monthly',
    startDate: Date,
  ) {
    const endDate = new Date(startDate);
    if (period === 'daily') {
      endDate.setDate(endDate.getDate() + 1);
    } else if (period === 'weekly') {
      endDate.setDate(endDate.getDate() + 7);
    } else {
      endDate.setMonth(endDate.getMonth() + 1);
    }
    return endDate;
  }

  private async toEarningsGoalDto(goal: any, userId: string): Promise<EarningsGoalDto> {
    const now = new Date();
    const currentAmount = await this.getTaskerEarningsForRange(
      userId,
      new Date(goal.startDate),
      new Date(goal.endDate),
    );

    let status = String(goal.status || 'active').toLowerCase();
    if (status === 'active' && currentAmount >= Number(goal.targetAmount ?? 0)) {
      status = 'achieved';
      await (this.prisma as any).earningsGoal.update({
        where: { id: goal.id },
        data: { status },
      });
    } else if (status === 'active' && new Date(goal.endDate) < now) {
      status = 'missed';
      await (this.prisma as any).earningsGoal.update({
        where: { id: goal.id },
        data: { status },
      });
    }

    return {
      id: goal.id,
      period: goal.period,
      targetAmount: Number(goal.targetAmount ?? 0),
      currentAmount,
      status: status as any,
      startDate: new Date(goal.startDate).toISOString(),
      endDate: new Date(goal.endDate).toISOString(),
      createdAt: new Date(goal.createdAt).toISOString(),
    };
  }

  private async getTaskerEarningsForRange(userId: string, startDate: Date, endDate: Date) {
    const shifts = await this.prisma.shift.findMany({
      where: {
        rider_user_id: userId,
        start_time: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        total_earnings: true,
      },
    });

    return shifts.reduce((sum, shift) => sum + Number(shift.total_earnings ?? 0), 0);
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

  private toCustomerSubscriptionDto(subscription: any): CustomerSubscriptionDto {
    const items = Array.isArray(subscription.items) ? subscription.items : [];
    return {
      id: subscription.id,
      planCode: subscription.planCode,
      plan: {
        code: subscription.planCode,
        vendorName: subscription.vendorName,
        name: subscription.name,
        description: subscription.description,
        frequency: this.toSubscriptionFrequency(subscription.frequency),
        price: Number(subscription.price ?? 0),
        discountPercent: Number(subscription.discountPercent ?? 0),
        deliveryDay:
          this.toRecordMetadata(subscription.metadata)?.deliveryDay || null,
        items,
      },
      status: String(subscription.status).toLowerCase(),
      startDate: subscription.startDate.toISOString(),
      nextDeliveryDate: subscription.nextDeliveryDate.toISOString(),
      lastDeliveryDate: subscription.lastDeliveryDate?.toISOString() || null,
      deliveryAddress: subscription.deliveryAddress,
      totalDeliveries: Number(subscription.totalDeliveries ?? 0),
      totalSaved: Number(subscription.totalSaved ?? 0),
      pausedUntil: subscription.pausedUntil?.toISOString() || null,
      cancelledAt: subscription.cancelledAt?.toISOString() || null,
    };
  }

  private toTipHistoryItemDto(tip: any): TipHistoryItemDto {
    return {
      id: tip.id,
      orderId: tip.order?.trackingId || tip.orderId || null,
      deliveryId: tip.deliveryId || null,
      bookingId: tip.bookingId || null,
      taskerName: tip.driver
        ? `${tip.driver.firstName || ''} ${tip.driver.lastName || ''}`.trim() || null
        : null,
      amount: Number(tip.amount ?? 0),
      currency: tip.currency || 'ZMW',
      percentage: Number(tip.percentage ?? 0),
      orderTotal: tip.orderTotal != null ? Number(tip.orderTotal) : Number(tip.order?.totalAmount ?? 0),
      date: tip.createdAt.toISOString(),
    };
  }

  private async getOwnedCustomerSubscription(userId: string, subscriptionId: string) {
    const subscription = await (this.prisma as any).customerSubscription.findFirst({
      where: { id: subscriptionId, userId },
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    return subscription;
  }

  private computeNextDeliveryDate(
    frequency: 'weekly' | 'biweekly' | 'monthly',
    startDate: Date,
  ) {
    const date = new Date(startDate);
    if (frequency === 'weekly') {
      date.setDate(date.getDate() + 7);
      return date;
    }
    if (frequency === 'biweekly') {
      date.setDate(date.getDate() + 14);
      return date;
    }
    date.setMonth(date.getMonth() + 1);
    return date;
  }

  private toSubscriptionFrequency(value: string): 'weekly' | 'biweekly' | 'monthly' {
    return value === 'biweekly' || value === 'monthly' ? value : 'weekly';
  }

  private toRecordMetadata(value: unknown): Record<string, any> | null {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      return value as Record<string, any>;
    }
    return null;
  }

  private async resolveTipContext(
    userId: string,
    contextType: 'order' | 'delivery' | 'booking',
    contextId: string,
  ) {
    if (contextType === 'order') {
      const order = await this.prisma.order.findFirst({
        where: { id: contextId, userId },
        select: {
          id: true,
          totalAmount: true,
        },
      });

      if (!order) {
        throw new NotFoundException('Order not found');
      }

      const deliveries = await (this.prisma as any).deliveryRecord.findMany({
        where: {
          created_by_user_id: userId,
        },
        select: {
          id: true,
          rider_id: true,
          more_info: true,
        },
      });

      const linkedDelivery = deliveries.find((item: any) => {
        try {
          const metadata = item.more_info ? JSON.parse(item.more_info) : {};
          return String(metadata?.marketplace_order_id || '') === String(contextId);
        } catch {
          return false;
        }
      });

      return {
        orderId: order.id,
        deliveryId: linkedDelivery?.id || null,
        bookingId: null,
        driverId: linkedDelivery?.rider_id || null,
        orderTotal: Number(order.totalAmount ?? 0),
        metadata: {
          contextType,
          contextId,
        },
      };
    }

    if (contextType === 'delivery') {
      const delivery = await (this.prisma as any).deliveryRecord.findFirst({
        where: { id: contextId, created_by_user_id: userId },
        select: {
          id: true,
          rider_id: true,
          payment_amount: true,
        },
      });

      if (!delivery) {
        throw new NotFoundException('Delivery not found');
      }

      return {
        orderId: null,
        deliveryId: delivery.id,
        bookingId: null,
        driverId: delivery.rider_id || null,
        orderTotal: Number(delivery.payment_amount ?? 0),
        metadata: {
          contextType,
          contextId,
        },
      };
    }

    const booking = await this.prisma.booking.findFirst({
      where: { booking_id: contextId, customer_user_id: userId },
      select: {
        booking_id: true,
        rider: true,
        metadata: true,
      },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    const bookingMetadata = this.toRecordMetadata(booking.metadata) || {};
    const rider = this.toRecordMetadata(booking.rider) || {};
    const estimatedTotal = Number(
      bookingMetadata.budgetMax ??
        bookingMetadata.budget?.max ??
        bookingMetadata.commitmentAmount ??
        0,
    );

    return {
      orderId: null,
      deliveryId: null,
      bookingId: booking.booking_id,
      driverId: rider.user_id || null,
      orderTotal: estimatedTotal,
      metadata: {
        contextType,
        contextId,
      },
    };
  }
}
