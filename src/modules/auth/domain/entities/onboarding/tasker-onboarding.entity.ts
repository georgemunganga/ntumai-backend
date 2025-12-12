/**
 * Tasker Onboarding Entity
 * Manages the complete tasker onboarding workflow with 11 states
 */

export enum TaskerOnboardingStatus {
  APPLIED = 'APPLIED',
  PRE_SCREEN_PASSED = 'PRE_SCREEN_PASSED',
  KYC_PENDING = 'KYC_PENDING',
  KYC_APPROVED = 'KYC_APPROVED',
  TRAINING_PENDING = 'TRAINING_PENDING',
  TRAINING_COMPLETED = 'TRAINING_COMPLETED',
  PROBATION = 'PROBATION',
  ACTIVE = 'ACTIVE',
  REJECTED = 'REJECTED',
  SUSPENDED = 'SUSPENDED',
  DEACTIVATED = 'DEACTIVATED',
}

export enum VehicleType {
  MOTORCYCLE = 'motorcycle',
  CAR = 'car',
  BICYCLE = 'bicycle',
  WALKING = 'walking',
}

export enum DocumentType {
  DRIVER_LICENSE = 'driver_license',
  VEHICLE_REGISTRATION = 'vehicle_registration',
  INSURANCE_CERTIFICATE = 'insurance_certificate',
  POLICE_CLEARANCE = 'police_clearance',
  NRC = 'nrc',
}

export enum DocumentStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export interface TaskerDocument {
  id: string;
  type: DocumentType;
  url: string;
  status: DocumentStatus;
  uploadedAt: Date;
  rejectionReason?: string;
}

export interface TaskerOnboardingProps {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  vehicleType: VehicleType;
  vehicleModel: string;
  licensePlate: string;
  bankAccountName: string;
  bankName: string;
  bankAccountNumber: string;
  status: TaskerOnboardingStatus;
  documents: TaskerDocument[];
  trainingScore?: number;
  rejectionReason?: string;
  createdAt: Date;
  updatedAt: Date;
  kycApprovedAt?: Date;
  trainingCompletedAt?: Date;
  activatedAt?: Date;
}

export class TaskerOnboardingEntity {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  vehicleType: VehicleType;
  vehicleModel: string;
  licensePlate: string;
  bankAccountName: string;
  bankName: string;
  bankAccountNumber: string;
  status: TaskerOnboardingStatus;
  documents: TaskerDocument[];
  trainingScore?: number;
  rejectionReason?: string;
  createdAt: Date;
  updatedAt: Date;
  kycApprovedAt?: Date;
  trainingCompletedAt?: Date;
  activatedAt?: Date;

  constructor(props: TaskerOnboardingProps) {
    this.id = props.id;
    this.userId = props.userId;
    this.firstName = props.firstName;
    this.lastName = props.lastName;
    this.phone = props.phone;
    this.email = props.email;
    this.vehicleType = props.vehicleType;
    this.vehicleModel = props.vehicleModel;
    this.licensePlate = props.licensePlate;
    this.bankAccountName = props.bankAccountName;
    this.bankName = props.bankName;
    this.bankAccountNumber = props.bankAccountNumber;
    this.status = props.status;
    this.documents = props.documents || [];
    this.trainingScore = props.trainingScore;
    this.rejectionReason = props.rejectionReason;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
    this.kycApprovedAt = props.kycApprovedAt;
    this.trainingCompletedAt = props.trainingCompletedAt;
    this.activatedAt = props.activatedAt;
  }

  /**
   * Check if tasker can accept jobs
   */
  canAcceptJobs(): boolean {
    return (
      this.status === TaskerOnboardingStatus.PROBATION ||
      this.status === TaskerOnboardingStatus.ACTIVE
    );
  }

  /**
   * Check if tasker is in onboarding process
   */
  isOnboarding(): boolean {
    return (
      this.status === TaskerOnboardingStatus.APPLIED ||
      this.status === TaskerOnboardingStatus.PRE_SCREEN_PASSED ||
      this.status === TaskerOnboardingStatus.KYC_PENDING ||
      this.status === TaskerOnboardingStatus.KYC_APPROVED ||
      this.status === TaskerOnboardingStatus.TRAINING_PENDING ||
      this.status === TaskerOnboardingStatus.TRAINING_COMPLETED
    );
  }

  /**
   * Get next onboarding step
   */
  getNextOnboardingStep(): TaskerOnboardingStatus | null {
    const steps = [
      TaskerOnboardingStatus.APPLIED,
      TaskerOnboardingStatus.PRE_SCREEN_PASSED,
      TaskerOnboardingStatus.KYC_PENDING,
      TaskerOnboardingStatus.KYC_APPROVED,
      TaskerOnboardingStatus.TRAINING_PENDING,
      TaskerOnboardingStatus.TRAINING_COMPLETED,
      TaskerOnboardingStatus.PROBATION,
      TaskerOnboardingStatus.ACTIVE,
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
      DocumentType.DRIVER_LICENSE,
      DocumentType.VEHICLE_REGISTRATION,
      DocumentType.INSURANCE_CERTIFICATE,
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
  addDocument(document: TaskerDocument): void {
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
      if (nextStatus === TaskerOnboardingStatus.KYC_APPROVED) {
        this.kycApprovedAt = new Date();
      } else if (nextStatus === TaskerOnboardingStatus.TRAINING_COMPLETED) {
        this.trainingCompletedAt = new Date();
      } else if (nextStatus === TaskerOnboardingStatus.ACTIVE) {
        this.activatedAt = new Date();
      }
    }
  }
}
