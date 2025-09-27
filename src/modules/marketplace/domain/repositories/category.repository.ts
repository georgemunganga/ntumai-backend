import { Category } from '../entities/category.entity';

export interface CategorySearchCriteria {
  name?: string;
  description?: string;
  parentId?: string;
  isActive?: boolean;
  hasProducts?: boolean;
  minProductCount?: number;
  maxProductCount?: number;
  createdAfter?: Date;
  createdBefore?: Date;
}

export interface CategorySortOptions {
  field: 'name' | 'sortOrder' | 'productCount' | 'createdAt' | 'updatedAt';
  direction: 'asc' | 'desc';
}

export interface CategoryPaginationOptions {
  page: number;
  limit: number;
  sort?: CategorySortOptions;
}

export interface CategorySearchResult {
  categories: Category[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface CategoryTree {
  category: Category;
  children: CategoryTree[];
  depth: number;
  path: string[];
}

export interface CategoryHierarchy {
  rootCategories: CategoryTree[];
  totalCategories: number;
  maxDepth: number;
}

export interface CategoryRepository {
  // Basic CRUD operations
  save(category: Category): Promise<Category>;
  findById(id: string): Promise<Category | null>;
  findByName(name: string): Promise<Category | null>;
  findBySlug(slug: string): Promise<Category | null>;
  update(category: Category): Promise<Category>;
  delete(id: string): Promise<void>;
  exists(id: string): Promise<boolean>;
  existsByName(name: string, excludeId?: string): Promise<boolean>;
  existsBySlug(slug: string, excludeId?: string): Promise<boolean>;

  // Bulk operations
  saveMany(categories: Category[]): Promise<Category[]>;
  findByIds(ids: string[]): Promise<Category[]>;
  updateMany(categories: Category[]): Promise<Category[]>;
  deleteMany(ids: string[]): Promise<void>;

  // Search and filtering
  search(criteria: CategorySearchCriteria, pagination?: CategoryPaginationOptions): Promise<CategorySearchResult>;
  findAll(pagination?: CategoryPaginationOptions): Promise<CategorySearchResult>;
  findActive(pagination?: CategoryPaginationOptions): Promise<CategorySearchResult>;
  findInactive(pagination?: CategoryPaginationOptions): Promise<CategorySearchResult>;

  // Hierarchy management
  findRootCategories(pagination?: CategoryPaginationOptions): Promise<CategorySearchResult>;
  findByParent(parentId: string, pagination?: CategoryPaginationOptions): Promise<CategorySearchResult>;
  findChildren(categoryId: string, pagination?: CategoryPaginationOptions): Promise<CategorySearchResult>;
  findDescendants(categoryId: string, maxDepth?: number): Promise<Category[]>;
  findAncestors(categoryId: string): Promise<Category[]>;
  findSiblings(categoryId: string, pagination?: CategoryPaginationOptions): Promise<CategorySearchResult>;
  getFullHierarchy(): Promise<CategoryHierarchy>;
  getCategoryTree(rootId?: string): Promise<CategoryTree[]>;
  getCategoryPath(categoryId: string): Promise<Category[]>;
  getCategoryBreadcrumb(categoryId: string): Promise<string[]>;

  // Parent-child relationships
  hasChildren(categoryId: string): Promise<boolean>;
  hasParent(categoryId: string): Promise<boolean>;
  getChildrenCount(categoryId: string): Promise<number>;
  getDescendantCount(categoryId: string): Promise<number>;
  isAncestorOf(ancestorId: string, descendantId: string): Promise<boolean>;
  isDescendantOf(descendantId: string, ancestorId: string): Promise<boolean>;
  canMoveToParent(categoryId: string, newParentId: string): Promise<boolean>;
  moveToParent(categoryId: string, newParentId: string | null): Promise<void>;

  // Product count management
  updateProductCount(categoryId: string, count: number): Promise<void>;
  incrementProductCount(categoryId: string, increment: number): Promise<void>;
  decrementProductCount(categoryId: string, decrement: number): Promise<void>;
  recalculateProductCount(categoryId: string): Promise<number>;
  recalculateAllProductCounts(): Promise<void>;
  findWithProducts(pagination?: CategoryPaginationOptions): Promise<CategorySearchResult>;
  findWithoutProducts(pagination?: CategoryPaginationOptions): Promise<CategorySearchResult>;
  findByProductCountRange(min: number, max: number, pagination?: CategoryPaginationOptions): Promise<CategorySearchResult>;

  // Sort order management
  updateSortOrder(categoryId: string, sortOrder: number): Promise<void>;
  reorderCategories(categoryIds: string[]): Promise<void>;
  getNextSortOrder(parentId?: string): Promise<number>;
  findBySortOrder(sortOrder: number, parentId?: string): Promise<Category | null>;
  swapSortOrder(categoryId1: string, categoryId2: string): Promise<void>;

  // Status management
  activate(categoryId: string): Promise<void>;
  deactivate(categoryId: string): Promise<void>;
  toggleStatus(categoryId: string): Promise<void>;
  activateWithChildren(categoryId: string): Promise<void>;
  deactivateWithChildren(categoryId: string): Promise<void>;

  // Search and filtering by hierarchy
  findByDepth(depth: number, pagination?: CategoryPaginationOptions): Promise<CategorySearchResult>;
  findByMaxDepth(maxDepth: number, pagination?: CategoryPaginationOptions): Promise<CategorySearchResult>;
  findLeafCategories(pagination?: CategoryPaginationOptions): Promise<CategorySearchResult>;
  findBranchCategories(pagination?: CategoryPaginationOptions): Promise<CategorySearchResult>;

  // Analytics and statistics
  getCategoryCount(): Promise<number>;
  getActiveCategoryCount(): Promise<number>;
  getRootCategoryCount(): Promise<number>;
  getMaxDepth(): Promise<number>;
  getAverageProductCount(): Promise<number>;
  getMostPopularCategories(limit: number): Promise<Category[]>;
  getLeastPopularCategories(limit: number): Promise<Category[]>;
  getCategoriesWithMostProducts(limit: number): Promise<Category[]>;
  getEmptyCategories(): Promise<Category[]>;

  // SEO and URL management
  generateSlug(name: string, excludeId?: string): Promise<string>;
  updateSlug(categoryId: string, slug: string): Promise<void>;
  findByKeywords(keywords: string[], pagination?: CategoryPaginationOptions): Promise<CategorySearchResult>;

  // Image management
  updateImage(categoryId: string, imageUrl: string): Promise<void>;
  removeImage(categoryId: string): Promise<void>;
  findWithImages(pagination?: CategoryPaginationOptions): Promise<CategorySearchResult>;
  findWithoutImages(pagination?: CategoryPaginationOptions): Promise<CategorySearchResult>;

  // Validation and business rules
  validateName(name: string, excludeId?: string): Promise<boolean>;
  validateSlug(slug: string, excludeId?: string): Promise<boolean>;
  validateParentAssignment(categoryId: string, parentId: string): Promise<boolean>;
  canDelete(categoryId: string): Promise<boolean>;
  canDeactivate(categoryId: string): Promise<boolean>;
  detectCircularReference(categoryId: string, parentId: string): Promise<boolean>;

  // Bulk operations for hierarchy
  moveMultipleToParent(categoryIds: string[], newParentId: string | null): Promise<void>;
  deleteSubtree(categoryId: string): Promise<void>;
  copySubtree(sourceCategoryId: string, targetParentId: string | null): Promise<Category>;
  mergeCategories(sourceCategoryId: string, targetCategoryId: string): Promise<void>;

  // Import/Export
  exportHierarchy(): Promise<any>;
  importHierarchy(data: any): Promise<void>;
  findForExport(criteria: CategorySearchCriteria): Promise<Category[]>;

  // Cache management
  clearHierarchyCache(): Promise<void>;
  refreshHierarchyCache(): Promise<void>;
  clearCache(): Promise<void>;
  refreshCache(categoryId: string): Promise<void>;

  // Reporting
  getCategoryReport(): Promise<any>;
  getHierarchyReport(): Promise<any>;
  getProductDistributionReport(): Promise<any>;

  // Recent changes and audit
  getRecentChanges(limit: number): Promise<any[]>;
  getCategoryHistory(categoryId: string): Promise<any[]>;

  // Integration support
  findModifiedSince(date: Date): Promise<Category[]>;
  findForSync(lastSyncDate: Date): Promise<Category[]>;
  markAsSynced(categoryIds: string[]): Promise<void>;

  // Advanced search
  searchInHierarchy(query: string, rootCategoryId?: string): Promise<Category[]>;
  findSimilarCategories(categoryId: string, limit: number): Promise<Category[]>;
  suggestCategories(query: string, limit: number): Promise<Category[]>;

  // Performance optimization
  preloadHierarchy(): Promise<void>;
  warmupCache(): Promise<void>;
  optimizeHierarchy(): Promise<void>;
}