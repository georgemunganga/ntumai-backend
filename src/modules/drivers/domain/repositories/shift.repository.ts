import { Shift } from '../entities/shift.entity';
import { UniqueEntityID } from '../../../common/domain/unique-entity-id';
import { Location } from '../value-objects/location.vo';

export interface ShiftSearchFilters {
  riderId?: string;
  state?: string[];
  startDate?: {
    after?: Date;
    before?: Date;
  };
  endDate?: {
    after?: Date;
    before?: Date;
  };
  duration?: {
    min?: number; // in minutes
    max?: number;
  };
  totalOrders?: {
    min?: number;
    max?: number;
  };
  totalEarnings?: {
    min?: number;
    max?: number;
  };
  totalDistance?: {
    min?: number;
    max?: number;
  };
  hasBreaks?: boolean;
  breakDuration?: {
    min?: number;
    max?: number;
  };
  location?: {
    latitude: number;
    longitude: number;
    radius: number;
  };
  tags?: string[];
}

export interface ShiftSortOptions {
  field: 'startTime' | 'endTime' | 'duration' | 'totalOrders' | 'totalEarnings' | 'totalDistance' | 'createdAt';
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

export interface ShiftAnalytics {
  totalShifts: number;
  activeShifts: number;
  completedShifts: number;
  cancelledShifts: number;
  averageDuration: number;
  averageEarnings: number;
  averageOrders: number;
  averageDistance: number;
  totalEarnings: number;
  totalOrders: number;
  totalDistance: number;
  totalHours: number;
}

export interface ShiftPerformanceMetrics {
  riderId: string;
  totalShifts: number;
  totalHours: number;
  averageHoursPerShift: number;
  totalEarnings: number;
  averageEarningsPerShift: number;
  averageEarningsPerHour: number;
  totalOrders: number;
  averageOrdersPerShift: number;
  averageOrdersPerHour: number;
  completionRate: number;
  cancellationRate: number;
  averageDistancePerShift: number;
  averageDistancePerOrder: number;
  breakTimePercentage: number;
  punctualityScore: number;
  consistencyScore: number;
}

export interface TimeSlot {
  start: Date;
  end: Date;
  duration: number;
  orders: number;
  earnings: number;
  distance: number;
}

export interface ShiftRepository {
  // Basic CRUD operations
  save(shift: Shift): Promise<void>;
  findById(id: UniqueEntityID): Promise<Shift | null>;
  findByRiderId(
    riderId: UniqueEntityID,
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<Shift>>;
  delete(id: UniqueEntityID): Promise<void>;
  exists(id: UniqueEntityID): Promise<boolean>;

  // Search and filtering
  findMany(
    filters?: ShiftSearchFilters,
    sort?: ShiftSortOptions,
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<Shift>>;

  findByIds(ids: UniqueEntityID[]): Promise<Shift[]>;

  // State-based queries
  findActiveShifts(
    riderId?: UniqueEntityID
  ): Promise<Shift[]>;

  findCurrentShift(riderId: UniqueEntityID): Promise<Shift | null>;
  
  findCompletedShifts(
    riderId?: UniqueEntityID,
    timeframe?: { start: Date; end: Date },
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<Shift>>;

  findCancelledShifts(
    riderId?: UniqueEntityID,
    timeframe?: { start: Date; end: Date },
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<Shift>>;

  findByState(
    state: string,
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<Shift>>;

  // Time-based queries
  findByDateRange(
    startDate: Date,
    endDate: Date,
    riderId?: UniqueEntityID,
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<Shift>>;

  findByDay(
    date: Date,
    riderId?: UniqueEntityID
  ): Promise<Shift[]>;

  findByWeek(
    weekStart: Date,
    riderId?: UniqueEntityID
  ): Promise<Shift[]>;

  findByMonth(
    year: number,
    month: number,
    riderId?: UniqueEntityID,
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<Shift>>;

  findTodaysShifts(
    riderId?: UniqueEntityID
  ): Promise<Shift[]>;

  findThisWeeksShifts(
    riderId?: UniqueEntityID
  ): Promise<Shift[]>;

  findThisMonthsShifts(
    riderId?: UniqueEntityID,
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<Shift>>;

  // Duration-based queries
  findLongShifts(
    minHours: number,
    timeframe?: { start: Date; end: Date },
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<Shift>>;

  findShortShifts(
    maxHours: number,
    timeframe?: { start: Date; end: Date },
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<Shift>>;

  findByDurationRange(
    minMinutes: number,
    maxMinutes: number,
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<Shift>>;

  // Performance-based queries
  findHighEarningShifts(
    minEarnings: number,
    timeframe?: { start: Date; end: Date },
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<Shift>>;

  findByEarningsRange(
    minEarnings: number,
    maxEarnings: number,
    timeframe?: { start: Date; end: Date },
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<Shift>>;

  findByOrderCountRange(
    minOrders: number,
    maxOrders: number,
    timeframe?: { start: Date; end: Date },
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<Shift>>;

  findHighVolumeShifts(
    minOrders: number,
    timeframe?: { start: Date; end: Date },
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<Shift>>;

  // Location-based queries
  findByStartLocation(
    location: Location,
    radius: number,
    timeframe?: { start: Date; end: Date }
  ): Promise<Shift[]>;

  findByEndLocation(
    location: Location,
    radius: number,
    timeframe?: { start: Date; end: Date }
  ): Promise<Shift[]>;

  findInArea(
    bounds: {
      northEast: Location;
      southWest: Location;
    },
    timeframe?: { start: Date; end: Date }
  ): Promise<Shift[]>;

  // Break-related queries
  findShiftsWithBreaks(
    riderId?: UniqueEntityID,
    timeframe?: { start: Date; end: Date }
  ): Promise<Shift[]>;

  findShiftsWithoutBreaks(
    riderId?: UniqueEntityID,
    timeframe?: { start: Date; end: Date }
  ): Promise<Shift[]>;

  findByBreakDuration(
    minMinutes: number,
    maxMinutes: number,
    timeframe?: { start: Date; end: Date }
  ): Promise<Shift[]>;

  // Analytics and reporting
  getShiftAnalytics(
    riderId?: UniqueEntityID,
    timeframe?: { start: Date; end: Date }
  ): Promise<ShiftAnalytics>;

  getRiderPerformanceMetrics(
    riderId: UniqueEntityID,
    timeframe?: { start: Date; end: Date }
  ): Promise<ShiftPerformanceMetrics>;

  getHourlyBreakdown(
    riderId?: UniqueEntityID,
    date?: Date
  ): Promise<TimeSlot[]>;

  getDailyBreakdown(
    riderId?: UniqueEntityID,
    timeframe?: { start: Date; end: Date }
  ): Promise<Array<{
    date: string;
    shifts: number;
    totalHours: number;
    totalEarnings: number;
    totalOrders: number;
    totalDistance: number;
  }>>;

  getWeeklyBreakdown(
    riderId?: UniqueEntityID,
    timeframe?: { start: Date; end: Date }
  ): Promise<Array<{
    week: string;
    shifts: number;
    totalHours: number;
    totalEarnings: number;
    totalOrders: number;
    totalDistance: number;
  }>>;

  getMonthlyBreakdown(
    riderId?: UniqueEntityID,
    year?: number
  ): Promise<Array<{
    month: string;
    shifts: number;
    totalHours: number;
    totalEarnings: number;
    totalOrders: number;
    totalDistance: number;
  }>>;

  // Shift patterns and insights
  getShiftPatterns(
    riderId: UniqueEntityID,
    timeframe?: { start: Date; end: Date }
  ): Promise<{
    averageStartTime: string;
    averageEndTime: string;
    mostCommonDuration: number;
    preferredDays: string[];
    peakHours: string[];
    consistencyScore: number;
  }>;

  getPeakHours(
    timeframe?: { start: Date; end: Date }
  ): Promise<Array<{
    hour: number;
    activeShifts: number;
    totalOrders: number;
    totalEarnings: number;
  }>>;

  getBusiestDays(
    timeframe?: { start: Date; end: Date }
  ): Promise<Array<{
    dayOfWeek: string;
    activeShifts: number;
    totalOrders: number;
    totalEarnings: number;
  }>>;

  // Compliance and monitoring
  findOvertimeShifts(
    maxHours: number,
    timeframe?: { start: Date; end: Date }
  ): Promise<Shift[]>;

  findShiftsWithoutBreaks(
    minHours: number,
    timeframe?: { start: Date; end: Date }
  ): Promise<Shift[]>;

  getComplianceReport(
    riderId?: UniqueEntityID,
    timeframe?: { start: Date; end: Date }
  ): Promise<{
    totalShifts: number;
    overtimeShifts: number;
    shiftsWithoutBreaks: number;
    averageHoursPerDay: number;
    maxConsecutiveHours: number;
    complianceScore: number;
    violations: Array<{
      type: string;
      count: number;
      severity: 'low' | 'medium' | 'high';
    }>;
  }>;

  // Forecasting and planning
  predictOptimalShiftTimes(
    riderId: UniqueEntityID,
    targetDate: Date
  ): Promise<{
    recommendedStart: Date;
    recommendedEnd: Date;
    expectedOrders: number;
    expectedEarnings: number;
    confidence: number;
  }>;

  getCapacityForecast(
    timeframe: { start: Date; end: Date }
  ): Promise<Array<{
    date: string;
    expectedActiveRiders: number;
    expectedCapacity: number;
    demandForecast: number;
    utilizationRate: number;
  }>>;

  // Bulk operations
  saveMany(shifts: Shift[]): Promise<void>;
  updateMany(
    filters: ShiftSearchFilters,
    updates: Partial<{
      state: string;
      tags: string[];
    }>
  ): Promise<number>;

  deleteMany(filters: ShiftSearchFilters): Promise<number>;

  // Advanced queries
  findSimilarShifts(
    shiftId: UniqueEntityID,
    criteria: ('duration' | 'earnings' | 'orders' | 'startTime' | 'location')[]
  ): Promise<Shift[]>;

  findOptimalShiftSchedule(
    riderId: UniqueEntityID,
    preferences: {
      preferredHours?: number;
      preferredDays?: string[];
      minEarnings?: number;
      maxDistance?: number;
    },
    timeframe: { start: Date; end: Date }
  ): Promise<Array<{
    date: Date;
    startTime: Date;
    endTime: Date;
    expectedEarnings: number;
    expectedOrders: number;
  }>>;

  // Cache management
  invalidateCache(shiftId?: UniqueEntityID): Promise<void>;
  warmupCache(shiftIds: UniqueEntityID[]): Promise<void>;

  // Event sourcing support
  getVersion(id: UniqueEntityID): Promise<number>;
  saveWithVersion(shift: Shift, expectedVersion: number): Promise<void>;
}