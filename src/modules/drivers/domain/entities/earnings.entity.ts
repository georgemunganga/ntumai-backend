import { Entity } from '../../../common/domain/entity';
import { UniqueEntityID } from '../../../common/domain/unique-entity-id';
import { EarningsDetails } from '../value-objects/earnings-details.vo';

export type EarningType = 'delivery' | 'bonus' | 'tip' | 'incentive' | 'penalty' | 'adjustment' | 'referral' | 'surge';
export type PayoutStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
export type PayoutMethod = 'bank_transfer' | 'digital_wallet' | 'cash' | 'check';

export interface EarningEntry {
  id: string;
  type: EarningType;
  amount: number;
  description: string;
  orderId?: string;
  referenceId?: string;
  date: Date;
  metadata?: Record<string, any>;
}

export interface PayoutRequest {
  id: string;
  amount: number;
  method: PayoutMethod;
  status: PayoutStatus;
  requestedAt: Date;
  processedAt?: Date;
  completedAt?: Date;
  failureReason?: string;
  transactionId?: string;
  fees: number;
  netAmount: number;
  bankDetails?: {
    accountNumber: string;
    routingNumber: string;
    accountHolderName: string;
  };
  walletDetails?: {
    walletId: string;
    walletType: string;
  };
}

export interface TaxDocument {
  year: number;
  totalEarnings: number;
  totalDeductions: number;
  taxableIncome: number;
  documentUrl?: string;
  generatedAt: Date;
}

