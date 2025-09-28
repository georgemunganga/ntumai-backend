import { Injectable } from '@nestjs/common';
import { Rider } from '../entities/rider.entity';
import { RiderOrder } from '../entities/rider-order.entity';
import { Shift } from '../entities/shift.entity';
import { Vehicle } from '../entities/vehicle.entity';
import { UniqueEntityID } from '../../../common/domain/unique-entity-id';
import { Location } from '../value-objects/location.vo';
import { PerformanceMetrics } from '../value-objects/performance-metrics.vo';
import { DomainEvents } from '../../../common/domain/domain-events';
import { OrderAssignedEvent } from '../events/order-assigned.event';
import { OrderUnassignedEvent } from '../events/order-unassigned.event';
import { OrderReassignedEvent } from '../events/order-reassigned.event';

export interface OrderAssignmentRequest {
  orderId: UniqueEntityID;
  pickupLocation: Location;
  deliveryLocation: Location;
  orderType: 'food' | 'grocery' | 'pharmacy' | 'package' | 'other';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  estimatedValue: number;
  estimatedDistance: number;
  estimatedDuration: number;
  specialRequirements?: string[];
  timeWindow?: {
    earliest: Date;
    latest: Date;
  };
  customerRating?: number;
  vendorId?: UniqueEntityID;
}

export interface RiderEligibility {
  riderId: UniqueEntityID;
  isEligible: boolean;
  score: number;
  reasons: string[];
  estimatedArrivalTime: Date;
  estimatedCompletionTime: Date;
  distance: number;
}

export interface AssignmentCriteria {
  maxDistance?: number;
  minRating?: number;
  requiredVehicleTypes?: string[];
  excludeRiders?: UniqueEntityID[];
  preferredRiders?: UniqueEntityID[];
  considerPerformance?: boolean;
  considerLocation?: boolean;
  considerAvailability?: boolean;
  considerVehicleCapacity?: boolean;
}

export interface AssignmentResult {
  success: boolean;
  assignedRider?: Rider;
  assignmentScore?: number;
  alternativeRiders?: RiderEligibility[];
  rejectionReason?: string;
  estimatedPickupTime?: Date;
  estimatedDeliveryTime?: Date;
}

export interface ReassignmentRequest {
  orderId: UniqueEntityID;
  currentRiderId: UniqueEntityID;
  reason: 'rider_unavailable' | 'vehicle_issue' | 'customer_request' | 'optimization' | 'emergency';
  newCriteria?: AssignmentCriteria;
  urgency: 'low' | 'medium' | 'high';
}

export interface BatchAssignmentRequest {
  orders: OrderAssignmentRequest[];
  criteria: AssignmentCriteria;
  optimizationGoal: 'minimize_distance' | 'maximize_efficiency' | 'balance_workload' | 'minimize_time';
}

export interface BatchAssignmentResult {
  assignments: Array<{
    orderId: UniqueEntityID;
    riderId?: UniqueEntityID;
    success: boolean;
    reason?: string;
  }>;
  totalAssigned: number;
  totalUnassigned: number;
  optimizationScore: number;
}

@Injectable()
export class OrderAssignmentService {
  constructor() {}

