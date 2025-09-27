import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { ExpenseRepository } from '../../domain/repositories/expense.repository';
import { Expense } from '../../domain/entities/expense.entity';
import { Prisma } from '@prisma/client';

export interface ExpenseSearchFilters {
  riderId?: string;
  category?: string;
  status?: string;
  startDate?: Date;
  endDate?: Date;
  minAmount?: number;
  maxAmount?: number;
  currency?: string;
  isReimbursable?: boolean;
  approvedBy?: string;
  rejectedBy?: string;
}

export interface ExpenseSearchResult {
  expenses: Expense[];
  total: number;
}

export interface PaginationOptions {
  page: number;
  limit: number;
}

export interface ExpenseSummary {
  period: string;
  totalExpenses: number;
  totalAmount: number;
  approvedAmount: number;
  pendingAmount: number;
  rejectedAmount: number;
  reimbursableAmount: number;
  fuelExpenses: number;
  maintenanceExpenses: number;
  insuranceExpenses: number;
  otherExpenses: number;
}

export interface TaxSummary {
  taxYear: number;
  totalExpenses: number;
  deductibleExpenses: number;
  fuelExpenses: number;
  maintenanceExpenses: number;
  insuranceExpenses: number;
  depreciationExpenses: number;
  otherExpenses: number;
}

@Injectable()
export class ExpenseRepositoryImpl implements ExpenseRepository {
  constructor(private readonly prisma: PrismaService) {}

  async save(expense: Expense): Promise<Expense> {
    const expenseData = this.mapToExpenseData(expense);

    if (expense.getId()) {
      // Update existing expense
      const updatedExpense = await this.prisma.expense.update({
        where: { id: expense.getId() },
        data: expenseData,
        include: this.getIncludeOptions(),
      });
      return this.mapToDomainEntity(updatedExpense);
    } else {
      // Create new expense
      const createdExpense = await this.prisma.expense.create({
        data: {
          ...expenseData,
          id: undefined, // Let Prisma generate the ID
        },
        include: this.getIncludeOptions(),
      });
      return this.mapToDomainEntity(createdExpense);
    }
  }

  async findById(id: string): Promise<Expense | null> {
    const expense = await this.prisma.expense.findUnique({
      where: { id },
      include: this.getIncludeOptions(),
    });

    return expense ? this.mapToDomainEntity(expense) : null;
  }

  async findByRiderId(
    riderId: string,
    pagination?: PaginationOptions,
  ): Promise<ExpenseSearchResult> {
    const where: Prisma.ExpenseWhereInput = { riderId };

    const [expenses, total] = await Promise.all([
      this.prisma.expense.findMany({
        where,
        include: this.getIncludeOptions(),
        skip: pagination ? (pagination.page - 1) * pagination.limit : undefined,
        take: pagination?.limit,
        orderBy: { expenseDate: 'desc' },
      }),
      this.prisma.expense.count({ where }),
    ]);

    return {
      expenses: expenses.map(expense => this.mapToDomainEntity(expense)),
      total,
    };
  }

  async findByCategory(
    category: string,
    pagination?: PaginationOptions,
  ): Promise<ExpenseSearchResult> {
    const where: Prisma.ExpenseWhereInput = { category: category as any };

    const [expenses, total] = await Promise.all([
      this.prisma.expense.findMany({
        where,
        include: this.getIncludeOptions(),
        skip: pagination ? (pagination.page - 1) * pagination.limit : undefined,
        take: pagination?.limit,
        orderBy: { expenseDate: 'desc' },
      }),
      this.prisma.expense.count({ where }),
    ]);

    return {
      expenses: expenses.map(expense => this.mapToDomainEntity(expense)),
      total,
    };
  }

  async findByStatus(
    status: string,
    pagination?: PaginationOptions,
  ): Promise<ExpenseSearchResult> {
    const where: Prisma.ExpenseWhereInput = { status: status as any };

    const [expenses, total] = await Promise.all([
      this.prisma.expense.findMany({
        where,
        include: this.getIncludeOptions(),
        skip: pagination ? (pagination.page - 1) * pagination.limit : undefined,
        take: pagination?.limit,
        orderBy: { expenseDate: 'desc' },
      }),
      this.prisma.expense.count({ where }),
    ]);

    return {
      expenses: expenses.map(expense => this.mapToDomainEntity(expense)),
      total,
    };
  }

