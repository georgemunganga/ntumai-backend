export interface UserStatsProps {
  // General stats
  totalOrders: number;
  totalSpent: number;
  averageOrderValue: number;
  lastOrderDate?: Date;
  memberSince: Date;
  loyaltyPoints: number;
  
  // Customer-specific stats
  customerStats?: {
    favoriteCategories: string[];
    preferredStores: string[];
    reviewsGiven: number;
    averageRating: number;
    cancelledOrders: number;
    returnedOrders: number;
  };
  
  // Driver-specific stats
  driverStats?: {
    totalDeliveries: number;
    completedDeliveries: number;
    cancelledDeliveries: number;
    averageDeliveryTime: number; // in minutes
    averageRating: number;
    totalEarnings: number;
    totalDistance: number; // in kilometers
    onTimeDeliveryRate: number; // percentage
    activeHours: number;
  };
  
  // Vendor-specific stats
  vendorStats?: {
    totalProducts: number;
    activeProducts: number;
    totalSales: number;
    totalRevenue: number;
    averageRating: number;
    reviewsReceived: number;
    ordersReceived: number;
    ordersCompleted: number;
    ordersCancelled: number;
    topSellingProducts: string[];
  };
}

export class UserStats {
  private constructor(private readonly props: UserStatsProps) {}

  static create(props: Partial<UserStatsProps> & { memberSince: Date }): UserStats {
    const defaultStats = UserStats.getDefaultStats(props.memberSince);
    const mergedProps = { ...defaultStats, ...props };
    const stats = new UserStats(mergedProps);
    stats.validate();
    return stats;
  }

  static getDefaultStats(memberSince: Date): UserStatsProps {
    return {
      totalOrders: 0,
      totalSpent: 0,
      averageOrderValue: 0,
      memberSince,
      loyaltyPoints: 0
    };
  }

  // Getters
  get totalOrders(): number {
    return this.props.totalOrders;
  }

  get totalSpent(): number {
    return this.props.totalSpent;
  }

  get averageOrderValue(): number {
    return this.props.averageOrderValue;
  }

  get lastOrderDate(): Date | undefined {
    return this.props.lastOrderDate;
  }

  get memberSince(): Date {
    return this.props.memberSince;
  }

  get loyaltyPoints(): number {
    return this.props.loyaltyPoints;
  }

  get customerStats(): UserStatsProps['customerStats'] {
    return this.props.customerStats;
  }

  get driverStats(): UserStatsProps['driverStats'] {
    return this.props.driverStats;
  }

  get vendorStats(): UserStatsProps['vendorStats'] {
    return this.props.vendorStats;
  }

  // General update methods
  addOrder(orderValue: number, orderDate: Date): UserStats {
    const newTotalOrders = this.props.totalOrders + 1;
    const newTotalSpent = this.props.totalSpent + orderValue;
    const newAverageOrderValue = newTotalSpent / newTotalOrders;

    return UserStats.create({
      ...this.props,
      totalOrders: newTotalOrders,
      totalSpent: newTotalSpent,
      averageOrderValue: newAverageOrderValue,
      lastOrderDate: orderDate
    });
  }

  addLoyaltyPoints(points: number): UserStats {
    return UserStats.create({
      ...this.props,
      loyaltyPoints: this.props.loyaltyPoints + points
    });
  }

  redeemLoyaltyPoints(points: number): UserStats {
    if (points > this.props.loyaltyPoints) {
      throw new Error('Insufficient loyalty points');
    }

    return UserStats.create({
      ...this.props,
      loyaltyPoints: this.props.loyaltyPoints - points
    });
  }

  // Customer-specific methods
  initializeCustomerStats(): UserStats {
    if (this.props.customerStats) {
      return this;
    }

    return UserStats.create({
      ...this.props,
      customerStats: {
        favoriteCategories: [],
        preferredStores: [],
        reviewsGiven: 0,
        averageRating: 0,
        cancelledOrders: 0,
        returnedOrders: 0
      }
    });
  }

