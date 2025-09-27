import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { EarningsRepository } from '../../domain/repositories/earnings.repository';
import { ExpenseRepository } from '../../domain/repositories/expense.repository';
import { RiderRepository } from '../../domain/repositories/rider.repository';
import { EarningsCalculationService } from '../../domain/services/earnings-calculation.service';
import { Earnings } from '../../domain/entities/earnings.entity';
import { Expense } from '../../domain/entities/expense.entity';
import { EarningsDetails } from '../../domain/value-objects/earnings-details.vo';

export interface EarningsRequest {
  riderId: string;
  riderOrderId?: string;
  type: 'ORDER_PAYMENT' | 'BONUS' | 'INCENTIVE' | 'TIP' | 'ADJUSTMENT' | 'PENALTY';
  amount: number;
  currency?: string;
  description?: string;
  metadata?: Record<string, any>;
}

export interface EarningsResponse {
  id: string;
  riderId: string;
  riderOrderId?: string;
  type: string;
  amount: number;
  currency: string;
  description?: string;
  payoutStatus: string;
  payoutDate?: Date;
  payoutReference?: string;
  isTaxable: boolean;
  taxAmount?: number;
  taxYear?: number;
  metadata?: Record<string, any>;
  earnedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ExpenseRequest {
  riderId: string;
  category: 'FUEL' | 'MAINTENANCE' | 'INSURANCE' | 'REGISTRATION' | 'EQUIPMENT' | 'PHONE' | 'OTHER';
  amount: number;
  currency?: string;
  description: string;
  merchant?: string;
  receiptUrl?: string;
  receiptNumber?: string;
  expenseDate?: Date;
  mileageStart?: number;
  mileageEnd?: number;
  mileageDriven?: number;
}

export interface ExpenseResponse {
  id: string;
  riderId: string;
  category: string;
  amount: number;
  currency: string;
  description: string;
  merchant?: string;
  receiptUrl?: string;
  receiptNumber?: string;
  status: string;
  approvedBy?: string;
  approvedAt?: Date;
  rejectedAt?: Date;
  rejectionReason?: string;
  isReimbursable: boolean;
  reimbursedAmount?: number;
  reimbursedAt?: Date;
  reimbursementReference?: string;
  isTaxDeductible: boolean;
  taxYear?: number;
  mileageInfo?: {
    start?: number;
    end?: number;
    driven?: number;
  };
  expenseDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface PayoutRequest {
  riderId: string;
  earningsIds: string[];
  payoutMethod: 'BANK_TRANSFER' | 'DIGITAL_WALLET' | 'CHECK';
  payoutReference?: string;
}

export interface PayoutResponse {
  id: string;
  riderId: string;
  totalAmount: number;
  currency: string;
  payoutMethod: string;
  payoutReference: string;
  status: string;
  processedAt: Date;
  earningsCount: number;
  earnings: EarningsResponse[];
}

export interface FinancialSummaryRequest {
  riderId: string;
  startDate: Date;
  endDate: Date;
  groupBy?: 'day' | 'week' | 'month';
}

export interface FinancialSummaryResponse {
  period: string;
  earnings: {
    totalAmount: number;
    orderPayments: number;
    bonuses: number;
    incentives: number;
    tips: number;
    adjustments: number;
    penalties: number;
    taxableAmount: number;
    taxAmount: number;
  };
  expenses: {
    totalAmount: number;
    fuel: number;
    maintenance: number;
    insurance: number;
    equipment: number;
    other: number;
    reimbursableAmount: number;
    taxDeductibleAmount: number;
  };
  netIncome: number;
  payouts: {
    totalAmount: number;
    pendingAmount: number;
    processedAmount: number;
  };
}

export interface EarningsFilters {
  riderId?: string;
  type?: string;
  payoutStatus?: string;
  startDate?: Date;
  endDate?: Date;
  minAmount?: number;
  maxAmount?: number;
  isTaxable?: boolean;
}

export interface ExpenseFilters {
  riderId?: string;
  category?: string;
  status?: string;
  startDate?: Date;
  endDate?: Date;
  minAmount?: number;
  maxAmount?: number;
  isReimbursable?: boolean;
  isTaxDeductible?: boolean;
}

export interface EarningsListResponse {
  earnings: EarningsResponse[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ExpenseListResponse {
  expenses: ExpenseResponse[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface TaxSummaryRequest {
  riderId: string;
  taxYear: number;
}

export interface TaxSummaryResponse {
  riderId: string;
  taxYear: number;
  totalEarnings: number;
  taxableEarnings: number;
  totalTaxAmount: number;
  totalExpenses: number;
  taxDeductibleExpenses: number;
  netTaxableIncome: number;
  quarterlyBreakdown: Array<{
    quarter: number;
    earnings: number;
    expenses: number;
    netIncome: number;
  }>;
  categoryBreakdown: {
    earnings: Record<string, number>;
    expenses: Record<string, number>;
  };
}

@Injectable()
export class FinancialManagementService {
  constructor(
    private readonly earningsRepository: EarningsRepository,
    private readonly expenseRepository: ExpenseRepository,
    private readonly riderRepository: RiderRepository,
    private readonly earningsCalculationService: EarningsCalculationService,
  ) {}

  async recordEarnings(request: EarningsRequest): Promise<EarningsResponse> {
    // Validate rider exists
    const rider = await this.riderRepository.findById(request.riderId);
    if (!rider) {
      throw new NotFoundException('Rider not found');
    }

    // Create earnings details
    const earningsDetails = EarningsDetails.create(
      request.type,
      request.amount,
      request.currency || 'USD',
      request.description,
      request.metadata,
    );

    // Create earnings entity
    const earnings = new Earnings(
      '', // ID will be generated
      request.riderId,
      request.riderOrderId,
      earningsDetails,
      'PENDING', // Default payout status
      true, // Default taxable
      new Date(),
    );

    const savedEarnings = await this.earningsRepository.save(earnings);

    // Update rider total earnings
    rider.addEarnings(request.amount);
    await this.riderRepository.save(rider);

    return this.mapToEarningsResponse(savedEarnings);
  }

  async recordExpense(request: ExpenseRequest): Promise<ExpenseResponse> {
    // Validate rider exists
    const rider = await this.riderRepository.findById(request.riderId);
    if (!rider) {
      throw new NotFoundException('Rider not found');
    }

    // Create expense entity
    const expense = new Expense(
      '', // ID will be generated
      request.riderId,
      request.category,
      request.amount,
      request.currency || 'USD',
      request.description,
      request.merchant,
      request.receiptUrl,
      request.receiptNumber,
      'PENDING', // Default status
      false, // Default not reimbursable
      false, // Default not tax deductible
      request.expenseDate || new Date(),
      request.mileageStart,
      request.mileageEnd,
      request.mileageDriven,
    );

    const savedExpense = await this.expenseRepository.save(expense);
    return this.mapToExpenseResponse(savedExpense);
  }

  async getEarnings(
    filters: EarningsFilters,
    page: number = 1,
    limit: number = 20,
  ): Promise<EarningsListResponse> {
    const { earnings, total } = await this.earningsRepository.searchEarnings(filters, {
      page,
      limit,
    });

    const earningsResponses = earnings.map(earning => this.mapToEarningsResponse(earning));

    return {
      earnings: earningsResponses,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getExpenses(
    filters: ExpenseFilters,
    page: number = 1,
    limit: number = 20,
  ): Promise<ExpenseListResponse> {
    const { expenses, total } = await this.expenseRepository.searchExpenses(filters, {
      page,
      limit,
    });

    const expenseResponses = expenses.map(expense => this.mapToExpenseResponse(expense));

    return {
      expenses: expenseResponses,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getRiderEarnings(
    riderId: string,
    page: number = 1,
    limit: number = 20,
    filters?: Omit<EarningsFilters, 'riderId'>,
  ): Promise<EarningsListResponse> {
    const earningsFilters: EarningsFilters = {
      ...filters,
      riderId,
    };

    return this.getEarnings(earningsFilters, page, limit);
  }

  async getRiderExpenses(
    riderId: string,
    page: number = 1,
    limit: number = 20,
    filters?: Omit<ExpenseFilters, 'riderId'>,
  ): Promise<ExpenseListResponse> {
    const expenseFilters: ExpenseFilters = {
      ...filters,
      riderId,
    };

    return this.getExpenses(expenseFilters, page, limit);
  }

  async approveExpense(
    expenseId: string,
    approvedBy: string,
    isReimbursable: boolean = false,
    reimbursedAmount?: number,
  ): Promise<ExpenseResponse> {
    const expense = await this.expenseRepository.findById(expenseId);
    if (!expense) {
      throw new NotFoundException('Expense not found');
    }

    expense.approve(approvedBy, isReimbursable, reimbursedAmount);
    const updatedExpense = await this.expenseRepository.save(expense);

    return this.mapToExpenseResponse(updatedExpense);
  }

  async rejectExpense(
    expenseId: string,
    rejectionReason: string,
  ): Promise<ExpenseResponse> {
    const expense = await this.expenseRepository.findById(expenseId);
    if (!expense) {
      throw new NotFoundException('Expense not found');
    }

    expense.reject(rejectionReason);
    const updatedExpense = await this.expenseRepository.save(expense);

    return this.mapToExpenseResponse(updatedExpense);
  }

  async processPayouts(request: PayoutRequest): Promise<PayoutResponse> {
    // Validate rider exists
    const rider = await this.riderRepository.findById(request.riderId);
    if (!rider) {
      throw new NotFoundException('Rider not found');
    }

    // Validate earnings exist and are pending
    const earnings = await Promise.all(
      request.earningsIds.map(id => this.earningsRepository.findById(id)),
    );

    const validEarnings = earnings.filter(earning => {
      return earning && 
             earning.getRiderId() === request.riderId && 
             earning.getPayoutStatus() === 'PENDING';
    }) as Earnings[];

    if (validEarnings.length !== request.earningsIds.length) {
      throw new BadRequestException('Some earnings are invalid or already processed');
    }

    // Calculate total amount
    const totalAmount = validEarnings.reduce(
      (sum, earning) => sum + earning.getAmount(),
      0,
    );

    // Generate payout reference
    const payoutReference = request.payoutReference || 
      `PAYOUT_${Date.now()}_${request.riderId.slice(-6)}`;

    // Update earnings with payout information
    const processedEarnings = await Promise.all(
      validEarnings.map(async earning => {
        earning.processPayout(payoutReference, new Date());
        return this.earningsRepository.save(earning);
      }),
    );

    return {
      id: payoutReference,
      riderId: request.riderId,
      totalAmount,
      currency: 'USD', // Default currency
      payoutMethod: request.payoutMethod,
      payoutReference,
      status: 'PROCESSED',
      processedAt: new Date(),
      earningsCount: processedEarnings.length,
      earnings: processedEarnings.map(earning => this.mapToEarningsResponse(earning)),
    };
  }

  async getFinancialSummary(
    request: FinancialSummaryRequest,
  ): Promise<FinancialSummaryResponse[]> {
    const earningsSummary = await this.earningsRepository.getEarningsSummary(
      request.riderId,
      request.startDate,
      request.endDate,
      request.groupBy || 'day',
    );

    const expensesSummary = await this.expenseRepository.getExpensesSummary(
      request.riderId,
      request.startDate,
      request.endDate,
      request.groupBy || 'day',
    );

    // Combine earnings and expenses data by period
    const summaryMap = new Map<string, FinancialSummaryResponse>();

    // Process earnings
    earningsSummary.forEach(earning => {
      const existing = summaryMap.get(earning.period) || {
        period: earning.period,
        earnings: {
          totalAmount: 0,
          orderPayments: 0,
          bonuses: 0,
          incentives: 0,
          tips: 0,
          adjustments: 0,
          penalties: 0,
          taxableAmount: 0,
          taxAmount: 0,
        },
        expenses: {
          totalAmount: 0,
          fuel: 0,
          maintenance: 0,
          insurance: 0,
          equipment: 0,
          other: 0,
          reimbursableAmount: 0,
          taxDeductibleAmount: 0,
        },
        netIncome: 0,
        payouts: {
          totalAmount: 0,
          pendingAmount: 0,
          processedAmount: 0,
        },
      };

      existing.earnings = {
        totalAmount: earning.totalAmount,
        orderPayments: earning.orderPayments || 0,
        bonuses: earning.bonuses || 0,
        incentives: earning.incentives || 0,
        tips: earning.tips || 0,
        adjustments: earning.adjustments || 0,
        penalties: earning.penalties || 0,
        taxableAmount: earning.taxableAmount || 0,
        taxAmount: earning.taxAmount || 0,
      };

      existing.payouts = {
        totalAmount: earning.totalPayouts || 0,
        pendingAmount: earning.pendingPayouts || 0,
        processedAmount: earning.processedPayouts || 0,
      };

      summaryMap.set(earning.period, existing);
    });

    // Process expenses
    expensesSummary.forEach(expense => {
      const existing = summaryMap.get(expense.period) || {
        period: expense.period,
        earnings: {
          totalAmount: 0,
          orderPayments: 0,
          bonuses: 0,
          incentives: 0,
          tips: 0,
          adjustments: 0,
          penalties: 0,
          taxableAmount: 0,
          taxAmount: 0,
        },
        expenses: {
          totalAmount: 0,
          fuel: 0,
          maintenance: 0,
          insurance: 0,
          equipment: 0,
          other: 0,
          reimbursableAmount: 0,
          taxDeductibleAmount: 0,
        },
        netIncome: 0,
        payouts: {
          totalAmount: 0,
          pendingAmount: 0,
          processedAmount: 0,
        },
      };

      existing.expenses = {
        totalAmount: expense.totalAmount,
        fuel: expense.fuel || 0,
        maintenance: expense.maintenance || 0,
        insurance: expense.insurance || 0,
        equipment: expense.equipment || 0,
        other: expense.other || 0,
        reimbursableAmount: expense.reimbursableAmount || 0,
        taxDeductibleAmount: expense.taxDeductibleAmount || 0,
      };

      summaryMap.set(expense.period, existing);
    });

    // Calculate net income for each period
    const summaries = Array.from(summaryMap.values()).map(summary => ({
      ...summary,
      netIncome: summary.earnings.totalAmount - summary.expenses.totalAmount,
    }));

    return summaries.sort((a, b) => a.period.localeCompare(b.period));
  }

  async getTaxSummary(request: TaxSummaryRequest): Promise<TaxSummaryResponse> {
    const startDate = new Date(request.taxYear, 0, 1);
    const endDate = new Date(request.taxYear, 11, 31);

    const taxSummary = await this.earningsRepository.getTaxSummary(
      request.riderId,
      request.taxYear,
    );

    const expenseTaxSummary = await this.expenseRepository.getTaxSummary(
      request.riderId,
      request.taxYear,
    );

    return {
      riderId: request.riderId,
      taxYear: request.taxYear,
      totalEarnings: taxSummary.totalEarnings,
      taxableEarnings: taxSummary.taxableEarnings,
      totalTaxAmount: taxSummary.totalTaxAmount,
      totalExpenses: expenseTaxSummary.totalExpenses,
      taxDeductibleExpenses: expenseTaxSummary.taxDeductibleExpenses,
      netTaxableIncome: taxSummary.taxableEarnings - expenseTaxSummary.taxDeductibleExpenses,
      quarterlyBreakdown: taxSummary.quarterlyBreakdown || [],
      categoryBreakdown: {
        earnings: taxSummary.categoryBreakdown || {},
        expenses: expenseTaxSummary.categoryBreakdown || {},
      },
    };
  }

  async getPendingPayouts(riderId: string): Promise<EarningsResponse[]> {
    const pendingEarnings = await this.earningsRepository.findPendingPayoutsByRiderId(riderId);
    return pendingEarnings.map(earning => this.mapToEarningsResponse(earning));
  }

  async updateExpense(
    expenseId: string,
    updates: Partial<ExpenseRequest>,
  ): Promise<ExpenseResponse> {
    const expense = await this.expenseRepository.findById(expenseId);
    if (!expense) {
      throw new NotFoundException('Expense not found');
    }

    // Update expense properties
    if (updates.amount !== undefined) expense.updateAmount(updates.amount);
    if (updates.description !== undefined) expense.updateDescription(updates.description);
    if (updates.merchant !== undefined) expense.updateMerchant(updates.merchant);
    if (updates.receiptUrl !== undefined) expense.updateReceipt(updates.receiptUrl, updates.receiptNumber);
    if (updates.expenseDate !== undefined) expense.updateExpenseDate(updates.expenseDate);
    if (updates.mileageStart !== undefined || updates.mileageEnd !== undefined || updates.mileageDriven !== undefined) {
      expense.updateMileage(updates.mileageStart, updates.mileageEnd, updates.mileageDriven);
    }

    const updatedExpense = await this.expenseRepository.save(expense);
    return this.mapToExpenseResponse(updatedExpense);
  }

  private mapToEarningsResponse(earnings: Earnings): EarningsResponse {
    return {
      id: earnings.getId(),
      riderId: earnings.getRiderId(),
      riderOrderId: earnings.getRiderOrderId(),
      type: earnings.getType(),
      amount: earnings.getAmount(),
      currency: earnings.getCurrency(),
      description: earnings.getDescription(),
      payoutStatus: earnings.getPayoutStatus(),
      payoutDate: earnings.getPayoutDate(),
      payoutReference: earnings.getPayoutReference(),
      isTaxable: earnings.getIsTaxable(),
      taxAmount: earnings.getTaxAmount(),
      taxYear: earnings.getTaxYear(),
      metadata: earnings.getMetadata(),
      earnedAt: earnings.getEarnedAt(),
      createdAt: earnings.getCreatedAt(),
      updatedAt: earnings.getUpdatedAt(),
    };
  }

  private mapToExpenseResponse(expense: Expense): ExpenseResponse {
    return {
      id: expense.getId(),
      riderId: expense.getRiderId(),
      category: expense.getCategory(),
      amount: expense.getAmount(),
      currency: expense.getCurrency(),
      description: expense.getDescription(),
      merchant: expense.getMerchant(),
      receiptUrl: expense.getReceiptUrl(),
      receiptNumber: expense.getReceiptNumber(),
      status: expense.getStatus(),
      approvedBy: expense.getApprovedBy(),
      approvedAt: expense.getApprovedAt(),
      rejectedAt: expense.getRejectedAt(),
      rejectionReason: expense.getRejectionReason(),
      isReimbursable: expense.getIsReimbursable(),
      reimbursedAmount: expense.getReimbursedAmount(),
      reimbursedAt: expense.getReimbursedAt(),
      reimbursementReference: expense.getReimbursementReference(),
      isTaxDeductible: expense.getIsTaxDeductible(),
      taxYear: expense.getTaxYear(),
      mileageInfo: expense.getMileageStart() ? {
        start: expense.getMileageStart(),
        end: expense.getMileageEnd(),
        driven: expense.getMileageDriven(),
      } : undefined,
      expenseDate: expense.getExpenseDate(),
      createdAt: expense.getCreatedAt(),
      updatedAt: expense.getUpdatedAt(),
    };
  }
}