import { Rider } from '../entities/rider.entity';
import { UniqueEntityID } from '../../../common/domain/unique-entity-id';
import { Location } from '../value-objects/location.vo';
import { RiderStatus } from '../value-objects/rider-status.vo';

export interface RiderSearchFilters {
  status?: string[];
  verificationLevel?: string[];
  workingAreas?: string[];
  vehicleType?: string[];
  isOnline?: boolean;
  isAvailable?: boolean;
  rating?: {
    min?: number;
    max?: number;
  };
  completedOrders?: {
    min?: number;
    max?: number;
  };
  joinedAfter?: Date;
  joinedBefore?: Date;
  lastActiveAfter?: Date;
  lastActiveBefore?: Date;
  location?: {
    latitude: number;
    longitude: number;
    radius: number; // in kilometers
  };
  tags?: string[];
}

export interface RiderSortOptions {
  field: 'createdAt' | 'updatedAt' | 'lastActiveAt' | 'rating' | 'completedOrders' | 'acceptanceRate' | 'onTimeDeliveryRate';
  direction: 'asc' | 'desc';
}

export interface PaginationOptions {
  page: number;
  limit: number;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface RiderRepository {
  // Basic CRUD operations
  save(rider: Rider): Promise<void>;
  findById(id: UniqueEntityID): Promise<Rider | null>;
  findByEmail(email: string): Promise<Rider | null>;
  findByPhone(phone: string): Promise<Rider | null>;
  findByLicenseNumber(licenseNumber: string): Promise<Rider | null>;
  delete(id: UniqueEntityID): Promise<void>;
  exists(id: UniqueEntityID): Promise<boolean>;

  // Search and filtering
  findMany(
    filters?: RiderSearchFilters,
    sort?: RiderSortOptions,
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<Rider>>;

  findByIds(ids: UniqueEntityID[]): Promise<Rider[]>;
  
  // Location-based queries
  findNearby(
    location: Location,
    radius: number,
    filters?: Omit<RiderSearchFilters, 'location'>
  ): Promise<Rider[]>;

  findInArea(
    areaId: string,
    filters?: RiderSearchFilters
  ): Promise<Rider[]>;

  // Status-based queries
  findOnlineRiders(
    location?: Location,
    radius?: number
  ): Promise<Rider[]>;

  findAvailableRiders(
    location?: Location,
    radius?: number,
    vehicleType?: string
  ): Promise<Rider[]>;

  findByStatus(
    status: RiderStatus['accountStatus'],
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<Rider>>;

  findByVerificationLevel(
    level: RiderStatus['verificationLevel'],
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<Rider>>;

  // Performance-based queries
  findTopPerformers(
    limit?: number,
    timeframe?: { start: Date; end: Date }
  ): Promise<Rider[]>;

  findByRatingRange(
    minRating: number,
    maxRating: number,
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<Rider>>;

  findByCompletedOrdersRange(
    minOrders: number,
    maxOrders: number,
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<Rider>>;

  // Document-related queries
  findWithExpiredDocuments(): Promise<Rider[]>;
  findWithPendingDocuments(): Promise<Rider[]>;
  findWithRejectedDocuments(): Promise<Rider[]>;
  
  findByDocumentStatus(
    documentType: string,
    status: string
  ): Promise<Rider[]>;

  // Vehicle-related queries
  findByVehicleType(vehicleType: string): Promise<Rider[]>;
  findWithVehicleIssues(): Promise<Rider[]>;

  // Activity-based queries
  findActiveInPeriod(
    startDate: Date,
    endDate: Date,
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<Rider>>;

  findInactiveRiders(
    daysSinceLastActive: number,
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<Rider>>;

  findNewRiders(
    daysSinceJoined: number,
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<Rider>>;

  // Earnings-related queries
  findByEarningsRange(
    minEarnings: number,
    maxEarnings: number,
    timeframe?: { start: Date; end: Date },
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<Rider>>;

  // Shift-related queries
  findCurrentlyOnShift(): Promise<Rider[]>;
  findOnBreak(): Promise<Rider[]>;
  findBusyWithOrders(): Promise<Rider[]>;

  // Analytics and reporting
  getStatistics(): Promise<{
    total: number;
    active: number;
    online: number;
    available: number;
    verified: number;
    suspended: number;
    newThisMonth: number;
    averageRating: number;
    totalCompletedOrders: number;
  }>;

  getStatusDistribution(): Promise<Record<string, number>>;
  getVerificationLevelDistribution(): Promise<Record<string, number>>;
  getVehicleTypeDistribution(): Promise<Record<string, number>>;
  getLocationDistribution(): Promise<Record<string, number>>;

  getRatingDistribution(): Promise<{
    '1-2': number;
    '2-3': number;
    '3-4': number;
    '4-5': number;
  }>;

  getPerformanceMetrics(timeframe?: { start: Date; end: Date }): Promise<{
    averageAcceptanceRate: number;
    averageCompletionRate: number;
    averageOnTimeRate: number;
    averageRating: number;
    totalOrders: number;
    totalEarnings: number;
  }>;

  // Bulk operations
  saveMany(riders: Rider[]): Promise<void>;
  updateMany(
    filters: RiderSearchFilters,
    updates: Partial<{
      status: string;
      verificationLevel: string;
      tags: string[];
      workingAreas: string[];
    }>
  ): Promise<number>; // Returns count of updated records

  deleteMany(filters: RiderSearchFilters): Promise<number>; // Returns count of deleted records

  // Advanced queries
  findSimilarRiders(
    riderId: UniqueEntityID,
    criteria: ('location' | 'vehicleType' | 'rating' | 'experience')[]
  ): Promise<Rider[]>;

  findOptimalRiderForOrder(
    pickupLocation: Location,
    deliveryLocation: Location,
    orderRequirements?: {
      vehicleType?: string;
      minRating?: number;
      maxDistance?: number;
      preferredRiders?: string[];
    }
  ): Promise<Rider | null>;

  findRidersForBroadcast(
    location: Location,
    radius: number,
    filters?: {
      vehicleType?: string;
      minRating?: number;
      excludeRiders?: string[];
    }
  ): Promise<Rider[]>;

  // Maintenance and cleanup
  cleanupInactiveRiders(daysSinceLastActive: number): Promise<number>;
  archiveRiders(filters: RiderSearchFilters): Promise<number>;
  
  // Cache management
  invalidateCache(riderId?: UniqueEntityID): Promise<void>;
  warmupCache(riderIds: UniqueEntityID[]): Promise<void>;

  // Event sourcing support
  getVersion(id: UniqueEntityID): Promise<number>;
  saveWithVersion(rider: Rider, expectedVersion: number): Promise<void>;
}