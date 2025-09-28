import { Earnings } from '../entities/earnings.entity';
import { UniqueEntityID } from '../../../common/domain/unique-entity-id';

export interface EarningsSearchFilters {
  riderId?: string;
  status?: string[];
  currency?: string[];
  totalEarnings?: {
    min?: number;
    max?: number;
  };
  availableBalance?: {
    min?: number;
    max?: number;
  };
  pendingBalance?: {
    min?: number;
    max?: number;
  };
  totalWithdrawn?: {
    min?: number;
    max?: number;
  };
  createdDate?: {
    after?: Date;
    before?: Date;
  };
  lastPayoutDate?: {
    after?: Date;
    before?: Date;
  };
  nextPayoutDate?: {
    after?: Date;
    before?: Date;
  };
  hasPayoutRequests?: boolean;
  hasTaxDocuments?: boolean;
  isActive?: boolean;
  tags?: string[];
}

export interface EarningsSortOptions {
  field: 'createdAt' | 'updatedAt' | 'totalEarnings' | 'availableBalance' | 'totalWithdrawn' | 'lastPayoutDate' | 'nextPayoutDate';
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

export interface EarningEntry {
  id: string;
  riderId: string;
  orderId?: string;
  type: 'delivery' | 'bonus' | 'tip' | 'incentive' | 'penalty' | 'adjustment';
  amount: number;
  currency: string;
  description: string;
  date: Date;
  status: 'pending' | 'confirmed' | 'disputed';
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface PayoutRequest {
  id: string;
  riderId: string;
  amount: number;
  currency: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  requestedAt: Date;
  processedAt?: Date;
  completedAt?: Date;
  failureReason?: string;
  paymentMethod: string;
  paymentDetails: Record<string, any>;
  fees: number;
  netAmount: number;
  reference?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TaxDocument {
  id: string;
  riderId: string;
  year: number;
  type: '1099' | 'tax_summary' | 'earnings_statement';
  totalEarnings: number;
  totalDeductions: number;
  netEarnings: number;
  currency: string;
  generatedAt: Date;
  downloadUrl?: string;
  status: 'generated' | 'sent' | 'downloaded';
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface EarningsAnalytics {
  totalEarnings: number;
  availableBalance: number;
  pendingBalance: number;
  totalWithdrawn: number;
  totalPayouts: number;
  averagePayoutAmount: number;
  earningsGrowth: number;
  earningsBreakdown: {
    delivery: number;
    bonus: number;
    tips: number;
    incentives: number;
    penalties: number;
    adjustments: number;
  };
  payoutFrequency: number;
  averageEarningsPerDay: number;
  averageEarningsPerOrder: number;
}

export interface EarningsRepository {
  // Basic CRUD operations
  save(earnings: Earnings): Promise<void>;
  findById(id: UniqueEntityID): Promise<Earnings | null>;
  findByRiderId(riderId: UniqueEntityID): Promise<Earnings | null>;
  delete(id: UniqueEntityID): Promise<void>;
  exists(id: UniqueEntityID): Promise<boolean>;
  existsByRiderId(riderId: UniqueEntityID): Promise<boolean>;

  // Search and filtering
  findMany(
    filters?: EarningsSearchFilters,
    sort?: EarningsSortOptions,
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<Earnings>>;

  findByIds(ids: UniqueEntityID[]): Promise<Earnings[]>;
  findByRiderIds(riderIds: UniqueEntityID[]): Promise<Earnings[]>;

  // Status-based queries
  findActiveEarnings(
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<Earnings>>;

  findInactiveEarnings(
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<Earnings>>;

  findByStatus(
    status: string,
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<Earnings>>;

  // Balance-based queries
  findByBalanceRange(
    minBalance: number,
    maxBalance: number,
    balanceType: 'available' | 'pending' | 'total',
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<Earnings>>;

  findHighBalanceAccounts(
    threshold: number,
    balanceType: 'available' | 'pending' | 'total',
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<Earnings>>;

  findLowBalanceAccounts(
    threshold: number,
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<Earnings>>;

  findZeroBalanceAccounts(
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<Earnings>>;

  // Earnings entries management
  addEarningEntry(
    riderId: UniqueEntityID,
    entry: Omit<EarningEntry, 'id' | 'riderId' | 'createdAt' | 'updatedAt'>
  ): Promise<EarningEntry>;

  getEarningEntries(
    riderId: UniqueEntityID,
    filters?: {
      type?: string[];
      status?: string[];
      dateRange?: { start: Date; end: Date };
      amountRange?: { min: number; max: number };
      orderId?: string;
    },
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<EarningEntry>>;

  updateEarningEntry(
    entryId: string,
    updates: Partial<EarningEntry>
  ): Promise<EarningEntry>;

  deleteEarningEntry(entryId: string): Promise<void>;

  getEarningEntriesByType(
    riderId: UniqueEntityID,
    type: string,
    timeframe?: { start: Date; end: Date },
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<EarningEntry>>;

  getEarningEntriesByOrder(
    orderId: string
  ): Promise<EarningEntry[]>;

  // Payout management
  createPayoutRequest(
    riderId: UniqueEntityID,
    request: Omit<PayoutRequest, 'id' | 'riderId' | 'createdAt' | 'updatedAt'>
  ): Promise<PayoutRequest>;

  getPayoutRequests(
    riderId?: UniqueEntityID,
    filters?: {
      status?: string[];
      dateRange?: { start: Date; end: Date };
      amountRange?: { min: number; max: number };
    },
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<PayoutRequest>>;

  updatePayoutRequest(
    requestId: string,
    updates: Partial<PayoutRequest>
  ): Promise<PayoutRequest>;

  getPayoutRequest(requestId: string): Promise<PayoutRequest | null>;

  getPendingPayouts(
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<PayoutRequest>>;

  getCompletedPayouts(
    riderId?: UniqueEntityID,
    timeframe?: { start: Date; end: Date },
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<PayoutRequest>>;

  getFailedPayouts(
    riderId?: UniqueEntityID,
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<PayoutRequest>>;

  // Tax document management
  generateTaxDocument(
    riderId: UniqueEntityID,
    document: Omit<TaxDocument, 'id' | 'riderId' | 'createdAt' | 'updatedAt'>
  ): Promise<TaxDocument>;

  getTaxDocuments(
    riderId: UniqueEntityID,
    filters?: {
      year?: number;
      type?: string;
      status?: string;
    }
  ): Promise<TaxDocument[]>;

  updateTaxDocument(
    documentId: string,
    updates: Partial<TaxDocument>
  ): Promise<TaxDocument>;

  getTaxDocument(documentId: string): Promise<TaxDocument | null>;

  getTaxDocumentsByYear(
    year: number,
    riderId?: UniqueEntityID
  ): Promise<TaxDocument[]>;

  // Time-based queries
  findByDateRange(
    startDate: Date,
    endDate: Date,
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<Earnings>>;

  findByLastPayoutDate(
    startDate: Date,
    endDate: Date,
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<Earnings>>;

  findDueForPayout(
    date?: Date
  ): Promise<Earnings[]>;

  findOverduePayouts(
    daysPastDue: number
  ): Promise<Earnings[]>;

  // Analytics and reporting
  getEarningsAnalytics(
    riderId?: UniqueEntityID,
    timeframe?: { start: Date; end: Date }
  ): Promise<EarningsAnalytics>;

  getEarningsBreakdown(
    riderId: UniqueEntityID,
    timeframe?: { start: Date; end: Date }
  ): Promise<{
    byType: Record<string, number>;
    byMonth: Record<string, number>;
    byWeek: Record<string, number>;
    byDay: Record<string, number>;
  }>;

  getPayoutAnalytics(
    riderId?: UniqueEntityID,
    timeframe?: { start: Date; end: Date }
  ): Promise<{
    totalPayouts: number;
    totalAmount: number;
    averageAmount: number;
    successRate: number;
    averageProcessingTime: number;
    totalFees: number;
    byStatus: Record<string, number>;
    byMonth: Record<string, number>;
  }>;

  getTopEarners(
    limit?: number,
    timeframe?: { start: Date; end: Date }
  ): Promise<Array<{
    riderId: string;
    totalEarnings: number;
    orderCount: number;
    averageEarningsPerOrder: number;
  }>>;

  getEarningsDistribution(): Promise<{
    '0-100': number;
    '100-500': number;
    '500-1000': number;
    '1000-5000': number;
    '5000+': number;
  }>;

  getPayoutFrequencyAnalysis(
    riderId?: UniqueEntityID
  ): Promise<{
    daily: number;
    weekly: number;
    biweekly: number;
    monthly: number;
    irregular: number;
  }>;

  // Currency and conversion
  findByCurrency(
    currency: string,
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<Earnings>>;

  convertEarnings(
    riderId: UniqueEntityID,
    fromCurrency: string,
    toCurrency: string,
    exchangeRate: number
  ): Promise<void>;

  // Compliance and auditing
  getAuditTrail(
    riderId: UniqueEntityID,
    timeframe?: { start: Date; end: Date }
  ): Promise<Array<{
    action: string;
    amount: number;
    timestamp: Date;
    reference: string;
    metadata: Record<string, any>;
  }>>;

  validateEarningsIntegrity(
    riderId: UniqueEntityID
  ): Promise<{
    isValid: boolean;
    discrepancies: Array<{
      type: string;
      description: string;
      amount: number;
    }>;
    totalDiscrepancy: number;
  }>;

  // Bulk operations
  saveMany(earnings: Earnings[]): Promise<void>;
  updateMany(
    filters: EarningsSearchFilters,
    updates: Partial<{
      status: string;
      currency: string;
      tags: string[];
    }>
  ): Promise<number>;

  deleteMany(filters: EarningsSearchFilters): Promise<number>;

  // Advanced queries
  findSimilarEarningsPatterns(
    riderId: UniqueEntityID,
    criteria: ('amount' | 'frequency' | 'timing' | 'sources')[]
  ): Promise<Earnings[]>;

  predictNextPayout(
    riderId: UniqueEntityID
  ): Promise<{
    estimatedDate: Date;
    estimatedAmount: number;
    confidence: number;
  }>;

  // Cache management
  invalidateCache(earningsId?: UniqueEntityID): Promise<void>;
  warmupCache(earningsIds: UniqueEntityID[]): Promise<void>;

  // Event sourcing support
  getVersion(id: UniqueEntityID): Promise<number>;
  saveWithVersion(earnings: Earnings, expectedVersion: number): Promise<void>;
}