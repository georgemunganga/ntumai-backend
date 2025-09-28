import { Injectable } from '@nestjs/common';
import { Earnings } from '../entities/earnings.entity';
import { RiderOrder } from '../entities/rider-order.entity';
import { Shift } from '../entities/shift.entity';
import { Rider } from '../entities/rider.entity';
import { UniqueEntityID } from '../../../common/domain/unique-entity-id';
import { EarningsDetails } from '../value-objects/earnings-details.vo';
import { DomainEvents } from '../../../common/domain/domain-events';
import { EarningsCalculatedEvent } from '../events/earnings-calculated.event';
import { BonusEarnedEvent } from '../events/bonus-earned.event';
import { IncentiveEarnedEvent } from '../events/incentive-earned.event';

export interface OrderEarningsRequest {
  orderId: UniqueEntityID;
  riderId: UniqueEntityID;
  orderValue: number;
  distance: number;
  duration: number; // in minutes
  orderType: 'food' | 'grocery' | 'pharmacy' | 'package' | 'other';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
  dayOfWeek: 'weekday' | 'weekend';
  weatherCondition?: 'normal' | 'rain' | 'snow' | 'storm';
  customerTip?: number;
  completionTime: Date;
  pickupDelay?: number; // in minutes
  deliveryDelay?: number; // in minutes
}

export interface EarningsBreakdown {
  basePay: number;
  distancePay: number;
  timePay: number;
  priorityBonus: number;
  peakTimeBonus: number;
  weatherBonus: number;
  qualityBonus: number;
  speedBonus: number;
  customerTip: number;
  platformFee: number;
  serviceFee: number;
  totalEarnings: number;
  netEarnings: number;
}

export interface ShiftEarningsRequest {
  shiftId: UniqueEntityID;
  riderId: UniqueEntityID;
  orders: RiderOrder[];
  shiftDuration: number; // in hours
  shiftType: 'regular' | 'peak' | 'night' | 'weekend';
  guaranteedMinimum?: number;
  completedOrders: number;
  cancelledOrders: number;
  averageRating: number;
  totalDistance: number;
}

export interface ShiftEarningsBreakdown {
  orderEarnings: number;
  hourlyGuarantee: number;
  completionBonus: number;
  qualityBonus: number;
  consecutiveShiftBonus: number;
  milestoneBonus: number;
  penalties: number;
  adjustments: number;
  totalEarnings: number;
  guaranteedAmount: number;
  finalAmount: number;
}

export interface IncentiveRule {
  id: string;
  name: string;
  type: 'completion' | 'quality' | 'consecutive' | 'milestone' | 'referral' | 'peak';
  conditions: {
    minOrders?: number;
    minRating?: number;
    timeFrame?: 'daily' | 'weekly' | 'monthly';
    orderTypes?: string[];
    locations?: string[];
    consecutiveDays?: number;
  };
  reward: {
    type: 'fixed' | 'percentage' | 'per_order';
    amount: number;
    maxAmount?: number;
  };
  validFrom: Date;
  validTo: Date;
  isActive: boolean;
}

export interface BonusRule {
  id: string;
  name: string;
  type: 'peak_time' | 'weather' | 'distance' | 'speed' | 'quality' | 'priority';
  conditions: {
    timeSlots?: Array<{ start: string; end: string }>;
    weatherConditions?: string[];
    minDistance?: number;
    maxDeliveryTime?: number;
    minRating?: number;
    orderPriorities?: string[];
  };
  multiplier?: number;
  fixedAmount?: number;
  isActive: boolean;
}

export interface PenaltyRule {
  id: string;
  name: string;
  type: 'cancellation' | 'delay' | 'quality' | 'no_show' | 'violation';
  conditions: {
    maxCancellations?: number;
    maxDelayMinutes?: number;
    minRating?: number;
  };
  penalty: {
    type: 'fixed' | 'percentage';
    amount: number;
  };
  isActive: boolean;
}

export interface WeeklyEarningsSummary {
  riderId: UniqueEntityID;
  weekStart: Date;
  weekEnd: Date;
  totalOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  totalDistance: number;
  totalDuration: number;
  averageRating: number;
  grossEarnings: number;
  bonuses: number;
  incentives: number;
  penalties: number;
  fees: number;
  netEarnings: number;
  guaranteedAmount: number;
  finalAmount: number;
}

@Injectable()
export class EarningsCalculationService {
  private readonly BASE_PAY_RATE = 3.50; // Base pay per order
  private readonly DISTANCE_RATE = 0.60; // Per km
  private readonly TIME_RATE = 0.15; // Per minute
  private readonly PLATFORM_FEE_RATE = 0.15; // 15% platform fee
  private readonly SERVICE_FEE = 0.30; // Fixed service fee per order