  async searchExpenses(
    filters: ExpenseSearchFilters,
    pagination: PaginationOptions,
  ): Promise<ExpenseSearchResult> {
    const where: Prisma.ExpenseWhereInput = {};

    if (filters.riderId) {
      where.riderId = filters.riderId;
    }

    if (filters.category) {
      where.category = filters.category as any;
    }

    if (filters.status) {
      where.status = filters.status as any;
    }

    if (filters.startDate) {
      where.expenseDate = {
        gte: filters.startDate,
      };
    }

    if (filters.endDate) {
      where.expenseDate = {
        ...where.expenseDate,
        lte: filters.endDate,
      };
    }

    if (filters.minAmount !== undefined) {
      where.amount = {
        gte: filters.minAmount,
      };
    }

    if (filters.maxAmount !== undefined) {
      where.amount = {
        ...where.amount,
        lte: filters.maxAmount,
      };
    }

    if (filters.currency) {
      where.currency = filters.currency;
    }

    if (filters.isReimbursable !== undefined) {
      where.isReimbursable = filters.isReimbursable;
    }

    if (filters.approvedBy) {
      where.approvedBy = filters.approvedBy;
    }

    if (filters.rejectedBy) {
      where.rejectedBy = filters.rejectedBy;
    }

    const [expenses, total] = await Promise.all([
      this.prisma.expense.findMany({
        where,
        include: this.getIncludeOptions(),
        skip: (pagination.page - 1) * pagination.limit,
        take: pagination.limit,
        orderBy: { expenseDate: 'desc' },
      }),
      this.prisma.expense.count({ where }),
    ]);

    return {
      expenses: expenses.map(expense => this.mapToDomainEntity(expense)),
      total,
    };
  }

  async getExpenseSummary(
    riderId: string,
    startDate: Date,
    endDate: Date,
    groupBy: 'day' | 'week' | 'month' = 'day',
  ): Promise<ExpenseSummary[]> {
    let dateFormat: string;
    switch (groupBy) {
      case 'week':
        dateFormat = '%Y-%u'; // Year-Week
        break;
      case 'month':
        dateFormat = '%Y-%m'; // Year-Month
        break;
      default:
        dateFormat = '%Y-%m-%d'; // Year-Month-Day
    }

    const query = `
      SELECT 
        DATE_FORMAT(expense_date, '${dateFormat}') as period,
        COUNT(*) as totalExpenses,
        SUM(amount) as totalAmount,
        SUM(CASE WHEN status = 'APPROVED' THEN amount ELSE 0 END) as approvedAmount,
        SUM(CASE WHEN status = 'PENDING' THEN amount ELSE 0 END) as pendingAmount,
        SUM(CASE WHEN status = 'REJECTED' THEN amount ELSE 0 END) as rejectedAmount,
        SUM(CASE WHEN is_reimbursable = true THEN amount ELSE 0 END) as reimbursableAmount,
        SUM(CASE WHEN category = 'FUEL' THEN amount ELSE 0 END) as fuelExpenses,
        SUM(CASE WHEN category = 'MAINTENANCE' THEN amount ELSE 0 END) as maintenanceExpenses,
        SUM(CASE WHEN category = 'INSURANCE' THEN amount ELSE 0 END) as insuranceExpenses,
        SUM(CASE WHEN category NOT IN ('FUEL', 'MAINTENANCE', 'INSURANCE') THEN amount ELSE 0 END) as otherExpenses
      FROM expenses 
      WHERE rider_id = ? 
        AND expense_date >= ? 
        AND expense_date <= ?
      GROUP BY DATE_FORMAT(expense_date, '${dateFormat}')
      ORDER BY period ASC
    `;

    const results = await this.prisma.$queryRawUnsafe(
      query,
      riderId,
      startDate,
      endDate,
    ) as any[];

    return results.map(result => ({
      period: result.period,
      totalExpenses: Number(result.totalExpenses) || 0,
      totalAmount: Number(result.totalAmount) || 0,
      approvedAmount: Number(result.approvedAmount) || 0,
      pendingAmount: Number(result.pendingAmount) || 0,
      rejectedAmount: Number(result.rejectedAmount) || 0,
      reimbursableAmount: Number(result.reimbursableAmount) || 0,
      fuelExpenses: Number(result.fuelExpenses) || 0,
      maintenanceExpenses: Number(result.maintenanceExpenses) || 0,
      insuranceExpenses: Number(result.insuranceExpenses) || 0,
      otherExpenses: Number(result.otherExpenses) || 0,
    }));
  }

