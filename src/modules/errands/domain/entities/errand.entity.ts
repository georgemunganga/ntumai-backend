import { ErrandStatus, ErrandStatusVO, Priority, PriorityVO, LocationVO, ProofVO } from '../value-objects';

export interface ErrandProps {
  id: string;
  title: string;
  description: string;
  pickupLocation: LocationVO;
  dropoffLocation: LocationVO;
  price?: number;
  priority: PriorityVO;
  deadline?: Date;
  category?: string;
  requirements: string[];
  status: ErrandStatusVO;
  assignedTo?: string;
  assignedAt?: Date;
  startedAt?: Date;
  completedAt?: Date;
  proofs: ProofVO[];
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  cancelledAt?: Date;
  cancelledBy?: string;
  cancellationReason?: string;
  refundRequested?: boolean;
  completionNotes?: string;
  completionLocation?: LocationVO;
  startLocation?: LocationVO;
}

export class ErrandEntity {
  private constructor(private props: ErrandProps) {
    this.validate();
  }

  static create(props: Omit<ErrandProps, 'id' | 'createdAt' | 'updatedAt' | 'status' | 'proofs'>): ErrandEntity {
    const errand = new ErrandEntity({
      ...props,
      id: crypto.randomUUID(),
      status: ErrandStatusVO.fromEnum(ErrandStatus.PENDING),
      proofs: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    return errand;
  }

  static fromPersistence(props: ErrandProps): ErrandEntity {
    return new ErrandEntity(props);
  }

  // Getters
  get id(): string {
    return this.props.id;
  }

  get title(): string {
    return this.props.title;
  }

  get description(): string {
    return this.props.description;
  }

  get pickupLocation(): LocationVO {
    return this.props.pickupLocation;
  }

  get dropoffLocation(): LocationVO {
    return this.props.dropoffLocation;
  }

  get price(): number | undefined {
    return this.props.price;
  }

  get priority(): PriorityVO {
    return this.props.priority;
  }

  get deadline(): Date | undefined {
    return this.props.deadline;
  }

  get category(): string | undefined {
    return this.props.category;
  }

  get requirements(): string[] {
    return [...this.props.requirements];
  }

  get status(): ErrandStatusVO {
    return this.props.status;
  }

  get assignedTo(): string | undefined {
    return this.props.assignedTo;
  }

  get assignedAt(): Date | undefined {
    return this.props.assignedAt;
  }

  get startedAt(): Date | undefined {
    return this.props.startedAt;
  }

  get completedAt(): Date | undefined {
    return this.props.completedAt;
  }

  get proofs(): ProofVO[] {
    return [...this.props.proofs];
  }

  get createdBy(): string {
    return this.props.createdBy;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  get cancelledAt(): Date | undefined {
    return this.props.cancelledAt;
  }

  get cancelledBy(): string | undefined {
    return this.props.cancelledBy;
  }

  get cancellationReason(): string | undefined {
    return this.props.cancellationReason;
  }

  get refundRequested(): boolean | undefined {
    return this.props.refundRequested;
  }

  get completionNotes(): string | undefined {
    return this.props.completionNotes;
  }

  get completionLocation(): LocationVO | undefined {
    return this.props.completionLocation;
  }

  get startLocation(): LocationVO | undefined {
    return this.props.startLocation;
  }

  // Business methods
  assign(assignedTo: string, notes?: string): void {
    if (!this.canBeAssigned()) {
      throw new Error('Errand cannot be assigned in current state');
    }

    this.props.assignedTo = assignedTo;
    this.props.assignedAt = new Date();
    this.props.status = ErrandStatusVO.fromEnum(ErrandStatus.ASSIGNED);
    this.updateTimestamp();
  }

  start(startLocation?: LocationVO, notes?: string): void {
    if (!this.canBeStarted()) {
      throw new Error('Errand cannot be started in current state');
    }

    this.props.startedAt = new Date();
    this.props.startLocation = startLocation;
    this.props.status = ErrandStatusVO.fromEnum(ErrandStatus.IN_PROGRESS);
    this.updateTimestamp();
  }

  complete(
    proofs: ProofVO[],
    completionNotes?: string,
    completionLocation?: LocationVO,
  ): void {
    if (!this.canBeCompleted()) {
      throw new Error('Errand cannot be completed in current state');
    }

    if (!proofs || proofs.length === 0) {
      throw new Error('Proof of completion is required');
    }

    this.props.completedAt = new Date();
    this.props.proofs = [...this.props.proofs, ...proofs];
    this.props.completionNotes = completionNotes;
    this.props.completionLocation = completionLocation;
    this.props.status = ErrandStatusVO.fromEnum(ErrandStatus.COMPLETED);
    this.updateTimestamp();
  }

  cancel(cancelledBy: string, reason: string, refundRequested = false): void {
    if (!this.canBeCancelled()) {
      throw new Error('Errand cannot be cancelled in current state');
    }

    this.props.cancelledAt = new Date();
    this.props.cancelledBy = cancelledBy;
    this.props.cancellationReason = reason;
    this.props.refundRequested = refundRequested;
    this.props.status = ErrandStatusVO.fromEnum(ErrandStatus.CANCELLED);
    this.updateTimestamp();
  }

  updateDetails(updates: {
    title?: string;
    description?: string;
    pickupLocation?: LocationVO;
    dropoffLocation?: LocationVO;
    price?: number;
    priority?: PriorityVO;
    deadline?: Date;
    category?: string;
    requirements?: string[];
  }): void {
    if (!this.canBeUpdated()) {
      throw new Error('Errand cannot be updated in current state');
    }

    if (updates.title !== undefined) {
      this.props.title = updates.title;
    }
    if (updates.description !== undefined) {
      this.props.description = updates.description;
    }
    if (updates.pickupLocation !== undefined) {
      this.props.pickupLocation = updates.pickupLocation;
    }
    if (updates.dropoffLocation !== undefined) {
      this.props.dropoffLocation = updates.dropoffLocation;
    }
    if (updates.price !== undefined) {
      this.props.price = updates.price;
    }
    if (updates.priority !== undefined) {
      this.props.priority = updates.priority;
    }
    if (updates.deadline !== undefined) {
      this.props.deadline = updates.deadline;
    }
    if (updates.category !== undefined) {
      this.props.category = updates.category;
    }
    if (updates.requirements !== undefined) {
      this.props.requirements = [...updates.requirements];
    }

    this.updateTimestamp();
    this.validate();
  }

  addProof(proof: ProofVO): void {
    this.props.proofs.push(proof);
    this.updateTimestamp();
  }

  // Status check methods
  canBeAssigned(): boolean {
    return this.props.status.value === ErrandStatus.PENDING;
  }

  canBeStarted(): boolean {
    return this.props.status.value === ErrandStatus.ASSIGNED && this.props.assignedTo !== undefined;
  }

  canBeCompleted(): boolean {
    return this.props.status.value === ErrandStatus.IN_PROGRESS;
  }

  canBeCancelled(): boolean {
    return [ErrandStatus.PENDING, ErrandStatus.ASSIGNED, ErrandStatus.IN_PROGRESS].includes(
      this.props.status.value,
    );
  }

  canBeUpdated(): boolean {
    return [ErrandStatus.PENDING, ErrandStatus.ASSIGNED].includes(this.props.status.value);
  }

  isOverdue(): boolean {
    if (!this.props.deadline) {
      return false;
    }
    return new Date() > this.props.deadline && !this.props.status.isCompleted();
  }

  getEstimatedDistance(): number | null {
    return this.props.pickupLocation.distanceTo(this.props.dropoffLocation);
  }

  hasUserAccess(userId: string): boolean {
    return this.props.createdBy === userId || this.props.assignedTo === userId;
  }

  private validate(): void {
    if (!this.props.title || this.props.title.trim().length === 0) {
      throw new Error('Title is required');
    }

    if (this.props.title.length > 200) {
      throw new Error('Title cannot exceed 200 characters');
    }

    if (!this.props.description || this.props.description.trim().length === 0) {
      throw new Error('Description is required');
    }

    if (this.props.description.length > 1000) {
      throw new Error('Description cannot exceed 1000 characters');
    }

    if (this.props.price !== undefined && this.props.price < 0) {
      throw new Error('Price cannot be negative');
    }

    if (this.props.deadline && this.props.deadline < new Date()) {
      throw new Error('Deadline cannot be in the past');
    }

    if (this.props.cancellationReason && this.props.cancellationReason.length > 500) {
      throw new Error('Cancellation reason cannot exceed 500 characters');
    }

    if (this.props.completionNotes && this.props.completionNotes.length > 1000) {
      throw new Error('Completion notes cannot exceed 1000 characters');
    }
  }

  private updateTimestamp(): void {
    this.props.updatedAt = new Date();
  }

  toJSON(): ErrandProps {
    return {
      ...this.props,
      requirements: [...this.props.requirements],
      proofs: [...this.props.proofs],
    };
  }
}