  constructor() {}

  /**
   * Calculates earnings for a single order
   */
  async calculateOrderEarnings(
    request: OrderEarningsRequest,
    bonusRules: BonusRule[],
    incentiveRules: IncentiveRule[]
  ): Promise<EarningsBreakdown> {
    // Base calculations
    const basePay = this.BASE_PAY_RATE;
    const distancePay = request.distance * this.DISTANCE_RATE;
    const timePay = request.duration * this.TIME_RATE;

    // Bonus calculations
    const priorityBonus = this.calculatePriorityBonus(request.priority);
    const peakTimeBonus = this.calculatePeakTimeBonus(
      request.timeOfDay,
      request.dayOfWeek,
      bonusRules
    );
    const weatherBonus = this.calculateWeatherBonus(
      request.weatherCondition,
      bonusRules
    );
    const qualityBonus = this.calculateQualityBonus(
      request.pickupDelay,
      request.deliveryDelay
    );
    const speedBonus = this.calculateSpeedBonus(
      request.duration,
      request.distance
    );

    // Customer tip
    const customerTip = request.customerTip || 0;

    // Calculate gross earnings
    const grossEarnings = basePay + distancePay + timePay + 
                         priorityBonus + peakTimeBonus + weatherBonus + 
                         qualityBonus + speedBonus + customerTip;

    // Calculate fees
    const platformFee = grossEarnings * this.PLATFORM_FEE_RATE;
    const serviceFee = this.SERVICE_FEE;

    // Calculate net earnings
    const netEarnings = grossEarnings - platformFee - serviceFee;

    const breakdown: EarningsBreakdown = {
      basePay,
      distancePay,
      timePay,
      priorityBonus,
      peakTimeBonus,
      weatherBonus,
      qualityBonus,
      speedBonus,
      customerTip,
      platformFee,
      serviceFee,
      totalEarnings: grossEarnings,
      netEarnings
    };

    // Raise earnings calculated event
    DomainEvents.raise(new EarningsCalculatedEvent({
      orderId: request.orderId,
      riderId: request.riderId,
      breakdown,
      calculatedAt: new Date()
    }));

    return breakdown;
  }

  /**
   * Calculates earnings for an entire shift
   */
  async calculateShiftEarnings(
    request: ShiftEarningsRequest,
    orderEarnings: EarningsBreakdown[],
    incentiveRules: IncentiveRule[],
    penaltyRules: PenaltyRule[],
    riderHistory: {
      consecutiveShifts: number;
      weeklyOrders: number;
      monthlyOrders: number;
    }
  ): Promise<ShiftEarningsBreakdown> {
    // Sum up order earnings
    const orderEarningsTotal = orderEarnings.reduce(
      (sum, earnings) => sum + earnings.netEarnings, 0
    );

    // Calculate hourly guarantee
    const hourlyGuarantee = this.calculateHourlyGuarantee(
      request.shiftType,
      request.shiftDuration,
      request.guaranteedMinimum
    );

    // Calculate bonuses
    const completionBonus = this.calculateCompletionBonus(
      request.completedOrders,
      request.shiftType,
      incentiveRules
    );

    const qualityBonus = this.calculateShiftQualityBonus(
      request.averageRating,
      request.completedOrders,
      incentiveRules
    );

    const consecutiveShiftBonus = this.calculateConsecutiveShiftBonus(
      riderHistory.consecutiveShifts,
      incentiveRules
    );

    const milestoneBonus = this.calculateMilestoneBonus(
      riderHistory.weeklyOrders,
      riderHistory.monthlyOrders,
      incentiveRules
    );

    // Calculate penalties
    const penalties = this.calculateShiftPenalties(
      request.cancelledOrders,
      request.completedOrders,
      request.averageRating,
      penaltyRules
    );

    // Calculate total earnings
    const totalEarnings = orderEarningsTotal + completionBonus + 
                         qualityBonus + consecutiveShiftBonus + milestoneBonus;

    // Apply guarantee if applicable
    const guaranteedAmount = Math.max(totalEarnings, hourlyGuarantee);
    const finalAmount = guaranteedAmount - penalties;

    const breakdown: ShiftEarningsBreakdown = {
      orderEarnings: orderEarningsTotal,
      hourlyGuarantee,
      completionBonus,
      qualityBonus,
      consecutiveShiftBonus,
      milestoneBonus,
      penalties,
      adjustments: 0,
      totalEarnings,
      guaranteedAmount,
      finalAmount
    };

    return breakdown;
  }