  /**
   * Assigns an order to the most suitable rider
   */
  async assignOrder(
    request: OrderAssignmentRequest,
    availableRiders: Rider[],
    activeShifts: Shift[],
    vehicles: Vehicle[],
    criteria: AssignmentCriteria = {}
  ): Promise<AssignmentResult> {
    // Get eligible riders
    const eligibleRiders = await this.getEligibleRiders(
      request,
      availableRiders,
      activeShifts,
      vehicles,
      criteria
    );

    if (eligibleRiders.length === 0) {
      return {
        success: false,
        rejectionReason: 'No eligible riders available',
        alternativeRiders: []
      };
    }

    // Sort by assignment score (highest first)
    eligibleRiders.sort((a, b) => b.score - a.score);

    const bestRider = availableRiders.find(r => 
      r.id.equals(eligibleRiders[0].riderId)
    )!;

    const assignmentScore = eligibleRiders[0].score;
    const estimatedPickupTime = eligibleRiders[0].estimatedArrivalTime;
    const estimatedDeliveryTime = eligibleRiders[0].estimatedCompletionTime;

    // Raise domain event
    DomainEvents.raise(new OrderAssignedEvent({
      orderId: request.orderId,
      riderId: bestRider.id,
      assignmentTime: new Date(),
      assignmentScore,
      estimatedPickupTime,
      estimatedDeliveryTime,
      assignmentMethod: 'automatic'
    }));

    return {
      success: true,
      assignedRider: bestRider,
      assignmentScore,
      alternativeRiders: eligibleRiders.slice(1, 6), // Top 5 alternatives
      estimatedPickupTime,
      estimatedDeliveryTime
    };
  }

  /**
   * Gets eligible riders for an order
   */
  async getEligibleRiders(
    request: OrderAssignmentRequest,
    availableRiders: Rider[],
    activeShifts: Shift[],
    vehicles: Vehicle[],
    criteria: AssignmentCriteria
  ): Promise<RiderEligibility[]> {
    const eligibleRiders: RiderEligibility[] = [];

    for (const rider of availableRiders) {
      const eligibility = await this.evaluateRiderEligibility(
        rider,
        request,
        activeShifts,
        vehicles,
        criteria
      );

      if (eligibility.isEligible) {
        eligibleRiders.push(eligibility);
      }
    }

    return eligibleRiders;
  }

  /**
   * Evaluates if a rider is eligible for an order
   */
  private async evaluateRiderEligibility(
    rider: Rider,
    request: OrderAssignmentRequest,
    activeShifts: Shift[],
    vehicles: Vehicle[],
    criteria: AssignmentCriteria
  ): Promise<RiderEligibility> {
    const reasons: string[] = [];
    let score = 0;
    let isEligible = true;

    // Check basic rider status
    if (!rider.isActive()) {
      isEligible = false;
      reasons.push('Rider is not active');
    }

    if (!rider.isAvailable()) {
      isEligible = false;
      reasons.push('Rider is not available');
    }

    // Check if rider is on an active shift
    const activeShift = activeShifts.find(shift => 
      shift.getRiderId().equals(rider.id) && 
      (shift.getStatus().getValue() === 'active')
    );

    if (!activeShift) {
      isEligible = false;
      reasons.push('Rider is not on an active shift');
    }

    // Check rider rating
    if (criteria.minRating && rider.getRating() < criteria.minRating) {
      isEligible = false;
      reasons.push(`Rider rating ${rider.getRating()} below minimum ${criteria.minRating}`);
    }

    // Check vehicle requirements
    const riderVehicle = vehicles.find(v => 
      v.getRiderId().equals(rider.id) && v.isActive()
    );

    if (!riderVehicle) {
      isEligible = false;
      reasons.push('No active vehicle found');
    } else {
      // Check vehicle type requirements
      if (criteria.requiredVehicleTypes && 
          !criteria.requiredVehicleTypes.includes(riderVehicle.getType())) {
        isEligible = false;
        reasons.push(`Vehicle type ${riderVehicle.getType()} not suitable`);
      }

      // Check vehicle capacity
      if (criteria.considerVehicleCapacity && !riderVehicle.hasCapacity()) {
        isEligible = false;
        reasons.push('Vehicle at capacity');
      }
    }

    // Check exclusions
    if (criteria.excludeRiders?.some(id => id.equals(rider.id))) {
      isEligible = false;
      reasons.push('Rider explicitly excluded');
    }

    // Calculate distance and time estimates
    const currentLocation = rider.getCurrentLocation();
    const distance = this.calculateDistance(currentLocation, request.pickupLocation);
    
    // Check maximum distance
    if (criteria.maxDistance && distance > criteria.maxDistance) {
      isEligible = false;
      reasons.push(`Distance ${distance}km exceeds maximum ${criteria.maxDistance}km`);
    }

    // Calculate estimated times
    const estimatedArrivalTime = this.calculateEstimatedArrivalTime(
      currentLocation,
      request.pickupLocation,
      distance
    );

    const estimatedCompletionTime = this.calculateEstimatedCompletionTime(
      estimatedArrivalTime,
      request.estimatedDuration
    );

    // Check time window constraints
    if (request.timeWindow) {
      if (estimatedArrivalTime > request.timeWindow.latest) {
        isEligible = false;
        reasons.push('Cannot arrive within required time window');
      }
    }

    // Calculate assignment score if eligible
    if (isEligible) {
      score = this.calculateAssignmentScore(
        rider,
        request,
        distance,
        activeShift!,
        criteria
      );
      reasons.push(`Assignment score: ${score.toFixed(2)}`);
    }

    return {
      riderId: rider.id,
      isEligible,
      score,
      reasons,
      estimatedArrivalTime,
      estimatedCompletionTime,
      distance
    };
  }

