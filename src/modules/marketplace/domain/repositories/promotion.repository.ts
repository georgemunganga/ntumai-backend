import { Promotion } from '../entities/promotion.entity';

export interface PromotionSearchCriteria {
  code?: string;
  title?: string;
  type?: string;
  status?: string;
  isActive?: boolean;
  storeId?: string;
  productId?: string;
  categoryId?: string;
  minValue?: number;
  maxValue?: number;
  currency?: string;
  startDateAfter?: Date;
  startDateBefore?: Date;
  endDateAfter?: Date;
  endDateBefore?: Date;
  hasUsageLimit?: boolean;
  isExpired?: boolean;
  isUsageLimitReached?: boolean;
  createdAfter?: Date;
  createdBefore?: Date;
}

export interface PromotionSortOptions {
  field: 'code' | 'title' | 'type' | 'value' | 'startDate' | 'endDate' | 'usageCount' | 'createdAt';
  direction: 'asc' | 'desc';
}

export interface PromotionPaginationOptions {
  page: number;
  limit: number;
  sort?: PromotionSortOptions;
}

export interface PromotionSearchResult {
  promotions: Promotion[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface PromotionStatistics {
  totalPromotions: number;
  activePromotions: number;
  expiredPromotions: number;
  usedPromotions: number;
  totalDiscountGiven: number;
  averageDiscountValue: number;
  mostUsedPromotions: { promotion: Promotion; usageCount: number }[];
  promotionsByType: { [type: string]: number };
  conversionRate: number;
  revenueImpact: number;
}

export interface PromotionUsage {
  promotionId: string;
  userId: string;
  orderId: string;
  discountAmount: number;
  usedAt: Date;
  orderTotal: number;
}

export interface PromotionValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  discountAmount?: number;
  applicableItems?: string[];
}

export interface PromotionRepository {
  // Basic CRUD operations
  save(promotion: Promotion): Promise<Promotion>;
  findById(id: string): Promise<Promotion | null>;
  findByCode(code: string): Promise<Promotion | null>;
  findByTitle(title: string): Promise<Promotion | null>;
  update(promotion: Promotion): Promise<Promotion>;
  delete(id: string): Promise<void>;
  exists(id: string): Promise<boolean>;
  existsByCode(code: string, excludeId?: string): Promise<boolean>;

  // Bulk operations
  saveMany(promotions: Promotion[]): Promise<Promotion[]>;
  findByIds(ids: string[]): Promise<Promotion[]>;
  findByCodes(codes: string[]): Promise<Promotion[]>;
  updateMany(promotions: Promotion[]): Promise<Promotion[]>;
  deleteMany(ids: string[]): Promise<void>;

  // Search and filtering
  search(criteria: PromotionSearchCriteria, pagination?: PromotionPaginationOptions): Promise<PromotionSearchResult>;
  findAll(pagination?: PromotionPaginationOptions): Promise<PromotionSearchResult>;
  findActive(pagination?: PromotionPaginationOptions): Promise<PromotionSearchResult>;
  findInactive(pagination?: PromotionPaginationOptions): Promise<PromotionSearchResult>;
  findExpired(pagination?: PromotionPaginationOptions): Promise<PromotionSearchResult>;
  findByType(type: string, pagination?: PromotionPaginationOptions): Promise<PromotionSearchResult>;
  findByStatus(status: string, pagination?: PromotionPaginationOptions): Promise<PromotionSearchResult>;

  // Code generation and validation
  generatePromotionCode(prefix?: string, length?: number): Promise<string>;
  validatePromotionCode(code: string, excludeId?: string): Promise<boolean>;
  findAvailableCodes(pattern: string, limit: number): Promise<string[]>;
  reserveCode(code: string): Promise<boolean>;
  releaseCode(code: string): Promise<void>;

