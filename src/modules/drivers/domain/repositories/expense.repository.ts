import { Expense } from '../entities/expense.entity';
import { UniqueEntityID } from '../../../common/domain/unique-entity-id';

export interface ExpenseSearchFilters {
  riderId?: string;
  category?: string[];
  subcategory?: string[];
  status?: string[];
  paymentMethod?: string[];
  merchant?: string[];
  amount?: {
    min?: number;
    max?: number;
  };
  date?: {
    after?: Date;
    before?: Date;
  };
  submittedDate?: {
    after?: Date;
    before?: Date;
  };
  approvedDate?: {
    after?: Date;
    before?: Date;
  };
  reimbursedDate?: {
    after?: Date;
    before?: Date;
  };
  isRecurring?: boolean;
  isTaxDeductible?: boolean;
  hasReceipts?: boolean;
  requiresApproval?: boolean;
  isReimbursable?: boolean;
  approverId?: string;
  currency?: string[];
  tags?: string[];
}

export interface ExpenseSortOptions {
  field: 'date' | 'amount' | 'submittedAt' | 'approvedAt' | 'reimbursedAt' | 'createdAt' | 'updatedAt';
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

export interface Receipt {
  id: string;
  url: string;
  filename: string;
  mimeType: string;
  fileSize: number;
  uploadedAt: Date;
  metadata?: {
    ocrText?: string;
    extractedData?: {
      merchant?: string;
      amount?: number;
      date?: Date;
      items?: string[];
    };
  };
}

export interface MileageRecord {
  id: string;
  startLocation: string;
  endLocation: string;
  distance: number;
  unit: 'miles' | 'kilometers';
  purpose: string;
  rate: number;
  amount: number;
  date: Date;
  vehicleId?: string;
  odometer?: {
    start: number;
    end: number;
  };
  route?: {
    coordinates: Array<{ latitude: number; longitude: number }>;
    duration: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface ExpenseAnalytics {
  totalExpenses: number;
  totalAmount: number;
  approvedAmount: number;
  reimbursedAmount: number;
  pendingAmount: number;
  taxDeductibleAmount: number;
  averageExpenseAmount: number;
  expensesByCategory: Record<string, number>;
  expensesByStatus: Record<string, number>;
  expensesByMonth: Record<string, number>;
  topMerchants: Array<{
    merchant: string;
    amount: number;
    count: number;
  }>;
  reimbursementRate: number;
  averageApprovalTime: number;
  averageReimbursementTime: number;
}

export interface ExpenseRepository {
  // Basic CRUD operations
  save(expense: Expense): Promise<void>;
  findById(id: UniqueEntityID): Promise<Expense | null>;
  findByRiderId(
    riderId: UniqueEntityID,
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<Expense>>;
  delete(id: UniqueEntityID): Promise<void>;
  exists(id: UniqueEntityID): Promise<boolean>;

  // Search and filtering
  findMany(
    filters?: ExpenseSearchFilters,
    sort?: ExpenseSortOptions,
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<Expense>>;

  findByIds(ids: UniqueEntityID[]): Promise<Expense[]>;

  // Category-based queries
  findByCategory(
    category: string,
    riderId?: UniqueEntityID,
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<Expense>>;

  findBySubcategory(
    subcategory: string,
    riderId?: UniqueEntityID,
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<Expense>>;

  getFuelExpenses(
    riderId?: UniqueEntityID,
    timeframe?: { start: Date; end: Date },
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<Expense>>;

  getMaintenanceExpenses(
    riderId?: UniqueEntityID,
    timeframe?: { start: Date; end: Date },
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<Expense>>;

  getInsuranceExpenses(
    riderId?: UniqueEntityID,
    timeframe?: { start: Date; end: Date },
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<Expense>>;

  getPhoneExpenses(
    riderId?: UniqueEntityID,
    timeframe?: { start: Date; end: Date },
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<Expense>>;

  // Status-based queries
  findByStatus(
    status: string,
    riderId?: UniqueEntityID,
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<Expense>>;

  findPendingExpenses(
    riderId?: UniqueEntityID,
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<Expense>>;

  findSubmittedExpenses(
    riderId?: UniqueEntityID,
    approverId?: string,
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<Expense>>;

  findApprovedExpenses(
    riderId?: UniqueEntityID,
    timeframe?: { start: Date; end: Date },
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<Expense>>;

  findRejectedExpenses(
    riderId?: UniqueEntityID,
    timeframe?: { start: Date; end: Date },
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<Expense>>;

  findReimbursedExpenses(
    riderId?: UniqueEntityID,
    timeframe?: { start: Date; end: Date },
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<Expense>>;

  findUnreimbursedExpenses(
    riderId?: UniqueEntityID,
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<Expense>>;

  // Time-based queries
  findByDateRange(
    startDate: Date,
    endDate: Date,
    riderId?: UniqueEntityID,
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<Expense>>;

  findByMonth(
    year: number,
    month: number,
    riderId?: UniqueEntityID,
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<Expense>>;

  findByYear(
    year: number,
    riderId?: UniqueEntityID,
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<Expense>>;

  findTodaysExpenses(
    riderId?: UniqueEntityID
  ): Promise<Expense[]>;

  findThisWeeksExpenses(
    riderId?: UniqueEntityID
  ): Promise<Expense[]>;

  findThisMonthsExpenses(
    riderId?: UniqueEntityID,
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<Expense>>;

  findThisYearsExpenses(
    riderId?: UniqueEntityID,
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<Expense>>;

  // Amount-based queries
  findByAmountRange(
    minAmount: number,
    maxAmount: number,
    riderId?: UniqueEntityID,
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<Expense>>;

  findHighValueExpenses(
    threshold: number,
    riderId?: UniqueEntityID,
    timeframe?: { start: Date; end: Date },
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<Expense>>;

  findSmallExpenses(
    threshold: number,
    riderId?: UniqueEntityID,
    timeframe?: { start: Date; end: Date },
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<Expense>>;

  // Tax and reimbursement queries
  findTaxDeductibleExpenses(
    riderId?: UniqueEntityID,
    taxYear?: number,
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<Expense>>;

  findNonTaxDeductibleExpenses(
    riderId?: UniqueEntityID,
    taxYear?: number,
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<Expense>>;

  findReimbursableExpenses(
    riderId?: UniqueEntityID,
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<Expense>>;

  findNonReimbursableExpenses(
    riderId?: UniqueEntityID,
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<Expense>>;

  // Merchant and payment queries
  findByMerchant(
    merchant: string,
    riderId?: UniqueEntityID,
    timeframe?: { start: Date; end: Date },
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<Expense>>;

  findByPaymentMethod(
    paymentMethod: string,
    riderId?: UniqueEntityID,
    timeframe?: { start: Date; end: Date },
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<Expense>>;

  getTopMerchants(
    riderId?: UniqueEntityID,
    timeframe?: { start: Date; end: Date },
    limit?: number
  ): Promise<Array<{
    merchant: string;
    totalAmount: number;
    expenseCount: number;
    averageAmount: number;
  }>>;

  // Receipt management
  addReceipt(
    expenseId: UniqueEntityID,
    receipt: Omit<Receipt, 'id' | 'uploadedAt'>
  ): Promise<Receipt>;

  getReceipts(expenseId: UniqueEntityID): Promise<Receipt[]>;

  updateReceipt(
    receiptId: string,
    updates: Partial<Receipt>
  ): Promise<Receipt>;

  removeReceipt(receiptId: string): Promise<void>;

  findExpensesWithReceipts(
    riderId?: UniqueEntityID,
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<Expense>>;

  findExpensesWithoutReceipts(
    riderId?: UniqueEntityID,
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<Expense>>;

  // Mileage management
  addMileageRecord(
    expenseId: UniqueEntityID,
    record: Omit<MileageRecord, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<MileageRecord>;

  getMileageRecords(
    expenseId: UniqueEntityID
  ): Promise<MileageRecord[]>;

  updateMileageRecord(
    recordId: string,
    updates: Partial<MileageRecord>
  ): Promise<MileageRecord>;

  removeMileageRecord(recordId: string): Promise<void>;

  getMileageExpenses(
    riderId?: UniqueEntityID,
    timeframe?: { start: Date; end: Date },
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<Expense>>;

  getTotalMileage(
    riderId: UniqueEntityID,
    timeframe?: { start: Date; end: Date }
  ): Promise<{
    totalDistance: number;
    totalAmount: number;
    averageRate: number;
    recordCount: number;
  }>;

  // Recurring expenses
  findRecurringExpenses(
    riderId?: UniqueEntityID,
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<Expense>>;

  findNonRecurringExpenses(
    riderId?: UniqueEntityID,
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<Expense>>;

  getRecurringExpenseTemplates(
    riderId: UniqueEntityID
  ): Promise<Array<{
    category: string;
    subcategory: string;
    merchant: string;
    averageAmount: number;
    frequency: string;
    lastOccurrence: Date;
    nextExpected: Date;
  }>>;

  // Approval workflow
  findExpensesPendingApproval(
    approverId?: string,
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<Expense>>;

  findExpensesByApprover(
    approverId: string,
    status?: string[],
    timeframe?: { start: Date; end: Date },
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<Expense>>;

  getApprovalQueue(
    approverId?: string,
    priority?: 'high' | 'medium' | 'low'
  ): Promise<Array<{
    expense: Expense;
    priority: string;
    daysWaiting: number;
    riderInfo: {
      name: string;
      id: string;
    };
  }>>;

  // Analytics and reporting
  getExpenseAnalytics(
    riderId?: UniqueEntityID,
    timeframe?: { start: Date; end: Date }
  ): Promise<ExpenseAnalytics>;

  getExpenseBreakdown(
    riderId: UniqueEntityID,
    timeframe?: { start: Date; end: Date }
  ): Promise<{
    byCategory: Record<string, number>;
    bySubcategory: Record<string, number>;
    byMonth: Record<string, number>;
    byWeek: Record<string, number>;
    byPaymentMethod: Record<string, number>;
  }>;

  getTaxReport(
    riderId: UniqueEntityID,
    taxYear: number
  ): Promise<{
    totalDeductibleExpenses: number;
    expensesByCategory: Record<string, number>;
    mileageDeduction: number;
    totalMileage: number;
    businessUsePercentage: number;
    quarterlyBreakdown: Record<string, number>;
  }>;

  getReimbursementReport(
    riderId?: UniqueEntityID,
    timeframe?: { start: Date; end: Date }
  ): Promise<{
    totalReimbursable: number;
    totalReimbursed: number;
    pendingReimbursement: number;
    reimbursementRate: number;
    averageProcessingTime: number;
    byCategory: Record<string, {
      reimbursable: number;
      reimbursed: number;
      pending: number;
    }>;
  }>;

  getSpendingTrends(
    riderId?: UniqueEntityID,
    period: 'daily' | 'weekly' | 'monthly',
    timeframe?: { start: Date; end: Date }
  ): Promise<Array<{
    period: string;
    totalAmount: number;
    expenseCount: number;
    averageAmount: number;
    topCategory: string;
  }>>;

  // Budget and limits
  getBudgetAnalysis(
    riderId: UniqueEntityID,
    budgetLimits: Record<string, number>,
    timeframe?: { start: Date; end: Date }
  ): Promise<{
    totalBudget: number;
    totalSpent: number;
    remainingBudget: number;
    utilizationRate: number;
    byCategory: Record<string, {
      budget: number;
      spent: number;
      remaining: number;
      utilizationRate: number;
      isOverBudget: boolean;
    }>;
    alerts: Array<{
      category: string;
      message: string;
      severity: 'info' | 'warning' | 'critical';
    }>;
  }>;

  // Bulk operations
  saveMany(expenses: Expense[]): Promise<void>;
  updateMany(
    filters: ExpenseSearchFilters,
    updates: Partial<{
      status: string;
      category: string;
      isTaxDeductible: boolean;
      isReimbursable: boolean;
      approverId: string;
      tags: string[];
    }>
  ): Promise<number>;

  deleteMany(filters: ExpenseSearchFilters): Promise<number>;

  bulkApprove(
    expenseIds: UniqueEntityID[],
    approverId: string,
    notes?: string
  ): Promise<number>;

  bulkReject(
    expenseIds: UniqueEntityID[],
    approverId: string,
    reason: string
  ): Promise<number>;

  bulkReimburse(
    expenseIds: UniqueEntityID[],
    paymentMethod: string,
    reference?: string
  ): Promise<number>;

  // Advanced queries
  findSimilarExpenses(
    expenseId: UniqueEntityID,
    criteria: ('amount' | 'merchant' | 'category' | 'date' | 'location')[]
  ): Promise<Expense[]>;

  findAnomalousExpenses(
    riderId: UniqueEntityID,
    timeframe?: { start: Date; end: Date }
  ): Promise<Array<{
    expense: Expense;
    anomalyType: string;
    score: number;
    reasons: string[];
  }>>;

  findDuplicateExpenses(
    riderId?: UniqueEntityID,
    tolerance?: {
      amount: number;
      days: number;
    }
  ): Promise<Array<{
    expenses: Expense[];
    similarity: number;
    suggestedAction: string;
  }>>;

  // Compliance and audit
  getComplianceReport(
    riderId?: UniqueEntityID,
    timeframe?: { start: Date; end: Date }
  ): Promise<{
    totalExpenses: number;
    compliantExpenses: number;
    nonCompliantExpenses: number;
    complianceRate: number;
    issues: Array<{
      type: string;
      count: number;
      severity: string;
      examples: string[];
    }>;
  }>;

  getAuditTrail(
    expenseId: UniqueEntityID
  ): Promise<Array<{
    action: string;
    performedBy: string;
    timestamp: Date;
    changes: Record<string, { from: any; to: any }>;
    notes?: string;
  }>>;

  // Cache management
  invalidateCache(expenseId?: UniqueEntityID): Promise<void>;
  warmupCache(expenseIds: UniqueEntityID[]): Promise<void>;

  // Event sourcing support
  getVersion(id: UniqueEntityID): Promise<number>;
  saveWithVersion(expense: Expense, expectedVersion: number): Promise<void>;
}