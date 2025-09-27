import { ErrandHistoryEntity, ErrandHistoryAction } from '../entities';
import { ErrandStatus } from '../value-objects';

export interface ErrandHistoryFilters {
  errandId?: string;
  action?: ErrandHistoryAction[];
  performedBy?: string;
  dateFrom?: Date;
  dateTo?: Date;
  previousStatus?: ErrandStatus[];
  newStatus?: ErrandStatus[];
  hasLocation?: boolean;
  hasNotes?: boolean;
  isCritical?: boolean;
}

export interface ErrandHistorySortOptions {
  field: 'performedAt' | 'action' | 'performedBy';
  direction: 'asc' | 'desc';
}

export interface PaginationOptions {
  page: number;
  limit: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface ErrandHistoryRepository {
  /**
   * Save an errand history entry
   */
  save(history: ErrandHistoryEntity): Promise<ErrandHistoryEntity>;

  /**
   * Find a history entry by ID
   */
  findById(id: string): Promise<ErrandHistoryEntity | null>;

  /**
   * Find history entries with filters, sorting, and pagination
   */
  findMany(
    filters?: ErrandHistoryFilters,
    sort?: ErrandHistorySortOptions,
    pagination?: PaginationOptions,
  ): Promise<PaginatedResult<ErrandHistoryEntity>>;

  /**
   * Find history entries for a specific errand
   */
  findByErrandId(
    errandId: string,
    filters?: Omit<ErrandHistoryFilters, 'errandId'>,
    sort?: ErrandHistorySortOptions,
    pagination?: PaginationOptions,
  ): Promise<PaginatedResult<ErrandHistoryEntity>>;

  /**
   * Find history entries performed by a specific user
   */
  findByPerformedBy(
    userId: string,
    filters?: Omit<ErrandHistoryFilters, 'performedBy'>,
    sort?: ErrandHistorySortOptions,
    pagination?: PaginationOptions,
  ): Promise<PaginatedResult<ErrandHistoryEntity>>;

  /**
   * Find history entries by action type
   */
  findByAction(
    action: ErrandHistoryAction,
    filters?: Omit<ErrandHistoryFilters, 'action'>,
    sort?: ErrandHistorySortOptions,
    pagination?: PaginationOptions,
  ): Promise<PaginatedResult<ErrandHistoryEntity>>;

  /**
   * Find critical history entries (status changes, assignments, etc.)
   */
  findCritical(
    filters?: Omit<ErrandHistoryFilters, 'isCritical'>,
    sort?: ErrandHistorySortOptions,
    pagination?: PaginationOptions,
  ): Promise<PaginatedResult<ErrandHistoryEntity>>;

  /**
   * Find history entries with location data
   */
  findWithLocation(
    filters?: Omit<ErrandHistoryFilters, 'hasLocation'>,
    sort?: ErrandHistorySortOptions,
    pagination?: PaginationOptions,
  ): Promise<PaginatedResult<ErrandHistoryEntity>>;

  /**
   * Find history entries within a date range
   */
  findByDateRange(
    startDate: Date,
    endDate: Date,
    filters?: Omit<ErrandHistoryFilters, 'dateFrom' | 'dateTo'>,
    sort?: ErrandHistorySortOptions,
    pagination?: PaginationOptions,
  ): Promise<PaginatedResult<ErrandHistoryEntity>>;

  /**
   * Get the complete timeline for an errand
   */
  getErrandTimeline(
    errandId: string,
    includeNonCritical?: boolean,
  ): Promise<ErrandHistoryEntity[]>;

  /**
   * Get the latest history entry for an errand
   */
  getLatestByErrandId(errandId: string): Promise<ErrandHistoryEntity | null>;

  /**
   * Get the first history entry for an errand (creation)
   */
  getFirstByErrandId(errandId: string): Promise<ErrandHistoryEntity | null>;

  /**
   * Find status change history for an errand
   */
  findStatusChanges(
    errandId: string,
    sort?: ErrandHistorySortOptions,
  ): Promise<ErrandHistoryEntity[]>;

  /**
   * Get user activity history
   */
  getUserActivity(
    userId: string,
    dateFrom?: Date,
    dateTo?: Date,
    pagination?: PaginationOptions,
  ): Promise<PaginatedResult<ErrandHistoryEntity>>;

  /**
   * Get activity statistics for a user
   */
  getUserActivityStatistics(
    userId: string,
    dateFrom?: Date,
    dateTo?: Date,
  ): Promise<{
    totalActions: number;
    actionBreakdown: Record<ErrandHistoryAction, number>;
    errandsAffected: number;
    averageActionsPerErrand: number;
    mostActiveDay: string;
    mostCommonAction: ErrandHistoryAction;
  }>;

  /**
   * Get errand lifecycle statistics
   */
  getErrandLifecycleStatistics(
    errandId: string,
  ): Promise<{
    totalDuration: number; // in minutes from creation to completion/cancellation
    timeToAssignment?: number; // in minutes
    timeToStart?: number; // in minutes
    timeToCompletion?: number; // in minutes
    statusChanges: number;
    totalActions: number;
    uniqueActors: number;
    hasLocationTracking: boolean;
  }>;

  /**
   * Get system-wide activity statistics
   */
  getSystemActivityStatistics(
    dateFrom?: Date,
    dateTo?: Date,
  ): Promise<{
    totalActions: number;
    actionBreakdown: Record<ErrandHistoryAction, number>;
    uniqueUsers: number;
    uniqueErrands: number;
    averageActionsPerErrand: number;
    averageActionsPerUser: number;
    peakActivityHour: number;
    peakActivityDay: string;
  }>;

  /**
   * Find history entries that need attention (errors, failures, etc.)
   */
  findRequiringAttention(
    filters?: ErrandHistoryFilters,
    pagination?: PaginationOptions,
  ): Promise<PaginatedResult<ErrandHistoryEntity>>;

  /**
   * Bulk save history entries
   */
  bulkSave(histories: ErrandHistoryEntity[]): Promise<ErrandHistoryEntity[]>;

  /**
   * Delete history entries older than specified date
   */
  deleteOlderThan(date: Date): Promise<number>;

  /**
   * Count history entries by filters
   */
  count(filters?: ErrandHistoryFilters): Promise<number>;

  /**
   * Check if user has access to history entry
   */
  hasUserAccess(historyId: string, userId: string): Promise<boolean>;

  /**
   * Get performance metrics for errands
   */
  getPerformanceMetrics(
    dateFrom?: Date,
    dateTo?: Date,
  ): Promise<{
    averageCompletionTime: number; // in minutes
    averageAssignmentTime: number; // in minutes
    averageStartTime: number; // in minutes
    completionRate: number; // percentage
    cancellationRate: number; // percentage
    onTimeCompletionRate: number; // percentage
    statusDistribution: Record<ErrandStatus, number>;
  }>;

  /**
   * Find history entries by location proximity
   */
  findByLocationProximity(
    latitude: number,
    longitude: number,
    radiusKm: number,
    filters?: Omit<ErrandHistoryFilters, 'hasLocation'>,
    sort?: ErrandHistorySortOptions,
    pagination?: PaginationOptions,
  ): Promise<PaginatedResult<ErrandHistoryEntity>>;

  /**
   * Get audit trail for an errand (detailed history with metadata)
   */
  getAuditTrail(
    errandId: string,
    includeMetadata?: boolean,
  ): Promise<ErrandHistoryEntity[]>;

  /**
   * Export history data for reporting
   */
  exportData(
    filters?: ErrandHistoryFilters,
    format?: 'json' | 'csv',
  ): Promise<string>;
}