  // Status management
  activate(promotionId: string): Promise<void>;
  deactivate(promotionId: string): Promise<void>;
  pause(promotionId: string): Promise<void>;
  resume(promotionId: string): Promise<void>;
  expire(promotionId: string): Promise<void>;
  updateStatus(promotionId: string, status: string): Promise<void>;
  bulkUpdateStatus(promotionIds: string[], status: string): Promise<void>;

  // Usage tracking and limits
  incrementUsage(promotionId: string, userId: string, orderId: string, discountAmount: number): Promise<void>;
  decrementUsage(promotionId: string, userId: string): Promise<void>;
  getUsageCount(promotionId: string): Promise<number>;
  getUserUsageCount(promotionId: string, userId: string): Promise<number>;
  hasReachedUsageLimit(promotionId: string): Promise<boolean>;
  hasUserReachedLimit(promotionId: string, userId: string): Promise<boolean>;
  getRemainingUsage(promotionId: string): Promise<number>;
  getUserRemainingUsage(promotionId: string, userId: string): Promise<number>;

  // Usage history and analytics
  getUsageHistory(promotionId: string, pagination?: PromotionPaginationOptions): Promise<{ usages: PromotionUsage[]; total: number }>;
  getUserUsageHistory(promotionId: string, userId: string): Promise<PromotionUsage[]>;
  getUsageStatistics(promotionId: string): Promise<any>;
  getTotalDiscountGiven(promotionId: string): Promise<number>;
  getAverageOrderValue(promotionId: string): Promise<number>;
  getConversionRate(promotionId: string): Promise<number>;

  // Date and time management
  findCurrentlyActive(): Promise<Promotion[]>;
  findStartingSoon(hours: number): Promise<Promotion[]>;
  findEndingSoon(hours: number): Promise<Promotion[]>;
  findExpiredSince(date: Date): Promise<Promotion[]>;
  updateStartDate(promotionId: string, startDate: Date): Promise<void>;
  updateEndDate(promotionId: string, endDate: Date): Promise<void>;
  extendPromotion(promotionId: string, additionalDays: number): Promise<void>;

  // Applicability and targeting
  findByStore(storeId: string, pagination?: PromotionPaginationOptions): Promise<PromotionSearchResult>;
  findByProduct(productId: string, pagination?: PromotionPaginationOptions): Promise<PromotionSearchResult>;
  findByCategory(categoryId: string, pagination?: PromotionPaginationOptions): Promise<PromotionSearchResult>;
  findApplicableToOrder(orderId: string): Promise<Promotion[]>;
  findApplicableToUser(userId: string): Promise<Promotion[]>;
  findApplicableToCart(cartId: string): Promise<Promotion[]>;

  // Validation and business rules
  validatePromotion(promotionId: string, orderId: string, userId: string): Promise<PromotionValidationResult>;
  validatePromotionCode(code: string, orderId: string, userId: string): Promise<PromotionValidationResult>;
  canApplyToOrder(promotionId: string, orderId: string): Promise<boolean>;
  canUserUsePromotion(promotionId: string, userId: string): Promise<boolean>;
  calculateDiscount(promotionId: string, orderTotal: number, items: any[]): Promise<number>;
  getApplicableItems(promotionId: string, items: any[]): Promise<string[]>;

  // Conflict detection and resolution
  findConflictingPromotions(promotionId: string): Promise<Promotion[]>;
  canCombineWith(promotionId1: string, promotionId2: string): Promise<boolean>;
  findBestPromotion(promotions: string[], orderTotal: number): Promise<string | null>;
  optimizePromotionStack(promotions: string[], orderTotal: number): Promise<string[]>;

  // Analytics and reporting
  getPromotionCount(): Promise<number>;
  getActivePromotionCount(): Promise<number>;
  getPromotionStatistics(startDate?: Date, endDate?: Date): Promise<PromotionStatistics>;
  getTopPerformingPromotions(limit: number, startDate?: Date, endDate?: Date): Promise<Promotion[]>;
  getUnderperformingPromotions(limit: number, startDate?: Date, endDate?: Date): Promise<Promotion[]>;
  getPromotionROI(promotionId: string): Promise<number>;
  getRevenueImpact(promotionId: string): Promise<{ increase: number; decrease: number; net: number }>;