  async getTaxSummary(
    riderId: string,
    taxYear: number,
  ): Promise<TaxSummary> {
    const startDate = new Date(taxYear, 0, 1); // January 1st
    const endDate = new Date(taxYear, 11, 31, 23, 59, 59); // December 31st

    const query = `
      SELECT 
        ? as taxYear,
        SUM(amount) as totalExpenses,
        SUM(CASE WHEN is_tax_deductible = true THEN amount ELSE 0 END) as deductibleExpenses,
        SUM(CASE WHEN category = 'FUEL' THEN amount ELSE 0 END) as fuelExpenses,
        SUM(CASE WHEN category = 'MAINTENANCE' THEN amount ELSE 0 END) as maintenanceExpenses,
        SUM(CASE WHEN category = 'INSURANCE' THEN amount ELSE 0 END) as insuranceExpenses,
        SUM(CASE WHEN category = 'DEPRECIATION' THEN amount ELSE 0 END) as depreciationExpenses,
        SUM(CASE WHEN category NOT IN ('FUEL', 'MAINTENANCE', 'INSURANCE', 'DEPRECIATION') THEN amount ELSE 0 END) as otherExpenses
      FROM expenses 
      WHERE rider_id = ? 
        AND expense_date >= ? 
        AND expense_date <= ?
        AND status = 'APPROVED'
    `;

    const results = await this.prisma.$queryRawUnsafe(
      query,
      taxYear,
      riderId,
      startDate,
      endDate,
    ) as any[];

    const result = results[0] || {};

    return {
      taxYear: Number(result.taxYear) || taxYear,
      totalExpenses: Number(result.totalExpenses) || 0,
      deductibleExpenses: Number(result.deductibleExpenses) || 0,
      fuelExpenses: Number(result.fuelExpenses) || 0,
      maintenanceExpenses: Number(result.maintenanceExpenses) || 0,
      insuranceExpenses: Number(result.insuranceExpenses) || 0,
      depreciationExpenses: Number(result.depreciationExpenses) || 0,
      otherExpenses: Number(result.otherExpenses) || 0,
    };
  }

  async findPendingExpenses(
    riderId?: string,
    pagination?: PaginationOptions,
  ): Promise<ExpenseSearchResult> {
    const where: Prisma.ExpenseWhereInput = { status: 'PENDING' };

    if (riderId) {
      where.riderId = riderId;
    }

    const [expenses, total] = await Promise.all([
      this.prisma.expense.findMany({
        where,
        include: this.getIncludeOptions(),
        skip: pagination ? (pagination.page - 1) * pagination.limit : undefined,
        take: pagination?.limit,
        orderBy: { submittedAt: 'asc' },
      }),
      this.prisma.expense.count({ where }),
    ]);

    return {
      expenses: expenses.map(expense => this.mapToDomainEntity(expense)),
      total,
    };
  }

  async findReimbursableExpenses(
    riderId: string,
    status: string = 'APPROVED',
  ): Promise<Expense[]> {
    const expenses = await this.prisma.expense.findMany({
      where: {
        riderId,
        status: status as any,
        isReimbursable: true,
      },
      include: this.getIncludeOptions(),
      orderBy: { expenseDate: 'desc' },
    });

    return expenses.map(expense => this.mapToDomainEntity(expense));
  }

