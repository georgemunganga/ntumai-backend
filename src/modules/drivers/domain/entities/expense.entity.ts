import { Entity } from '../../../common/domain/entity';
import { UniqueEntityID } from '../../../common/domain/unique-entity-id';
import { Location } from '../value-objects/location.vo';

export type ExpenseCategory = 'fuel' | 'maintenance' | 'insurance' | 'vehicle_payment' | 'phone' | 'equipment' | 'parking' | 'tolls' | 'food' | 'supplies' | 'registration' | 'inspection' | 'cleaning' | 'other';
export type ExpenseStatus = 'pending' | 'approved' | 'rejected' | 'reimbursed';
export type PaymentMethod = 'cash' | 'credit_card' | 'debit_card' | 'bank_transfer' | 'digital_wallet' | 'check';
export type ReimbursementStatus = 'not_applicable' | 'pending' | 'processing' | 'completed' | 'failed';

export interface ExpenseReceipt {
  id: string;
  url: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: Date;
  ocrText?: string;
  extractedData?: {
    merchant?: string;
    amount?: number;
    date?: Date;
    taxAmount?: number;
  };
}

export interface ExpenseApproval {
  approvedBy: string;
  approvedAt: Date;
  approvedAmount: number;
  notes?: string;
  rejectionReason?: string;
}

export interface ExpenseReimbursement {
  id: string;
  amount: number;
  requestedAt: Date;
  processedAt?: Date;
  completedAt?: Date;
  status: ReimbursementStatus;
  paymentMethod?: PaymentMethod;
  transactionId?: string;
  failureReason?: string;
  notes?: string;
}

export interface MileageRecord {
  startLocation: Location;
  endLocation: Location;
  distance: number; // in kilometers
  purpose: string;
  orderId?: string;
  startTime: Date;
  endTime: Date;
  rate: number; // per kilometer
  amount: number;
}

export interface TaxDeduction {
  year: number;
  category: ExpenseCategory;
  totalAmount: number;
  deductibleAmount: number;
  deductionPercentage: number;
  notes?: string;
}

