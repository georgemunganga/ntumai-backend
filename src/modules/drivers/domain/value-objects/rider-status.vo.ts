import { ValueObject } from '../../../common/domain/value-object';

export type AccountStatus = 'active' | 'inactive' | 'suspended' | 'pending_verification' | 'rejected';
export type VerificationLevel = 'unverified' | 'partially_verified' | 'fully_verified';

export interface RiderStatusProps {
  accountStatus: AccountStatus;
  verificationLevel: VerificationLevel;
  rating: number;
  totalOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  acceptanceRate: number;
  completionRate: number;
  onTimeDeliveryRate: number;
  lastActiveAt?: Date;
  suspensionReason?: string;
  suspendedUntil?: Date;
  rejectionReason?: string;
  canReceiveOrders: boolean;
}

export class RiderStatus extends ValueObject<RiderStatusProps> {
  private constructor(props: RiderStatusProps) {
    super(props);
  }

  public static create(props: RiderStatusProps): RiderStatus {
    if (!props.accountStatus || !props.verificationLevel) {
      throw new Error('Account status and verification level are required');
    }

    if (props.rating < 0 || props.rating > 5) {
      throw new Error('Rating must be between 0 and 5');
    }

    if (props.acceptanceRate < 0 || props.acceptanceRate > 100) {
      throw new Error('Acceptance rate must be between 0 and 100');
    }

    if (props.completionRate < 0 || props.completionRate > 100) {
      throw new Error('Completion rate must be between 0 and 100');
    }

    if (props.onTimeDeliveryRate < 0 || props.onTimeDeliveryRate > 100) {
      throw new Error('On-time delivery rate must be between 0 and 100');
    }

    return new RiderStatus(props);
  }

  public static createNew(): RiderStatus {
    return new RiderStatus({
      accountStatus: 'pending_verification',
      verificationLevel: 'unverified',
      rating: 0,
      totalOrders: 0,
      completedOrders: 0,
      cancelledOrders: 0,
      acceptanceRate: 0,
      completionRate: 0,
      onTimeDeliveryRate: 0,
      canReceiveOrders: false,
    });
  }

  get accountStatus(): AccountStatus {
    return this.props.accountStatus;
  }

  get verificationLevel(): VerificationLevel {
    return this.props.verificationLevel;
  }

  get rating(): number {
    return this.props.rating;
  }

  get totalOrders(): number {
    return this.props.totalOrders;
  }

  get completedOrders(): number {
    return this.props.completedOrders;
  }

  get cancelledOrders(): number {
    return this.props.cancelledOrders;
  }

  get acceptanceRate(): number {
    return this.props.acceptanceRate;
  }

  get completionRate(): number {
    return this.props.completionRate;
  }

  get onTimeDeliveryRate(): number {
    return this.props.onTimeDeliveryRate;
  }

  get lastActiveAt(): Date | undefined {
    return this.props.lastActiveAt;
  }

  get suspensionReason(): string | undefined {
    return this.props.suspensionReason;
  }

  get suspendedUntil(): Date | undefined {
    return this.props.suspendedUntil;
  }

  get rejectionReason(): string | undefined {
    return this.props.rejectionReason;
  }

  get canReceiveOrders(): boolean {
    return this.props.canReceiveOrders;
  }

  isActive(): boolean {
    return this.props.accountStatus === 'active';
  }

  isInactive(): boolean {
    return this.props.accountStatus === 'inactive';
  }

  isSuspended(): boolean {
    return this.props.accountStatus === 'suspended';
  }

  isPendingVerification(): boolean {
    return this.props.accountStatus === 'pending_verification';
  }

  isRejected(): boolean {
    return this.props.accountStatus === 'rejected';
  }

  isFullyVerified(): boolean {
    return this.props.verificationLevel === 'fully_verified';
  }

  isPartiallyVerified(): boolean {
    return this.props.verificationLevel === 'partially_verified';
  }

  isUnverified(): boolean {
    return this.props.verificationLevel === 'unverified';
  }

  canAcceptOrders(): boolean {
    return this.isActive() && this.isFullyVerified() && this.props.canReceiveOrders && !this.isSuspensionActive();
  }

  isSuspensionActive(): boolean {
    if (!this.isSuspended() || !this.props.suspendedUntil) return false;
    return new Date() < this.props.suspendedUntil;
  }

  activate(): RiderStatus {
    if (!this.isFullyVerified()) {
      throw new Error('Cannot activate rider without full verification');
    }

    return RiderStatus.create({
      ...this.props,
      accountStatus: 'active',
      canReceiveOrders: true,
      suspensionReason: undefined,
      suspendedUntil: undefined,
    });
  }

  deactivate(): RiderStatus {
    return RiderStatus.create({
      ...this.props,
      accountStatus: 'inactive',
      canReceiveOrders: false,
    });
  }