  async findExpensesByDateRange(
    riderId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<Expense[]> {
    const expenses = await this.prisma.expense.findMany({
      where: {
        riderId,
        expenseDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: this.getIncludeOptions(),
      orderBy: { expenseDate: 'desc' },
    });

    return expenses.map(expense => this.mapToDomainEntity(expense));
  }

  async updateExpenseStatus(
    expenseId: string,
    status: string,
    reviewedBy: string,
    reviewNotes?: string,
  ): Promise<void> {
    const updateData: any = {
      status,
      reviewedAt: new Date(),
      reviewNotes,
    };

    if (status === 'APPROVED') {
      updateData.approvedBy = reviewedBy;
      updateData.approvedAt = new Date();
    } else if (status === 'REJECTED') {
      updateData.rejectedBy = reviewedBy;
      updateData.rejectedAt = new Date();
    }

    await this.prisma.expense.update({
      where: { id: expenseId },
      data: updateData,
    });
  }

  async bulkUpdateExpenseStatus(
    expenseIds: string[],
    status: string,
    reviewedBy: string,
    reviewNotes?: string,
  ): Promise<void> {
    const updateData: any = {
      status,
      reviewedAt: new Date(),
      reviewNotes,
    };

    if (status === 'APPROVED') {
      updateData.approvedBy = reviewedBy;
      updateData.approvedAt = new Date();
    } else if (status === 'REJECTED') {
      updateData.rejectedBy = reviewedBy;
      updateData.rejectedAt = new Date();
    }

    await this.prisma.expense.updateMany({
      where: {
        id: {
          in: expenseIds,
        },
      },
      data: updateData,
    });
  }

  async getTotalExpensesByRiderId(
    riderId: string,
    startDate?: Date,
    endDate?: Date,
    status?: string,
  ): Promise<number> {
    const where: Prisma.ExpenseWhereInput = { riderId };

    if (startDate) {
      where.expenseDate = { gte: startDate };
    }

    if (endDate) {
      where.expenseDate = {
        ...where.expenseDate,
        lte: endDate,
      };
    }

    if (status) {
      where.status = status as any;
    }

    const result = await this.prisma.expense.aggregate({
      where,
      _sum: { amount: true },
    });

    return Number(result._sum.amount) || 0;
  }

  async getTotalExpensesByCategory(
    riderId: string,
    category: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<number> {
    const where: Prisma.ExpenseWhereInput = {
      riderId,
      category: category as any,
    };

    if (startDate) {
      where.expenseDate = { gte: startDate };
    }

    if (endDate) {
      where.expenseDate = {
        ...where.expenseDate,
        lte: endDate,
      };
    }

    const result = await this.prisma.expense.aggregate({
      where,
      _sum: { amount: true },
    });

    return Number(result._sum.amount) || 0;
  }

  async getReimbursableAmount(
    riderId: string,
    status: string = 'APPROVED',
  ): Promise<number> {
    const result = await this.prisma.expense.aggregate({
      where: {
        riderId,
        status: status as any,
        isReimbursable: true,
      },
      _sum: { amount: true },
    });

    return Number(result._sum.amount) || 0;
  }

  async delete(id: string): Promise<void> {
    await this.prisma.expense.delete({
      where: { id },
    });
  }

  async findAll(): Promise<Expense[]> {
    const expenses = await this.prisma.expense.findMany({
      include: this.getIncludeOptions(),
      orderBy: { expenseDate: 'desc' },
    });

    return expenses.map(expense => this.mapToDomainEntity(expense));
  }

  async count(): Promise<number> {
    return this.prisma.expense.count();
  }

  async countByRiderId(riderId: string): Promise<number> {
    return this.prisma.expense.count({
      where: { riderId },
    });
  }

  async countByStatus(status: string): Promise<number> {
    return this.prisma.expense.count({
      where: { status: status as any },
    });
  }

  async countByCategory(category: string): Promise<number> {
    return this.prisma.expense.count({
      where: { category: category as any },
    });
  }

  private getIncludeOptions() {
    return {
      rider: {
        select: {
          id: true,
          riderCode: true,
          firstName: true,
          lastName: true,
          email: true,
          phoneNumber: true,
        },
      },
    };
  }

  private mapToExpenseData(expense: Expense): Prisma.ExpenseCreateInput | Prisma.ExpenseUpdateInput {
    return {
      riderId: expense.getRiderId(),
      category: expense.getCategory() as any,
      amount: expense.getAmount(),
      currency: expense.getCurrency(),
      description: expense.getDescription(),
      expenseDate: expense.getExpenseDate(),
      receiptUrl: expense.getReceiptUrl(),
      isReimbursable: expense.getIsReimbursable(),
      isTaxDeductible: expense.getIsTaxDeductible(),
      status: expense.getStatus() as any,
      submittedAt: expense.getSubmittedAt(),
      reviewedAt: expense.getReviewedAt(),
      approvedBy: expense.getApprovedBy(),
      approvedAt: expense.getApprovedAt(),
      rejectedBy: expense.getRejectedBy(),
      rejectedAt: expense.getRejectedAt(),
      reviewNotes: expense.getReviewNotes(),
      mileage: expense.getMileage(),
      location: expense.getLocation(),
      vendor: expense.getVendor(),
      paymentMethod: expense.getPaymentMethod(),
      taxYear: expense.getTaxYear(),
      metadata: expense.getMetadata() ? JSON.stringify(expense.getMetadata()) : null,
    };
  }

  private mapToDomainEntity(data: any): Expense {
    return new Expense(
      data.id,
      data.riderId,
      data.category,
      data.amount,
      data.currency,
      data.description,
      data.expenseDate,
      data.receiptUrl,
      data.isReimbursable,
      data.isTaxDeductible,
      data.status,
      data.submittedAt,
      data.reviewedAt,
      data.approvedBy,
      data.approvedAt,
      data.rejectedBy,
      data.rejectedAt,
      data.reviewNotes,
      data.mileage,
      data.location,
      data.vendor,
      data.paymentMethod,
      data.taxYear,
      data.metadata ? JSON.parse(data.metadata) : null,
      data.createdAt,
      data.updatedAt,
    );
  }
}