export interface ExpenseProps {
  riderId: string;
  orderId?: string;
  shiftId?: string;
  category: ExpenseCategory;
  subcategory?: string;
  description: string;
  amount: number;
  currency: string;
  date: Date;
  location?: Location;
  merchant?: string;
  paymentMethod: PaymentMethod;
  isBusinessExpense: boolean;
  isTaxDeductible: boolean;
  deductionPercentage: number;
  status: ExpenseStatus;
  receipts: ExpenseReceipt[];
  approval?: ExpenseApproval;
  reimbursement?: ExpenseReimbursement;
  mileageRecord?: MileageRecord;
  tags: string[];
  notes?: string;
  isRecurring: boolean;
  recurringFrequency?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  nextRecurrenceDate?: Date;
  parentExpenseId?: string; // for recurring expenses
  submittedAt?: Date;
  submittedBy: string;
  reviewedAt?: Date;
  reviewedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class Expense extends Entity<ExpenseProps> {
  private constructor(props: ExpenseProps, id?: UniqueEntityID) {
    super(props, id);
  }

  public static create(props: ExpenseProps, id?: UniqueEntityID): Expense {
    return new Expense(props, id);
  }

  get expenseId(): UniqueEntityID {
    return this._id;
  }

  get riderId(): string {
    return this.props.riderId;
  }

  get orderId(): string | undefined {
    return this.props.orderId;
  }

  get shiftId(): string | undefined {
    return this.props.shiftId;
  }

  get category(): ExpenseCategory {
    return this.props.category;
  }

  get subcategory(): string | undefined {
    return this.props.subcategory;
  }

  get description(): string {
    return this.props.description;
  }

  get amount(): number {
    return this.props.amount;
  }

  get currency(): string {
    return this.props.currency;
  }

  get date(): Date {
    return this.props.date;
  }

  get location(): Location | undefined {
    return this.props.location;
  }

  get merchant(): string | undefined {
    return this.props.merchant;
  }

  get paymentMethod(): PaymentMethod {
    return this.props.paymentMethod;
  }

  get isBusinessExpense(): boolean {
    return this.props.isBusinessExpense;
  }

  get isTaxDeductible(): boolean {
    return this.props.isTaxDeductible;
  }

  get deductionPercentage(): number {
    return this.props.deductionPercentage;
  }

  get status(): ExpenseStatus {
    return this.props.status;
  }

  get receipts(): ExpenseReceipt[] {
    return this.props.receipts;
  }

  get approval(): ExpenseApproval | undefined {
    return this.props.approval;
  }

  get reimbursement(): ExpenseReimbursement | undefined {
    return this.props.reimbursement;
  }

  get mileageRecord(): MileageRecord | undefined {
    return this.props.mileageRecord;
  }

  get tags(): string[] {
    return this.props.tags;
  }

  get notes(): string | undefined {
    return this.props.notes;
  }

  get isRecurring(): boolean {
    return this.props.isRecurring;
  }

  get recurringFrequency(): string | undefined {
    return this.props.recurringFrequency;
  }

  get nextRecurrenceDate(): Date | undefined {
    return this.props.nextRecurrenceDate;
  }

  get parentExpenseId(): string | undefined {
    return this.props.parentExpenseId;
  }

  get submittedAt(): Date | undefined {
    return this.props.submittedAt;
  }

  get submittedBy(): string {
    return this.props.submittedBy;
  }

  get reviewedAt(): Date | undefined {
    return this.props.reviewedAt;
  }

  get reviewedBy(): string | undefined {
    return this.props.reviewedBy;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  // Business logic methods

  public submit(): void {
    if (this.props.status !== 'pending') {
      throw new Error('Can only submit pending expenses');
    }

    if (this.props.receipts.length === 0 && this.props.amount > 25) {
      throw new Error('Receipt required for expenses over $25');
    }

    this.props.submittedAt = new Date();
    this.props.updatedAt = new Date();
  }

  public approve(approvedBy: string, approvedAmount?: number, notes?: string): void {
    if (this.props.status !== 'pending') {
      throw new Error('Can only approve pending expenses');
    }

    const finalAmount = approvedAmount || this.props.amount;
    if (finalAmount > this.props.amount) {
      throw new Error('Approved amount cannot exceed original amount');
    }

    this.props.status = 'approved';
    this.props.approval = {
      approvedBy,
      approvedAt: new Date(),
      approvedAmount: finalAmount,
      notes,
    };
    this.props.reviewedAt = new Date();
    this.props.reviewedBy = approvedBy;
    this.props.updatedAt = new Date();
  }

  public reject(rejectedBy: string, reason: string): void {
    if (this.props.status !== 'pending') {
      throw new Error('Can only reject pending expenses');
    }

    this.props.status = 'rejected';
    this.props.approval = {
      approvedBy: rejectedBy,
      approvedAt: new Date(),
      approvedAmount: 0,
      rejectionReason: reason,
    };
    this.props.reviewedAt = new Date();
    this.props.reviewedBy = rejectedBy;
    this.props.updatedAt = new Date();
  }

  public requestReimbursement(paymentMethod: PaymentMethod, notes?: string): string {
    if (this.props.status !== 'approved') {
      throw new Error('Can only request reimbursement for approved expenses');
    }

    if (this.props.reimbursement && this.props.reimbursement.status === 'pending') {
      throw new Error('Reimbursement request already pending');
    }

    const reimbursementAmount = this.props.approval?.approvedAmount || this.props.amount;
    
    this.props.reimbursement = {
      id: new UniqueEntityID().toString(),
      amount: reimbursementAmount,
      requestedAt: new Date(),
      status: 'pending',
      paymentMethod,
      notes,
    };
    this.props.updatedAt = new Date();

    return this.props.reimbursement.id;
  }

  public processReimbursement(transactionId?: string): void {
    if (!this.props.reimbursement || this.props.reimbursement.status !== 'pending') {
      throw new Error('No pending reimbursement request found');
    }

    this.props.reimbursement.status = 'processing';
    this.props.reimbursement.processedAt = new Date();
    if (transactionId) this.props.reimbursement.transactionId = transactionId;
    this.props.updatedAt = new Date();
  }

  public completeReimbursement(transactionId?: string): void {
    if (!this.props.reimbursement || this.props.reimbursement.status !== 'processing') {
      throw new Error('No processing reimbursement found');
    }

    this.props.status = 'reimbursed';
    this.props.reimbursement.status = 'completed';
    this.props.reimbursement.completedAt = new Date();
    if (transactionId) this.props.reimbursement.transactionId = transactionId;
    this.props.updatedAt = new Date();
  }

  public failReimbursement(reason: string): void {
    if (!this.props.reimbursement || !['pending', 'processing'].includes(this.props.reimbursement.status)) {
      throw new Error('No pending or processing reimbursement found');
    }

    this.props.reimbursement.status = 'failed';
    this.props.reimbursement.failureReason = reason;
    this.props.updatedAt = new Date();
  }

  public addReceipt(receipt: Omit<ExpenseReceipt, 'id' | 'uploadedAt'>): string {
    const newReceipt: ExpenseReceipt = {
      id: new UniqueEntityID().toString(),
      uploadedAt: new Date(),
      ...receipt,
    };

    this.props.receipts.push(newReceipt);
    this.props.updatedAt = new Date();

    return newReceipt.id;
  }

  public removeReceipt(receiptId: string): void {
    const receiptIndex = this.props.receipts.findIndex(r => r.id === receiptId);
    if (receiptIndex === -1) {
      throw new Error('Receipt not found');
    }

    this.props.receipts.splice(receiptIndex, 1);
    this.props.updatedAt = new Date();
  }

  public updateReceiptOCR(receiptId: string, ocrText: string, extractedData?: ExpenseReceipt['extractedData']): void {
    const receipt = this.props.receipts.find(r => r.id === receiptId);
    if (!receipt) {
      throw new Error('Receipt not found');
    }

    receipt.ocrText = ocrText;
    if (extractedData) {
      receipt.extractedData = extractedData;
      
      // Auto-update expense details if extracted data is available
      if (extractedData.merchant && !this.props.merchant) {
        this.props.merchant = extractedData.merchant;
      }
      if (extractedData.amount && Math.abs(extractedData.amount - this.props.amount) < 0.01) {
        // Verify amount matches
        this.props.amount = extractedData.amount;
      }
      if (extractedData.date) {
        this.props.date = extractedData.date;
      }
    }

    this.props.updatedAt = new Date();
  }

  public addMileageRecord(record: MileageRecord): void {
    this.props.mileageRecord = record;
    
    // Update amount based on mileage if this is a mileage expense
    if (this.props.category === 'fuel' || this.props.category === 'maintenance') {
      this.props.amount += record.amount;
    }
    
    this.props.updatedAt = new Date();
  }

  public updateAmount(amount: number): void {
    if (amount <= 0) {
      throw new Error('Amount must be positive');
    }

    if (this.props.status !== 'pending') {
      throw new Error('Can only update amount for pending expenses');
    }

    this.props.amount = amount;
    this.props.updatedAt = new Date();
  }

  public updateDescription(description: string): void {
    if (this.props.status !== 'pending') {
      throw new Error('Can only update description for pending expenses');
    }

    this.props.description = description;
    this.props.updatedAt = new Date();
  }

  public updateCategory(category: ExpenseCategory, subcategory?: string): void {
    if (this.props.status !== 'pending') {
      throw new Error('Can only update category for pending expenses');
    }

    this.props.category = category;
    this.props.subcategory = subcategory;
    
    // Update tax deductibility based on category
    this.updateTaxDeductibility();
    
    this.props.updatedAt = new Date();
  }

  public setBusinessExpense(isBusinessExpense: boolean): void {
    this.props.isBusinessExpense = isBusinessExpense;
    
    // Update tax deductibility
    this.updateTaxDeductibility();
    
    this.props.updatedAt = new Date();
  }

  public setTaxDeductible(isTaxDeductible: boolean, deductionPercentage: number = 100): void {
    if (deductionPercentage < 0 || deductionPercentage > 100) {
      throw new Error('Deduction percentage must be between 0 and 100');
    }

    this.props.isTaxDeductible = isTaxDeductible;
    this.props.deductionPercentage = isTaxDeductible ? deductionPercentage : 0;
    this.props.updatedAt = new Date();
  }

  public addTags(tags: string[]): void {
    const newTags = tags.filter(tag => !this.props.tags.includes(tag));
    this.props.tags.push(...newTags);
    this.props.updatedAt = new Date();
  }

  public removeTags(tags: string[]): void {
    this.props.tags = this.props.tags.filter(tag => !tags.includes(tag));
    this.props.updatedAt = new Date();
  }

  public addNotes(notes: string): void {
    this.props.notes = notes;
    this.props.updatedAt = new Date();
  }

  public setRecurring(isRecurring: boolean, frequency?: ExpenseProps['recurringFrequency']): void {
    this.props.isRecurring = isRecurring;
    this.props.recurringFrequency = frequency;
    
    if (isRecurring && frequency) {
      this.calculateNextRecurrenceDate();
    } else {
      this.props.nextRecurrenceDate = undefined;
    }
    
    this.props.updatedAt = new Date();
  }

  private calculateNextRecurrenceDate(): void {
    if (!this.props.recurringFrequency) return;

    const currentDate = new Date();
    const nextDate = new Date(currentDate);

    switch (this.props.recurringFrequency) {
      case 'daily':
        nextDate.setDate(nextDate.getDate() + 1);
        break;
      case 'weekly':
        nextDate.setDate(nextDate.getDate() + 7);
        break;
      case 'monthly':
        nextDate.setMonth(nextDate.getMonth() + 1);
        break;
      case 'yearly':
        nextDate.setFullYear(nextDate.getFullYear() + 1);
        break;
    }

    this.props.nextRecurrenceDate = nextDate;
  }

  private updateTaxDeductibility(): void {
    // Define tax deductible categories and their default percentages
    const taxDeductibleCategories: Record<ExpenseCategory, number> = {
      fuel: 100,
      maintenance: 100,
      insurance: 100,
      vehicle_payment: 100,
      phone: 50, // Partial business use
      equipment: 100,
      parking: 100,
      tolls: 100,
      food: 0, // Generally not deductible
      supplies: 100,
      registration: 100,
      inspection: 100,
      cleaning: 100,
      other: 0,
    };

    const defaultPercentage = taxDeductibleCategories[this.props.category] || 0;
    
    if (this.props.isBusinessExpense && defaultPercentage > 0) {
      this.props.isTaxDeductible = true;
      this.props.deductionPercentage = defaultPercentage;
    } else {
      this.props.isTaxDeductible = false;
      this.props.deductionPercentage = 0;
    }
  }

  // Helper methods

  public isPending(): boolean {
    return this.props.status === 'pending';
  }

  public isApproved(): boolean {
    return this.props.status === 'approved';
  }

  public isRejected(): boolean {
    return this.props.status === 'rejected';
  }

  public isReimbursed(): boolean {
    return this.props.status === 'reimbursed';
  }

  public hasReceipts(): boolean {
    return this.props.receipts.length > 0;
  }

  public requiresReceipt(): boolean {
    return this.props.amount > 25; // Require receipt for expenses over $25
  }

  public isReimbursable(): boolean {
    return this.props.isBusinessExpense && this.props.status === 'approved';
  }

  public getApprovedAmount(): number {
    return this.props.approval?.approvedAmount || 0;
  }

  public getTaxDeductibleAmount(): number {
    if (!this.props.isTaxDeductible) return 0;
    
    const baseAmount = this.props.status === 'approved' ? this.getApprovedAmount() : this.props.amount;
    return baseAmount * (this.props.deductionPercentage / 100);
  }

  public getReimbursementAmount(): number {
    return this.props.reimbursement?.amount || 0;
  }

  public isOverdue(): boolean {
    if (this.props.status !== 'pending') return false;
    
    const daysSinceCreated = Math.floor((Date.now() - this.props.createdAt.getTime()) / (1000 * 60 * 60 * 24));
    return daysSinceCreated > 30; // Consider overdue after 30 days
  }

  public getDaysOld(): number {
    return Math.floor((Date.now() - this.props.createdAt.getTime()) / (1000 * 60 * 60 * 24));
  }

  public getDaysUntilRecurrence(): number | null {
    if (!this.props.nextRecurrenceDate) return null;
    
    const diffMs = this.props.nextRecurrenceDate.getTime() - Date.now();
    return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  }

  public formatAmount(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: this.props.currency,
    }).format(amount);
  }