export interface EarningsProps {
  riderId: string;
  earningsDetails: EarningsDetails;
  entries: EarningEntry[];
  payoutRequests: PayoutRequest[];
  taxDocuments: TaxDocument[];
  lastPayoutDate?: Date;
  nextPayoutDate?: Date;
  minimumPayoutAmount: number;
  currency: string;
  taxId?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class Earnings extends Entity<EarningsProps> {
  private constructor(props: EarningsProps, id?: UniqueEntityID) {
    super(props, id);
  }

  public static create(props: EarningsProps, id?: UniqueEntityID): Earnings {
    return new Earnings(props, id);
  }

  get earningsId(): UniqueEntityID {
    return this._id;
  }

  get riderId(): string {
    return this.props.riderId;
  }

  get earningsDetails(): EarningsDetails {
    return this.props.earningsDetails;
  }

  get entries(): EarningEntry[] {
    return this.props.entries;
  }

  get payoutRequests(): PayoutRequest[] {
    return this.props.payoutRequests;
  }

  get taxDocuments(): TaxDocument[] {
    return this.props.taxDocuments;
  }

  get lastPayoutDate(): Date | undefined {
    return this.props.lastPayoutDate;
  }

  get nextPayoutDate(): Date | undefined {
    return this.props.nextPayoutDate;
  }

  get minimumPayoutAmount(): number {
    return this.props.minimumPayoutAmount;
  }

  get currency(): string {
    return this.props.currency;
  }

  get taxId(): string | undefined {
    return this.props.taxId;
  }

  get isActive(): boolean {
    return this.props.isActive;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  // Business logic methods

  public addEarning(
    type: EarningType,
    amount: number,
    description: string,
    orderId?: string,
    referenceId?: string,
    metadata?: Record<string, any>
  ): void {
    const entry: EarningEntry = {
      id: new UniqueEntityID().toString(),
      type,
      amount,
      description,
      orderId,
      referenceId,
      date: new Date(),
      metadata,
    };

    this.props.entries.push(entry);

    // Update earnings details based on type
    switch (type) {
      case 'delivery':
        this.props.earningsDetails = this.props.earningsDetails.addDeliveryEarnings(amount);
        break;
      case 'bonus':
        this.props.earningsDetails = this.props.earningsDetails.addBonusEarnings(amount);
        break;
      case 'tip':
        this.props.earningsDetails = this.props.earningsDetails.addTipEarnings(amount);
        break;
      case 'incentive':
      case 'referral':
      case 'surge':
        this.props.earningsDetails = this.props.earningsDetails.addIncentiveEarnings(amount);
        break;
      case 'penalty':
        this.props.earningsDetails = this.props.earningsDetails.applyPenalty(Math.abs(amount));
        break;
      case 'adjustment':
        if (amount > 0) {
          this.props.earningsDetails = this.props.earningsDetails.addBonusEarnings(amount);
        } else {
          this.props.earningsDetails = this.props.earningsDetails.applyPenalty(Math.abs(amount));
        }
        break;
    }

    this.props.updatedAt = new Date();
  }

  public requestPayout(
    amount: number,
    method: PayoutMethod,
    bankDetails?: PayoutRequest['bankDetails'],
    walletDetails?: PayoutRequest['walletDetails']
  ): string {
    if (amount < this.props.minimumPayoutAmount) {
      throw new Error(`Minimum payout amount is ${this.formatAmount(this.props.minimumPayoutAmount)}`);
    }

    if (amount > this.props.earningsDetails.availableBalance) {
      throw new Error('Insufficient available balance');
    }

    if (!this.props.isActive) {
      throw new Error('Earnings account is not active');
    }

    const fees = this.calculatePayoutFees(amount, method);
    const netAmount = amount - fees;

    const payoutRequest: PayoutRequest = {
      id: new UniqueEntityID().toString(),
      amount,
      method,
      status: 'pending',
      requestedAt: new Date(),
      fees,
      netAmount,
      bankDetails,
      walletDetails,
    };

    this.props.payoutRequests.push(payoutRequest);

    // Move amount from available to pending
    this.props.earningsDetails = this.props.earningsDetails.moveToPending(amount);
    this.props.updatedAt = new Date();

    return payoutRequest.id;
  }

  public processPayoutRequest(payoutId: string, transactionId?: string): void {
    const payout = this.props.payoutRequests.find(p => p.id === payoutId);
    if (!payout) {
      throw new Error('Payout request not found');
    }

    if (payout.status !== 'pending') {
      throw new Error('Can only process pending payout requests');
    }

    payout.status = 'processing';
    payout.processedAt = new Date();
    if (transactionId) payout.transactionId = transactionId;

    this.props.updatedAt = new Date();
  }

  public completePayoutRequest(payoutId: string, transactionId?: string): void {
    const payout = this.props.payoutRequests.find(p => p.id === payoutId);
    if (!payout) {
      throw new Error('Payout request not found');
    }

    if (payout.status !== 'processing') {
      throw new Error('Can only complete processing payout requests');
    }

    payout.status = 'completed';
    payout.completedAt = new Date();
    if (transactionId) payout.transactionId = transactionId;

    // Process withdrawal from pending balance
    this.props.earningsDetails = this.props.earningsDetails.processWithdrawal(payout.amount);
    this.props.lastPayoutDate = new Date();
    this.props.updatedAt = new Date();
  }

  public failPayoutRequest(payoutId: string, reason: string): void {
    const payout = this.props.payoutRequests.find(p => p.id === payoutId);
    if (!payout) {
      throw new Error('Payout request not found');
    }

    if (!['pending', 'processing'].includes(payout.status)) {
      throw new Error('Can only fail pending or processing payout requests');
    }

    payout.status = 'failed';
    payout.failureReason = reason;

    // Return amount from pending to available
    this.props.earningsDetails = this.props.earningsDetails.moveToAvailable(payout.amount);
    this.props.updatedAt = new Date();
  }

  public cancelPayoutRequest(payoutId: string): void {
    const payout = this.props.payoutRequests.find(p => p.id === payoutId);
    if (!payout) {
      throw new Error('Payout request not found');
    }

    if (payout.status !== 'pending') {
      throw new Error('Can only cancel pending payout requests');
    }

    payout.status = 'cancelled';

    // Return amount from pending to available
    this.props.earningsDetails = this.props.earningsDetails.moveToAvailable(payout.amount);
    this.props.updatedAt = new Date();
  }

  public setMinimumPayoutAmount(amount: number): void {
    if (amount < 0) {
      throw new Error('Minimum payout amount cannot be negative');
    }

    this.props.minimumPayoutAmount = amount;
    this.props.updatedAt = new Date();
  }

  public setNextPayoutDate(date: Date): void {
    this.props.nextPayoutDate = date;
    this.props.updatedAt = new Date();
  }

  public updateTaxId(taxId: string): void {
    this.props.taxId = taxId;
    this.props.updatedAt = new Date();
  }

  public activate(): void {
    this.props.isActive = true;
    this.props.updatedAt = new Date();
  }

  public deactivate(): void {
    this.props.isActive = false;
    this.props.updatedAt = new Date();
  }

  public generateTaxDocument(year: number): void {
    const yearEntries = this.getEntriesForYear(year);
    const totalEarnings = yearEntries
      .filter(e => e.amount > 0)
      .reduce((sum, e) => sum + e.amount, 0);
    const totalDeductions = yearEntries
      .filter(e => e.amount < 0)
      .reduce((sum, e) => sum + Math.abs(e.amount), 0);
    const taxableIncome = totalEarnings - totalDeductions;

    const existingDoc = this.props.taxDocuments.find(doc => doc.year === year);
    if (existingDoc) {
      existingDoc.totalEarnings = totalEarnings;
      existingDoc.totalDeductions = totalDeductions;
      existingDoc.taxableIncome = taxableIncome;
      existingDoc.generatedAt = new Date();
    } else {
      const taxDocument: TaxDocument = {
        year,
        totalEarnings,
        totalDeductions,
        taxableIncome,
        generatedAt: new Date(),
      };
      this.props.taxDocuments.push(taxDocument);
    }

    this.props.updatedAt = new Date();
  }

  public updateTaxDocumentUrl(year: number, documentUrl: string): void {
    const taxDoc = this.props.taxDocuments.find(doc => doc.year === year);
    if (!taxDoc) {
      throw new Error(`Tax document for year ${year} not found`);
    }

    taxDoc.documentUrl = documentUrl;
    this.props.updatedAt = new Date();
  }

  // Helper methods

  private calculatePayoutFees(amount: number, method: PayoutMethod): number {
    const feeRates: Record<PayoutMethod, number> = {
      bank_transfer: 0.01, // 1%
      digital_wallet: 0.005, // 0.5%
      cash: 0.02, // 2%
      check: 0.015, // 1.5%
    };

    const feeRate = feeRates[method] || 0.01;
    const fee = amount * feeRate;
    const maxFee = 10; // Maximum fee cap
    const minFee = 0.5; // Minimum fee

    return Math.min(Math.max(fee, minFee), maxFee);
  }

  public canRequestPayout(): boolean {
    return (
      this.props.isActive &&
      this.props.earningsDetails.availableBalance >= this.props.minimumPayoutAmount &&
      !this.hasPendingPayouts()
    );
  }

  public hasPendingPayouts(): boolean {
    return this.props.payoutRequests.some(p => ['pending', 'processing'].includes(p.status));
  }

  public getEntriesForPeriod(startDate: Date, endDate: Date): EarningEntry[] {
    return this.props.entries.filter(
      entry => entry.date >= startDate && entry.date <= endDate
    );
  }

  public getEntriesForYear(year: number): EarningEntry[] {
    return this.props.entries.filter(
      entry => entry.date.getFullYear() === year
    );
  }

  public getEntriesByType(type: EarningType): EarningEntry[] {
    return this.props.entries.filter(entry => entry.type === type);
  }

  public getEntriesForOrder(orderId: string): EarningEntry[] {
    return this.props.entries.filter(entry => entry.orderId === orderId);
  }

  public getTotalEarningsForPeriod(startDate: Date, endDate: Date): number {
    return this.getEntriesForPeriod(startDate, endDate)
      .reduce((sum, entry) => sum + entry.amount, 0);
  }

  public getTotalEarningsByType(type: EarningType): number {
    return this.getEntriesByType(type)
      .reduce((sum, entry) => sum + entry.amount, 0);
  }

  public getCompletedPayouts(): PayoutRequest[] {
    return this.props.payoutRequests.filter(p => p.status === 'completed');
  }

  public getPendingPayouts(): PayoutRequest[] {
    return this.props.payoutRequests.filter(p => ['pending', 'processing'].includes(p.status));
  }

  public getTotalWithdrawn(): number {
    return this.getCompletedPayouts()
      .reduce((sum, payout) => sum + payout.amount, 0);
  }

  public getTotalFeesPaid(): number {
    return this.getCompletedPayouts()
      .reduce((sum, payout) => sum + payout.fees, 0);
  }

  public getAveragePayoutAmount(): number {
    const completedPayouts = this.getCompletedPayouts();
    if (completedPayouts.length === 0) return 0;
    
    const total = completedPayouts.reduce((sum, payout) => sum + payout.amount, 0);
    return total / completedPayouts.length;
  }

  public getDaysUntilNextPayout(): number | null {
    if (!this.props.nextPayoutDate) return null;
    
    const diffMs = this.props.nextPayoutDate.getTime() - Date.now();
    return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  }

  public getEarningsGrowth(days: number): number {
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - (days * 24 * 60 * 60 * 1000));
    const previousStartDate = new Date(startDate.getTime() - (days * 24 * 60 * 60 * 1000));
    
    const currentPeriodEarnings = this.getTotalEarningsForPeriod(startDate, endDate);
    const previousPeriodEarnings = this.getTotalEarningsForPeriod(previousStartDate, startDate);
    
    if (previousPeriodEarnings === 0) return currentPeriodEarnings > 0 ? 100 : 0;
    
    return ((currentPeriodEarnings - previousPeriodEarnings) / previousPeriodEarnings) * 100;
  }

  public getEarningsBreakdown(days: number = 30): Record<EarningType, number> {
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - (days * 24 * 60 * 60 * 1000));
    const entries = this.getEntriesForPeriod(startDate, endDate);
    
    const breakdown: Record<EarningType, number> = {
      delivery: 0,
      bonus: 0,
      tip: 0,
      incentive: 0,
      penalty: 0,
      adjustment: 0,
      referral: 0,
      surge: 0,
    };
    
    entries.forEach(entry => {
      breakdown[entry.type] += entry.amount;
    });
    
    return breakdown;
  }

