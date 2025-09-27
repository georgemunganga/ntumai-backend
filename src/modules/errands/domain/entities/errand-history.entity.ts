import { ErrandStatus } from '../value-objects';

export enum ErrandHistoryAction {
  CREATED = 'CREATED',
  UPDATED = 'UPDATED',
  ASSIGNED = 'ASSIGNED',
  STARTED = 'STARTED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  PROOF_ADDED = 'PROOF_ADDED',
  LOCATION_UPDATED = 'LOCATION_UPDATED',
  NOTES_ADDED = 'NOTES_ADDED',
}

export interface ErrandHistoryProps {
  id: string;
  errandId: string;
  action: ErrandHistoryAction;
  performedBy: string;
  performedAt: Date;
  previousStatus?: ErrandStatus;
  newStatus?: ErrandStatus;
  details: Record<string, any>;
  notes?: string;
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  metadata?: Record<string, any>;
}

export class ErrandHistoryEntity {
  private constructor(private props: ErrandHistoryProps) {
    this.validate();
  }

  static create(props: Omit<ErrandHistoryProps, 'id' | 'performedAt'>): ErrandHistoryEntity {
    const history = new ErrandHistoryEntity({
      ...props,
      id: crypto.randomUUID(),
      performedAt: new Date(),
    });
    return history;
  }

  static fromPersistence(props: ErrandHistoryProps): ErrandHistoryEntity {
    return new ErrandHistoryEntity(props);
  }

  // Factory methods for common actions
  static createCreatedEntry(
    errandId: string,
    performedBy: string,
    details: Record<string, any>,
    notes?: string,
  ): ErrandHistoryEntity {
    return ErrandHistoryEntity.create({
      errandId,
      action: ErrandHistoryAction.CREATED,
      performedBy,
      newStatus: ErrandStatus.PENDING,
      details,
      notes,
    });
  }

  static createUpdatedEntry(
    errandId: string,
    performedBy: string,
    details: Record<string, any>,
    notes?: string,
  ): ErrandHistoryEntity {
    return ErrandHistoryEntity.create({
      errandId,
      action: ErrandHistoryAction.UPDATED,
      performedBy,
      details,
      notes,
    });
  }

  static createAssignedEntry(
    errandId: string,
    performedBy: string,
    assignedTo: string,
    notes?: string,
  ): ErrandHistoryEntity {
    return ErrandHistoryEntity.create({
      errandId,
      action: ErrandHistoryAction.ASSIGNED,
      performedBy,
      previousStatus: ErrandStatus.PENDING,
      newStatus: ErrandStatus.ASSIGNED,
      details: { assignedTo },
      notes,
    });
  }

  static createStartedEntry(
    errandId: string,
    performedBy: string,
    location?: { latitude: number; longitude: number; address?: string },
    notes?: string,
  ): ErrandHistoryEntity {
    return ErrandHistoryEntity.create({
      errandId,
      action: ErrandHistoryAction.STARTED,
      performedBy,
      previousStatus: ErrandStatus.ASSIGNED,
      newStatus: ErrandStatus.IN_PROGRESS,
      details: { startedAt: new Date().toISOString() },
      location,
      notes,
    });
  }

  static createCompletedEntry(
    errandId: string,
    performedBy: string,
    proofCount: number,
    location?: { latitude: number; longitude: number; address?: string },
    notes?: string,
  ): ErrandHistoryEntity {
    return ErrandHistoryEntity.create({
      errandId,
      action: ErrandHistoryAction.COMPLETED,
      performedBy,
      previousStatus: ErrandStatus.IN_PROGRESS,
      newStatus: ErrandStatus.COMPLETED,
      details: { 
        completedAt: new Date().toISOString(),
        proofCount,
      },
      location,
      notes,
    });
  }

  static createCancelledEntry(
    errandId: string,
    performedBy: string,
    reason: string,
    refundRequested: boolean,
    previousStatus: ErrandStatus,
    notes?: string,
  ): ErrandHistoryEntity {
    return ErrandHistoryEntity.create({
      errandId,
      action: ErrandHistoryAction.CANCELLED,
      performedBy,
      previousStatus,
      newStatus: ErrandStatus.CANCELLED,
      details: { 
        reason,
        refundRequested,
        cancelledAt: new Date().toISOString(),
      },
      notes,
    });
  }

  static createProofAddedEntry(
    errandId: string,
    performedBy: string,
    proofType: string,
    proofUrl: string,
    notes?: string,
  ): ErrandHistoryEntity {
    return ErrandHistoryEntity.create({
      errandId,
      action: ErrandHistoryAction.PROOF_ADDED,
      performedBy,
      details: { 
        proofType,
        proofUrl,
        addedAt: new Date().toISOString(),
      },
      notes,
    });
  }

  static createLocationUpdatedEntry(
    errandId: string,
    performedBy: string,
    location: { latitude: number; longitude: number; address?: string },
    notes?: string,
  ): ErrandHistoryEntity {
    return ErrandHistoryEntity.create({
      errandId,
      action: ErrandHistoryAction.LOCATION_UPDATED,
      performedBy,
      details: { 
        updatedAt: new Date().toISOString(),
      },
      location,
      notes,
    });
  }

  static createNotesAddedEntry(
    errandId: string,
    performedBy: string,
    noteContent: string,
  ): ErrandHistoryEntity {
    return ErrandHistoryEntity.create({
      errandId,
      action: ErrandHistoryAction.NOTES_ADDED,
      performedBy,
      details: { 
        addedAt: new Date().toISOString(),
      },
      notes: noteContent,
    });
  }

