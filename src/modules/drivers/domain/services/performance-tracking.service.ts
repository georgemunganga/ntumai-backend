import { Injectable } from '@nestjs/common';
import { Performance } from '../entities/performance.entity';
import { RiderOrder } from '../entities/rider-order.entity';
import { Shift } from '../entities/shift.entity';
import { Rider } from '../entities/rider.entity';
import { UniqueEntityID } from '../../../common/domain/unique-entity-id';
import { PerformanceMetrics } from '../value-objects/performance-metrics.vo';
import { DomainEvents } from '../../../common/domain/domain-events';
import { PerformanceUpdatedEvent } from '../events/performance-updated.event';
import { MilestoneAchievedEvent } from '../events/milestone-achieved.event';
import { PerformanceAlertEvent } from '../events/performance-alert.event';

export interface PerformanceCalculationRequest {
  riderId: UniqueEntityID;
  timeFrame: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  startDate: Date;
  endDate: Date;
  orders: RiderOrder[];
  shifts: Shift[];
}

export interface PerformanceMetricsResult {
  riderId: UniqueEntityID;
  timeFrame: string;
  period: { start: Date; end: Date };
  orderMetrics: OrderPerformanceMetrics;
  deliveryMetrics: DeliveryPerformanceMetrics;
  qualityMetrics: QualityPerformanceMetrics;
  efficiencyMetrics: EfficiencyPerformanceMetrics;
  reliabilityMetrics: ReliabilityPerformanceMetrics;
  customerMetrics: CustomerPerformanceMetrics;
  overallScore: number;
  ranking: PerformanceRanking;
  trends: PerformanceTrends;
  alerts: PerformanceAlert[];
}

export interface OrderPerformanceMetrics {
  totalOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  acceptedOrders: number;
  rejectedOrders: number;
  completionRate: number;
  acceptanceRate: number;
  cancellationRate: number;
  averageOrderValue: number;
  ordersPerHour: number;
  ordersPerShift: number;
}

export interface DeliveryPerformanceMetrics {
  totalDeliveries: number;
  onTimeDeliveries: number;
  lateDeliveries: number;
  earlyDeliveries: number;
  onTimeRate: number;
  averageDeliveryTime: number;
  averagePickupTime: number;
  averageDeliveryDistance: number;
  totalDistanceTraveled: number;
  averageSpeed: number;
  fastestDelivery: number;
  slowestDelivery: number;
}

export interface QualityPerformanceMetrics {
  averageRating: number;
  totalRatings: number;
  fiveStarRatings: number;
  fourStarRatings: number;
  threeStarRatings: number;
  twoStarRatings: number;
  oneStarRatings: number;
  ratingDistribution: { [key: number]: number };
  customerComplaints: number;
  customerCompliments: number;
  qualityScore: number;
}

export interface EfficiencyPerformanceMetrics {
  totalActiveTime: number;
  totalIdleTime: number;
  utilizationRate: number;
  averageOrdersPerHour: number;
  peakHourPerformance: number;
  offPeakPerformance: number;
  multiOrderEfficiency: number;
  routeOptimizationScore: number;
  fuelEfficiency: number;
}

export interface ReliabilityMetrics {
  attendanceRate: number;
  punctualityScore: number;
  shiftCompletionRate: number;
  noShowCount: number;
  lateStartCount: number;
  earlyEndCount: number;
  consistencyScore: number;
  reliabilityTrend: 'improving' | 'stable' | 'declining';
}

export interface CustomerPerformanceMetrics {
  customerRetentionRate: number;
  repeatCustomers: number;
  customerSatisfactionScore: number;
  positiveReviews: number;
  negativeReviews: number;
  neutralReviews: number;
  customerTips: {
    total: number;
    average: number;
    percentage: number;
  };
  communicationScore: number;
}

export interface PerformanceRanking {
  overallRank: number;
  totalRiders: number;
  percentile: number;
  categoryRankings: {
    delivery: number;
    quality: number;
    efficiency: number;
    reliability: number;
    customer: number;
  };
  regionRank?: number;
  cityRank?: number;
}