  addCustomerReview(rating: number): UserStats {
    if (!this.props.customerStats) {
      throw new Error('Customer stats not initialized');
    }

    const currentStats = this.props.customerStats;
    const newReviewsGiven = currentStats.reviewsGiven + 1;
    const newAverageRating = ((currentStats.averageRating * currentStats.reviewsGiven) + rating) / newReviewsGiven;

    return UserStats.create({
      ...this.props,
      customerStats: {
        ...currentStats,
        reviewsGiven: newReviewsGiven,
        averageRating: newAverageRating
      }
    });
  }

  addFavoriteCategory(category: string): UserStats {
    if (!this.props.customerStats) {
      throw new Error('Customer stats not initialized');
    }

    const currentCategories = this.props.customerStats.favoriteCategories;
    if (currentCategories.includes(category)) {
      return this;
    }

    return UserStats.create({
      ...this.props,
      customerStats: {
        ...this.props.customerStats,
        favoriteCategories: [...currentCategories, category]
      }
    });
  }

  // Driver-specific methods
  initializeDriverStats(): UserStats {
    if (this.props.driverStats) {
      return this;
    }

    return UserStats.create({
      ...this.props,
      driverStats: {
        totalDeliveries: 0,
        completedDeliveries: 0,
        cancelledDeliveries: 0,
        averageDeliveryTime: 0,
        averageRating: 0,
        totalEarnings: 0,
        totalDistance: 0,
        onTimeDeliveryRate: 0,
        activeHours: 0
      }
    });
  }

  completeDelivery(deliveryTime: number, distance: number, earnings: number, rating?: number): UserStats {
    if (!this.props.driverStats) {
      throw new Error('Driver stats not initialized');
    }

    const currentStats = this.props.driverStats;
    const newTotalDeliveries = currentStats.totalDeliveries + 1;
    const newCompletedDeliveries = currentStats.completedDeliveries + 1;
    const newAverageDeliveryTime = ((currentStats.averageDeliveryTime * currentStats.completedDeliveries) + deliveryTime) / newCompletedDeliveries;
    const newTotalEarnings = currentStats.totalEarnings + earnings;
    const newTotalDistance = currentStats.totalDistance + distance;

    let newAverageRating = currentStats.averageRating;
    if (rating) {
      const totalRatedDeliveries = currentStats.completedDeliveries; // Assuming all completed deliveries were rated
      newAverageRating = ((currentStats.averageRating * totalRatedDeliveries) + rating) / (totalRatedDeliveries + 1);
    }

    return UserStats.create({
      ...this.props,
      driverStats: {
        ...currentStats,
        totalDeliveries: newTotalDeliveries,
        completedDeliveries: newCompletedDeliveries,
        averageDeliveryTime: newAverageDeliveryTime,
        averageRating: newAverageRating,
        totalEarnings: newTotalEarnings,
        totalDistance: newTotalDistance
      }
    });
  }

  cancelDelivery(): UserStats {
    if (!this.props.driverStats) {
      throw new Error('Driver stats not initialized');
    }

    return UserStats.create({
      ...this.props,
      driverStats: {
        ...this.props.driverStats,
        totalDeliveries: this.props.driverStats.totalDeliveries + 1,
        cancelledDeliveries: this.props.driverStats.cancelledDeliveries + 1
      }
    });
  }

  // Vendor-specific methods
  initializeVendorStats(): UserStats {
    if (this.props.vendorStats) {
      return this;
    }

    return UserStats.create({
      ...this.props,
      vendorStats: {
        totalProducts: 0,
        activeProducts: 0,
        totalSales: 0,
        totalRevenue: 0,
        averageRating: 0,
        reviewsReceived: 0,
        ordersReceived: 0,
        ordersCompleted: 0,
        ordersCancelled: 0,
        topSellingProducts: []
      }
    });
  }

