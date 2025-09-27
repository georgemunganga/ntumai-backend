import { ErrandEntity } from '../entities';
import { LocationVO, Priority } from '../value-objects';
import { ErrandRepository } from '../repositories';

export interface DriverInfo {
  id: string;
  name: string;
  rating: number;
  location: LocationVO;
  isAvailable: boolean;
  vehicleType?: string;
  completedErrands: number;
  averageCompletionTime: number; // in minutes
  specializations: string[];
  maxDistance: number; // in km
}

export interface AssignmentCriteria {
  maxDistance?: number; // in km
  minRating?: number;
  requiredSpecializations?: string[];
  preferredVehicleType?: string;
  prioritizeBy?: 'distance' | 'rating' | 'experience' | 'availability';
  excludeDrivers?: string[];
}

export interface AssignmentResult {
  driver: DriverInfo;
  score: number;
  distance: number;
  estimatedArrivalTime: number; // in minutes
  reasons: string[];
}

export interface ErrandAssignmentService {
  /**
   * Find the best driver for an errand
   */
  findBestDriver(
    errand: ErrandEntity,
    availableDrivers: DriverInfo[],
    criteria?: AssignmentCriteria,
  ): Promise<AssignmentResult | null>;

  /**
   * Find multiple suitable drivers for an errand (ranked)
   */
  findSuitableDrivers(
    errand: ErrandEntity,
    availableDrivers: DriverInfo[],
    criteria?: AssignmentCriteria,
    limit?: number,
  ): Promise<AssignmentResult[]>;

  /**
   * Calculate assignment score for a driver
   */
  calculateAssignmentScore(
    errand: ErrandEntity,
    driver: DriverInfo,
    criteria?: AssignmentCriteria,
  ): Promise<{
    score: number;
    breakdown: {
      distance: number;
      rating: number;
      experience: number;
      specialization: number;
      availability: number;
      priority: number;
    };
    reasons: string[];
  }>;

  /**
   * Check if driver is suitable for errand
   */
  isDriverSuitable(
    errand: ErrandEntity,
    driver: DriverInfo,
    criteria?: AssignmentCriteria,
  ): Promise<{
    suitable: boolean;
    reasons: string[];
  }>;

  /**
   * Estimate arrival time for driver to pickup location
   */
  estimateArrivalTime(
    driverLocation: LocationVO,
    pickupLocation: LocationVO,
  ): Promise<number>; // in minutes

  /**
   * Get assignment recommendations
   */
  getAssignmentRecommendations(
    errand: ErrandEntity,
    availableDrivers: DriverInfo[],
  ): Promise<{
    recommended: AssignmentResult[];
    alternatives: AssignmentResult[];
    reasons: string[];
  }>;

  /**
   * Validate assignment before execution
   */
  validateAssignment(
    errand: ErrandEntity,
    driver: DriverInfo,
  ): Promise<{
    valid: boolean;
    errors: string[];
    warnings: string[];
  }>;
}

export class ErrandAssignmentServiceImpl implements ErrandAssignmentService {
  constructor(
    private readonly errandRepository: ErrandRepository,
  ) {}

  async findBestDriver(
    errand: ErrandEntity,
    availableDrivers: DriverInfo[],
    criteria?: AssignmentCriteria,
  ): Promise<AssignmentResult | null> {
    const suitableDrivers = await this.findSuitableDrivers(
      errand,
      availableDrivers,
      criteria,
      1,
    );

    return suitableDrivers.length > 0 ? suitableDrivers[0] : null;
  }