export interface PerformanceTrends {
  overallTrend: 'improving' | 'stable' | 'declining';
  trendPercentage: number;
  categoryTrends: {
    orders: 'up' | 'down' | 'stable';
    delivery: 'up' | 'down' | 'stable';
    quality: 'up' | 'down' | 'stable';
    efficiency: 'up' | 'down' | 'stable';
    reliability: 'up' | 'down' | 'stable';
  };
  weekOverWeekChange: number;
  monthOverMonthChange: number;
}

export interface PerformanceAlert {
  id: string;
  type: 'warning' | 'critical' | 'improvement' | 'milestone';
  category: 'delivery' | 'quality' | 'efficiency' | 'reliability' | 'customer';
  message: string;
  metric: string;
  currentValue: number;
  threshold: number;
  severity: 'low' | 'medium' | 'high';
  actionRequired: boolean;
  suggestions: string[];
  createdAt: Date;
}

export interface PerformanceMilestone {
  id: string;
  name: string;
  description: string;
  category: 'orders' | 'rating' | 'earnings' | 'efficiency' | 'reliability';
  criteria: {
    metric: string;
    operator: '>=' | '<=' | '=' | '>' | '<';
    value: number;
    timeFrame?: string;
  };
  reward?: {
    type: 'badge' | 'bonus' | 'recognition';
    value: string | number;
  };
  isActive: boolean;
}

export interface PerformanceGoal {
  id: string;
  riderId: UniqueEntityID;
  category: 'delivery' | 'quality' | 'efficiency' | 'earnings';
  metric: string;
  targetValue: number;
  currentValue: number;
  progress: number;
  deadline: Date;
  status: 'active' | 'achieved' | 'missed' | 'paused';
  createdAt: Date;
}

export interface PerformanceBenchmark {
  metric: string;
  category: 'delivery' | 'quality' | 'efficiency' | 'reliability';
  benchmarks: {
    excellent: number;
    good: number;
    average: number;
    belowAverage: number;
    poor: number;
  };
  unit: string;
  description: string;
}

@Injectable()
export class PerformanceTrackingService {
  private readonly PERFORMANCE_BENCHMARKS: PerformanceBenchmark[] = [
    {
      metric: 'completionRate',
      category: 'delivery',
      benchmarks: { excellent: 98, good: 95, average: 90, belowAverage: 85, poor: 80 },
      unit: '%',
      description: 'Percentage of accepted orders completed successfully'
    },
    {
      metric: 'onTimeRate',
      category: 'delivery',
      benchmarks: { excellent: 95, good: 90, average: 85, belowAverage: 80, poor: 75 },
      unit: '%',
      description: 'Percentage of deliveries completed on time'
    },
    {
      metric: 'averageRating',
      category: 'quality',
      benchmarks: { excellent: 4.8, good: 4.5, average: 4.2, belowAverage: 4.0, poor: 3.8 },
      unit: 'stars',
      description: 'Average customer rating'
    },
    {
      metric: 'utilizationRate',
      category: 'efficiency',
      benchmarks: { excellent: 85, good: 75, average: 65, belowAverage: 55, poor: 45 },
      unit: '%',
      description: 'Percentage of active time spent on deliveries'
    },
    {
      metric: 'attendanceRate',
      category: 'reliability',
      benchmarks: { excellent: 98, good: 95, average: 90, belowAverage: 85, poor: 80 },
      unit: '%',
      description: 'Percentage of scheduled shifts attended'
    }
  ];

  constructor() {}

