import {
  IsString,
  IsOptional,
  IsDateString,
  IsEnum,
  IsBoolean,
  IsNumber,
  ValidateNested,
  IsObject,
  IsArray,
  Min,
  Max,
  Length,
  IsUrl,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// Enums
export enum ExpenseCategory {
  FUEL = 'FUEL',
  VEHICLE_MAINTENANCE = 'VEHICLE_MAINTENANCE',
  VEHICLE_REPAIR = 'VEHICLE_REPAIR',
  INSURANCE = 'INSURANCE',
  REGISTRATION = 'REGISTRATION',
  PARKING = 'PARKING',
  TOLLS = 'TOLLS',
  PHONE_BILL = 'PHONE_BILL',
  UNIFORM = 'UNIFORM',
  EQUIPMENT = 'EQUIPMENT',
  TRAINING = 'TRAINING',
  MEDICAL = 'MEDICAL',
  FOOD = 'FOOD',
  ACCOMMODATION = 'ACCOMMODATION',
  OTHER = 'OTHER',
}

export enum ExpenseStatus {
  DRAFT = 'DRAFT',
  SUBMITTED = 'SUBMITTED',
  UNDER_REVIEW = 'UNDER_REVIEW',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  REIMBURSED = 'REIMBURSED',
  CANCELLED = 'CANCELLED',
}

export enum ExpenseType {
  REIMBURSABLE = 'REIMBURSABLE',
  NON_REIMBURSABLE = 'NON_REIMBURSABLE',
  TAX_DEDUCTIBLE = 'TAX_DEDUCTIBLE',
  COMPANY_PAID = 'COMPANY_PAID',
}

export enum PaymentMethod {
  CASH = 'CASH',
  CREDIT_CARD = 'CREDIT_CARD',
  DEBIT_CARD = 'DEBIT_CARD',
  BANK_TRANSFER = 'BANK_TRANSFER',
  DIGITAL_WALLET = 'DIGITAL_WALLET',
  CHECK = 'CHECK',
  OTHER = 'OTHER',
}

export enum IncidentType {
  ACCIDENT = 'ACCIDENT',
  VEHICLE_BREAKDOWN = 'VEHICLE_BREAKDOWN',
  THEFT = 'THEFT',
  HARASSMENT = 'HARASSMENT',
  CUSTOMER_COMPLAINT = 'CUSTOMER_COMPLAINT',
  SAFETY_VIOLATION = 'SAFETY_VIOLATION',
  TRAFFIC_VIOLATION = 'TRAFFIC_VIOLATION',
  PROPERTY_DAMAGE = 'PROPERTY_DAMAGE',
  INJURY = 'INJURY',
  EMERGENCY = 'EMERGENCY',
  OTHER = 'OTHER',
}

export enum IncidentSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export enum IncidentStatus {
  REPORTED = 'REPORTED',
  UNDER_INVESTIGATION = 'UNDER_INVESTIGATION',
  RESOLVED = 'RESOLVED',
  CLOSED = 'CLOSED',
  ESCALATED = 'ESCALATED',
}

// Expense Receipt DTO
export class ExpenseReceiptDto {
  @ApiProperty({ description: 'Receipt ID' })
  @IsString()
  id: string;

  @ApiProperty({ description: 'Receipt image URL' })
  @IsUrl()
  imageUrl: string;

  @ApiProperty({ description: 'Receipt file name' })
  @IsString()
  @Length(1, 255)
  fileName: string;

  @ApiProperty({ description: 'File size in bytes' })
  @IsNumber()
  @Min(0)
  fileSize: number;

  @ApiPropertyOptional({ description: 'MIME type' })
  @IsOptional()
  @IsString()
  mimeType?: string;

  @ApiPropertyOptional({ description: 'OCR extracted text' })
  @IsOptional()
  @IsString()
  extractedText?: string;

  @ApiPropertyOptional({ description: 'OCR extracted amount' })
  @IsOptional()
  @IsNumber()
  extractedAmount?: number;

  @ApiPropertyOptional({ description: 'OCR extracted date' })
  @IsOptional()
  @IsDateString()
  extractedDate?: string;

  @ApiPropertyOptional({ description: 'OCR extracted merchant name' })
  @IsOptional()
  @IsString()
  extractedMerchant?: string;

  @ApiProperty({ description: 'Receipt upload date' })
  uploadedAt: string;
}

// Create Expense DTO
export class CreateExpenseDto {
  @ApiProperty({ description: 'Expense category', enum: ExpenseCategory })
  @IsEnum(ExpenseCategory)
  category: ExpenseCategory;

  @ApiProperty({ description: 'Expense type', enum: ExpenseType })
  @IsEnum(ExpenseType)
  expenseType: ExpenseType;

  @ApiProperty({ description: 'Expense amount' })
  @IsNumber()
  @Min(0.01)
  amount: number;

  @ApiProperty({ description: 'Currency code' })
  @IsString()
  @Length(3, 3)
  currency: string;

  @ApiProperty({ description: 'Expense description' })
  @IsString()
  @Length(1, 500)
  description: string;

  @ApiProperty({ description: 'Expense date' })
  @IsDateString()
  expenseDate: string;

  @ApiProperty({ description: 'Payment method', enum: PaymentMethod })
  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @ApiPropertyOptional({ description: 'Merchant or vendor name' })
  @IsOptional()
  @IsString()
  @Length(1, 200)
  merchantName?: string;

  @ApiPropertyOptional({ description: 'Merchant address' })
  @IsOptional()
  @IsString()
  @Length(1, 500)
  merchantAddress?: string;

  @ApiPropertyOptional({ description: 'Related order ID' })
  @IsOptional()
  @IsString()
  orderId?: string;

  @ApiPropertyOptional({ description: 'Related shift ID' })
  @IsOptional()
  @IsString()
  shiftId?: string;

  @ApiPropertyOptional({ description: 'Vehicle mileage at time of expense' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  mileage?: number;

  @ApiPropertyOptional({ description: 'Expense location' })
  @IsOptional()
  @IsObject()
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
    city?: string;
    state?: string;
    country?: string;
  };

  @ApiPropertyOptional({ description: 'Receipt attachments', type: [ExpenseReceiptDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ExpenseReceiptDto)
  receipts?: ExpenseReceiptDto[];

  @ApiPropertyOptional({ description: 'Tax amount' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  taxAmount?: number;

  @ApiPropertyOptional({ description: 'Whether expense is billable to customer' })
  @IsOptional()
  @IsBoolean()
  isBillable?: boolean;

  @ApiPropertyOptional({ description: 'Additional notes' })
  @IsOptional()
  @IsString()
  @Length(1, 1000)
  notes?: string;

  @ApiPropertyOptional({ description: 'Additional metadata' })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

// Update Expense DTO
export class UpdateExpenseDto {
  @ApiPropertyOptional({ description: 'Expense category', enum: ExpenseCategory })
  @IsOptional()
  @IsEnum(ExpenseCategory)
  category?: ExpenseCategory;

  @ApiPropertyOptional({ description: 'Expense type', enum: ExpenseType })
  @IsOptional()
  @IsEnum(ExpenseType)
  expenseType?: ExpenseType;

  @ApiPropertyOptional({ description: 'Expense amount' })
  @IsOptional()
  @IsNumber()
  @Min(0.01)
  amount?: number;

  @ApiPropertyOptional({ description: 'Expense description' })
  @IsOptional()
  @IsString()
  @Length(1, 500)
  description?: string;

  @ApiPropertyOptional({ description: 'Expense date' })
  @IsOptional()
  @IsDateString()
  expenseDate?: string;

  @ApiPropertyOptional({ description: 'Payment method', enum: PaymentMethod })
  @IsOptional()
  @IsEnum(PaymentMethod)
  paymentMethod?: PaymentMethod;

  @ApiPropertyOptional({ description: 'Merchant or vendor name' })
  @IsOptional()
  @IsString()
  @Length(1, 200)
  merchantName?: string;

  @ApiPropertyOptional({ description: 'Merchant address' })
  @IsOptional()
  @IsString()
  @Length(1, 500)
  merchantAddress?: string;

  @ApiPropertyOptional({ description: 'Vehicle mileage at time of expense' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  mileage?: number;

  @ApiPropertyOptional({ description: 'Additional receipt attachments', type: [ExpenseReceiptDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ExpenseReceiptDto)
  additionalReceipts?: ExpenseReceiptDto[];

  @ApiPropertyOptional({ description: 'Tax amount' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  taxAmount?: number;

  @ApiPropertyOptional({ description: 'Whether expense is billable to customer' })
  @IsOptional()
  @IsBoolean()
  isBillable?: boolean;

  @ApiPropertyOptional({ description: 'Additional notes' })
  @IsOptional()
  @IsString()
  @Length(1, 1000)
  notes?: string;

  @ApiPropertyOptional({ description: 'Additional metadata' })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

// Expense Response DTO
export class ExpenseResponseDto {
  @ApiProperty({ description: 'Expense ID' })
  id: string;

  @ApiProperty({ description: 'Rider ID' })
  riderId: string;

  @ApiProperty({ description: 'Expense category', enum: ExpenseCategory })
  category: ExpenseCategory;

  @ApiProperty({ description: 'Expense type', enum: ExpenseType })
  expenseType: ExpenseType;

  @ApiProperty({ description: 'Expense status', enum: ExpenseStatus })
  status: ExpenseStatus;

  @ApiProperty({ description: 'Expense amount' })
  amount: number;

  @ApiProperty({ description: 'Currency code' })
  currency: string;

  @ApiProperty({ description: 'Expense description' })
  description: string;

  @ApiProperty({ description: 'Expense date' })
  expenseDate: string;

  @ApiProperty({ description: 'Payment method', enum: PaymentMethod })
  paymentMethod: PaymentMethod;

  @ApiPropertyOptional({ description: 'Merchant or vendor name' })
  merchantName?: string;

  @ApiPropertyOptional({ description: 'Merchant address' })
  merchantAddress?: string;

  @ApiPropertyOptional({ description: 'Related order ID' })
  orderId?: string;

  @ApiPropertyOptional({ description: 'Related shift ID' })
  shiftId?: string;

  @ApiPropertyOptional({ description: 'Vehicle mileage at time of expense' })
  mileage?: number;

  @ApiPropertyOptional({ description: 'Expense location' })
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
    city?: string;
    state?: string;
    country?: string;
  };

  @ApiPropertyOptional({ description: 'Receipt attachments', type: [ExpenseReceiptDto] })
  receipts?: ExpenseReceiptDto[];

  @ApiPropertyOptional({ description: 'Tax amount' })
  taxAmount?: number;

  @ApiPropertyOptional({ description: 'Whether expense is billable to customer' })
  isBillable?: boolean;

  @ApiPropertyOptional({ description: 'Reimbursement amount' })
  reimbursementAmount?: number;

  @ApiPropertyOptional({ description: 'Reimbursement date' })
  reimbursementDate?: string;

  @ApiPropertyOptional({ description: 'Approval date' })
  approvedAt?: string;

  @ApiPropertyOptional({ description: 'Approver ID' })
  approvedBy?: string;

  @ApiPropertyOptional({ description: 'Rejection reason' })
  rejectionReason?: string;

  @ApiPropertyOptional({ description: 'Additional notes' })
  notes?: string;

  @ApiProperty({ description: 'Expense creation date' })
  createdAt: string;

  @ApiProperty({ description: 'Last update date' })
  updatedAt: string;

  @ApiPropertyOptional({ description: 'Additional metadata' })
  metadata?: Record<string, any>;
}

// Get Expenses DTO
export class GetExpensesDto {
  @ApiPropertyOptional({ description: 'Filter by rider ID' })
  @IsOptional()
  @IsString()
  riderId?: string;

  @ApiPropertyOptional({ description: 'Filter by category', enum: ExpenseCategory })
  @IsOptional()
  @IsEnum(ExpenseCategory)
  category?: ExpenseCategory;

  @ApiPropertyOptional({ description: 'Filter by expense type', enum: ExpenseType })
  @IsOptional()
  @IsEnum(ExpenseType)
  expenseType?: ExpenseType;

  @ApiPropertyOptional({ description: 'Filter by status', enum: ExpenseStatus })
  @IsOptional()
  @IsEnum(ExpenseStatus)
  status?: ExpenseStatus;

  @ApiPropertyOptional({ description: 'Filter by expense date (from)' })
  @IsOptional()
  @IsDateString()
  expenseDateFrom?: string;

  @ApiPropertyOptional({ description: 'Filter by expense date (to)' })
  @IsOptional()
  @IsDateString()
  expenseDateTo?: string;

  @ApiPropertyOptional({ description: 'Filter by minimum amount' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  minAmount?: number;

  @ApiPropertyOptional({ description: 'Filter by maximum amount' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  maxAmount?: number;

  @ApiPropertyOptional({ description: 'Filter by payment method', enum: PaymentMethod })
  @IsOptional()
  @IsEnum(PaymentMethod)
  paymentMethod?: PaymentMethod;

  @ApiPropertyOptional({ description: 'Filter by reimbursable expenses only' })
  @IsOptional()
  @IsBoolean()
  reimbursableOnly?: boolean;

  @ApiPropertyOptional({ description: 'Search in description and merchant name' })
  @IsOptional()
  @IsString()
  @Length(1, 100)
  search?: string;

  @ApiPropertyOptional({ description: 'Page number for pagination', default: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Number of items per page', default: 20 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiPropertyOptional({ description: 'Sort field' })
  @IsOptional()
  @IsString()
  sortBy?: string;

  @ApiPropertyOptional({ description: 'Sort order', enum: ['asc', 'desc'] })
  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'desc';
}

// Paginated Expenses Response DTO
export class PaginatedExpensesResponseDto {
  @ApiProperty({ description: 'List of expenses', type: [ExpenseResponseDto] })
  expenses: ExpenseResponseDto[];

  @ApiProperty({ description: 'Total number of expenses' })
  total: number;

  @ApiProperty({ description: 'Current page number' })
  page: number;

  @ApiProperty({ description: 'Number of items per page' })
  limit: number;

  @ApiProperty({ description: 'Total number of pages' })
  totalPages: number;

  @ApiProperty({ description: 'Whether there is a next page' })
  hasNext: boolean;

  @ApiProperty({ description: 'Whether there is a previous page' })
  hasPrev: boolean;
}

// Expense Summary DTO
export class ExpenseSummaryDto {
  @ApiProperty({ description: 'Summary period' })
  period: string;

  @ApiProperty({ description: 'Total expenses amount' })
  totalAmount: number;

  @ApiProperty({ description: 'Total reimbursable amount' })
  totalReimbursable: number;

  @ApiProperty({ description: 'Total reimbursed amount' })
  totalReimbursed: number;

  @ApiProperty({ description: 'Pending reimbursement amount' })
  pendingReimbursement: number;

  @ApiProperty({ description: 'Total tax deductible amount' })
  totalTaxDeductible: number;

  @ApiProperty({ description: 'Number of expenses' })
  expenseCount: number;

  @ApiProperty({ description: 'Currency code' })
  currency: string;

  @ApiProperty({ description: 'Expenses by category' })
  expensesByCategory: Record<string, {
    amount: number;
    count: number;
    percentage: number;
  }>;

  @ApiProperty({ description: 'Expenses by status' })
  expensesByStatus: Record<string, {
    amount: number;
    count: number;
  }>;

  @ApiProperty({ description: 'Monthly breakdown' })
  monthlyBreakdown: Array<{
    month: string;
    totalAmount: number;
    reimbursableAmount: number;
    expenseCount: number;
  }>;
}

// Create Incident DTO
export class CreateIncidentDto {
  @ApiProperty({ description: 'Incident type', enum: IncidentType })
  @IsEnum(IncidentType)
  incidentType: IncidentType;

  @ApiProperty({ description: 'Incident severity', enum: IncidentSeverity })
  @IsEnum(IncidentSeverity)
  severity: IncidentSeverity;

  @ApiProperty({ description: 'Incident title' })
  @IsString()
  @Length(1, 200)
  title: string;

  @ApiProperty({ description: 'Incident description' })
  @IsString()
  @Length(1, 2000)
  description: string;

  @ApiProperty({ description: 'Incident date and time' })
  @IsDateString()
  incidentDateTime: string;

  @ApiPropertyOptional({ description: 'Related order ID' })
  @IsOptional()
  @IsString()
  orderId?: string;

  @ApiPropertyOptional({ description: 'Related shift ID' })
  @IsOptional()
  @IsString()
  shiftId?: string;

  @ApiPropertyOptional({ description: 'Incident location' })
  @IsOptional()
  @IsObject()
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
    city?: string;
    state?: string;
    country?: string;
  };

  @ApiPropertyOptional({ description: 'Involved parties' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  involvedParties?: string[];

  @ApiPropertyOptional({ description: 'Witness information' })
  @IsOptional()
  @IsArray()
  witnesses?: Array<{
    name: string;
    phoneNumber?: string;
    email?: string;
    statement?: string;
  }>;

  @ApiPropertyOptional({ description: 'Police report number' })
  @IsOptional()
  @IsString()
  @Length(1, 50)
  policeReportNumber?: string;

  @ApiPropertyOptional({ description: 'Insurance claim number' })
  @IsOptional()
  @IsString()
  @Length(1, 50)
  insuranceClaimNumber?: string;

  @ApiPropertyOptional({ description: 'Estimated damage cost' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  estimatedDamageCost?: number;

  @ApiPropertyOptional({ description: 'Photo attachments' })
  @IsOptional()
  @IsArray()
  @IsUrl({}, { each: true })
  photoAttachments?: string[];

  @ApiPropertyOptional({ description: 'Document attachments' })
  @IsOptional()
  @IsArray()
  @IsUrl({}, { each: true })
  documentAttachments?: string[];

  @ApiPropertyOptional({ description: 'Whether emergency services were called' })
  @IsOptional()
  @IsBoolean()
  emergencyServicesCalled?: boolean;

  @ApiPropertyOptional({ description: 'Whether medical attention was required' })
  @IsOptional()
  @IsBoolean()
  medicalAttentionRequired?: boolean;

  @ApiPropertyOptional({ description: 'Additional notes' })
  @IsOptional()
  @IsString()
  @Length(1, 1000)
  notes?: string;

  @ApiPropertyOptional({ description: 'Additional metadata' })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

// Update Incident DTO
export class UpdateIncidentDto {
  @ApiPropertyOptional({ description: 'Incident severity', enum: IncidentSeverity })
  @IsOptional()
  @IsEnum(IncidentSeverity)
  severity?: IncidentSeverity;

  @ApiPropertyOptional({ description: 'Additional description or update' })
  @IsOptional()
  @IsString()
  @Length(1, 2000)
  additionalDescription?: string;

  @ApiPropertyOptional({ description: 'Police report number' })
  @IsOptional()
  @IsString()
  @Length(1, 50)
  policeReportNumber?: string;

  @ApiPropertyOptional({ description: 'Insurance claim number' })
  @IsOptional()
  @IsString()
  @Length(1, 50)
  insuranceClaimNumber?: string;

  @ApiPropertyOptional({ description: 'Actual damage cost' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  actualDamageCost?: number;

  @ApiPropertyOptional({ description: 'Additional photo attachments' })
  @IsOptional()
  @IsArray()
  @IsUrl({}, { each: true })
  additionalPhotos?: string[];

  @ApiPropertyOptional({ description: 'Additional document attachments' })
  @IsOptional()
  @IsArray()
  @IsUrl({}, { each: true })
  additionalDocuments?: string[];

  @ApiPropertyOptional({ description: 'Resolution notes' })
  @IsOptional()
  @IsString()
  @Length(1, 1000)
  resolutionNotes?: string;

  @ApiPropertyOptional({ description: 'Additional notes' })
  @IsOptional()
  @IsString()
  @Length(1, 1000)
  notes?: string;
}

// Incident Response DTO
export class IncidentResponseDto {
  @ApiProperty({ description: 'Incident ID' })
  id: string;

  @ApiProperty({ description: 'Incident number' })
  incidentNumber: string;

  @ApiProperty({ description: 'Rider ID' })
  riderId: string;

  @ApiProperty({ description: 'Incident type', enum: IncidentType })
  incidentType: IncidentType;

  @ApiProperty({ description: 'Incident severity', enum: IncidentSeverity })
  severity: IncidentSeverity;

  @ApiProperty({ description: 'Incident status', enum: IncidentStatus })
  status: IncidentStatus;

  @ApiProperty({ description: 'Incident title' })
  title: string;

  @ApiProperty({ description: 'Incident description' })
  description: string;

  @ApiProperty({ description: 'Incident date and time' })
  incidentDateTime: string;

  @ApiPropertyOptional({ description: 'Related order ID' })
  orderId?: string;

  @ApiPropertyOptional({ description: 'Related shift ID' })
  shiftId?: string;

  @ApiPropertyOptional({ description: 'Incident location' })
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
    city?: string;
    state?: string;
    country?: string;
  };

  @ApiPropertyOptional({ description: 'Involved parties' })
  involvedParties?: string[];

  @ApiPropertyOptional({ description: 'Witness information' })
  witnesses?: Array<{
    name: string;
    phoneNumber?: string;
    email?: string;
    statement?: string;
  }>;

  @ApiPropertyOptional({ description: 'Police report number' })
  policeReportNumber?: string;

  @ApiPropertyOptional({ description: 'Insurance claim number' })
  insuranceClaimNumber?: string;

  @ApiPropertyOptional({ description: 'Estimated damage cost' })
  estimatedDamageCost?: number;

  @ApiPropertyOptional({ description: 'Actual damage cost' })
  actualDamageCost?: number;

  @ApiPropertyOptional({ description: 'Photo attachments' })
  photoAttachments?: string[];

  @ApiPropertyOptional({ description: 'Document attachments' })
  documentAttachments?: string[];

  @ApiPropertyOptional({ description: 'Whether emergency services were called' })
  emergencyServicesCalled?: boolean;

  @ApiPropertyOptional({ description: 'Whether medical attention was required' })
  medicalAttentionRequired?: boolean;

  @ApiPropertyOptional({ description: 'Assigned investigator ID' })
  assignedInvestigatorId?: string;

  @ApiPropertyOptional({ description: 'Assigned investigator name' })
  assignedInvestigatorName?: string;

  @ApiPropertyOptional({ description: 'Resolution notes' })
  resolutionNotes?: string;

  @ApiPropertyOptional({ description: 'Resolution date' })
  resolvedAt?: string;

  @ApiPropertyOptional({ description: 'Additional notes' })
  notes?: string;

  @ApiProperty({ description: 'Incident creation date' })
  createdAt: string;

  @ApiProperty({ description: 'Last update date' })
  updatedAt: string;

  @ApiPropertyOptional({ description: 'Additional metadata' })
  metadata?: Record<string, any>;
}

// Get Incidents DTO
export class GetIncidentsDto {
  @ApiPropertyOptional({ description: 'Filter by rider ID' })
  @IsOptional()
  @IsString()
  riderId?: string;

  @ApiPropertyOptional({ description: 'Filter by incident type', enum: IncidentType })
  @IsOptional()
  @IsEnum(IncidentType)
  incidentType?: IncidentType;

  @ApiPropertyOptional({ description: 'Filter by severity', enum: IncidentSeverity })
  @IsOptional()
  @IsEnum(IncidentSeverity)
  severity?: IncidentSeverity;

  @ApiPropertyOptional({ description: 'Filter by status', enum: IncidentStatus })
  @IsOptional()
  @IsEnum(IncidentStatus)
  status?: IncidentStatus;

  @ApiPropertyOptional({ description: 'Filter by incident date (from)' })
  @IsOptional()
  @IsDateString()
  incidentDateFrom?: string;

  @ApiPropertyOptional({ description: 'Filter by incident date (to)' })
  @IsOptional()
  @IsDateString()
  incidentDateTo?: string;

  @ApiPropertyOptional({ description: 'Search in title and description' })
  @IsOptional()
  @IsString()
  @Length(1, 100)
  search?: string;

  @ApiPropertyOptional({ description: 'Page number for pagination', default: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Number of items per page', default: 20 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiPropertyOptional({ description: 'Sort field' })
  @IsOptional()
  @IsString()
  sortBy?: string;

  @ApiPropertyOptional({ description: 'Sort order', enum: ['asc', 'desc'] })
  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'desc';
}

// Paginated Incidents Response DTO
export class PaginatedIncidentsResponseDto {
  @ApiProperty({ description: 'List of incidents', type: [IncidentResponseDto] })
  incidents: IncidentResponseDto[];

  @ApiProperty({ description: 'Total number of incidents' })
  total: number;

  @ApiProperty({ description: 'Current page number' })
  page: number;

  @ApiProperty({ description: 'Number of items per page' })
  limit: number;

  @ApiProperty({ description: 'Total number of pages' })
  totalPages: number;

  @ApiProperty({ description: 'Whether there is a next page' })
  hasNext: boolean;

  @ApiProperty({ description: 'Whether there is a previous page' })
  hasPrev: boolean;
}