  /**
   * Calculates weekly earnings summary
   */
  async calculateWeeklyEarnings(
    riderId: UniqueEntityID,
    weekStart: Date,
    weekEnd: Date,
    shifts: Shift[],
    orders: RiderOrder[],
    earnings: Earnings[]
  ): Promise<WeeklyEarningsSummary> {
    const completedOrders = orders.filter(o => o.getStatus() === 'completed').length;
    const cancelledOrders = orders.filter(o => o.getStatus() === 'cancelled').length;
    
    const totalDistance = shifts.reduce((sum, shift) => 
      sum + shift.getDistanceTraveled(), 0
    );
    
    const totalDuration = shifts.reduce((sum, shift) => 
      sum + shift.getDuration(), 0
    );

    const averageRating = orders.length > 0 ? 
      orders.reduce((sum, order) => sum + (order.getRating() || 0), 0) / orders.length : 0;

    const grossEarnings = earnings.reduce((sum, earning) => 
      sum + earning.getGrossAmount(), 0
    );

    const bonuses = earnings.reduce((sum, earning) => 
      sum + earning.getBonusAmount(), 0
    );

    const incentives = earnings.reduce((sum, earning) => 
      sum + earning.getIncentiveAmount(), 0
    );

    const penalties = earnings.reduce((sum, earning) => 
      sum + earning.getPenaltyAmount(), 0
    );

    const fees = earnings.reduce((sum, earning) => 
      sum + earning.getFeeAmount(), 0
    );

    const netEarnings = grossEarnings + bonuses + incentives - penalties - fees;

    // Calculate weekly guarantee if applicable
    const guaranteedAmount = this.calculateWeeklyGuarantee(
      completedOrders,
      totalDuration,
      averageRating
    );

    const finalAmount = Math.max(netEarnings, guaranteedAmount);

    return {
      riderId,
      weekStart,
      weekEnd,
      totalOrders: orders.length,
      completedOrders,
      cancelledOrders,
      totalDistance,
      totalDuration,
      averageRating,
      grossEarnings,
      bonuses,
      incentives,
      penalties,
      fees,
      netEarnings,
      guaranteedAmount,
      finalAmount
    };
  }

  /**
   * Calculates priority bonus based on order priority
   */
  private calculatePriorityBonus(priority: string): number {
    const bonuses = {
      low: 0,
      medium: 0.50,
      high: 1.00,
      urgent: 2.00
    };
    return bonuses[priority as keyof typeof bonuses] || 0;
  }

  /**
   * Calculates peak time bonus
   */
  private calculatePeakTimeBonus(
    timeOfDay: string,
    dayOfWeek: string,
    bonusRules: BonusRule[]
  ): number {
    const peakTimeRule = bonusRules.find(rule => 
      rule.type === 'peak_time' && rule.isActive
    );

    if (!peakTimeRule) return 0;

    const isPeakTime = (timeOfDay === 'morning' && dayOfWeek === 'weekday') ||
                      (timeOfDay === 'evening') ||
                      (dayOfWeek === 'weekend');

    return isPeakTime ? (peakTimeRule.fixedAmount || 1.50) : 0;
  }

  /**
   * Calculates weather bonus
   */
  private calculateWeatherBonus(
    weatherCondition: string | undefined,
    bonusRules: BonusRule[]
  ): number {
    if (!weatherCondition || weatherCondition === 'normal') return 0;

    const weatherRule = bonusRules.find(rule => 
      rule.type === 'weather' && 
      rule.isActive &&
      rule.conditions.weatherConditions?.includes(weatherCondition)
    );

    if (!weatherRule) return 0;

    const bonuses = {
      rain: 1.00,
      snow: 2.00,
      storm: 3.00
    };

    return weatherRule.fixedAmount || bonuses[weatherCondition as keyof typeof bonuses] || 0;
  }

  /**
   * Calculates quality bonus based on delivery performance
   */
  private calculateQualityBonus(
    pickupDelay?: number,
    deliveryDelay?: number
  ): number {
    const totalDelay = (pickupDelay || 0) + (deliveryDelay || 0);
    
    if (totalDelay === 0) return 1.00; // Perfect delivery
    if (totalDelay <= 5) return 0.50; // Minor delay
    if (totalDelay <= 10) return 0.25; // Moderate delay
    return 0; // Significant delay
  }