  addProduct(): UserStats {
    if (!this.props.vendorStats) {
      throw new Error('Vendor stats not initialized');
    }

    return UserStats.create({
      ...this.props,
      vendorStats: {
        ...this.props.vendorStats,
        totalProducts: this.props.vendorStats.totalProducts + 1,
        activeProducts: this.props.vendorStats.activeProducts + 1
      }
    });
  }

  completeVendorOrder(revenue: number): UserStats {
    if (!this.props.vendorStats) {
      throw new Error('Vendor stats not initialized');
    }

    return UserStats.create({
      ...this.props,
      vendorStats: {
        ...this.props.vendorStats,
        totalSales: this.props.vendorStats.totalSales + 1,
        totalRevenue: this.props.vendorStats.totalRevenue + revenue,
        ordersCompleted: this.props.vendorStats.ordersCompleted + 1
      }
    });
  }

  // Helper methods
  getMembershipDuration(): { years: number; months: number; days: number } {
    const now = new Date();
    const memberSince = this.props.memberSince;
    
    const diffTime = Math.abs(now.getTime() - memberSince.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    const years = Math.floor(diffDays / 365);
    const months = Math.floor((diffDays % 365) / 30);
    const days = diffDays % 30;
    
    return { years, months, days };
  }

  getDaysSinceLastOrder(): number | null {
    if (!this.props.lastOrderDate) return null;
    
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - this.props.lastOrderDate.getTime());
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  }

  isActiveCustomer(): boolean {
    const daysSinceLastOrder = this.getDaysSinceLastOrder();
    return daysSinceLastOrder !== null && daysSinceLastOrder <= 30;
  }

  getCustomerTier(): 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM' {
    if (this.props.totalSpent >= 10000) return 'PLATINUM';
    if (this.props.totalSpent >= 5000) return 'GOLD';
    if (this.props.totalSpent >= 1000) return 'SILVER';
    return 'BRONZE';
  }

  getDriverSuccessRate(): number {
    if (!this.props.driverStats || this.props.driverStats.totalDeliveries === 0) {
      return 0;
    }
    
    return (this.props.driverStats.completedDeliveries / this.props.driverStats.totalDeliveries) * 100;
  }

  getVendorSuccessRate(): number {
    if (!this.props.vendorStats || this.props.vendorStats.ordersReceived === 0) {
      return 0;
    }
    
    return (this.props.vendorStats.ordersCompleted / this.props.vendorStats.ordersReceived) * 100;
  }

  // Validation
  private validate(): void {
    const errors: string[] = [];

    if (this.props.totalOrders < 0) {
      errors.push('Total orders cannot be negative');
    }

    if (this.props.totalSpent < 0) {
      errors.push('Total spent cannot be negative');
    }

    if (this.props.loyaltyPoints < 0) {
      errors.push('Loyalty points cannot be negative');
    }

    if (this.props.memberSince > new Date()) {
      errors.push('Member since date cannot be in the future');
    }

    // Validate driver stats
    if (this.props.driverStats) {
      const ds = this.props.driverStats;
      if (ds.completedDeliveries > ds.totalDeliveries) {
        errors.push('Completed deliveries cannot exceed total deliveries');
      }
      if (ds.averageRating < 0 || ds.averageRating > 5) {
        errors.push('Average rating must be between 0 and 5');
      }
    }

    // Validate vendor stats
    if (this.props.vendorStats) {
      const vs = this.props.vendorStats;
      if (vs.activeProducts > vs.totalProducts) {
        errors.push('Active products cannot exceed total products');
      }
      if (vs.averageRating < 0 || vs.averageRating > 5) {
        errors.push('Average rating must be between 0 and 5');
      }
    }

    if (errors.length > 0) {
      throw new Error(`Stats validation failed: ${errors.join(', ')}`);
    }
  }

  toPlainObject(): UserStatsProps {
    return JSON.parse(JSON.stringify(this.props));
  }

  equals(other: UserStats): boolean {
    return JSON.stringify(this.toPlainObject()) === JSON.stringify(other.toPlainObject());
  }
}