  /**
   * Calculates comprehensive performance metrics for a rider
   */
  async calculatePerformanceMetrics(
    request: PerformanceCalculationRequest
  ): Promise<PerformanceMetricsResult> {
    const { riderId, timeFrame, startDate, endDate, orders, shifts } = request;

    // Calculate individual metric categories
    const orderMetrics = this.calculateOrderMetrics(orders);
    const deliveryMetrics = this.calculateDeliveryMetrics(orders);
    const qualityMetrics = this.calculateQualityMetrics(orders);
    const efficiencyMetrics = this.calculateEfficiencyMetrics(orders, shifts);
    const reliabilityMetrics = this.calculateReliabilityMetrics(shifts);
    const customerMetrics = this.calculateCustomerMetrics(orders);

    // Calculate overall performance score
    const overallScore = this.calculateOverallScore({
      orderMetrics,
      deliveryMetrics,
      qualityMetrics,
      efficiencyMetrics,
      reliabilityMetrics,
      customerMetrics
    });

    // Generate performance ranking (would need additional data in real implementation)
    const ranking = await this.calculatePerformanceRanking(riderId, overallScore);

    // Calculate trends (would need historical data in real implementation)
    const trends = await this.calculatePerformanceTrends(riderId, timeFrame);

    // Generate performance alerts
    const alerts = this.generatePerformanceAlerts({
      orderMetrics,
      deliveryMetrics,
      qualityMetrics,
      efficiencyMetrics,
      reliabilityMetrics,
      customerMetrics
    });

    const result: PerformanceMetricsResult = {
      riderId,
      timeFrame,
      period: { start: startDate, end: endDate },
      orderMetrics,
      deliveryMetrics,
      qualityMetrics,
      efficiencyMetrics,
      reliabilityMetrics,
      customerMetrics,
      overallScore,
      ranking,
      trends,
      alerts
    };

    // Raise performance updated event
    DomainEvents.raise(new PerformanceUpdatedEvent({
      riderId,
      metrics: result,
      calculatedAt: new Date()
    }));

    // Check for milestone achievements
    await this.checkMilestoneAchievements(riderId, result);

    return result;
  }

  /**
   * Calculates order-related performance metrics
   */
  private calculateOrderMetrics(orders: RiderOrder[]): OrderPerformanceMetrics {
    const totalOrders = orders.length;
    const completedOrders = orders.filter(o => o.getStatus() === 'completed').length;
    const cancelledOrders = orders.filter(o => o.getStatus() === 'cancelled').length;
    const acceptedOrders = orders.filter(o => o.getStatus() !== 'rejected').length;
    const rejectedOrders = totalOrders - acceptedOrders;

    const completionRate = totalOrders > 0 ? (completedOrders / totalOrders) * 100 : 0;
    const acceptanceRate = totalOrders > 0 ? (acceptedOrders / totalOrders) * 100 : 0;
    const cancellationRate = totalOrders > 0 ? (cancelledOrders / totalOrders) * 100 : 0;

    const totalOrderValue = orders.reduce((sum, order) => sum + order.getTotalAmount(), 0);
    const averageOrderValue = totalOrders > 0 ? totalOrderValue / totalOrders : 0;

    // Calculate orders per hour and per shift (simplified)
    const ordersPerHour = 0; // Would need shift duration data
    const ordersPerShift = 0; // Would need shift count data

    return {
      totalOrders,
      completedOrders,
      cancelledOrders,
      acceptedOrders,
      rejectedOrders,
      completionRate,
      acceptanceRate,
      cancellationRate,
      averageOrderValue,
      ordersPerHour,
      ordersPerShift
    };
  }