  public getCategoryDisplay(): string {
    const categoryMap: Record<ExpenseCategory, string> = {
      fuel: 'Fuel',
      maintenance: 'Vehicle Maintenance',
      insurance: 'Insurance',
      vehicle_payment: 'Vehicle Payment',
      phone: 'Phone/Communication',
      equipment: 'Equipment',
      parking: 'Parking',
      tolls: 'Tolls',
      food: 'Food/Meals',
      supplies: 'Supplies',
      registration: 'Vehicle Registration',
      inspection: 'Vehicle Inspection',
      cleaning: 'Vehicle Cleaning',
      other: 'Other',
    };
    
    return categoryMap[this.props.category];
  }

  public getStatusDisplay(): string {
    const statusMap: Record<ExpenseStatus, string> = {
      pending: 'Pending Review',
      approved: 'Approved',
      rejected: 'Rejected',
      reimbursed: 'Reimbursed',
    };
    
    return statusMap[this.props.status];
  }

  public getPaymentMethodDisplay(): string {
    const methodMap: Record<PaymentMethod, string> = {
      cash: 'Cash',
      credit_card: 'Credit Card',
      debit_card: 'Debit Card',
      bank_transfer: 'Bank Transfer',
      digital_wallet: 'Digital Wallet',
      check: 'Check',
    };
    
    return methodMap[this.props.paymentMethod];
  }

