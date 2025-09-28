import { ErrandTemplateEntity } from '../entities';
import { Priority } from '../value-objects';

export interface ErrandTemplateFilters {
  category?: string[];
  createdBy?: string;
  isActive?: boolean;
  tags?: string[];
  search?: string;
  priceRange?: {
    min?: number;
    max?: number;
  };
  durationRange?: {
    min?: number; // in minutes
    max?: number; // in minutes
  };
  priority?: Priority[];
}

export interface ErrandTemplateSortOptions {
  field: 'name' | 'category' | 'createdAt' | 'updatedAt' | 'usageCount' | 'estimatedPrice' | 'estimatedDuration';
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

export interface ErrandTemplateRepository {
  /**
   * Save an errand template entity
   */
  save(template: ErrandTemplateEntity): Promise<ErrandTemplateEntity>;

  /**
   * Find a template by ID
   */
  findById(id: string): Promise<ErrandTemplateEntity | null>;

  /**
   * Find templates with filters, sorting, and pagination
   */
  findMany(
    filters?: ErrandTemplateFilters,
    sort?: ErrandTemplateSortOptions,
    pagination?: PaginationOptions,
  ): Promise<PaginatedResult<ErrandTemplateEntity>>;

  /**
   * Find templates created by a specific user
   */
  findByCreatedBy(
    userId: string,
    filters?: Omit<ErrandTemplateFilters, 'createdBy'>,
    sort?: ErrandTemplateSortOptions,
    pagination?: PaginationOptions,
  ): Promise<PaginatedResult<ErrandTemplateEntity>>;

  /**
   * Find active templates
   */
  findActive(
    filters?: Omit<ErrandTemplateFilters, 'isActive'>,
    sort?: ErrandTemplateSortOptions,
    pagination?: PaginationOptions,
  ): Promise<PaginatedResult<ErrandTemplateEntity>>;

  /**
   * Find templates by category
   */
  findByCategory(
    category: string,
    filters?: Omit<ErrandTemplateFilters, 'category'>,
    sort?: ErrandTemplateSortOptions,
    pagination?: PaginationOptions,
  ): Promise<PaginatedResult<ErrandTemplateEntity>>;

  /**
   * Find templates by tags
   */
  findByTags(
    tags: string[],
    filters?: Omit<ErrandTemplateFilters, 'tags'>,
    sort?: ErrandTemplateSortOptions,
    pagination?: PaginationOptions,
  ): Promise<PaginatedResult<ErrandTemplateEntity>>;

  /**
   * Find public templates (available to all users)
   */
  findPublic(
    filters?: ErrandTemplateFilters,
    sort?: ErrandTemplateSortOptions,
    pagination?: PaginationOptions,
  ): Promise<PaginatedResult<ErrandTemplateEntity>>;

  /**
   * Find templates accessible by a user (created by user or public)
   */
  findAccessibleByUser(
    userId: string,
    filters?: ErrandTemplateFilters,
    sort?: ErrandTemplateSortOptions,
    pagination?: PaginationOptions,
  ): Promise<PaginatedResult<ErrandTemplateEntity>>;

  /**
   * Find most used templates
   */
  findMostUsed(
    limit?: number,
    filters?: ErrandTemplateFilters,
  ): Promise<ErrandTemplateEntity[]>;

  /**
   * Find recently created templates
   */
  findRecent(
    limit?: number,
    filters?: ErrandTemplateFilters,
  ): Promise<ErrandTemplateEntity[]>;

  /**
   * Search templates by text
   */
  search(
    query: string,
    filters?: Omit<ErrandTemplateFilters, 'search'>,
    sort?: ErrandTemplateSortOptions,
    pagination?: PaginationOptions,
  ): Promise<PaginatedResult<ErrandTemplateEntity>>;

  /**
   * Update a template
   */
  update(template: ErrandTemplateEntity): Promise<ErrandTemplateEntity>;

  /**
   * Delete a template (soft delete)
   */
  delete(id: string): Promise<void>;

  /**
   * Check if template exists
   */
  exists(id: string): Promise<boolean>;

  /**
   * Check if user has access to template
   */
  hasUserAccess(templateId: string, userId: string): Promise<boolean>;

  /**
   * Increment usage count for a template
   */
  incrementUsage(id: string): Promise<void>;

  /**
   * Get template statistics
   */
  getStatistics(userId?: string): Promise<{
    total: number;
    active: number;
    inactive: number;
    public: number;
    private: number;
    totalUsage: number;
    averageUsage: number;
    categoriesCount: number;
    tagsCount: number;
  }>;

  /**
   * Get all unique categories
   */
  getCategories(): Promise<string[]>;

  /**
   * Get all unique tags
   */
  getTags(): Promise<string[]>;

  /**
   * Get popular categories with usage count
   */
  getPopularCategories(limit?: number): Promise<Array<{
    category: string;
    count: number;
    percentage: number;
  }>>;

  /**
   * Get popular tags with usage count
   */
  getPopularTags(limit?: number): Promise<Array<{
    tag: string;
    count: number;
    percentage: number;
  }>>;

  /**
   * Find similar templates based on category and tags
   */
  findSimilar(
    templateId: string,
    limit?: number,
  ): Promise<ErrandTemplateEntity[]>;

  /**
   * Bulk activate/deactivate templates
   */
  bulkUpdateStatus(
    templateIds: string[],
    isActive: boolean,
    updatedBy: string,
  ): Promise<number>;

  /**
   * Get templates with price range statistics
   */
  getPriceRangeStatistics(): Promise<{
    min: number;
    max: number;
    average: number;
    median: number;
    ranges: Array<{
      range: string;
      count: number;
      percentage: number;
    }>;
  }>;

  /**
   * Get templates with duration range statistics
   */
  getDurationRangeStatistics(): Promise<{
    min: number; // in minutes
    max: number; // in minutes
    average: number; // in minutes
    median: number; // in minutes
    ranges: Array<{
      range: string;
      count: number;
      percentage: number;
    }>;
  }>;

  /**
   * Find templates by name (exact or partial match)
   */
  findByName(
    name: string,
    exactMatch?: boolean,
  ): Promise<ErrandTemplateEntity[]>;

  /**
   * Check if template name is unique for a user
   */
  isNameUnique(name: string, userId: string, excludeId?: string): Promise<boolean>;
}