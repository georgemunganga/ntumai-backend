import { UserEntity } from '../entities/user.entity';
import { UserRepositoryInterface } from '../repositories/user.repository.interface';
import { UserStats, CustomerStats, DriverStats, VendorStats } from '../value-objects/user-stats.vo';
import { UserRole } from '@prisma/client';

export interface StatisticsFilter {
  dateFrom?: Date;
  dateTo?: Date;
  role?: UserRole;
  status?: string;
  includeInactive?: boolean;
}

export interface UserStatisticsSummary {
  userId: string;
  generalStats: UserStats;
  roleSpecificStats: {
    customer?: CustomerStats;
    driver?: DriverStats;
    vendor?: VendorStats;
  };
  calculatedAt: Date;
  period: {
    from: Date;
    to: Date;
  };
}

export interface AggregatedStatistics {
  totalUsers: number;
  activeUsers: number;
  usersByRole: Record<UserRole, number>;
  averageOrderValue: number;
  totalRevenue: number;
  topPerformers: {
    customers: Array<{ userId: string; totalSpent: number; orderCount: number }>;
    drivers: Array<{ userId: string; deliveryCount: number; rating: number }>;
    vendors: Array<{ userId: string; revenue: number; orderCount: number }>;
  };
  trends: {
    userGrowth: number; // percentage
    revenueGrowth: number; // percentage
    orderGrowth: number; // percentage
  };
}

export interface PerformanceMetrics {
  userId: string;
  role: UserRole;
  score: number; // 0-100
  metrics: {
    reliability: number;
    quality: number;
    efficiency: number;
    customerSatisfaction: number;
  };
  ranking: {
    overall: number;
    inRole: number;
    percentile: number;
  };
  recommendations: string[];
}

export class UserStatisticsService {
  constructor(
    private readonly userRepository: UserRepositoryInterface
  ) {}

  /**
   * Calculate comprehensive statistics for a user
   */
  async calculateUserStatistics(
    userId: string, 
    filter?: StatisticsFilter
  ): Promise<UserStatisticsSummary> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const period = {
      from: filter?.dateFrom || new Date(Date.now() - 365 * 24 * 60 * 60 * 1000), // 1 year ago
      to: filter?.dateTo || new Date()
    };

    // Calculate general statistics
    const generalStats = await this.calculateGeneralStats(userId, period);

    // Calculate role-specific statistics
    const roleSpecificStats: any = {};
    
    for (const role of user.roles) {
      switch (role) {
        case 'CUSTOMER':
          roleSpecificStats.customer = await this.calculateCustomerStats(userId, period);
          break;
        case 'DRIVER':
          roleSpecificStats.driver = await this.calculateDriverStats(userId, period);
          break;
        case 'VENDOR':
          roleSpecificStats.vendor = await this.calculateVendorStats(userId, period);
          break;
      }
    }