  public toJSON() {
    return {
      id: this._id.toString(),
      riderId: this.props.riderId,
      orderId: this.props.orderId,
      shiftId: this.props.shiftId,
      category: this.props.category,
      categoryDisplay: this.getCategoryDisplay(),
      subcategory: this.props.subcategory,
      description: this.props.description,
      amount: this.props.amount,
      formattedAmount: this.formatAmount(this.props.amount),
      currency: this.props.currency,
      date: this.props.date,
      location: this.props.location?.toJSON(),
      merchant: this.props.merchant,
      paymentMethod: this.props.paymentMethod,
      paymentMethodDisplay: this.getPaymentMethodDisplay(),
      isBusinessExpense: this.props.isBusinessExpense,
      isTaxDeductible: this.props.isTaxDeductible,
      deductionPercentage: this.props.deductionPercentage,
      taxDeductibleAmount: this.getTaxDeductibleAmount(),
      formattedTaxDeductibleAmount: this.formatAmount(this.getTaxDeductibleAmount()),
      status: this.props.status,
      statusDisplay: this.getStatusDisplay(),
      receipts: this.props.receipts,
      approval: this.props.approval,
      reimbursement: this.props.reimbursement,
      mileageRecord: this.props.mileageRecord ? {
        ...this.props.mileageRecord,
        startLocation: this.props.mileageRecord.startLocation.toJSON(),
        endLocation: this.props.mileageRecord.endLocation.toJSON(),
        formattedAmount: this.formatAmount(this.props.mileageRecord.amount),
      } : undefined,
      tags: this.props.tags,
      notes: this.props.notes,
      isRecurring: this.props.isRecurring,
      recurringFrequency: this.props.recurringFrequency,
      nextRecurrenceDate: this.props.nextRecurrenceDate,
      daysUntilRecurrence: this.getDaysUntilRecurrence(),
      parentExpenseId: this.props.parentExpenseId,
      submittedAt: this.props.submittedAt,
      submittedBy: this.props.submittedBy,
      reviewedAt: this.props.reviewedAt,
      reviewedBy: this.props.reviewedBy,
      isPending: this.isPending(),
      isApproved: this.isApproved(),
      isRejected: this.isRejected(),
      isReimbursed: this.isReimbursed(),
      hasReceipts: this.hasReceipts(),
      requiresReceipt: this.requiresReceipt(),
      isReimbursable: this.isReimbursable(),
      approvedAmount: this.getApprovedAmount(),
      formattedApprovedAmount: this.formatAmount(this.getApprovedAmount()),
      reimbursementAmount: this.getReimbursementAmount(),
      formattedReimbursementAmount: this.formatAmount(this.getReimbursementAmount()),
      isOverdue: this.isOverdue(),
      daysOld: this.getDaysOld(),
      createdAt: this.props.createdAt,
      updatedAt: this.props.updatedAt,
    };
  }
}