  /**
   * Calculates delivery-related performance metrics
   */
  private calculateDeliveryMetrics(orders: RiderOrder[]): DeliveryPerformanceMetrics {
    const completedOrders = orders.filter(o => o.getStatus() === 'completed');
    const totalDeliveries = completedOrders.length;

    if (totalDeliveries === 0) {
      return {
        totalDeliveries: 0,
        onTimeDeliveries: 0,
        lateDeliveries: 0,
        earlyDeliveries: 0,
        onTimeRate: 0,
        averageDeliveryTime: 0,
        averagePickupTime: 0,
        averageDeliveryDistance: 0,
        totalDistanceTraveled: 0,
        averageSpeed: 0,
        fastestDelivery: 0,
        slowestDelivery: 0
      };
    }

    // Calculate delivery timing metrics
    let onTimeDeliveries = 0;
    let lateDeliveries = 0;
    let earlyDeliveries = 0;
    let totalDeliveryTime = 0;
    let totalPickupTime = 0;
    let totalDistance = 0;
    let deliveryTimes: number[] = [];

    completedOrders.forEach(order => {
      const deliveryTime = order.getDeliveryDuration() || 0;
      const estimatedTime = order.getEstimatedDeliveryTime() || 0;
      const pickupTime = order.getPickupDuration() || 0;
      const distance = order.getDistance() || 0;

      deliveryTimes.push(deliveryTime);
      totalDeliveryTime += deliveryTime;
      totalPickupTime += pickupTime;
      totalDistance += distance;

      if (deliveryTime <= estimatedTime) {
        if (deliveryTime < estimatedTime * 0.8) {
          earlyDeliveries++;
        } else {
          onTimeDeliveries++;
        }
      } else {
        lateDeliveries++;
      }
    });

    const onTimeRate = (onTimeDeliveries / totalDeliveries) * 100;
    const averageDeliveryTime = totalDeliveryTime / totalDeliveries;
    const averagePickupTime = totalPickupTime / totalDeliveries;
    const averageDeliveryDistance = totalDistance / totalDeliveries;
    const averageSpeed = averageDeliveryDistance > 0 ? averageDeliveryDistance / (averageDeliveryTime / 60) : 0;
    const fastestDelivery = Math.min(...deliveryTimes);
    const slowestDelivery = Math.max(...deliveryTimes);

    return {
      totalDeliveries,
      onTimeDeliveries,
      lateDeliveries,
      earlyDeliveries,
      onTimeRate,
      averageDeliveryTime,
      averagePickupTime,
      averageDeliveryDistance,
      totalDistanceTraveled: totalDistance,
      averageSpeed,
      fastestDelivery,
      slowestDelivery
    };
  }

  /**
   * Calculates quality-related performance metrics
   */
  private calculateQualityMetrics(orders: RiderOrder[]): QualityPerformanceMetrics {
    const ratedOrders = orders.filter(o => o.getRating() !== null && o.getRating() !== undefined);
    const totalRatings = ratedOrders.length;

    if (totalRatings === 0) {
      return {
        averageRating: 0,
        totalRatings: 0,
        fiveStarRatings: 0,
        fourStarRatings: 0,
        threeStarRatings: 0,
        twoStarRatings: 0,
        oneStarRatings: 0,
        ratingDistribution: {},
        customerComplaints: 0,
        customerCompliments: 0,
        qualityScore: 0
      };
    }

    const ratings = ratedOrders.map(o => o.getRating()!);
    const totalRatingSum = ratings.reduce((sum, rating) => sum + rating, 0);
    const averageRating = totalRatingSum / totalRatings;

    // Count ratings by star level
    const ratingCounts = {
      5: ratings.filter(r => r === 5).length,
      4: ratings.filter(r => r === 4).length,
      3: ratings.filter(r => r === 3).length,
      2: ratings.filter(r => r === 2).length,
      1: ratings.filter(r => r === 1).length
    };

    // Calculate quality score (weighted average favoring higher ratings)
    const qualityScore = (
      (ratingCounts[5] * 5 + ratingCounts[4] * 4 + ratingCounts[3] * 3 + 
       ratingCounts[2] * 2 + ratingCounts[1] * 1) / totalRatings
    ) * 20; // Convert to 0-100 scale

    // Count complaints and compliments (simplified - would need review data)
    const customerComplaints = ratings.filter(r => r <= 2).length;
    const customerCompliments = ratings.filter(r => r >= 4).length;

    return {
      averageRating,
      totalRatings,
      fiveStarRatings: ratingCounts[5],
      fourStarRatings: ratingCounts[4],
      threeStarRatings: ratingCounts[3],
      twoStarRatings: ratingCounts[2],
      oneStarRatings: ratingCounts[1],
      ratingDistribution: ratingCounts,
      customerComplaints,
      customerCompliments,
      qualityScore
    };
  }

