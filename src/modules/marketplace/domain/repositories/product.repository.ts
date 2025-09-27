import { Product } from '../entities/product.entity';
import { ProductDetails } from '../value-objects/product-details.vo';
import { Price } from '../value-objects/price.vo';
import { Rating } from '../value-objects/rating.vo';

export interface ProductSearchCriteria {
  name?: string;
  description?: string;
  sku?: string;
  storeId?: string;
  categoryId?: string;
  brandId?: string;
  tags?: string[];
  status?: string;
  condition?: string;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  inStock?: boolean;
  isFeatured?: boolean;
  isDigital?: boolean;
  createdAfter?: Date;
  createdBefore?: Date;
}

export interface ProductSortOptions {
  field: 'name' | 'price' | 'rating' | 'reviewCount' | 'stockQuantity' | 'createdAt' | 'updatedAt';
  direction: 'asc' | 'desc';
}

export interface ProductPaginationOptions {
  page: number;
  limit: number;
  sort?: ProductSortOptions;
}

export interface ProductSearchResult {
  products: Product[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface ProductRepository {
  // Basic CRUD operations
  save(product: Product): Promise<Product>;
  findById(id: string): Promise<Product | null>;
  findBySku(sku: string): Promise<Product | null>;
  findByBarcode(barcode: string): Promise<Product | null>;
  update(product: Product): Promise<Product>;
  delete(id: string): Promise<void>;
  exists(id: string): Promise<boolean>;
  existsBySku(sku: string): Promise<boolean>;
  existsByBarcode(barcode: string): Promise<boolean>;

  // Bulk operations
  saveMany(products: Product[]): Promise<Product[]>;
  findByIds(ids: string[]): Promise<Product[]>;
  findBySkus(skus: string[]): Promise<Product[]>;
  updateMany(products: Product[]): Promise<Product[]>;
  deleteMany(ids: string[]): Promise<void>;

  // Search and filtering
  search(criteria: ProductSearchCriteria, pagination?: ProductPaginationOptions): Promise<ProductSearchResult>;
  findAll(pagination?: ProductPaginationOptions): Promise<ProductSearchResult>;
  findByStore(storeId: string, pagination?: ProductPaginationOptions): Promise<ProductSearchResult>;
  findByCategory(categoryId: string, pagination?: ProductPaginationOptions): Promise<ProductSearchResult>;
  findByBrand(brandId: string, pagination?: ProductPaginationOptions): Promise<ProductSearchResult>;
  findByTags(tags: string[], pagination?: ProductPaginationOptions): Promise<ProductSearchResult>;
  findByPriceRange(minPrice: number, maxPrice: number, pagination?: ProductPaginationOptions): Promise<ProductSearchResult>;
  findByRatingRange(minRating: number, maxRating: number, pagination?: ProductPaginationOptions): Promise<ProductSearchResult>;

  // Status-based queries
  findActive(pagination?: ProductPaginationOptions): Promise<ProductSearchResult>;
  findInactive(pagination?: ProductPaginationOptions): Promise<ProductSearchResult>;
  findOutOfStock(pagination?: ProductPaginationOptions): Promise<ProductSearchResult>;
  findDiscontinued(pagination?: ProductPaginationOptions): Promise<ProductSearchResult>;
  findFeatured(pagination?: ProductPaginationOptions): Promise<ProductSearchResult>;
  findDigital(pagination?: ProductPaginationOptions): Promise<ProductSearchResult>;
  findPhysical(pagination?: ProductPaginationOptions): Promise<ProductSearchResult>;

  // Stock management
  findLowStock(threshold: number, pagination?: ProductPaginationOptions): Promise<ProductSearchResult>;
  findInStock(pagination?: ProductPaginationOptions): Promise<ProductSearchResult>;
  updateStock(productId: string, quantity: number): Promise<void>;
  incrementStock(productId: string, quantity: number): Promise<void>;
  decrementStock(productId: string, quantity: number): Promise<void>;
  reserveStock(productId: string, quantity: number): Promise<boolean>;
  releaseStock(productId: string, quantity: number): Promise<void>;

  // Rating and review management
  updateRating(productId: string, rating: Rating): Promise<void>;
  addReview(productId: string, rating: number): Promise<void>;
  removeReview(productId: string, rating: number): Promise<void>;

  // Analytics and statistics
  getProductCount(): Promise<number>;
  getProductCountByStore(storeId: string): Promise<number>;
  getProductCountByCategory(categoryId: string): Promise<number>;
  getProductCountByBrand(brandId: string): Promise<number>;
  getProductCountByStatus(status: string): Promise<number>;
  getAveragePrice(): Promise<number>;
  getAveragePriceByCategory(categoryId: string): Promise<number>;
  getAverageRating(): Promise<number>;
  getTotalStockValue(): Promise<number>;
  getTopRatedProducts(limit: number): Promise<Product[]>;
  getBestSellingProducts(limit: number): Promise<Product[]>;
  getRecentlyAddedProducts(limit: number): Promise<Product[]>;
  getMostViewedProducts(limit: number): Promise<Product[]>;

  // Variant management
  findProductsWithVariants(pagination?: ProductPaginationOptions): Promise<ProductSearchResult>;
  findProductsWithoutVariants(pagination?: ProductPaginationOptions): Promise<ProductSearchResult>;
  findByVariantOption(optionName: string, optionValue: string, pagination?: ProductPaginationOptions): Promise<ProductSearchResult>;

  // Category and brand relationships
  findSimilarProducts(productId: string, limit: number): Promise<Product[]>;
  findRelatedProducts(productId: string, limit: number): Promise<Product[]>;
  findComplementaryProducts(productId: string, limit: number): Promise<Product[]>;

  // SEO and search optimization
  findBySlug(slug: string): Promise<Product | null>;
  findByKeywords(keywords: string[], pagination?: ProductPaginationOptions): Promise<ProductSearchResult>;
  findPopularSearchTerms(limit: number): Promise<string[]>;

  // Promotion and discount management
  findEligibleForPromotion(promotionId: string, pagination?: ProductPaginationOptions): Promise<ProductSearchResult>;
  findOnSale(pagination?: ProductPaginationOptions): Promise<ProductSearchResult>;
  findWithDiscount(pagination?: ProductPaginationOptions): Promise<ProductSearchResult>;

  // Reporting and exports
  findForExport(criteria: ProductSearchCriteria): Promise<Product[]>;
  getProductReport(storeId?: string, categoryId?: string, brandId?: string): Promise<any>;
  getInventoryReport(storeId?: string): Promise<any>;
  getSalesReport(productId: string, startDate: Date, endDate: Date): Promise<any>;

  // Cache management
  clearCache(): Promise<void>;
  refreshCache(productId: string): Promise<void>;

  // Validation and business rules
  validateSku(sku: string, excludeProductId?: string): Promise<boolean>;
  validateBarcode(barcode: string, excludeProductId?: string): Promise<boolean>;
  canDelete(productId: string): Promise<boolean>;
  canDiscontinue(productId: string): Promise<boolean>;

  // Audit and history
  getProductHistory(productId: string): Promise<any[]>;
  getRecentChanges(limit: number): Promise<any[]>;

  // Integration support
  findModifiedSince(date: Date): Promise<Product[]>;
  findForSync(lastSyncDate: Date): Promise<Product[]>;
  markAsSynced(productIds: string[]): Promise<void>;
}