  /**
   * Calculates assignment score for a rider
   */
  private calculateAssignmentScore(
    rider: Rider,
    request: OrderAssignmentRequest,
    distance: number,
    activeShift: Shift,
    criteria: AssignmentCriteria
  ): number {
    let score = 100; // Base score

    // Distance factor (closer is better)
    const distanceScore = Math.max(0, 50 - (distance * 2));
    score += distanceScore;

    // Rating factor
    if (criteria.considerPerformance !== false) {
      const ratingScore = (rider.getRating() - 3) * 10; // Scale 1-5 to -20 to +20
      score += ratingScore;
    }

    // Performance metrics
    const performance = rider.getPerformanceMetrics();
    if (performance && criteria.considerPerformance !== false) {
      score += performance.getCompletionRate() * 20;
      score += (performance.getAverageRating() - 3) * 5;
      score -= performance.getCancellationRate() * 30;
    }

    // Order type compatibility
    const orderTypeScore = this.getOrderTypeCompatibilityScore(
      rider,
      request.orderType
    );
    score += orderTypeScore;

    // Priority bonus
    const priorityBonus = {
      low: 0,
      medium: 5,
      high: 10,
      urgent: 20
    };
    score += priorityBonus[request.priority];

    // Preferred rider bonus
    if (criteria.preferredRiders?.some(id => id.equals(rider.id))) {
      score += 25;
    }

    // Current workload factor
    const currentOrders = activeShift.getOrdersCount();
    if (currentOrders === 0) {
      score += 10; // Bonus for idle riders
    } else if (currentOrders >= 3) {
      score -= 15; // Penalty for busy riders
    }

    // Time of day factor
    const hour = new Date().getHours();
    if ((hour >= 11 && hour <= 14) || (hour >= 18 && hour <= 21)) {
      score += 5; // Peak hours bonus
    }

    return Math.max(0, score);
  }

  /**
   * Gets order type compatibility score
   */
  private getOrderTypeCompatibilityScore(
    rider: Rider,
    orderType: string
  ): number {
    const preferences = rider.getOrderTypePreferences();
    if (!preferences) return 0;

    const preference = preferences[orderType];
    if (preference === 'preferred') return 15;
    if (preference === 'accepted') return 5;
    if (preference === 'avoided') return -10;
    if (preference === 'blocked') return -50;

    return 0;
  }