  /**
   * Calculates efficiency-related performance metrics
   */
  private calculateEfficiencyMetrics(
    orders: RiderOrder[],
    shifts: Shift[]
  ): EfficiencyPerformanceMetrics {
    const totalShifts = shifts.length;
    
    if (totalShifts === 0) {
      return {
        totalActiveTime: 0,
        totalIdleTime: 0,
        utilizationRate: 0,
        averageOrdersPerHour: 0,
        peakHourPerformance: 0,
        offPeakPerformance: 0,
        multiOrderEfficiency: 0,
        routeOptimizationScore: 0,
        fuelEfficiency: 0
      };
    }

    const totalActiveTime = shifts.reduce((sum, shift) => sum + shift.getDuration(), 0);
    const totalIdleTime = shifts.reduce((sum, shift) => sum + shift.getIdleTime(), 0);
    const utilizationRate = totalActiveTime > 0 ? 
      ((totalActiveTime - totalIdleTime) / totalActiveTime) * 100 : 0;

    const completedOrders = orders.filter(o => o.getStatus() === 'completed').length;
    const averageOrdersPerHour = totalActiveTime > 0 ? 
      completedOrders / (totalActiveTime / 60) : 0;

    // Simplified calculations for other metrics
    const peakHourPerformance = 85; // Would need time-based analysis
    const offPeakPerformance = 75;
    const multiOrderEfficiency = 80; // Would need batch order analysis
    const routeOptimizationScore = 78; // Would need route analysis
    const fuelEfficiency = 82; // Would need fuel consumption data

    return {
      totalActiveTime,
      totalIdleTime,
      utilizationRate,
      averageOrdersPerHour,
      peakHourPerformance,
      offPeakPerformance,
      multiOrderEfficiency,
      routeOptimizationScore,
      fuelEfficiency
    };
  }

  /**
   * Calculates reliability-related performance metrics
   */
  private calculateReliabilityMetrics(shifts: Shift[]): ReliabilityMetrics {
    const totalShifts = shifts.length;
    
    if (totalShifts === 0) {
      return {
        attendanceRate: 0,
        punctualityScore: 0,
        shiftCompletionRate: 0,
        noShowCount: 0,
        lateStartCount: 0,
        earlyEndCount: 0,
        consistencyScore: 0,
        reliabilityTrend: 'stable'
      };
    }

    const completedShifts = shifts.filter(s => s.getStatus() === 'completed').length;
    const noShowCount = shifts.filter(s => s.getStatus() === 'no_show').length;
    const lateStartCount = shifts.filter(s => s.isLateStart()).length;
    const earlyEndCount = shifts.filter(s => s.isEarlyEnd()).length;

    const attendanceRate = ((totalShifts - noShowCount) / totalShifts) * 100;
    const shiftCompletionRate = (completedShifts / totalShifts) * 100;
    const punctualityScore = ((totalShifts - lateStartCount - earlyEndCount) / totalShifts) * 100;
    
    // Calculate consistency score based on various factors
    const consistencyScore = (attendanceRate + shiftCompletionRate + punctualityScore) / 3;
    
    // Determine reliability trend (simplified)
    const reliabilityTrend: 'improving' | 'stable' | 'declining' = 
      consistencyScore >= 90 ? 'improving' : 
      consistencyScore >= 75 ? 'stable' : 'declining';

    return {
      attendanceRate,
      punctualityScore,
      shiftCompletionRate,
      noShowCount,
      lateStartCount,
      earlyEndCount,
      consistencyScore,
      reliabilityTrend
    };
  }

