import { ValueObject } from '../../../common/domain/value-object';

export interface PerformanceMetricsProps {
  totalOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  acceptanceRate: number; // percentage
  completionRate: number; // percentage
  onTimeDeliveryRate: number; // percentage
  averageRating: number; // 1-5 scale
  totalRatings: number;
  averageDeliveryTime: number; // in minutes
  totalDeliveryTime: number; // in minutes
  fastestDeliveryTime?: number; // in minutes
  slowestDeliveryTime?: number; // in minutes
  customerCompliments: number;
  customerComplaints: number;
  qualityScore: number; // 1-100 scale
  reliabilityScore: number; // 1-100 scale
  efficiencyScore: number; // 1-100 scale
  lastUpdated: Date;
}

export class PerformanceMetrics extends ValueObject<PerformanceMetricsProps> {
  private constructor(props: PerformanceMetricsProps) {
    super(props);
  }

  public static create(props: PerformanceMetricsProps): PerformanceMetrics {
    // Validate rates are between 0-100
    if (props.acceptanceRate < 0 || props.acceptanceRate > 100) {
      throw new Error('Acceptance rate must be between 0 and 100');
    }
    if (props.completionRate < 0 || props.completionRate > 100) {
      throw new Error('Completion rate must be between 0 and 100');
    }
    if (props.onTimeDeliveryRate < 0 || props.onTimeDeliveryRate > 100) {
      throw new Error('On-time delivery rate must be between 0 and 100');
    }

    // Validate rating is between 1-5
    if (props.averageRating < 0 || props.averageRating > 5) {
      throw new Error('Average rating must be between 0 and 5');
    }

    // Validate scores are between 1-100
    if (props.qualityScore < 0 || props.qualityScore > 100) {
      throw new Error('Quality score must be between 0 and 100');
    }
    if (props.reliabilityScore < 0 || props.reliabilityScore > 100) {
      throw new Error('Reliability score must be between 0 and 100');
    }
    if (props.efficiencyScore < 0 || props.efficiencyScore > 100) {
      throw new Error('Efficiency score must be between 0 and 100');
    }

    // Validate order counts
    if (props.totalOrders < 0 || props.completedOrders < 0 || props.cancelledOrders < 0) {
      throw new Error('Order counts cannot be negative');
    }
    if (props.completedOrders + props.cancelledOrders > props.totalOrders) {
      throw new Error('Completed and cancelled orders cannot exceed total orders');
    }

    return new PerformanceMetrics(props);
  }

  public static createEmpty(): PerformanceMetrics {
    return new PerformanceMetrics({
      totalOrders: 0,
      completedOrders: 0,
      cancelledOrders: 0,
      acceptanceRate: 0,
      completionRate: 0,
      onTimeDeliveryRate: 0,
      averageRating: 0,
      totalRatings: 0,
      averageDeliveryTime: 0,
      totalDeliveryTime: 0,
      customerCompliments: 0,
      customerComplaints: 0,
      qualityScore: 0,
      reliabilityScore: 0,
      efficiencyScore: 0,
      lastUpdated: new Date(),
    });
  }

  get totalOrders(): number {
    return this.props.totalOrders;
  }

  get completedOrders(): number {
    return this.props.completedOrders;
  }

  get cancelledOrders(): number {
    return this.props.cancelledOrders;
  }

  get acceptanceRate(): number {
    return this.props.acceptanceRate;
  }

  get completionRate(): number {
    return this.props.completionRate;
  }

  get onTimeDeliveryRate(): number {
    return this.props.onTimeDeliveryRate;
  }

  get averageRating(): number {
    return this.props.averageRating;
  }

  get totalRatings(): number {
    return this.props.totalRatings;
  }

  get averageDeliveryTime(): number {
    return this.props.averageDeliveryTime;
  }

  get totalDeliveryTime(): number {
    return this.props.totalDeliveryTime;
  }

  get fastestDeliveryTime(): number | undefined {
    return this.props.fastestDeliveryTime;
  }

  get slowestDeliveryTime(): number | undefined {
    return this.props.slowestDeliveryTime;
  }

  get customerCompliments(): number {
    return this.props.customerCompliments;
  }

  get customerComplaints(): number {
    return this.props.customerComplaints;
  }

  get qualityScore(): number {
    return this.props.qualityScore;
  }

  get reliabilityScore(): number {
    return this.props.reliabilityScore;
  }

