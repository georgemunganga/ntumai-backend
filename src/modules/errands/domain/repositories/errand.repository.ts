import { ErrandEntity } from '../entities';
import { ErrandStatus, Priority } from '../value-objects';

export interface ErrandFilters {
  status?: ErrandStatus[];
  priority?: Priority[];
  category?: string[];
  assignedTo?: string;
  createdBy?: string;
  dateFrom?: Date;
  dateTo?: Date;
  location?: {
    latitude: number;
    longitude: number;
    radiusKm: number;
  };
  search?: string;
  isOverdue?: boolean;
}

export interface ErrandSortOptions {
  field: 'createdAt' | 'updatedAt' | 'deadline' | 'priority' | 'status';
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

export interface ErrandRepository {
  /**
   * Save an errand entity
   */
  save(errand: ErrandEntity): Promise<ErrandEntity>;

  /**
   * Find an errand by ID
   */
  findById(id: string): Promise<ErrandEntity | null>;

  /**
   * Find errands with filters, sorting, and pagination
   */
  findMany(
    filters?: ErrandFilters,
    sort?: ErrandSortOptions,
    pagination?: PaginationOptions,
  ): Promise<PaginatedResult<ErrandEntity>>;

  /**
   * Find errands by user ID (created by or assigned to)
   */
  findByUserId(
    userId: string,
    filters?: Omit<ErrandFilters, 'createdBy' | 'assignedTo'>,
    sort?: ErrandSortOptions,
    pagination?: PaginationOptions,
  ): Promise<PaginatedResult<ErrandEntity>>;

  /**
   * Find errands created by a specific user
   */
  findByCreatedBy(
    userId: string,
    filters?: Omit<ErrandFilters, 'createdBy'>,
    sort?: ErrandSortOptions,
    pagination?: PaginationOptions,
  ): Promise<PaginatedResult<ErrandEntity>>;

  /**
   * Find errands assigned to a specific user
   */
  findByAssignedTo(
    userId: string,
    filters?: Omit<ErrandFilters, 'assignedTo'>,
    sort?: ErrandSortOptions,
    pagination?: PaginationOptions,
  ): Promise<PaginatedResult<ErrandEntity>>;

  /**
   * Find available errands (pending status, not assigned)
   */
  findAvailable(
    filters?: Omit<ErrandFilters, 'status' | 'assignedTo'>,
    sort?: ErrandSortOptions,
    pagination?: PaginationOptions,
  ): Promise<PaginatedResult<ErrandEntity>>;

  /**
   * Find errands by location within a radius
   */
  findByLocation(
    latitude: number,
    longitude: number,
    radiusKm: number,
    filters?: Omit<ErrandFilters, 'location'>,
    sort?: ErrandSortOptions,
    pagination?: PaginationOptions,
  ): Promise<PaginatedResult<ErrandEntity>>;

  /**
   * Find overdue errands
   */
  findOverdue(
    filters?: Omit<ErrandFilters, 'isOverdue'>,
    sort?: ErrandSortOptions,
    pagination?: PaginationOptions,
  ): Promise<PaginatedResult<ErrandEntity>>;

  /**
   * Count errands by status
   */
  countByStatus(userId?: string): Promise<Record<ErrandStatus, number>>;

  /**
   * Count errands by priority
   */
  countByPriority(userId?: string): Promise<Record<Priority, number>>;

  /**
   * Get errand statistics for a user
   */
  getStatistics(userId: string): Promise<{
    total: number;
    completed: number;
    cancelled: number;
    inProgress: number;
    pending: number;
    assigned: number;
    overdue: number;
    averageCompletionTime: number; // in minutes
    completionRate: number; // percentage
  }>;

  /**
   * Search errands by text
   */
  search(
    query: string,
    filters?: Omit<ErrandFilters, 'search'>,
    sort?: ErrandSortOptions,
    pagination?: PaginationOptions,
  ): Promise<PaginatedResult<ErrandEntity>>;

  /**
   * Update an errand
   */
  update(errand: ErrandEntity): Promise<ErrandEntity>;

  /**
   * Delete an errand (soft delete)
   */
  delete(id: string): Promise<void>;

  /**
   * Check if errand exists
   */
  exists(id: string): Promise<boolean>;

  /**
   * Check if user has access to errand
   */
  hasUserAccess(errandId: string, userId: string): Promise<boolean>;

  /**
   * Get errands that need attention (overdue, high priority, etc.)
   */
  findRequiringAttention(
    userId?: string,
    pagination?: PaginationOptions,
  ): Promise<PaginatedResult<ErrandEntity>>;

  /**
   * Get recent errands for a user
   */
  findRecent(
    userId: string,
    limit?: number,
  ): Promise<ErrandEntity[]>;

  /**
   * Bulk update errands status
   */
  bulkUpdateStatus(
    errandIds: string[],
    status: ErrandStatus,
    updatedBy: string,
  ): Promise<number>;

  /**
   * Get errands by category with statistics
   */
  findByCategory(
    category: string,
    filters?: Omit<ErrandFilters, 'category'>,
    sort?: ErrandSortOptions,
    pagination?: PaginationOptions,
  ): Promise<PaginatedResult<ErrandEntity>>;

  /**
   * Get popular categories
   */
  getPopularCategories(limit?: number): Promise<Array<{
    category: string;
    count: number;
    percentage: number;
  }>>;
}