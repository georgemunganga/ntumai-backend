import { ValueObject } from '../../../common/domain/value-object';

export type DocumentType = 'driver_license' | 'vehicle_registration' | 'insurance' | 'background_check' | 'profile_photo';
export type VerificationStatus = 'pending' | 'verified' | 'rejected' | 'expired';

export interface DocumentStatusProps {
  type: DocumentType;
  status: VerificationStatus;
  uploadedAt?: Date;
  verifiedAt?: Date;
  rejectedAt?: Date;
  expiryDate?: Date;
  rejectionReason?: string;
  documentUrl?: string;
  verifiedBy?: string;
}

export class DocumentStatus extends ValueObject<DocumentStatusProps> {
  private constructor(props: DocumentStatusProps) {
    super(props);
  }

  public static create(props: DocumentStatusProps): DocumentStatus {
    if (!props.type || !props.status) {
      throw new Error('Document type and status are required');
    }

    return new DocumentStatus(props);
  }

  public static createPending(type: DocumentType, documentUrl?: string): DocumentStatus {
    return new DocumentStatus({
      type,
      status: 'pending',
      uploadedAt: new Date(),
      documentUrl,
    });
  }

  get type(): DocumentType {
    return this.props.type;
  }

  get status(): VerificationStatus {
    return this.props.status;
  }

  get uploadedAt(): Date | undefined {
    return this.props.uploadedAt;
  }

  get verifiedAt(): Date | undefined {
    return this.props.verifiedAt;
  }

  get rejectedAt(): Date | undefined {
    return this.props.rejectedAt;
  }

  get expiryDate(): Date | undefined {
    return this.props.expiryDate;
  }

  get rejectionReason(): string | undefined {
    return this.props.rejectionReason;
  }

  get documentUrl(): string | undefined {
    return this.props.documentUrl;
  }

  get verifiedBy(): string | undefined {
    return this.props.verifiedBy;
  }

  isPending(): boolean {
    return this.props.status === 'pending';
  }

  isVerified(): boolean {
    return this.props.status === 'verified' && !this.isExpired();
  }

  isRejected(): boolean {
    return this.props.status === 'rejected';
  }

  isExpired(): boolean {
    if (!this.props.expiryDate) return false;
    return this.props.expiryDate < new Date();
  }

  needsRenewal(): boolean {
    if (!this.props.expiryDate) return false;
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    return this.props.expiryDate <= thirtyDaysFromNow;
  }

  verify(verifiedBy: string, expiryDate?: Date): DocumentStatus {
    return DocumentStatus.create({
      ...this.props,
      status: 'verified',
      verifiedAt: new Date(),
      verifiedBy,
      expiryDate,
      rejectedAt: undefined,
      rejectionReason: undefined,
    });
  }

  reject(reason: string, rejectedBy: string): DocumentStatus {
    return DocumentStatus.create({
      ...this.props,
      status: 'rejected',
      rejectedAt: new Date(),
      rejectionReason: reason,
      verifiedBy: rejectedBy,
      verifiedAt: undefined,
    });
  }

  markExpired(): DocumentStatus {
    return DocumentStatus.create({
      ...this.props,
      status: 'expired',
    });
  }

  updateDocument(documentUrl: string): DocumentStatus {
    return DocumentStatus.create({
      ...this.props,
      documentUrl,
      uploadedAt: new Date(),
      status: 'pending',
      verifiedAt: undefined,
      rejectedAt: undefined,
      rejectionReason: undefined,
    });
  }

  getDaysUntilExpiry(): number | null {
    if (!this.props.expiryDate) return null;
    const now = new Date();
    const diffTime = this.props.expiryDate.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  getStatusDisplayName(): string {
    switch (this.props.status) {
      case 'pending':
        return 'Pending Review';
      case 'verified':
        return 'Verified';
      case 'rejected':
        return 'Rejected';
      case 'expired':
        return 'Expired';
      default:
        return 'Unknown';
    }
  }

  getTypeDisplayName(): string {
    switch (this.props.type) {
      case 'driver_license':
        return 'Driver License';
      case 'vehicle_registration':
        return 'Vehicle Registration';
      case 'insurance':
        return 'Insurance Certificate';
      case 'background_check':
        return 'Background Check';
      case 'profile_photo':
        return 'Profile Photo';
      default:
        return 'Unknown Document';
    }
  }

  toJSON() {
    return {
      type: this.props.type,
      status: this.props.status,
      uploadedAt: this.props.uploadedAt,
      verifiedAt: this.props.verifiedAt,
      rejectedAt: this.props.rejectedAt,
      expiryDate: this.props.expiryDate,
      rejectionReason: this.props.rejectionReason,
      documentUrl: this.props.documentUrl,
      verifiedBy: this.props.verifiedBy,
    };
  }
}