  async findSuitableDrivers(
    errand: ErrandEntity,
    availableDrivers: DriverInfo[],
    criteria?: AssignmentCriteria,
    limit = 10,
  ): Promise<AssignmentResult[]> {
    const results: AssignmentResult[] = [];

    for (const driver of availableDrivers) {
      // Check basic suitability
      const suitability = await this.isDriverSuitable(errand, driver, criteria);
      if (!suitability.suitable) {
        continue;
      }

      // Calculate score
      const scoreResult = await this.calculateAssignmentScore(errand, driver, criteria);
      
      // Calculate distance and arrival time
      const distance = errand.pickupLocation.distanceTo(driver.location) || 0;
      const estimatedArrivalTime = await this.estimateArrivalTime(
        driver.location,
        errand.pickupLocation,
      );

      results.push({
        driver,
        score: scoreResult.score,
        distance,
        estimatedArrivalTime,
        reasons: scoreResult.reasons,
      });
    }

    // Sort by score (highest first) and limit results
    return results
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  async calculateAssignmentScore(
    errand: ErrandEntity,
    driver: DriverInfo,
    criteria?: AssignmentCriteria,
  ): Promise<{
    score: number;
    breakdown: {
      distance: number;
      rating: number;
      experience: number;
      specialization: number;
      availability: number;
      priority: number;
    };
    reasons: string[];
  }> {
    const reasons: string[] = [];
    const breakdown = {
      distance: 0,
      rating: 0,
      experience: 0,
      specialization: 0,
      availability: 0,
      priority: 0,
    };

    // Distance score (closer is better, max 30 points)
    const distance = errand.pickupLocation.distanceTo(driver.location) || 0;
    const maxDistance = criteria?.maxDistance || 50; // km
    if (distance <= maxDistance) {
      breakdown.distance = Math.max(0, 30 - (distance / maxDistance) * 30);
      reasons.push(`Driver is ${distance.toFixed(1)}km away`);
    }

    // Rating score (max 25 points)
    breakdown.rating = (driver.rating / 5) * 25;
    reasons.push(`Driver rating: ${driver.rating}/5`);

    // Experience score (max 20 points)
    const experienceScore = Math.min(20, (driver.completedErrands / 100) * 20);
    breakdown.experience = experienceScore;
    reasons.push(`Driver completed ${driver.completedErrands} errands`);

    // Specialization score (max 15 points)
    if (errand.category && driver.specializations.includes(errand.category)) {
      breakdown.specialization = 15;
      reasons.push(`Driver specializes in ${errand.category}`);
    }

    // Availability score (max 5 points)
    if (driver.isAvailable) {
      breakdown.availability = 5;
      reasons.push('Driver is currently available');
    }

    // Priority bonus (max 5 points)
    if (errand.priority.value === Priority.HIGH) {
      breakdown.priority = 5;
      reasons.push('High priority errand bonus');
    } else if (errand.priority.value === Priority.MEDIUM) {
      breakdown.priority = 3;
      reasons.push('Medium priority errand bonus');
    }

    // Apply prioritization weights
    let totalScore = 0;
    const prioritizeBy = criteria?.prioritizeBy || 'distance';
    
    switch (prioritizeBy) {
      case 'distance':
        totalScore = breakdown.distance * 1.5 + breakdown.rating + breakdown.experience + 
                    breakdown.specialization + breakdown.availability + breakdown.priority;
        break;
      case 'rating':
        totalScore = breakdown.distance + breakdown.rating * 1.5 + breakdown.experience + 
                    breakdown.specialization + breakdown.availability + breakdown.priority;
        break;
      case 'experience':
        totalScore = breakdown.distance + breakdown.rating + breakdown.experience * 1.5 + 
                    breakdown.specialization + breakdown.availability + breakdown.priority;
        break;
      default:
        totalScore = breakdown.distance + breakdown.rating + breakdown.experience + 
                    breakdown.specialization + breakdown.availability + breakdown.priority;
    }

    return {
      score: Math.round(totalScore * 100) / 100,
      breakdown,
      reasons,
    };
  }

  async isDriverSuitable(
    errand: ErrandEntity,
    driver: DriverInfo,
    criteria?: AssignmentCriteria,
  ): Promise<{
    suitable: boolean;
    reasons: string[];
  }> {
    const reasons: string[] = [];
    let suitable = true;

    // Check availability
    if (!driver.isAvailable) {
      suitable = false;
      reasons.push('Driver is not available');
    }

    // Check distance
    const distance = errand.pickupLocation.distanceTo(driver.location) || 0;
    const maxDistance = criteria?.maxDistance || driver.maxDistance || 50;
    if (distance > maxDistance) {
      suitable = false;
      reasons.push(`Driver is too far (${distance.toFixed(1)}km > ${maxDistance}km)`);
    }

    // Check minimum rating
    if (criteria?.minRating && driver.rating < criteria.minRating) {
      suitable = false;
      reasons.push(`Driver rating too low (${driver.rating} < ${criteria.minRating})`);
    }

    // Check required specializations
    if (criteria?.requiredSpecializations && criteria.requiredSpecializations.length > 0) {
      const hasAllSpecializations = criteria.requiredSpecializations.every(
        spec => driver.specializations.includes(spec)
      );
      if (!hasAllSpecializations) {
        suitable = false;
        reasons.push('Driver lacks required specializations');
      }
    }

    // Check vehicle type
    if (criteria?.preferredVehicleType && driver.vehicleType !== criteria.preferredVehicleType) {
      // This is a preference, not a hard requirement
      reasons.push(`Vehicle type mismatch (has ${driver.vehicleType}, preferred ${criteria.preferredVehicleType})`);
    }

    // Check exclusion list
    if (criteria?.excludeDrivers && criteria.excludeDrivers.includes(driver.id)) {
      suitable = false;
      reasons.push('Driver is in exclusion list');
    }

    if (suitable) {
      reasons.push('Driver meets all requirements');
    }

    return { suitable, reasons };
  }

  async estimateArrivalTime(
    driverLocation: LocationVO,
    pickupLocation: LocationVO,
  ): Promise<number> {
    const distance = driverLocation.distanceTo(pickupLocation) || 0;
    
    // Simple estimation: assume average speed of 30 km/h in city
    const averageSpeedKmh = 30;
    const timeHours = distance / averageSpeedKmh;
    const timeMinutes = timeHours * 60;
    
    // Add buffer time for traffic and preparation
    const bufferMinutes = 5;
    
    return Math.round(timeMinutes + bufferMinutes);
  }

  async getAssignmentRecommendations(
    errand: ErrandEntity,
    availableDrivers: DriverInfo[],
  ): Promise<{
    recommended: AssignmentResult[];
    alternatives: AssignmentResult[];
    reasons: string[];
  }> {
    const allSuitable = await this.findSuitableDrivers(errand, availableDrivers, undefined, 10);
    
    const recommended = allSuitable.slice(0, 3); // Top 3
    const alternatives = allSuitable.slice(3, 7); // Next 4
    
    const reasons: string[] = [
      `Found ${allSuitable.length} suitable drivers`,
      `Recommended ${recommended.length} top choices`,
      `${alternatives.length} alternative options available`,
    ];

    if (errand.priority.value === Priority.HIGH) {
      reasons.push('High priority errand - consider immediate assignment');
    }

    if (errand.isOverdue()) {
      reasons.push('Errand is overdue - urgent assignment needed');
    }

    return {
      recommended,
      alternatives,
      reasons,
    };
  }

  async validateAssignment(
    errand: ErrandEntity,
    driver: DriverInfo,
  ): Promise<{
    valid: boolean;
    errors: string[];
    warnings: string[];
  }> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check if errand can be assigned
    if (!errand.canBeAssigned()) {
      errors.push(`Errand cannot be assigned in current status: ${errand.status.value}`);
    }

    // Check driver availability
    if (!driver.isAvailable) {
      errors.push('Driver is not available');
    }

    // Check distance
    const distance = errand.pickupLocation.distanceTo(driver.location) || 0;
    if (distance > driver.maxDistance) {
      errors.push(`Distance exceeds driver's maximum range (${distance.toFixed(1)}km > ${driver.maxDistance}km)`);
    }

    // Warnings
    if (distance > 20) {
      warnings.push('Driver is relatively far from pickup location');
    }

    if (driver.rating < 4.0) {
      warnings.push('Driver has below average rating');
    }

    if (errand.priority.value === Priority.HIGH && driver.averageCompletionTime > 60) {
      warnings.push('High priority errand assigned to driver with slower completion times');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }
}