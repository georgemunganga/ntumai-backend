/**
 * Vendor Onboarding Entity
 * Manages the complete vendor onboarding workflow with 4 states
 */

export enum VendorOnboardingStatus {
  PENDING = 'PENDING',
  VERIFIED = 'VERIFIED',
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
}

export enum BusinessType {
  RESTAURANT = 'restaurant',
  GROCERY = 'grocery',
  PHARMACY = 'pharmacy',
  RETAIL = 'retail',
  SERVICES = 'services',
  OTHER = 'other',
}

export enum VendorDocumentType {
  BUSINESS_REGISTRATION = 'business_registration',
  TAX_ID = 'tax_id',
  BANK_PROOF = 'bank_proof',
  GOVERNMENT_ID = 'government_id',
}

export enum DocumentStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export interface LocationData {
  address: string;
  city: string;
  district: string;
  latitude: string;
  longitude: string;
}

export interface VendorDocument {
  id: string;
  type: VendorDocumentType;
  url: string;
  status: DocumentStatus;
  uploadedAt: Date;
  rejectionReason?: string;
}

export interface VendorOnboardingProps {
  id: string;
  userId: string;
  businessName: string;
  businessType: BusinessType;
  description: string;
  phone: string;
  email: string;
  location: LocationData;
  bankAccountName: string;
  bankName: string;
  bankAccountNumber: string;
  branchCode?: string;
  status: VendorOnboardingStatus;
  documents: VendorDocument[];
  rejectionReason?: string;
  createdAt: Date;
  updatedAt: Date;
  verifiedAt?: Date;
  activatedAt?: Date;
}

export class VendorOnboardingEntity {
  id: string;
  userId: string;
  businessName: string;
  businessType: BusinessType;
  description: string;
  phone: string;
  email: string;
  location: LocationData;
  bankAccountName: string;
  bankName: string;
  bankAccountNumber: string;
  branchCode?: string;
  status: VendorOnboardingStatus;
  documents: VendorDocument[];
  rejectionReason?: string;
  createdAt: Date;
  updatedAt: Date;
  verifiedAt?: Date;
  activatedAt?: Date;

  constructor(props: VendorOnboardingProps) {
    this.id = props.id;
    this.userId = props.userId;
    this.businessName = props.businessName;
    this.businessType = props.businessType;
    this.description = props.description;
    this.phone = props.phone;
    this.email = props.email;
    this.location = props.location;
    this.bankAccountName = props.bankAccountName;
    this.bankName = props.bankName;
    this.bankAccountNumber = props.bankAccountNumber;
    this.branchCode = props.branchCode;
    this.status = props.status;
    this.documents = props.documents || [];
    this.rejectionReason = props.rejectionReason;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
    this.verifiedAt = props.verifiedAt;
    this.activatedAt = props.activatedAt;
  }

  /**
   * Check if vendor can accept orders
   */
  canAcceptOrders(): boolean {
    return this.status === VendorOnboardingStatus.ACTIVE;
  }

  /**
   * Check if vendor is in onboarding process
   */
  isOnboarding(): boolean {
    return this.status === VendorOnboardingStatus.PENDING;
  }

  /**
   * Check if vendor is verified
   */
  isVerified(): boolean {
    return (
      this.status === VendorOnboardingStatus.VERIFIED ||
      this.status === VendorOnboardingStatus.ACTIVE
    );
  }

  /**
   * Get next onboarding step
   */
  getNextOnboardingStep(): VendorOnboardingStatus | null {
    const steps = [
      VendorOnboardingStatus.PENDING,
      VendorOnboardingStatus.VERIFIED,
      VendorOnboardingStatus.ACTIVE,
    ];

    const currentIndex = steps.indexOf(this.status);
    if (currentIndex === -1 || currentIndex === steps.length - 1) {
      return null;
    }

    return steps[currentIndex + 1];
  }

  /**
   * Check if all required documents are uploaded
   */
  hasAllRequiredDocuments(): boolean {
    const requiredDocs = [
      VendorDocumentType.BUSINESS_REGISTRATION,
      VendorDocumentType.TAX_ID,
      VendorDocumentType.BANK_PROOF,
      VendorDocumentType.GOVERNMENT_ID,
    ];

    return requiredDocs.every((docType) =>
      this.documents.some((doc) => doc.type === docType),
    );
  }

  /**
   * Check if all documents are approved
   */
  areAllDocumentsApproved(): boolean {
    if (this.documents.length === 0) return false;
    return this.documents.every((doc) => doc.status === DocumentStatus.APPROVED);
  }

  /**
   * Add or update document
   */
  addDocument(document: VendorDocument): void {
    const existingIndex = this.documents.findIndex(
      (d) => d.type === document.type,
    );
    if (existingIndex >= 0) {
      this.documents[existingIndex] = document;
    } else {
      this.documents.push(document);
    }
    this.updatedAt = new Date();
  }

  /**
   * Transition to next status
   */
  transitionToNextStatus(): void {
    const nextStatus = this.getNextOnboardingStep();
    if (nextStatus) {
      this.status = nextStatus;
      this.updatedAt = new Date();

      // Update timestamps for specific transitions
      if (nextStatus === VendorOnboardingStatus.VERIFIED) {
        this.verifiedAt = new Date();
      } else if (nextStatus === VendorOnboardingStatus.ACTIVE) {
        this.activatedAt = new Date();
      }
    }
  }
}