  get efficiencyScore(): number {
    return this.props.efficiencyScore;
  }

  get lastUpdated(): Date {
    return this.props.lastUpdated;
  }

  getPendingOrders(): number {
    return this.props.totalOrders - this.props.completedOrders - this.props.cancelledOrders;
  }

  getCancellationRate(): number {
    if (this.props.totalOrders === 0) return 0;
    return (this.props.cancelledOrders / this.props.totalOrders) * 100;
  }

  getOverallScore(): number {
    // Calculate weighted overall score
    const weights = {
      quality: 0.3,
      reliability: 0.3,
      efficiency: 0.2,
      rating: 0.2,
    };

    const ratingScore = (this.props.averageRating / 5) * 100;
    
    return (
      this.props.qualityScore * weights.quality +
      this.props.reliabilityScore * weights.reliability +
      this.props.efficiencyScore * weights.efficiency +
      ratingScore * weights.rating
    );
  }

  getPerformanceLevel(): 'excellent' | 'good' | 'average' | 'poor' {
    const overallScore = this.getOverallScore();
    
    if (overallScore >= 90) return 'excellent';
    if (overallScore >= 75) return 'good';
    if (overallScore >= 60) return 'average';
    return 'poor';
  }

  isTopPerformer(): boolean {
    return (
      this.props.acceptanceRate >= 90 &&
      this.props.completionRate >= 95 &&
      this.props.onTimeDeliveryRate >= 90 &&
      this.props.averageRating >= 4.5 &&
      this.getCancellationRate() <= 5
    );
  }

  needsImprovement(): boolean {
    return (
      this.props.acceptanceRate < 70 ||
      this.props.completionRate < 85 ||
      this.props.onTimeDeliveryRate < 80 ||
      this.props.averageRating < 3.5 ||
      this.getCancellationRate() > 15
    );
  }

  addCompletedOrder(deliveryTimeMinutes: number, rating?: number, onTime: boolean = true): PerformanceMetrics {
    const newTotalOrders = this.props.totalOrders + 1;
    const newCompletedOrders = this.props.completedOrders + 1;
    const newTotalDeliveryTime = this.props.totalDeliveryTime + deliveryTimeMinutes;
    const newAverageDeliveryTime = newTotalDeliveryTime / newCompletedOrders;
    
    let newAverageRating = this.props.averageRating;
    let newTotalRatings = this.props.totalRatings;
    
    if (rating !== undefined) {
      const totalRatingPoints = this.props.averageRating * this.props.totalRatings;
      newTotalRatings = this.props.totalRatings + 1;
      newAverageRating = (totalRatingPoints + rating) / newTotalRatings;
    }

    const newOnTimeDeliveries = onTime ? 
      Math.round((this.props.onTimeDeliveryRate / 100) * this.props.completedOrders) + 1 :
      Math.round((this.props.onTimeDeliveryRate / 100) * this.props.completedOrders);
    
    const newOnTimeDeliveryRate = (newOnTimeDeliveries / newCompletedOrders) * 100;
    const newCompletionRate = (newCompletedOrders / newTotalOrders) * 100;

    return PerformanceMetrics.create({
      ...this.props,
      totalOrders: newTotalOrders,
      completedOrders: newCompletedOrders,
      completionRate: newCompletionRate,
      onTimeDeliveryRate: newOnTimeDeliveryRate,
      averageRating: newAverageRating,
      totalRatings: newTotalRatings,
      averageDeliveryTime: newAverageDeliveryTime,
      totalDeliveryTime: newTotalDeliveryTime,
      fastestDeliveryTime: this.props.fastestDeliveryTime ? 
        Math.min(this.props.fastestDeliveryTime, deliveryTimeMinutes) : deliveryTimeMinutes,
      slowestDeliveryTime: this.props.slowestDeliveryTime ? 
        Math.max(this.props.slowestDeliveryTime, deliveryTimeMinutes) : deliveryTimeMinutes,
      lastUpdated: new Date(),
    });
  }

  addCancelledOrder(): PerformanceMetrics {
    const newTotalOrders = this.props.totalOrders + 1;
    const newCancelledOrders = this.props.cancelledOrders + 1;
    const newCompletionRate = (this.props.completedOrders / newTotalOrders) * 100;

    return PerformanceMetrics.create({
      ...this.props,
      totalOrders: newTotalOrders,
      cancelledOrders: newCancelledOrders,
      completionRate: newCompletionRate,
      lastUpdated: new Date(),
    });
  }