  public formatAmount(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: this.props.currency,
    }).format(amount);
  }

  public getPayoutStatusDisplay(status: PayoutStatus): string {
    const statusMap: Record<PayoutStatus, string> = {
      pending: 'Pending',
      processing: 'Processing',
      completed: 'Completed',
      failed: 'Failed',
      cancelled: 'Cancelled',
    };
    
    return statusMap[status];
  }

  public getEarningTypeDisplay(type: EarningType): string {
    const typeMap: Record<EarningType, string> = {
      delivery: 'Delivery Fee',
      bonus: 'Bonus',
      tip: 'Tip',
      incentive: 'Incentive',
      penalty: 'Penalty',
      adjustment: 'Adjustment',
      referral: 'Referral Bonus',
      surge: 'Surge Pricing',
    };
    
    return typeMap[type];
  }

  public toJSON() {
    return {
      id: this._id.toString(),
      riderId: this.props.riderId,
      earningsDetails: this.props.earningsDetails.toJSON(),
      entries: this.props.entries.map(entry => ({
        ...entry,
        typeDisplay: this.getEarningTypeDisplay(entry.type),
        formattedAmount: this.formatAmount(entry.amount),
      })),
      payoutRequests: this.props.payoutRequests.map(payout => ({
        ...payout,
        statusDisplay: this.getPayoutStatusDisplay(payout.status),
        formattedAmount: this.formatAmount(payout.amount),
        formattedNetAmount: this.formatAmount(payout.netAmount),
        formattedFees: this.formatAmount(payout.fees),
      })),
      taxDocuments: this.props.taxDocuments.map(doc => ({
        ...doc,
        formattedTotalEarnings: this.formatAmount(doc.totalEarnings),
        formattedTotalDeductions: this.formatAmount(doc.totalDeductions),
        formattedTaxableIncome: this.formatAmount(doc.taxableIncome),
      })),
      lastPayoutDate: this.props.lastPayoutDate,
      nextPayoutDate: this.props.nextPayoutDate,
      daysUntilNextPayout: this.getDaysUntilNextPayout(),
      minimumPayoutAmount: this.props.minimumPayoutAmount,
      formattedMinimumPayout: this.formatAmount(this.props.minimumPayoutAmount),
      currency: this.props.currency,
      taxId: this.props.taxId,
      isActive: this.props.isActive,
      canRequestPayout: this.canRequestPayout(),
      hasPendingPayouts: this.hasPendingPayouts(),
      totalWithdrawn: this.getTotalWithdrawn(),
      formattedTotalWithdrawn: this.formatAmount(this.getTotalWithdrawn()),
      totalFeesPaid: this.getTotalFeesPaid(),
      formattedTotalFeesPaid: this.formatAmount(this.getTotalFeesPaid()),
      averagePayoutAmount: this.getAveragePayoutAmount(),
      formattedAveragePayoutAmount: this.formatAmount(this.getAveragePayoutAmount()),
      earningsGrowth30Days: this.getEarningsGrowth(30),
      earningsBreakdown30Days: this.getEarningsBreakdown(30),
      createdAt: this.props.createdAt,
      updatedAt: this.props.updatedAt,
    };
  }
}