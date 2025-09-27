import { Brand } from '../entities/brand.entity';

export interface BrandSearchCriteria {
  name?: string;
  description?: string;
  website?: string;
  country?: string;
  isActive?: boolean;
  hasProducts?: boolean;
  minProductCount?: number;
  maxProductCount?: number;
  createdAfter?: Date;
  createdBefore?: Date;
  tags?: string[];
}

export interface BrandSortOptions {
  field: 'name' | 'productCount' | 'averageRating' | 'country' | 'createdAt' | 'updatedAt';
  direction: 'asc' | 'desc';
}

export interface BrandPaginationOptions {
  page: number;
  limit: number;
  sort?: BrandSortOptions;
}

export interface BrandSearchResult {
  brands: Brand[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface BrandStatistics {
  totalBrands: number;
  activeBrands: number;
  brandsWithProducts: number;
  averageProductsPerBrand: number;
  topBrandsByProducts: Brand[];
  topBrandsByRating: Brand[];
  brandsByCountry: { [country: string]: number };
}

export interface BrandRepository {
  // Basic CRUD operations
  save(brand: Brand): Promise<Brand>;
  findById(id: string): Promise<Brand | null>;
  findByName(name: string): Promise<Brand | null>;
  findBySlug(slug: string): Promise<Brand | null>;
  update(brand: Brand): Promise<Brand>;
  delete(id: string): Promise<void>;
  exists(id: string): Promise<boolean>;
  existsByName(name: string, excludeId?: string): Promise<boolean>;
  existsBySlug(slug: string, excludeId?: string): Promise<boolean>;

  // Bulk operations
  saveMany(brands: Brand[]): Promise<Brand[]>;
  findByIds(ids: string[]): Promise<Brand[]>;
  updateMany(brands: Brand[]): Promise<Brand[]>;
  deleteMany(ids: string[]): Promise<void>;

  // Search and filtering
  search(criteria: BrandSearchCriteria, pagination?: BrandPaginationOptions): Promise<BrandSearchResult>;
  findAll(pagination?: BrandPaginationOptions): Promise<BrandSearchResult>;
  findActive(pagination?: BrandPaginationOptions): Promise<BrandSearchResult>;
  findInactive(pagination?: BrandPaginationOptions): Promise<BrandSearchResult>;
  findByCountry(country: string, pagination?: BrandPaginationOptions): Promise<BrandSearchResult>;
  findByWebsite(website: string): Promise<Brand | null>;

  // Product count management
  updateProductCount(brandId: string, count: number): Promise<void>;
  incrementProductCount(brandId: string, increment: number): Promise<void>;
  decrementProductCount(brandId: string, decrement: number): Promise<void>;
  recalculateProductCount(brandId: string): Promise<number>;
  recalculateAllProductCounts(): Promise<void>;
  findWithProducts(pagination?: BrandPaginationOptions): Promise<BrandSearchResult>;
  findWithoutProducts(pagination?: BrandPaginationOptions): Promise<BrandSearchResult>;
  findByProductCountRange(min: number, max: number, pagination?: BrandPaginationOptions): Promise<BrandSearchResult>;

  // Rating management
  updateAverageRating(brandId: string, rating: number, reviewCount: number): Promise<void>;
  addRating(brandId: string, rating: number): Promise<void>;
  removeRating(brandId: string, rating: number): Promise<void>;
  recalculateAverageRating(brandId: string): Promise<{ rating: number; reviewCount: number }>;
  findByRatingRange(minRating: number, maxRating: number, pagination?: BrandPaginationOptions): Promise<BrandSearchResult>;
  findTopRated(limit: number): Promise<Brand[]>;
  findLowestRated(limit: number): Promise<Brand[]>;

  // Status management
  activate(brandId: string): Promise<void>;
  deactivate(brandId: string): Promise<void>;
  toggleStatus(brandId: string): Promise<void>;
  bulkActivate(brandIds: string[]): Promise<void>;
  bulkDeactivate(brandIds: string[]): Promise<void>;

  // Tag management
  addTag(brandId: string, tag: string): Promise<void>;
  removeTag(brandId: string, tag: string): Promise<void>;
  updateTags(brandId: string, tags: string[]): Promise<void>;
  findByTag(tag: string, pagination?: BrandPaginationOptions): Promise<BrandSearchResult>;
  findByTags(tags: string[], matchAll: boolean, pagination?: BrandPaginationOptions): Promise<BrandSearchResult>;
  getAllTags(): Promise<string[]>;
  getPopularTags(limit: number): Promise<{ tag: string; count: number }[]>;

  // Image management
  updateLogo(brandId: string, logoUrl: string): Promise<void>;
  removeLogo(brandId: string): Promise<void>;
  updateBanner(brandId: string, bannerUrl: string): Promise<void>;
  removeBanner(brandId: string): Promise<void>;
  findWithLogos(pagination?: BrandPaginationOptions): Promise<BrandSearchResult>;
  findWithoutLogos(pagination?: BrandPaginationOptions): Promise<BrandSearchResult>;
  findWithBanners(pagination?: BrandPaginationOptions): Promise<BrandSearchResult>;
  findWithoutBanners(pagination?: BrandPaginationOptions): Promise<BrandSearchResult>;

  // SEO and URL management
  generateSlug(name: string, excludeId?: string): Promise<string>;
  updateSlug(brandId: string, slug: string): Promise<void>;
  updateSeoTitle(brandId: string, seoTitle: string): Promise<void>;
  updateSeoDescription(brandId: string, seoDescription: string): Promise<void>;
  updateSeoKeywords(brandId: string, seoKeywords: string[]): Promise<void>;
  findByKeywords(keywords: string[], pagination?: BrandPaginationOptions): Promise<BrandSearchResult>;

  // Analytics and statistics
  getBrandCount(): Promise<number>;
  getActiveBrandCount(): Promise<number>;
  getBrandStatistics(): Promise<BrandStatistics>;
  getMostPopularBrands(limit: number): Promise<Brand[]>;
  getFastestGrowingBrands(limit: number, days: number): Promise<Brand[]>;
  getBrandsByCountry(): Promise<{ [country: string]: Brand[] }>;
  getCountryStatistics(): Promise<{ [country: string]: number }>;
  getAverageRatingByCountry(): Promise<{ [country: string]: number }>;

  // Search and autocomplete
  searchByName(query: string, limit: number): Promise<Brand[]>;
  suggestBrands(query: string, limit: number): Promise<Brand[]>;
  findSimilarBrands(brandId: string, limit: number): Promise<Brand[]>;
  autocomplete(query: string, limit: number): Promise<{ id: string; name: string; logo?: string }[]>;

  // Validation and business rules
  validateName(name: string, excludeId?: string): Promise<boolean>;
  validateSlug(slug: string, excludeId?: string): Promise<boolean>;
  validateWebsite(website: string, excludeId?: string): Promise<boolean>;
  canDelete(brandId: string): Promise<boolean>;
  canDeactivate(brandId: string): Promise<boolean>;

  // Featured brands
  setFeatured(brandId: string, featured: boolean): Promise<void>;
  findFeatured(pagination?: BrandPaginationOptions): Promise<BrandSearchResult>;
  getFeaturedBrands(limit: number): Promise<Brand[]>;
  reorderFeatured(brandIds: string[]): Promise<void>;

  // Social media and contact
  updateSocialMedia(brandId: string, socialMedia: { [platform: string]: string }): Promise<void>;
  updateContactInfo(brandId: string, contactInfo: { email?: string; phone?: string; address?: string }): Promise<void>;
  findBySocialMedia(platform: string, handle: string): Promise<Brand | null>;
  findByEmail(email: string): Promise<Brand | null>;
  findByPhone(phone: string): Promise<Brand | null>;

  // Import/Export
  exportBrands(criteria?: BrandSearchCriteria): Promise<any[]>;
  importBrands(data: any[]): Promise<Brand[]>;
  findForExport(criteria: BrandSearchCriteria): Promise<Brand[]>;

  // Cache management
  clearCache(): Promise<void>;
  refreshCache(brandId: string): Promise<void>;
  warmupCache(): Promise<void>;
  clearSearchCache(): Promise<void>;

  // Reporting
  getBrandReport(): Promise<any>;
  getPerformanceReport(brandId: string): Promise<any>;
  getComparisonReport(brandIds: string[]): Promise<any>;
  getTrendReport(days: number): Promise<any>;

  // Recent changes and audit
  getRecentChanges(limit: number): Promise<any[]>;
  getBrandHistory(brandId: string): Promise<any[]>;
  getActivityLog(brandId: string, limit: number): Promise<any[]>;

  // Integration support
  findModifiedSince(date: Date): Promise<Brand[]>;
  findForSync(lastSyncDate: Date): Promise<Brand[]>;
  markAsSynced(brandIds: string[]): Promise<void>;
  syncBrandData(brandId: string, externalData: any): Promise<void>;

  // Advanced filtering
  findByEstablishedYear(year: number): Promise<Brand[]>;
  findByEstablishedYearRange(startYear: number, endYear: number): Promise<Brand[]>;
  findByHeadquarters(city: string, country?: string): Promise<Brand[]>;
  findByIndustry(industry: string): Promise<Brand[]>;
  findByCompanySize(size: 'startup' | 'small' | 'medium' | 'large' | 'enterprise'): Promise<Brand[]>;

  // Relationship management
  addPartnership(brandId: string, partnerBrandId: string, type: string): Promise<void>;
  removePartnership(brandId: string, partnerBrandId: string): Promise<void>;
  getPartners(brandId: string): Promise<Brand[]>;
  findCompetitors(brandId: string, limit: number): Promise<Brand[]>;

  // Performance optimization
  preloadBrandData(): Promise<void>;
  optimizeSearch(): Promise<void>;
  rebuildSearchIndex(): Promise<void>;
}