  /**
   * Calculates customer-related performance metrics
   */
  private calculateCustomerMetrics(orders: RiderOrder[]): CustomerPerformanceMetrics {
    const completedOrders = orders.filter(o => o.getStatus() === 'completed');
    const totalCustomers = new Set(completedOrders.map(o => o.getCustomerId().toString())).size;
    
    // Calculate customer tips
    const ordersWithTips = completedOrders.filter(o => (o.getTipAmount() || 0) > 0);
    const totalTips = completedOrders.reduce((sum, o) => sum + (o.getTipAmount() || 0), 0);
    const averageTip = ordersWithTips.length > 0 ? totalTips / ordersWithTips.length : 0;
    const tipPercentage = completedOrders.length > 0 ? 
      (ordersWithTips.length / completedOrders.length) * 100 : 0;

    // Calculate review metrics (simplified)
    const ratedOrders = completedOrders.filter(o => o.getRating() !== null);
    const positiveReviews = ratedOrders.filter(o => o.getRating()! >= 4).length;
    const negativeReviews = ratedOrders.filter(o => o.getRating()! <= 2).length;
    const neutralReviews = ratedOrders.length - positiveReviews - negativeReviews;

    const customerSatisfactionScore = ratedOrders.length > 0 ? 
      (positiveReviews / ratedOrders.length) * 100 : 0;

    // Simplified metrics
    const customerRetentionRate = 75; // Would need repeat customer analysis
    const repeatCustomers = Math.floor(totalCustomers * 0.3); // Estimated
    const communicationScore = 85; // Would need communication data

    return {
      customerRetentionRate,
      repeatCustomers,
      customerSatisfactionScore,
      positiveReviews,
      negativeReviews,
      neutralReviews,
      customerTips: {
        total: totalTips,
        average: averageTip,
        percentage: tipPercentage
      },
      communicationScore
    };
  }

  /**
   * Calculates overall performance score
   */
  private calculateOverallScore(metrics: {
    orderMetrics: OrderPerformanceMetrics;
    deliveryMetrics: DeliveryPerformanceMetrics;
    qualityMetrics: QualityPerformanceMetrics;
    efficiencyMetrics: EfficiencyPerformanceMetrics;
    reliabilityMetrics: ReliabilityMetrics;
    customerMetrics: CustomerPerformanceMetrics;
  }): number {
    const weights = {
      delivery: 0.25,
      quality: 0.25,
      efficiency: 0.20,
      reliability: 0.15,
      customer: 0.15
    };

    const deliveryScore = (metrics.orderMetrics.completionRate + metrics.deliveryMetrics.onTimeRate) / 2;
    const qualityScore = metrics.qualityMetrics.qualityScore;
    const efficiencyScore = metrics.efficiencyMetrics.utilizationRate;
    const reliabilityScore = metrics.reliabilityMetrics.consistencyScore;
    const customerScore = metrics.customerMetrics.customerSatisfactionScore;

    const overallScore = 
      (deliveryScore * weights.delivery) +
      (qualityScore * weights.quality) +
      (efficiencyScore * weights.efficiency) +
      (reliabilityScore * weights.reliability) +
      (customerScore * weights.customer);

    return Math.round(overallScore * 100) / 100;
  }

  /**
   * Calculates performance ranking (simplified)
   */
  private async calculatePerformanceRanking(
    riderId: UniqueEntityID,
    overallScore: number
  ): Promise<PerformanceRanking> {
    // In a real implementation, this would query the database for all riders
    // and calculate actual rankings
    return {
      overallRank: Math.floor(Math.random() * 100) + 1,
      totalRiders: 500,
      percentile: Math.round((overallScore / 100) * 100),
      categoryRankings: {
        delivery: Math.floor(Math.random() * 100) + 1,
        quality: Math.floor(Math.random() * 100) + 1,
        efficiency: Math.floor(Math.random() * 100) + 1,
        reliability: Math.floor(Math.random() * 100) + 1,
        customer: Math.floor(Math.random() * 100) + 1
      }
    };
  }

  /**
   * Calculates performance trends (simplified)
   */
  private async calculatePerformanceTrends(
    riderId: UniqueEntityID,
    timeFrame: string
  ): Promise<PerformanceTrends> {
    // In a real implementation, this would analyze historical data
    return {
      overallTrend: 'improving',
      trendPercentage: 5.2,
      categoryTrends: {
        orders: 'up',
        delivery: 'up',
        quality: 'stable',
        efficiency: 'up',
        reliability: 'stable'
      },
      weekOverWeekChange: 3.1,
      monthOverMonthChange: 8.7
    };
  }