  // A/B testing and experiments
  createVariant(promotionId: string, variantData: any): Promise<Promotion>;
  findVariants(promotionId: string): Promise<Promotion[]>;
  getVariantPerformance(promotionId: string): Promise<any[]>;
  assignUserToVariant(promotionId: string, userId: string): Promise<string>;
  getWinningVariant(promotionId: string): Promise<Promotion | null>;

  // Automation and scheduling
  scheduleActivation(promotionId: string, activationDate: Date): Promise<void>;
  scheduleDeactivation(promotionId: string, deactivationDate: Date): Promise<void>;
  findScheduledPromotions(): Promise<Promotion[]>;
  processScheduledActions(): Promise<void>;
  autoExpirePromotions(): Promise<number>;

  // Import/Export
  exportPromotions(criteria?: PromotionSearchCriteria): Promise<any[]>;
  importPromotions(data: any[]): Promise<Promotion[]>;
  findForExport(criteria: PromotionSearchCriteria): Promise<Promotion[]>;
  validateImportData(data: any[]): Promise<{ valid: boolean; errors: string[] }>;

  // Template and cloning
  clonePromotion(promotionId: string, newCode: string, modifications?: any): Promise<Promotion>;
  createFromTemplate(templateId: string, promotionData: any): Promise<Promotion>;
  saveAsTemplate(promotionId: string, templateName: string): Promise<void>;
  findTemplates(): Promise<any[]>;

  // Integration support
  findModifiedSince(date: Date): Promise<Promotion[]>;
  findForSync(lastSyncDate: Date): Promise<Promotion[]>;
  markAsSynced(promotionIds: string[]): Promise<void>;
  syncPromotionData(promotionId: string, externalData: any): Promise<void>;

  // Cache management
  clearCache(promotionId?: string): Promise<void>;
  refreshCache(promotionId: string): Promise<void>;
  warmupCache(): Promise<void>;
  clearValidationCache(): Promise<void>;

  // Notification and alerts
  findPromotionsForAlert(alertType: string): Promise<Promotion[]>;
  markAlertSent(promotionId: string, alertType: string): Promise<void>;
  getAlertHistory(promotionId: string): Promise<any[]>;
  findPromotionsNeedingAttention(): Promise<Promotion[]>;

  // Performance optimization
  preloadPromotionData(promotionId: string): Promise<void>;
  optimizePromotion(promotionId: string): Promise<void>;
  archiveOldPromotions(olderThanDays: number): Promise<number>;
  cleanupExpiredPromotions(olderThanDays: number): Promise<number>;

  // Advanced search
  searchByKeywords(keywords: string[], pagination?: PromotionPaginationOptions): Promise<PromotionSearchResult>;
  findSimilarPromotions(promotionId: string, limit: number): Promise<Promotion[]>;
  suggestPromotions(criteria: any, limit: number): Promise<Promotion[]>;
  findTrendingPromotions(days: number, limit: number): Promise<Promotion[]>;

  // Compliance and audit
  getPromotionAuditLog(promotionId: string): Promise<any[]>;
  recordAuditEvent(promotionId: string, event: string, details: any): Promise<void>;
  findPromotionsForCompliance(criteria: any): Promise<Promotion[]>;
  generateComplianceReport(startDate: Date, endDate: Date): Promise<any>;

  // Multi-currency support
  findByCurrency(currency: string, pagination?: PromotionPaginationOptions): Promise<PromotionSearchResult>;
  convertPromotionCurrency(promotionId: string, newCurrency: string, exchangeRate: number): Promise<void>;
  updateCurrencyRates(promotionId: string): Promise<void>;
  findMultiCurrencyPromotions(): Promise<Promotion[]>;
}