    return {
      userId,
      generalStats,
      roleSpecificStats,
      calculatedAt: new Date(),
      period
    };
  }

  /**
   * Get aggregated statistics across all users
   */
  async getAggregatedStatistics(filter?: StatisticsFilter): Promise<AggregatedStatistics> {
    const period = {
      from: filter?.dateFrom || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
      to: filter?.dateTo || new Date()
    };

    const previousPeriod = {
      from: new Date(period.from.getTime() - (period.to.getTime() - period.from.getTime())),
      to: period.from
    };

    // Get basic user counts
    const totalUsers = await this.userRepository.count();
    const activeUsers = await this.userRepository.countActiveUsers(period.from);
    
    // Get users by role
    const usersByRole = await this.getUserCountsByRole();
    
    // Calculate financial metrics
    const { averageOrderValue, totalRevenue } = await this.calculateFinancialMetrics(period);
    
    // Get top performers
    const topPerformers = await this.getTopPerformers(period);
    
    // Calculate trends
    const trends = await this.calculateTrends(period, previousPeriod);

    return {
      totalUsers,
      activeUsers,
      usersByRole,
      averageOrderValue,
      totalRevenue,
      topPerformers,
      trends
    };
  }

  /**
   * Calculate performance metrics for a user
   */
  async calculatePerformanceMetrics(
    userId: string, 
    role?: UserRole
  ): Promise<PerformanceMetrics> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const targetRole = role || user.currentRole;
    
    if (!user.roles.includes(targetRole)) {
      throw new Error(`User doesn't have the ${targetRole} role`);
    }

    const metrics = await this.calculateRoleSpecificMetrics(userId, targetRole);
    const score = this.calculateOverallScore(metrics);
    const ranking = await this.calculateUserRanking(userId, targetRole, score);
    const recommendations = this.generateRecommendations(targetRole, metrics);

    return {
      userId,
      role: targetRole,
      score,
      metrics,
      ranking,
      recommendations
    };
  }

  /**
   * Update user statistics after an event
   */
  async updateStatisticsAfterEvent(
    userId: string, 
    eventType: string, 
    eventData: any
  ): Promise<void> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      return;
    }

    let updatedStats = user.stats;

    switch (eventType) {
      case 'ORDER_PLACED':
        updatedStats = updatedStats.addOrder(
          eventData.orderId,
          eventData.amount,
          eventData.items?.length || 1
        );
        break;

      case 'ORDER_COMPLETED':
        updatedStats = updatedStats.completeOrder(
          eventData.orderId,
          eventData.rating
        );
        break;

      case 'DELIVERY_COMPLETED':
        if (user.roles.includes('DRIVER')) {
          updatedStats = updatedStats.completeDelivery(
            eventData.deliveryId,
            eventData.distance,
            eventData.duration,
            eventData.rating
          );
        }
        break;

      case 'PRODUCT_ADDED':
        if (user.roles.includes('VENDOR')) {
          updatedStats = updatedStats.addProduct(
            eventData.productId,
            eventData.category
          );
        }
        break;

      case 'PRODUCT_SOLD':
        if (user.roles.includes('VENDOR')) {
          updatedStats = updatedStats.sellProduct(
            eventData.productId,
            eventData.quantity,
            eventData.revenue
          );
        }
        break;

      case 'LOYALTY_POINTS_EARNED':
        updatedStats = updatedStats.addLoyaltyPoints(eventData.points);
        break;

      case 'REFERRAL_COMPLETED':
        updatedStats = updatedStats.addReferral(eventData.referredUserId);
        break;
    }

    // Update user with new statistics
    const updatedUser = user.updateStats(updatedStats);
    await this.userRepository.save(updatedUser);
  }

  /**
   * Get user statistics comparison
   */
  async compareUserStatistics(
    userId1: string, 
    userId2: string, 
    role?: UserRole
  ): Promise<{
    user1: UserStatisticsSummary;
    user2: UserStatisticsSummary;
    comparison: {
      metric: string;
      user1Value: number;
      user2Value: number;
      difference: number;
      percentageDifference: number;
      winner: 'user1' | 'user2' | 'tie';
    }[];
  }> {
    const [stats1, stats2] = await Promise.all([
      this.calculateUserStatistics(userId1),
      this.calculateUserStatistics(userId2)
    ]);

    const comparison = this.generateStatisticsComparison(stats1, stats2, role);

    return {
      user1: stats1,
      user2: stats2,
      comparison
    };
  }

  /**
   * Get user statistics trends over time
   */
  async getUserStatisticsTrends(
    userId: string, 
    days: number = 30
  ): Promise<{
    dates: string[];
    metrics: {
      orders: number[];
      revenue: number[];
      ratings: number[];
      deliveries?: number[];
      products?: number[];
    };
  }> {
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000);
    
    const dates: string[] = [];
    const metrics = {
      orders: [] as number[],
      revenue: [] as number[],
      ratings: [] as number[],
      deliveries: [] as number[],
      products: [] as number[]
    };

    // Generate daily statistics for the period
    for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
      const dayStart = new Date(date);
      const dayEnd = new Date(date.getTime() + 24 * 60 * 60 * 1000);
      
      dates.push(dayStart.toISOString().split('T')[0]);
      
      const dayStats = await this.calculateUserStatistics(userId, {
        dateFrom: dayStart,
        dateTo: dayEnd
      });
      
      metrics.orders.push(dayStats.generalStats.totalOrders);
      metrics.revenue.push(dayStats.generalStats.totalSpent);
      metrics.ratings.push(dayStats.generalStats.averageRating);
      
      if (dayStats.roleSpecificStats.driver) {
        metrics.deliveries.push(dayStats.roleSpecificStats.driver.totalDeliveries);
      }
      
      if (dayStats.roleSpecificStats.vendor) {
        metrics.products.push(dayStats.roleSpecificStats.vendor.totalProducts);
      }
    }

    return { dates, metrics };
  }

  // Private helper methods
  private async calculateGeneralStats(userId: string, period: { from: Date; to: Date }): Promise<UserStats> {
    // In a real implementation, these would query the database
    // For now, returning default values
    return UserStats.create({
      totalOrders: 0,
      completedOrders: 0,
      cancelledOrders: 0,
      totalSpent: 0,
      averageOrderValue: 0,
      loyaltyPoints: 0,
      referralCount: 0,
      averageRating: 0,
      totalRatings: 0,
      accountAge: 0,
      lastOrderDate: null,
      favoriteCategories: [],
      customerStats: null,
      driverStats: null,
      vendorStats: null
    });
  }

  private async calculateCustomerStats(userId: string, period: { from: Date; to: Date }): Promise<CustomerStats> {
    // Query customer-specific data from database
    return {
      totalOrders: 0,
      averageOrderValue: 0,
      favoriteRestaurants: [],
      preferredCuisines: [],
      averageDeliveryTime: 0,
      loyaltyTier: 'BRONZE',
      savedAddresses: 0,
      paymentMethods: 0,
      reviewsGiven: 0,
      averageRatingGiven: 0,
      cancelledOrdersRate: 0,
      repeatOrderRate: 0,
      averageOrderFrequency: 0,
      totalSavings: 0,
      discountCodesUsed: 0,
      referralsMade: 0,
      subscriptionsActive: 0
    };
  }

  private async calculateDriverStats(userId: string, period: { from: Date; to: Date }): Promise<DriverStats> {
    // Query driver-specific data from database
    return {
      totalDeliveries: 0,
      completedDeliveries: 0,
      cancelledDeliveries: 0,
      totalDistance: 0,
      totalEarnings: 0,
      averageDeliveryTime: 0,
      averageRating: 0,
      totalRatings: 0,
      onlineHours: 0,
      peakHoursWorked: 0,
      weekendHoursWorked: 0,
      averageOrdersPerHour: 0,
      fuelEfficiency: 0,
      vehicleMaintenanceCost: 0,
      customerTips: 0,
      bonusEarnings: 0,
      penaltiesIncurred: 0,
      trafficViolations: 0,
      customerComplaints: 0,
      onTimeDeliveryRate: 0
    };
  }

  private async calculateVendorStats(userId: string, period: { from: Date; to: Date }): Promise<VendorStats> {
    // Query vendor-specific data from database
    return {
      totalProducts: 0,
      activeProducts: 0,
      totalOrders: 0,
      completedOrders: 0,
      cancelledOrders: 0,
      totalRevenue: 0,
      averageOrderValue: 0,
      averageRating: 0,
      totalRatings: 0,
      averagePreparationTime: 0,
      peakHoursRevenue: 0,
      topSellingProducts: [],
      inventoryTurnover: 0,
      customerRetentionRate: 0,
      averageOrdersPerDay: 0,
      seasonalTrends: {},
      promotionsRun: 0,
      discountGiven: 0,
      returnsProcessed: 0,
      qualityScore: 0,
      deliveryPartnerRating: 0
    };
  }

  private async getUserCountsByRole(): Promise<Record<UserRole, number>> {
    // Query database for user counts by role
    return {
      CUSTOMER: 0,
      DRIVER: 0,
      VENDOR: 0,
      ADMIN: 0
    };
  }

  private async calculateFinancialMetrics(period: { from: Date; to: Date }): Promise<{
    averageOrderValue: number;
    totalRevenue: number;
  }> {
    // Query financial data from database
    return {
      averageOrderValue: 0,
      totalRevenue: 0
    };
  }

  private async getTopPerformers(period: { from: Date; to: Date }): Promise<{
    customers: Array<{ userId: string; totalSpent: number; orderCount: number }>;
    drivers: Array<{ userId: string; deliveryCount: number; rating: number }>;
    vendors: Array<{ userId: string; revenue: number; orderCount: number }>;
  }> {
    // Query top performers from database
    return {
      customers: [],
      drivers: [],
      vendors: []
    };
  }

  private async calculateTrends(
    currentPeriod: { from: Date; to: Date },
    previousPeriod: { from: Date; to: Date }
  ): Promise<{
    userGrowth: number;
    revenueGrowth: number;
    orderGrowth: number;
  }> {
    // Calculate growth trends
    return {
      userGrowth: 0,
      revenueGrowth: 0,
      orderGrowth: 0
    };
  }

  private async calculateRoleSpecificMetrics(userId: string, role: UserRole): Promise<{
    reliability: number;
    quality: number;
    efficiency: number;
    customerSatisfaction: number;
  }> {
    // Calculate role-specific performance metrics
    switch (role) {
      case 'DRIVER':
        return {
          reliability: 85, // On-time delivery rate
          quality: 90, // Customer rating
          efficiency: 75, // Orders per hour
          customerSatisfaction: 88 // Overall satisfaction
        };
      
      case 'VENDOR':
        return {
          reliability: 92, // Order fulfillment rate
          quality: 87, // Food quality rating
          efficiency: 80, // Preparation time
          customerSatisfaction: 89 // Customer reviews
        };
      
      case 'CUSTOMER':
        return {
          reliability: 95, // Payment reliability
          quality: 85, // Review quality
          efficiency: 90, // Order completion rate
          customerSatisfaction: 0 // Not applicable
        };
      
      default:
        return {
          reliability: 0,
          quality: 0,
          efficiency: 0,
          customerSatisfaction: 0
        };
    }
  }

  private calculateOverallScore(metrics: {
    reliability: number;
    quality: number;
    efficiency: number;
    customerSatisfaction: number;
  }): number {
    const weights = {
      reliability: 0.3,
      quality: 0.3,
      efficiency: 0.2,
      customerSatisfaction: 0.2
    };

    return Math.round(
      metrics.reliability * weights.reliability +
      metrics.quality * weights.quality +
      metrics.efficiency * weights.efficiency +
      metrics.customerSatisfaction * weights.customerSatisfaction
    );
  }

  private async calculateUserRanking(userId: string, role: UserRole, score: number): Promise<{
    overall: number;
    inRole: number;
    percentile: number;
  }> {
    // Calculate user ranking among all users and within role
    return {
      overall: 1,
      inRole: 1,
      percentile: 95
    };
  }

  private generateRecommendations(role: UserRole, metrics: {
    reliability: number;
    quality: number;
    efficiency: number;
    customerSatisfaction: number;
  }): string[] {
    const recommendations: string[] = [];

    if (metrics.reliability < 80) {
      recommendations.push('Focus on improving reliability and consistency');
    }

    if (metrics.quality < 85) {
      recommendations.push('Work on improving service quality');
    }

    if (metrics.efficiency < 75) {
      recommendations.push('Optimize your workflow for better efficiency');
    }

    if (metrics.customerSatisfaction < 85) {
      recommendations.push('Focus on customer satisfaction and communication');
    }

    // Role-specific recommendations
    switch (role) {
      case 'DRIVER':
        if (metrics.efficiency < 80) {
          recommendations.push('Consider optimizing your delivery routes');
        }
        break;
      
      case 'VENDOR':
        if (metrics.quality < 90) {
          recommendations.push('Focus on food quality and presentation');
        }
        break;
    }

    return recommendations;
  }

  private generateStatisticsComparison(
    stats1: UserStatisticsSummary,
    stats2: UserStatisticsSummary,
    role?: UserRole
  ): Array<{
    metric: string;
    user1Value: number;
    user2Value: number;
    difference: number;
    percentageDifference: number;
    winner: 'user1' | 'user2' | 'tie';
  }> {
    const comparisons = [];

    // Compare general statistics
    const generalMetrics = [
      { key: 'totalOrders', name: 'Total Orders' },
      { key: 'totalSpent', name: 'Total Spent' },
      { key: 'averageRating', name: 'Average Rating' },
      { key: 'loyaltyPoints', name: 'Loyalty Points' }
    ];

    for (const metric of generalMetrics) {
      const value1 = (stats1.generalStats as any)[metric.key] || 0;
      const value2 = (stats2.generalStats as any)[metric.key] || 0;
      const difference = value1 - value2;
      const percentageDifference = value2 !== 0 ? (difference / value2) * 100 : 0;
      
      let winner: 'user1' | 'user2' | 'tie' = 'tie';
      if (difference > 0) winner = 'user1';
      else if (difference < 0) winner = 'user2';

      comparisons.push({
        metric: metric.name,
        user1Value: value1,
        user2Value: value2,
        difference,
        percentageDifference,
        winner
      });
    }

    return comparisons;
  }
}