  /**
   * Reassigns an order to a different rider
   */
  async reassignOrder(
    request: ReassignmentRequest,
    availableRiders: Rider[],
    activeShifts: Shift[],
    vehicles: Vehicle[],
    orderDetails: OrderAssignmentRequest
  ): Promise<AssignmentResult> {
    // Remove current rider from available list
    const filteredRiders = availableRiders.filter(r => 
      !r.id.equals(request.currentRiderId)
    );

    // Add current rider to exclusion list
    const criteria = {
      ...request.newCriteria,
      excludeRiders: [
        ...(request.newCriteria?.excludeRiders || []),
        request.currentRiderId
      ]
    };

    // Adjust criteria based on urgency
    if (request.urgency === 'high') {
      criteria.maxDistance = (criteria.maxDistance || 10) * 1.5;
      criteria.minRating = Math.max(0, (criteria.minRating || 4) - 0.5);
    }

    const result = await this.assignOrder(
      orderDetails,
      filteredRiders,
      activeShifts,
      vehicles,
      criteria
    );

    if (result.success) {
      // Raise reassignment event
      DomainEvents.raise(new OrderReassignedEvent({
        orderId: request.orderId,
        previousRiderId: request.currentRiderId,
        newRiderId: result.assignedRider!.id,
        reassignmentTime: new Date(),
        reason: request.reason,
        urgency: request.urgency
      }));
    }

    return result;
  }

  /**
   * Unassigns an order from a rider
   */
  async unassignOrder(
    orderId: UniqueEntityID,
    riderId: UniqueEntityID,
    reason: string
  ): Promise<void> {
    DomainEvents.raise(new OrderUnassignedEvent({
      orderId,
      riderId,
      unassignmentTime: new Date(),
      reason
    }));
  }

  /**
   * Performs batch assignment of multiple orders
   */
  async batchAssignOrders(
    request: BatchAssignmentRequest,
    availableRiders: Rider[],
    activeShifts: Shift[],
    vehicles: Vehicle[]
  ): Promise<BatchAssignmentResult> {
    const assignments: BatchAssignmentResult['assignments'] = [];
    let totalAssigned = 0;
    let totalUnassigned = 0;

    // Sort orders by priority
    const sortedOrders = [...request.orders].sort((a, b) => {
      const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });

    // Track assigned riders to avoid double assignment
    const assignedRiders = new Set<string>();

    for (const order of sortedOrders) {
      // Filter out already assigned riders
      const availableForOrder = availableRiders.filter(r => 
        !assignedRiders.has(r.id.toString())
      );

      const result = await this.assignOrder(
        order,
        availableForOrder,
        activeShifts,
        vehicles,
        request.criteria
      );

      if (result.success && result.assignedRider) {
        assignments.push({
          orderId: order.orderId,
          riderId: result.assignedRider.id,
          success: true
        });
        assignedRiders.add(result.assignedRider.id.toString());
        totalAssigned++;
      } else {
        assignments.push({
          orderId: order.orderId,
          success: false,
          reason: result.rejectionReason
        });
        totalUnassigned++;
      }
    }

    // Calculate optimization score
    const optimizationScore = this.calculateBatchOptimizationScore(
      assignments,
      request.optimizationGoal
    );

    return {
      assignments,
      totalAssigned,
      totalUnassigned,
      optimizationScore
    };
  }

  /**
   * Calculates distance between two locations
   */
  private calculateDistance(from: Location, to: Location): number {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRadians(to.getLatitude() - from.getLatitude());
    const dLon = this.toRadians(to.getLongitude() - from.getLongitude());
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(this.toRadians(from.getLatitude())) * 
              Math.cos(this.toRadians(to.getLatitude())) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Calculates estimated arrival time
   */
  private calculateEstimatedArrivalTime(
    from: Location,
    to: Location,
    distance: number
  ): Date {
    const averageSpeed = 25; // km/h in city traffic
    const travelTimeHours = distance / averageSpeed;
    const travelTimeMs = travelTimeHours * 60 * 60 * 1000;
    
    return new Date(Date.now() + travelTimeMs);
  }

  /**
   * Calculates estimated completion time
   */
  private calculateEstimatedCompletionTime(
    arrivalTime: Date,
    estimatedDuration: number
  ): Date {
    return new Date(arrivalTime.getTime() + (estimatedDuration * 60 * 1000));
  }

  /**
   * Calculates batch optimization score
   */
  private calculateBatchOptimizationScore(
    assignments: BatchAssignmentResult['assignments'],
    goal: string
  ): number {
    const successRate = assignments.filter(a => a.success).length / assignments.length;
    return successRate * 100;
  }
}