  suspend(reason: string, until?: Date): RiderStatus {
    return RiderStatus.create({
      ...this.props,
      accountStatus: 'suspended',
      suspensionReason: reason,
      suspendedUntil: until,
      canReceiveOrders: false,
    });
  }

  reject(reason: string): RiderStatus {
    return RiderStatus.create({
      ...this.props,
      accountStatus: 'rejected',
      rejectionReason: reason,
      canReceiveOrders: false,
    });
  }

  updateVerificationLevel(level: VerificationLevel): RiderStatus {
    const canReceiveOrders = level === 'fully_verified' && this.isActive();
    
    return RiderStatus.create({
      ...this.props,
      verificationLevel: level,
      accountStatus: level === 'fully_verified' ? 'active' : this.props.accountStatus,
      canReceiveOrders,
    });
  }

  updateRating(newRating: number): RiderStatus {
    return RiderStatus.create({
      ...this.props,
      rating: newRating,
    });
  }

  recordOrderCompletion(onTime: boolean = true): RiderStatus {
    const newTotalOrders = this.props.totalOrders + 1;
    const newCompletedOrders = this.props.completedOrders + 1;
    const newCompletionRate = (newCompletedOrders / newTotalOrders) * 100;
    
    const onTimeDeliveries = Math.round((this.props.onTimeDeliveryRate / 100) * this.props.completedOrders);
    const newOnTimeDeliveries = onTime ? onTimeDeliveries + 1 : onTimeDeliveries;
    const newOnTimeDeliveryRate = (newOnTimeDeliveries / newCompletedOrders) * 100;

    return RiderStatus.create({
      ...this.props,
      totalOrders: newTotalOrders,
      completedOrders: newCompletedOrders,
      completionRate: newCompletionRate,
      onTimeDeliveryRate: newOnTimeDeliveryRate,
      lastActiveAt: new Date(),
    });
  }

  recordOrderCancellation(): RiderStatus {
    const newTotalOrders = this.props.totalOrders + 1;
    const newCancelledOrders = this.props.cancelledOrders + 1;
    const newCompletionRate = (this.props.completedOrders / newTotalOrders) * 100;

    return RiderStatus.create({
      ...this.props,
      totalOrders: newTotalOrders,
      cancelledOrders: newCancelledOrders,
      completionRate: newCompletionRate,
      lastActiveAt: new Date(),
    });
  }

  updateAcceptanceRate(acceptanceRate: number): RiderStatus {
    return RiderStatus.create({
      ...this.props,
      acceptanceRate,
    });
  }

  updateLastActive(): RiderStatus {
    return RiderStatus.create({
      ...this.props,
      lastActiveAt: new Date(),
    });
  }

  getCancellationRate(): number {
    if (this.props.totalOrders === 0) return 0;
    return (this.props.cancelledOrders / this.props.totalOrders) * 100;
  }

  getPerformanceLevel(): 'excellent' | 'good' | 'average' | 'poor' {
    const avgScore = (this.props.rating + (this.props.acceptanceRate / 20) + (this.props.completionRate / 20) + (this.props.onTimeDeliveryRate / 20)) / 4;
    
    if (avgScore >= 4.5) return 'excellent';
    if (avgScore >= 3.5) return 'good';
    if (avgScore >= 2.5) return 'average';
    return 'poor';
  }

  needsPerformanceReview(): boolean {
    return this.props.rating < 3.0 || 
           this.props.acceptanceRate < 70 || 
           this.props.completionRate < 85 || 
           this.getCancellationRate() > 15;
  }

  getStatusDisplayName(): string {
    switch (this.props.accountStatus) {
      case 'active':
        return 'Active';
      case 'inactive':
        return 'Inactive';
      case 'suspended':
        return 'Suspended';
      case 'pending_verification':
        return 'Pending Verification';
      case 'rejected':
        return 'Rejected';
      default:
        return 'Unknown';
    }
  }

  getVerificationDisplayName(): string {
    switch (this.props.verificationLevel) {
      case 'fully_verified':
        return 'Fully Verified';
      case 'partially_verified':
        return 'Partially Verified';
      case 'unverified':
        return 'Unverified';
      default:
        return 'Unknown';
    }
  }

  toJSON() {
    return {
      accountStatus: this.props.accountStatus,
      verificationLevel: this.props.verificationLevel,
      rating: this.props.rating,
      totalOrders: this.props.totalOrders,
      completedOrders: this.props.completedOrders,
      cancelledOrders: this.props.cancelledOrders,
      acceptanceRate: this.props.acceptanceRate,
      completionRate: this.props.completionRate,
      onTimeDeliveryRate: this.props.onTimeDeliveryRate,
      lastActiveAt: this.props.lastActiveAt,
      suspensionReason: this.props.suspensionReason,
      suspendedUntil: this.props.suspendedUntil,
      rejectionReason: this.props.rejectionReason,
      canReceiveOrders: this.props.canReceiveOrders,
    };
  }
}