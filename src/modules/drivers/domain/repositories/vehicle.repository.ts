import { Vehicle } from '../entities/vehicle.entity';
import { UniqueEntityID } from '../../../common/domain/unique-entity-id';
import { VehicleInfo } from '../value-objects/vehicle-info.vo';
import { DocumentStatus } from '../value-objects/document-status.vo';

export interface VehicleSearchFilters {
  riderId?: string;
  type?: string[];
  make?: string[];
  model?: string[];
  year?: {
    min?: number;
    max?: number;
  };
  status?: string[];
  verificationStatus?: string[];
  mileage?: {
    min?: number;
    max?: number;
  };
  registrationExpiry?: {
    before?: Date;
    after?: Date;
  };
  insuranceExpiry?: {
    before?: Date;
    after?: Date;
  };
  inspectionExpiry?: {
    before?: Date;
    after?: Date;
  };
  maintenanceStatus?: string[];
  hasActiveIssues?: boolean;
  createdAfter?: Date;
  createdBefore?: Date;
  tags?: string[];
}

export interface VehicleSortOptions {
  field: 'createdAt' | 'updatedAt' | 'year' | 'mileage' | 'registrationExpiry' | 'insuranceExpiry' | 'inspectionExpiry';
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

export interface MaintenanceRecord {
  id: string;
  vehicleId: string;
  type: string;
  description: string;
  cost: number;
  currency: string;
  performedAt: Date;
  performedBy: string;
  mileageAtService: number;
  nextServiceDue?: Date;
  nextServiceMileage?: number;
  parts?: string[];
  warranty?: {
    duration: number;
    unit: 'days' | 'months' | 'years' | 'miles' | 'kilometers';
    expiresAt: Date;
  };
  receipt?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface VehicleRepository {
  // Basic CRUD operations
  save(vehicle: Vehicle): Promise<void>;
  findById(id: UniqueEntityID): Promise<Vehicle | null>;
  findByRiderId(riderId: UniqueEntityID): Promise<Vehicle[]>;
  findByLicensePlate(licensePlate: string): Promise<Vehicle | null>;
  findByVin(vin: string): Promise<Vehicle | null>;
  findByRegistrationNumber(registrationNumber: string): Promise<Vehicle | null>;
  delete(id: UniqueEntityID): Promise<void>;
  exists(id: UniqueEntityID): Promise<boolean>;

  // Search and filtering
  findMany(
    filters?: VehicleSearchFilters,
    sort?: VehicleSortOptions,
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<Vehicle>>;

  findByIds(ids: UniqueEntityID[]): Promise<Vehicle[]>;

  // Type and specification queries
  findByType(type: string): Promise<Vehicle[]>;
  findByMakeAndModel(make: string, model: string): Promise<Vehicle[]>;
  findByYearRange(minYear: number, maxYear: number): Promise<Vehicle[]>;
  
  // Status-based queries
  findByStatus(
    status: string,
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<Vehicle>>;

  findActiveVehicles(
    riderId?: UniqueEntityID,
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<Vehicle>>;

  findInactiveVehicles(
    riderId?: UniqueEntityID,
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<Vehicle>>;

  findRetiredVehicles(
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<Vehicle>>;

  // Verification and document queries
  findByVerificationStatus(
    status: string,
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<Vehicle>>;

  findVerifiedVehicles(): Promise<Vehicle[]>;
  findUnverifiedVehicles(): Promise<Vehicle[]>;
  findPendingVerification(): Promise<Vehicle[]>;

  findWithExpiredDocuments(): Promise<Vehicle[]>;
  findWithExpiringDocuments(daysAhead: number): Promise<Vehicle[]>;
  findWithPendingDocuments(): Promise<Vehicle[]>;
  findWithRejectedDocuments(): Promise<Vehicle[]>;

  findByDocumentStatus(
    documentType: string,
    status: string
  ): Promise<Vehicle[]>;

  // Expiry-based queries
  findWithExpiringRegistration(daysAhead: number): Promise<Vehicle[]>;
  findWithExpiredRegistration(): Promise<Vehicle[]>;
  
  findWithExpiringInsurance(daysAhead: number): Promise<Vehicle[]>;
  findWithExpiredInsurance(): Promise<Vehicle[]>;
  
  findWithExpiringInspection(daysAhead: number): Promise<Vehicle[]>;
  findWithExpiredInspection(): Promise<Vehicle[]>;

  // Maintenance queries
  findByMaintenanceStatus(status: string): Promise<Vehicle[]>;
  findRequiringMaintenance(): Promise<Vehicle[]>;
  findOverdueMaintenance(): Promise<Vehicle[]>;
  
  findByMileageRange(
    minMileage: number,
    maxMileage: number,
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<Vehicle>>;

  findHighMileageVehicles(
    threshold: number,
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<Vehicle>>;

  // Maintenance records
  addMaintenanceRecord(
    vehicleId: UniqueEntityID,
    record: Omit<MaintenanceRecord, 'id' | 'vehicleId' | 'createdAt' | 'updatedAt'>
  ): Promise<MaintenanceRecord>;

  getMaintenanceRecords(
    vehicleId: UniqueEntityID,
    filters?: {
      type?: string;
      dateRange?: { start: Date; end: Date };
      costRange?: { min: number; max: number };
    }
  ): Promise<MaintenanceRecord[]>;

  getMaintenanceHistory(
    vehicleId: UniqueEntityID,
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<MaintenanceRecord>>;

  updateMaintenanceRecord(
    recordId: string,
    updates: Partial<MaintenanceRecord>
  ): Promise<MaintenanceRecord>;

  deleteMaintenanceRecord(recordId: string): Promise<void>;

  // Analytics and reporting
  getStatistics(): Promise<{
    total: number;
    active: number;
    verified: number;
    requiresMaintenance: number;
    expiredDocuments: number;
    expiringDocuments: number;
    averageMileage: number;
    averageAge: number;
  }>;

  getTypeDistribution(): Promise<Record<string, number>>;
  getMakeDistribution(): Promise<Record<string, number>>;
  getStatusDistribution(): Promise<Record<string, number>>;
  getVerificationStatusDistribution(): Promise<Record<string, number>>;
  
  getAgeDistribution(): Promise<{
    '0-2': number;
    '3-5': number;
    '6-10': number;
    '10+': number;
  }>;

  getMileageDistribution(): Promise<{
    '0-50k': number;
    '50k-100k': number;
    '100k-200k': number;
    '200k+': number;
  }>;

  getMaintenanceCosts(
    timeframe?: { start: Date; end: Date },
    vehicleId?: UniqueEntityID
  ): Promise<{
    total: number;
    average: number;
    byType: Record<string, number>;
    byMonth: Record<string, number>;
  }>;

  getExpiryReport(): Promise<{
    expiredRegistration: number;
    expiredInsurance: number;
    expiredInspection: number;
    expiringIn30Days: {
      registration: number;
      insurance: number;
      inspection: number;
    };
    expiringIn7Days: {
      registration: number;
      insurance: number;
      inspection: number;
    };
  }>;

  // Fleet management
  getFleetOverview(riderId?: UniqueEntityID): Promise<{
    totalVehicles: number;
    activeVehicles: number;
    averageAge: number;
    averageMileage: number;
    maintenanceCosts: number;
    utilizationRate: number;
    complianceRate: number;
  }>;

  getVehicleUtilization(
    vehicleId: UniqueEntityID,
    timeframe: { start: Date; end: Date }
  ): Promise<{
    totalHours: number;
    activeHours: number;
    utilizationRate: number;
    ordersCompleted: number;
    distanceCovered: number;
    earningsGenerated: number;
  }>;

  // Compliance and alerts
  getComplianceStatus(vehicleId: UniqueEntityID): Promise<{
    isCompliant: boolean;
    issues: string[];
    expiringDocuments: string[];
    requiredActions: string[];
    complianceScore: number;
  }>;

  getAlerts(): Promise<{
    critical: Array<{
      vehicleId: string;
      type: string;
      message: string;
      dueDate?: Date;
    }>;
    warning: Array<{
      vehicleId: string;
      type: string;
      message: string;
      dueDate?: Date;
    }>;
    info: Array<{
      vehicleId: string;
      type: string;
      message: string;
      dueDate?: Date;
    }>;
  }>;

  // Bulk operations
  saveMany(vehicles: Vehicle[]): Promise<void>;
  updateMany(
    filters: VehicleSearchFilters,
    updates: Partial<{
      status: string;
      verificationStatus: string;
      tags: string[];
    }>
  ): Promise<number>;

  deleteMany(filters: VehicleSearchFilters): Promise<number>;

  // Advanced queries
  findSimilarVehicles(
    vehicleId: UniqueEntityID,
    criteria: ('type' | 'make' | 'model' | 'year' | 'mileage')[]
  ): Promise<Vehicle[]>;

  findOptimalVehicleForOrder(
    orderRequirements: {
      vehicleType?: string;
      maxAge?: number;
      maxMileage?: number;
      location?: { latitude: number; longitude: number };
      radius?: number;
    }
  ): Promise<Vehicle[]>;

  // Maintenance scheduling
  scheduleMaintenanceReminders(): Promise<{
    scheduled: number;
    overdue: number;
    upcoming: number;
  }>;

  getMaintenanceSchedule(
    vehicleId: UniqueEntityID,
    daysAhead?: number
  ): Promise<Array<{
    type: string;
    dueDate: Date;
    dueMileage?: number;
    priority: 'low' | 'medium' | 'high' | 'critical';
    estimatedCost?: number;
  }>>;

  // Cache management
  invalidateCache(vehicleId?: UniqueEntityID): Promise<void>;
  warmupCache(vehicleIds: UniqueEntityID[]): Promise<void>;

  // Event sourcing support
  getVersion(id: UniqueEntityID): Promise<number>;
  saveWithVersion(vehicle: Vehicle, expectedVersion: number): Promise<void>;
}