  updateAcceptanceRate(newRate: number): PerformanceMetrics {
    return PerformanceMetrics.create({
      ...this.props,
      acceptanceRate: newRate,
      lastUpdated: new Date(),
    });
  }

  addCompliment(): PerformanceMetrics {
    return PerformanceMetrics.create({
      ...this.props,
      customerCompliments: this.props.customerCompliments + 1,
      lastUpdated: new Date(),
    });
  }

  addComplaint(): PerformanceMetrics {
    return PerformanceMetrics.create({
      ...this.props,
      customerComplaints: this.props.customerComplaints + 1,
      lastUpdated: new Date(),
    });
  }

  updateQualityScore(score: number): PerformanceMetrics {
    return PerformanceMetrics.create({
      ...this.props,
      qualityScore: score,
      lastUpdated: new Date(),
    });
  }

  updateReliabilityScore(score: number): PerformanceMetrics {
    return PerformanceMetrics.create({
      ...this.props,
      reliabilityScore: score,
      lastUpdated: new Date(),
    });
  }

  updateEfficiencyScore(score: number): PerformanceMetrics {
    return PerformanceMetrics.create({
      ...this.props,
      efficiencyScore: score,
      lastUpdated: new Date(),
    });
  }

  getPerformanceSummary(): {
    level: string;
    overallScore: number;
    strengths: string[];
    improvements: string[];
  } {
    const strengths: string[] = [];
    const improvements: string[] = [];

    if (this.props.acceptanceRate >= 90) strengths.push('High acceptance rate');
    else if (this.props.acceptanceRate < 70) improvements.push('Improve acceptance rate');

    if (this.props.completionRate >= 95) strengths.push('Excellent completion rate');
    else if (this.props.completionRate < 85) improvements.push('Improve completion rate');

    if (this.props.onTimeDeliveryRate >= 90) strengths.push('Punctual deliveries');
    else if (this.props.onTimeDeliveryRate < 80) improvements.push('Improve delivery timeliness');

    if (this.props.averageRating >= 4.5) strengths.push('High customer satisfaction');
    else if (this.props.averageRating < 3.5) improvements.push('Improve customer service');

    if (this.getCancellationRate() <= 5) strengths.push('Low cancellation rate');
    else if (this.getCancellationRate() > 15) improvements.push('Reduce order cancellations');

    return {
      level: this.getPerformanceLevel(),
      overallScore: Math.round(this.getOverallScore()),
      strengths,
      improvements,
    };
  }

  getDeliveryTimeStats(): {
    average: number;
    fastest: number | null;
    slowest: number | null;
    total: number;
  } {
    return {
      average: this.props.averageDeliveryTime,
      fastest: this.props.fastestDeliveryTime || null,
      slowest: this.props.slowestDeliveryTime || null,
      total: this.props.totalDeliveryTime,
    };
  }

  getCustomerFeedbackRatio(): number {
    const totalFeedback = this.props.customerCompliments + this.props.customerComplaints;
    if (totalFeedback === 0) return 0;
    return (this.props.customerCompliments / totalFeedback) * 100;
  }

  formatDeliveryTime(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  }

  toJSON() {
    return {
      totalOrders: this.props.totalOrders,
      completedOrders: this.props.completedOrders,
      cancelledOrders: this.props.cancelledOrders,
      pendingOrders: this.getPendingOrders(),
      acceptanceRate: this.props.acceptanceRate,
      completionRate: this.props.completionRate,
      cancellationRate: this.getCancellationRate(),
      onTimeDeliveryRate: this.props.onTimeDeliveryRate,
      averageRating: this.props.averageRating,
      totalRatings: this.props.totalRatings,
      averageDeliveryTime: this.props.averageDeliveryTime,
      totalDeliveryTime: this.props.totalDeliveryTime,
      fastestDeliveryTime: this.props.fastestDeliveryTime,
      slowestDeliveryTime: this.props.slowestDeliveryTime,
      customerCompliments: this.props.customerCompliments,
      customerComplaints: this.props.customerComplaints,
      qualityScore: this.props.qualityScore,
      reliabilityScore: this.props.reliabilityScore,
      efficiencyScore: this.props.efficiencyScore,
      overallScore: this.getOverallScore(),
      performanceLevel: this.getPerformanceLevel(),
      lastUpdated: this.props.lastUpdated,
    };
  }
}