  // Getters
  get id(): string {
    return this.props.id;
  }

  get errandId(): string {
    return this.props.errandId;
  }

  get action(): ErrandHistoryAction {
    return this.props.action;
  }

  get performedBy(): string {
    return this.props.performedBy;
  }

  get performedAt(): Date {
    return this.props.performedAt;
  }

  get previousStatus(): ErrandStatus | undefined {
    return this.props.previousStatus;
  }

  get newStatus(): ErrandStatus | undefined {
    return this.props.newStatus;
  }

  get details(): Record<string, any> {
    return { ...this.props.details };
  }

  get notes(): string | undefined {
    return this.props.notes;
  }

  get location(): { latitude: number; longitude: number; address?: string } | undefined {
    return this.props.location ? { ...this.props.location } : undefined;
  }

  get metadata(): Record<string, any> | undefined {
    return this.props.metadata ? { ...this.props.metadata } : undefined;
  }

  // Business methods
  isStatusChange(): boolean {
    return this.props.previousStatus !== undefined && this.props.newStatus !== undefined;
  }

  isLocationTracked(): boolean {
    return this.props.location !== undefined;
  }

  hasNotes(): boolean {
    return this.props.notes !== undefined && this.props.notes.trim().length > 0;
  }

  isCriticalAction(): boolean {
    return [
      ErrandHistoryAction.ASSIGNED,
      ErrandHistoryAction.STARTED,
      ErrandHistoryAction.COMPLETED,
      ErrandHistoryAction.CANCELLED,
    ].includes(this.props.action);
  }

  getActionDescription(): string {
    switch (this.props.action) {
      case ErrandHistoryAction.CREATED:
        return 'Errand was created';
      case ErrandHistoryAction.UPDATED:
        return 'Errand details were updated';
      case ErrandHistoryAction.ASSIGNED:
        return `Errand was assigned to ${this.props.details.assignedTo || 'driver'}`;
      case ErrandHistoryAction.STARTED:
        return 'Errand was started';
      case ErrandHistoryAction.COMPLETED:
        return 'Errand was completed';
      case ErrandHistoryAction.CANCELLED:
        return `Errand was cancelled: ${this.props.details.reason || 'No reason provided'}`;
      case ErrandHistoryAction.PROOF_ADDED:
        return `Proof of type ${this.props.details.proofType || 'unknown'} was added`;
      case ErrandHistoryAction.LOCATION_UPDATED:
        return 'Location was updated';
      case ErrandHistoryAction.NOTES_ADDED:
        return 'Notes were added';
      default:
        return 'Unknown action';
    }
  }

  addMetadata(key: string, value: any): void {
    if (!this.props.metadata) {
      this.props.metadata = {};
    }
    this.props.metadata[key] = value;
  }

  hasUserAccess(userId: string): boolean {
    return this.props.performedBy === userId;
  }

  private validate(): void {
    if (!this.props.errandId || this.props.errandId.trim().length === 0) {
      throw new Error('Errand ID is required');
    }

    if (!this.props.performedBy || this.props.performedBy.trim().length === 0) {
      throw new Error('Performed by user ID is required');
    }

    if (!Object.values(ErrandHistoryAction).includes(this.props.action)) {
      throw new Error('Invalid action type');
    }

    if (this.props.notes && this.props.notes.length > 1000) {
      throw new Error('Notes cannot exceed 1000 characters');
    }

    if (this.props.location) {
      if (typeof this.props.location.latitude !== 'number' || 
          typeof this.props.location.longitude !== 'number') {
        throw new Error('Location coordinates must be numbers');
      }

      if (this.props.location.latitude < -90 || this.props.location.latitude > 90) {
        throw new Error('Latitude must be between -90 and 90');
      }

      if (this.props.location.longitude < -180 || this.props.location.longitude > 180) {
        throw new Error('Longitude must be between -180 and 180');
      }

      if (this.props.location.address && this.props.location.address.length > 500) {
        throw new Error('Address cannot exceed 500 characters');
      }
    }

    // Validate status transitions
    if (this.isStatusChange()) {
      const validTransitions = this.getValidStatusTransitions();
      const transition = `${this.props.previousStatus}->${this.props.newStatus}`;
      if (!validTransitions.includes(transition)) {
        throw new Error(`Invalid status transition: ${transition}`);
      }
    }
  }

  private getValidStatusTransitions(): string[] {
    return [
      `${ErrandStatus.PENDING}->${ErrandStatus.ASSIGNED}`,
      `${ErrandStatus.ASSIGNED}->${ErrandStatus.IN_PROGRESS}`,
      `${ErrandStatus.IN_PROGRESS}->${ErrandStatus.COMPLETED}`,
      `${ErrandStatus.PENDING}->${ErrandStatus.CANCELLED}`,
      `${ErrandStatus.ASSIGNED}->${ErrandStatus.CANCELLED}`,
      `${ErrandStatus.IN_PROGRESS}->${ErrandStatus.CANCELLED}`,
    ];
  }

  toJSON(): ErrandHistoryProps {
    return {
      ...this.props,
      details: { ...this.props.details },
      location: this.props.location ? { ...this.props.location } : undefined,
      metadata: this.props.metadata ? { ...this.props.metadata } : undefined,
    };
  }
}