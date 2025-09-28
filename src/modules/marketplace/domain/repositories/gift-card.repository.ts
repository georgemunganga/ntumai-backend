import { GiftCard } from '../entities/gift-card.entity';

export interface GiftCardSearchCriteria {
  code?: string;
  purchaserId?: string;
  recipientId?: string;
  recipientEmail?: string;
  status?: string;
  designType?: string;
  minOriginalAmount?: number;
  maxOriginalAmount?: number;
  minCurrentAmount?: number;
  maxCurrentAmount?: number;
  currency?: string;
  isExpired?: boolean;
  expiresAfter?: Date;
  expiresBefore?: Date;
  createdAfter?: Date;
  createdBefore?: Date;
  activatedAfter?: Date;
  activatedBefore?: Date;
  hasMessage?: boolean;
  isGift?: boolean;
}

export interface GiftCardSortOptions {
  field: 'code' | 'originalAmount' | 'currentAmount' | 'status' | 'createdAt' | 'activatedAt' | 'expiresAt';
  direction: 'asc' | 'desc';
}

export interface GiftCardPaginationOptions {
  page: number;
  limit: number;
  sort?: GiftCardSortOptions;
}

export interface GiftCardSearchResult {
  giftCards: GiftCard[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface GiftCardStatistics {
  totalGiftCards: number;
  activeGiftCards: number;
  expiredGiftCards: number;
  usedGiftCards: number;
  totalValueIssued: number;
  totalValueRedeemed: number;
  totalValueExpired: number;
  averageGiftCardValue: number;
  redemptionRate: number;
  expirationRate: number;
  giftCardsByStatus: { [status: string]: number };
  popularDesignTypes: { [type: string]: number };
}

export interface GiftCardTransaction {
  id: string;
  giftCardId: string;
  type: 'purchase' | 'activation' | 'redemption' | 'refund' | 'expiration';
  amount: number;
  orderId?: string;
  userId?: string;
  description: string;
  createdAt: Date;
  metadata?: any;
}

export interface GiftCardUsage {
  giftCardId: string;
  orderId: string;
  userId: string;
  amountUsed: number;
  remainingAmount: number;
  usedAt: Date;
  orderTotal: number;
}

export interface GiftCardRepository {
  // Basic CRUD operations
  save(giftCard: GiftCard): Promise<GiftCard>;
  findById(id: string): Promise<GiftCard | null>;
  findByCode(code: string): Promise<GiftCard | null>;
  update(giftCard: GiftCard): Promise<GiftCard>;
  delete(id: string): Promise<void>;
  exists(id: string): Promise<boolean>;
  existsByCode(code: string): Promise<boolean>;

  // Bulk operations
  saveMany(giftCards: GiftCard[]): Promise<GiftCard[]>;
  findByIds(ids: string[]): Promise<GiftCard[]>;
  findByCodes(codes: string[]): Promise<GiftCard[]>;
  updateMany(giftCards: GiftCard[]): Promise<GiftCard[]>;
  deleteMany(ids: string[]): Promise<void>;

  // Search and filtering
  search(criteria: GiftCardSearchCriteria, pagination?: GiftCardPaginationOptions): Promise<GiftCardSearchResult>;
  findAll(pagination?: GiftCardPaginationOptions): Promise<GiftCardSearchResult>;
  findActive(pagination?: GiftCardPaginationOptions): Promise<GiftCardSearchResult>;
  findExpired(pagination?: GiftCardPaginationOptions): Promise<GiftCardSearchResult>;
  findByStatus(status: string, pagination?: GiftCardPaginationOptions): Promise<GiftCardSearchResult>;
  findByPurchaser(purchaserId: string, pagination?: GiftCardPaginationOptions): Promise<GiftCardSearchResult>;
  findByRecipient(recipientId: string, pagination?: GiftCardPaginationOptions): Promise<GiftCardSearchResult>;
  findByRecipientEmail(email: string, pagination?: GiftCardPaginationOptions): Promise<GiftCardSearchResult>;

  // Code generation and validation
  generateGiftCardCode(prefix?: string, length?: number): Promise<string>;
  validateGiftCardCode(code: string): Promise<boolean>;
  findAvailableCodes(pattern: string, limit: number): Promise<string[]>;
  reserveCode(code: string): Promise<boolean>;
  releaseCode(code: string): Promise<void>;
  isCodeUnique(code: string): Promise<boolean>;

  // Status management
  activate(giftCardId: string, activatedBy?: string): Promise<void>;
  deactivate(giftCardId: string, reason?: string): Promise<void>;
  cancel(giftCardId: string, reason: string): Promise<void>;
  expire(giftCardId: string): Promise<void>;
  updateStatus(giftCardId: string, status: string, reason?: string): Promise<void>;
  bulkUpdateStatus(giftCardIds: string[], status: string, reason?: string): Promise<void>;

  // Balance and transaction management
  useAmount(giftCardId: string, amount: number, orderId: string, userId: string): Promise<{ success: boolean; remainingBalance: number }>;
  refundAmount(giftCardId: string, amount: number, orderId: string, reason: string): Promise<void>;
  addAmount(giftCardId: string, amount: number, reason: string): Promise<void>;
  getBalance(giftCardId: string): Promise<number>;
  hasBalance(giftCardId: string, requiredAmount: number): Promise<boolean>;
  updateBalance(giftCardId: string, newBalance: number): Promise<void>;

  // Transaction history
  recordTransaction(transaction: Omit<GiftCardTransaction, 'id' | 'createdAt'>): Promise<GiftCardTransaction>;
  getTransactionHistory(giftCardId: string, pagination?: GiftCardPaginationOptions): Promise<{ transactions: GiftCardTransaction[]; total: number }>;
  getUsageHistory(giftCardId: string): Promise<GiftCardUsage[]>;
  getTotalUsed(giftCardId: string): Promise<number>;
  getTotalRefunded(giftCardId: string): Promise<number>;
  getLastUsedDate(giftCardId: string): Promise<Date | null>;

  // Expiration management
  findExpiringGiftCards(days: number): Promise<GiftCard[]>;
  findExpiredGiftCards(pagination?: GiftCardPaginationOptions): Promise<GiftCardSearchResult>;
  extendExpiration(giftCardId: string, additionalDays: number): Promise<void>;
  updateExpirationDate(giftCardId: string, newExpirationDate: Date): Promise<void>;
  processExpiredGiftCards(): Promise<number>;
  getExpirationStatus(giftCardId: string): Promise<{ expired: boolean; daysUntilExpiry: number }>;

  // Recipient management
  updateRecipientInfo(giftCardId: string, recipientInfo: { name?: string; email?: string; phone?: string }): Promise<void>;
  updateMessage(giftCardId: string, message: string): Promise<void>;
  updateDesignType(giftCardId: string, designType: string): Promise<void>;
  markAsDelivered(giftCardId: string, deliveredAt?: Date): Promise<void>;
  resendGiftCard(giftCardId: string): Promise<void>;

  // Validation and business rules
  validateForUse(giftCardId: string, amount: number, userId?: string): Promise<{ valid: boolean; errors: string[] }>;
  validateCode(code: string, amount: number, userId?: string): Promise<{ valid: boolean; errors: string[]; giftCard?: GiftCard }>;
  canUseAmount(giftCardId: string, amount: number): Promise<boolean>;
  canRefund(giftCardId: string, amount: number): Promise<boolean>;
  canCancel(giftCardId: string): Promise<boolean>;
  canExtend(giftCardId: string): Promise<boolean>;

  // Analytics and statistics
  getGiftCardCount(): Promise<number>;
  getActiveGiftCardCount(): Promise<number>;
  getGiftCardStatistics(startDate?: Date, endDate?: Date): Promise<GiftCardStatistics>;
  getTotalValueIssued(startDate?: Date, endDate?: Date): Promise<number>;
  getTotalValueRedeemed(startDate?: Date, endDate?: Date): Promise<number>;
  getRedemptionRate(startDate?: Date, endDate?: Date): Promise<number>;
  getAverageGiftCardValue(): Promise<number>;
  getPopularDesignTypes(limit: number): Promise<{ type: string; count: number }[]>;

  // Currency support
  findByCurrency(currency: string, pagination?: GiftCardPaginationOptions): Promise<GiftCardSearchResult>;
  convertCurrency(giftCardId: string, newCurrency: string, exchangeRate: number): Promise<void>;
  updateCurrencyRates(giftCardId: string): Promise<void>;
  findMultiCurrencyGiftCards(): Promise<GiftCard[]>;

  // Bulk operations
  bulkActivate(giftCardIds: string[]): Promise<void>;
  bulkExpire(giftCardIds: string[]): Promise<void>;
  bulkExtendExpiration(giftCardIds: string[], additionalDays: number): Promise<void>;
  bulkUpdateDesign(giftCardIds: string[], designType: string): Promise<void>;
  bulkRefund(giftCardIds: string[], reason: string): Promise<void>;

  // Import/Export
  exportGiftCards(criteria?: GiftCardSearchCriteria): Promise<any[]>;
  importGiftCards(data: any[]): Promise<GiftCard[]>;
  findForExport(criteria: GiftCardSearchCriteria): Promise<GiftCard[]>;
  validateImportData(data: any[]): Promise<{ valid: boolean; errors: string[] }>;

  // Reporting
  getSalesReport(startDate: Date, endDate: Date): Promise<any>;
  getUsageReport(startDate: Date, endDate: Date): Promise<any>;
  getExpirationReport(): Promise<any>;
  getRedemptionReport(startDate: Date, endDate: Date): Promise<any>;
  getDesignPopularityReport(): Promise<any>;

  // Fraud detection and security
  flagAsSuspicious(giftCardId: string, reason: string): Promise<void>;
  clearSuspiciousFlag(giftCardId: string): Promise<void>;
  findSuspiciousGiftCards(): Promise<GiftCard[]>;
  validateSecurity(giftCardId: string): Promise<{ valid: boolean; issues: string[] }>;
  detectUnusualActivity(giftCardId: string): Promise<{ suspicious: boolean; reasons: string[] }>;

  // Notification and communication
  markNotificationSent(giftCardId: string, notificationType: string): Promise<void>;
  getNotificationHistory(giftCardId: string): Promise<any[]>;
  findGiftCardsForExpirationNotification(days: number): Promise<GiftCard[]>;
  findGiftCardsForActivationReminder(): Promise<GiftCard[]>;
  findGiftCardsForUsageReminder(days: number): Promise<GiftCard[]>;

  // Integration support
  findModifiedSince(date: Date): Promise<GiftCard[]>;
  findForSync(lastSyncDate: Date): Promise<GiftCard[]>;
  markAsSynced(giftCardIds: string[]): Promise<void>;
  syncGiftCardData(giftCardId: string, externalData: any): Promise<void>;

  // Cache management
  clearCache(giftCardId?: string): Promise<void>;
  refreshCache(giftCardId: string): Promise<void>;
  warmupCache(): Promise<void>;
  clearValidationCache(): Promise<void>;

  // Performance optimization
  preloadGiftCardData(giftCardId: string): Promise<void>;
  optimizeGiftCard(giftCardId: string): Promise<void>;
  archiveOldGiftCards(olderThanDays: number): Promise<number>;
  cleanupExpiredGiftCards(olderThanDays: number): Promise<number>;

  // Advanced search
  searchByKeywords(keywords: string[], pagination?: GiftCardPaginationOptions): Promise<GiftCardSearchResult>;
  findSimilarGiftCards(giftCardId: string, limit: number): Promise<GiftCard[]>;
  findGiftCardsByValueRange(minValue: number, maxValue: number, pagination?: GiftCardPaginationOptions): Promise<GiftCardSearchResult>;
  findUnusedGiftCards(olderThanDays: number): Promise<GiftCard[]>;

  // Design and customization
  findByDesignType(designType: string, pagination?: GiftCardPaginationOptions): Promise<GiftCardSearchResult>;
  getAvailableDesignTypes(): Promise<string[]>;
  getDesignTypeStatistics(): Promise<{ [type: string]: number }>;
  updateDesignMetadata(giftCardId: string, metadata: any): Promise<void>;

  // Compliance and audit
  getGiftCardAuditLog(giftCardId: string): Promise<any[]>;
  recordAuditEvent(giftCardId: string, event: string, details: any): Promise<void>;
  findGiftCardsForCompliance(criteria: any): Promise<GiftCard[]>;
  generateComplianceReport(startDate: Date, endDate: Date): Promise<any>;

  // Loyalty and rewards integration
  convertToLoyaltyPoints(giftCardId: string, conversionRate: number): Promise<void>;
  createFromLoyaltyPoints(userId: string, points: number, conversionRate: number): Promise<GiftCard>;
  findEligibleForLoyaltyConversion(): Promise<GiftCard[]>;

  // Promotional campaigns
  findGiftCardsForPromotion(promotionId: string): Promise<GiftCard[]>;
  applyPromotionalBonus(giftCardIds: string[], bonusAmount: number): Promise<void>;
  findPromotionalGiftCards(): Promise<GiftCard[]>;
  trackPromotionalPerformance(promotionId: string): Promise<any>;
}