  /**
   * Calculates speed bonus
   */
  private calculateSpeedBonus(
    actualDuration: number,
    distance: number
  ): number {
    const expectedDuration = distance * 3; // 3 minutes per km expected
    const timeSaved = expectedDuration - actualDuration;
    
    if (timeSaved > 5) return 0.75;
    if (timeSaved > 2) return 0.50;
    if (timeSaved > 0) return 0.25;
    return 0;
  }

  /**
   * Calculates hourly guarantee
   */
  private calculateHourlyGuarantee(
    shiftType: string,
    duration: number,
    customGuarantee?: number
  ): number {
    if (customGuarantee) return customGuarantee;

    const hourlyRates = {
      regular: 12.00,
      peak: 15.00,
      night: 14.00,
      weekend: 13.00
    };

    const rate = hourlyRates[shiftType as keyof typeof hourlyRates] || 12.00;
    return rate * duration;
  }

  /**
   * Calculates completion bonus
   */
  private calculateCompletionBonus(
    completedOrders: number,
    shiftType: string,
    incentiveRules: IncentiveRule[]
  ): number {
    const completionRule = incentiveRules.find(rule => 
      rule.type === 'completion' && 
      rule.isActive &&
      completedOrders >= (rule.conditions.minOrders || 0)
    );

    if (!completionRule) return 0;

    if (completionRule.reward.type === 'fixed') {
      return completionRule.reward.amount;
    }

    if (completionRule.reward.type === 'per_order') {
      return completionRule.reward.amount * completedOrders;
    }

    return 0;
  }

  /**
   * Calculates shift quality bonus
   */
  private calculateShiftQualityBonus(
    averageRating: number,
    completedOrders: number,
    incentiveRules: IncentiveRule[]
  ): number {
    const qualityRule = incentiveRules.find(rule => 
      rule.type === 'quality' && 
      rule.isActive &&
      averageRating >= (rule.conditions.minRating || 0) &&
      completedOrders >= (rule.conditions.minOrders || 0)
    );

    if (!qualityRule) return 0;

    return qualityRule.reward.amount;
  }

  /**
   * Calculates consecutive shift bonus
   */
  private calculateConsecutiveShiftBonus(
    consecutiveShifts: number,
    incentiveRules: IncentiveRule[]
  ): number {
    const consecutiveRule = incentiveRules.find(rule => 
      rule.type === 'consecutive' && 
      rule.isActive &&
      consecutiveShifts >= (rule.conditions.consecutiveDays || 0)
    );

    if (!consecutiveRule) return 0;

    return consecutiveRule.reward.amount;
  }

  /**
   * Calculates milestone bonus
   */
  private calculateMilestoneBonus(
    weeklyOrders: number,
    monthlyOrders: number,
    incentiveRules: IncentiveRule[]
  ): number {
    const milestoneRule = incentiveRules.find(rule => 
      rule.type === 'milestone' && 
      rule.isActive &&
      (
        (rule.conditions.timeFrame === 'weekly' && weeklyOrders >= (rule.conditions.minOrders || 0)) ||
        (rule.conditions.timeFrame === 'monthly' && monthlyOrders >= (rule.conditions.minOrders || 0))
      )
    );

    if (!milestoneRule) return 0;

    return milestoneRule.reward.amount;
  }

  /**
   * Calculates shift penalties
   */
  private calculateShiftPenalties(
    cancelledOrders: number,
    completedOrders: number,
    averageRating: number,
    penaltyRules: PenaltyRule[]
  ): number {
    let totalPenalties = 0;

    // Cancellation penalty
    const cancellationRule = penaltyRules.find(rule => 
      rule.type === 'cancellation' && rule.isActive
    );

    if (cancellationRule && cancelledOrders > (cancellationRule.conditions.maxCancellations || 0)) {
      const excessCancellations = cancelledOrders - (cancellationRule.conditions.maxCancellations || 0);
      totalPenalties += excessCancellations * cancellationRule.penalty.amount;
    }

    // Quality penalty
    const qualityRule = penaltyRules.find(rule => 
      rule.type === 'quality' && rule.isActive
    );

    if (qualityRule && averageRating < (qualityRule.conditions.minRating || 0)) {
      totalPenalties += qualityRule.penalty.amount;
    }

    return totalPenalties;
  }

  /**
   * Calculates weekly guarantee
   */
  private calculateWeeklyGuarantee(
    completedOrders: number,
    totalHours: number,
    averageRating: number
  ): number {
    // Weekly guarantee only applies if rider meets minimum requirements
    if (completedOrders < 20 || totalHours < 25 || averageRating < 4.0) {
      return 0;
    }

    return 400; // $400 weekly guarantee
  }
}