  /**
   * Generates performance alerts based on metrics
   */
  private generatePerformanceAlerts(metrics: {
    orderMetrics: OrderPerformanceMetrics;
    deliveryMetrics: DeliveryPerformanceMetrics;
    qualityMetrics: QualityPerformanceMetrics;
    efficiencyMetrics: EfficiencyPerformanceMetrics;
    reliabilityMetrics: ReliabilityMetrics;
    customerMetrics: CustomerPerformanceMetrics;
  }): PerformanceAlert[] {
    const alerts: PerformanceAlert[] = [];

    // Check completion rate
    if (metrics.orderMetrics.completionRate < 85) {
      alerts.push({
        id: 'completion-rate-low',
        type: 'warning',
        category: 'delivery',
        message: 'Order completion rate is below target',
        metric: 'completionRate',
        currentValue: metrics.orderMetrics.completionRate,
        threshold: 85,
        severity: 'medium',
        actionRequired: true,
        suggestions: [
          'Review order acceptance criteria',
          'Improve time management during deliveries',
          'Contact support for assistance'
        ],
        createdAt: new Date()
      });
    }

    // Check average rating
    if (metrics.qualityMetrics.averageRating < 4.0) {
      alerts.push({
        id: 'rating-low',
        type: 'critical',
        category: 'quality',
        message: 'Customer rating is below acceptable level',
        metric: 'averageRating',
        currentValue: metrics.qualityMetrics.averageRating,
        threshold: 4.0,
        severity: 'high',
        actionRequired: true,
        suggestions: [
          'Focus on customer service excellence',
          'Ensure timely and careful deliveries',
          'Communicate proactively with customers'
        ],
        createdAt: new Date()
      });
    }

    // Check on-time rate
    if (metrics.deliveryMetrics.onTimeRate < 80) {
      alerts.push({
        id: 'ontime-rate-low',
        type: 'warning',
        category: 'delivery',
        message: 'On-time delivery rate needs improvement',
        metric: 'onTimeRate',
        currentValue: metrics.deliveryMetrics.onTimeRate,
        threshold: 80,
        severity: 'medium',
        actionRequired: true,
        suggestions: [
          'Plan routes more efficiently',
          'Allow extra time for deliveries',
          'Use navigation apps for optimal routes'
        ],
        createdAt: new Date()
      });
    }

    return alerts;
  }

  /**
   * Checks for milestone achievements
   */
  private async checkMilestoneAchievements(
    riderId: UniqueEntityID,
    metrics: PerformanceMetricsResult
  ): Promise<void> {
    const milestones: PerformanceMilestone[] = [
      {
        id: 'first-100-orders',
        name: '100 Orders Milestone',
        description: 'Complete your first 100 orders',
        category: 'orders',
        criteria: { metric: 'totalOrders', operator: '>=', value: 100 },
        reward: { type: 'badge', value: 'Century Rider' },
        isActive: true
      },
      {
        id: 'five-star-rating',
        name: 'Five Star Excellence',
        description: 'Maintain a 4.8+ average rating',
        category: 'rating',
        criteria: { metric: 'averageRating', operator: '>=', value: 4.8 },
        reward: { type: 'badge', value: 'Quality Champion' },
        isActive: true
      }
    ];

    for (const milestone of milestones) {
      if (this.checkMilestoneCriteria(milestone, metrics)) {
        DomainEvents.raise(new MilestoneAchievedEvent({
          riderId,
          milestone,
          achievedAt: new Date()
        }));
      }
    }
  }

  /**
   * Checks if milestone criteria is met
   */
  private checkMilestoneCriteria(
    milestone: PerformanceMilestone,
    metrics: PerformanceMetricsResult
  ): boolean {
    const { metric, operator, value } = milestone.criteria;
    let currentValue: number;

    // Get current value based on metric name
    switch (metric) {
      case 'totalOrders':
        currentValue = metrics.orderMetrics.totalOrders;
        break;
      case 'averageRating':
        currentValue = metrics.qualityMetrics.averageRating;
        break;
      case 'completionRate':
        currentValue = metrics.orderMetrics.completionRate;
        break;
      default:
        return false;
    }

    // Check criteria
    switch (operator) {
      case '>=':
        return currentValue >= value;
      case '<=':
        return currentValue <= value;
      case '>':
        return currentValue > value;
      case '<':
        return currentValue < value;
      case '=':
        return currentValue === value;
      default:
        return false;
    }
  }
}