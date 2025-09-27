import { ErrandEntity, ErrandHistoryEntity, ErrandHistoryAction } from '../entities';
import { ErrandStatus, ErrandStatusVO, LocationVO, ProofVO } from '../value-objects';
import { ErrandRepository, ErrandHistoryRepository } from '../repositories';

export interface ErrandLifecycleService {
  /**
   * Assign an errand to a driver
   */
  assignErrand(
    errand: ErrandEntity,
    assignedTo: string,
    assignedBy: string,
    notes?: string,
  ): Promise<{
    errand: ErrandEntity;
    history: ErrandHistoryEntity;
  }>;

  /**
   * Start an errand
   */
  startErrand(
    errand: ErrandEntity,
    startedBy: string,
    startLocation?: LocationVO,
    notes?: string,
  ): Promise<{
    errand: ErrandEntity;
    history: ErrandHistoryEntity;
  }>;

  /**
   * Complete an errand
   */
  completeErrand(
    errand: ErrandEntity,
    completedBy: string,
    proofs: ProofVO[],
    completionNotes?: string,
    completionLocation?: LocationVO,
  ): Promise<{
    errand: ErrandEntity;
    history: ErrandHistoryEntity;
  }>;

  /**
   * Cancel an errand
   */
  cancelErrand(
    errand: ErrandEntity,
    cancelledBy: string,
    reason: string,
    refundRequested?: boolean,
    notes?: string,
  ): Promise<{
    errand: ErrandEntity;
    history: ErrandHistoryEntity;
  }>;

  /**
   * Validate errand status transition
   */
  validateStatusTransition(
    currentStatus: ErrandStatus,
    newStatus: ErrandStatus,
  ): boolean;

  /**
   * Get next possible statuses for an errand
   */
  getNextPossibleStatuses(currentStatus: ErrandStatus): ErrandStatus[];

  /**
   * Check if errand can be modified
   */
  canModifyErrand(errand: ErrandEntity): boolean;

  /**
   * Check if errand is overdue
   */
  isErrandOverdue(errand: ErrandEntity): boolean;

  /**
   * Calculate errand completion time
   */
  calculateCompletionTime(errand: ErrandEntity): number | null; // in minutes

  /**
   * Get errand lifecycle summary
   */
  getLifecycleSummary(errand: ErrandEntity): {
    status: ErrandStatus;
    canBeAssigned: boolean;
    canBeStarted: boolean;
    canBeCompleted: boolean;
    canBeCancelled: boolean;
    canBeUpdated: boolean;
    isOverdue: boolean;
    completionTime?: number;
    nextPossibleStatuses: ErrandStatus[];
  };
}

export class ErrandLifecycleServiceImpl implements ErrandLifecycleService {
  constructor(
    private readonly errandRepository: ErrandRepository,
    private readonly historyRepository: ErrandHistoryRepository,
  ) {}

  async assignErrand(
    errand: ErrandEntity,
    assignedTo: string,
    assignedBy: string,
    notes?: string,
  ): Promise<{
    errand: ErrandEntity;
    history: ErrandHistoryEntity;
  }> {
    // Validate assignment
    if (!errand.canBeAssigned()) {
      throw new Error(`Errand cannot be assigned in current status: ${errand.status.value}`);
    }

    if (!assignedTo || assignedTo.trim().length === 0) {
      throw new Error('Assigned to user ID is required');
    }

    if (!assignedBy || assignedBy.trim().length === 0) {
      throw new Error('Assigned by user ID is required');
    }

    // Assign the errand
    errand.assign(assignedTo, notes);

    // Create history entry
    const history = ErrandHistoryEntity.createAssignedEntry(
      errand.id,
      assignedBy,
      assignedTo,
      notes,
    );

    // Save both entities
    const updatedErrand = await this.errandRepository.save(errand);
    const savedHistory = await this.historyRepository.save(history);

    return {
      errand: updatedErrand,
      history: savedHistory,
    };
  }

  async startErrand(
    errand: ErrandEntity,
    startedBy: string,
    startLocation?: LocationVO,
    notes?: string,
  ): Promise<{
    errand: ErrandEntity;
    history: ErrandHistoryEntity;
  }> {
    // Validate start
    if (!errand.canBeStarted()) {
      throw new Error(`Errand cannot be started in current status: ${errand.status.value}`);
    }

    if (!startedBy || startedBy.trim().length === 0) {
      throw new Error('Started by user ID is required');
    }

    // Validate that the person starting is the assigned driver
    if (errand.assignedTo !== startedBy) {
      throw new Error('Only the assigned driver can start the errand');
    }

    // Start the errand
    errand.start(startLocation, notes);

    // Create history entry
    const locationData = startLocation ? {
      latitude: startLocation.latitude,
      longitude: startLocation.longitude,
      address: startLocation.address,
    } : undefined;

    const history = ErrandHistoryEntity.createStartedEntry(
      errand.id,
      startedBy,
      locationData,
      notes,
    );

    // Save both entities
    const updatedErrand = await this.errandRepository.save(errand);
    const savedHistory = await this.historyRepository.save(history);

    return {
      errand: updatedErrand,
      history: savedHistory,
    };
  }

  async completeErrand(
    errand: ErrandEntity,
    completedBy: string,
    proofs: ProofVO[],
    completionNotes?: string,
    completionLocation?: LocationVO,
  ): Promise<{
    errand: ErrandEntity;
    history: ErrandHistoryEntity;
  }> {
    // Validate completion
    if (!errand.canBeCompleted()) {
      throw new Error(`Errand cannot be completed in current status: ${errand.status.value}`);
    }

    if (!completedBy || completedBy.trim().length === 0) {
      throw new Error('Completed by user ID is required');
    }

    // Validate that the person completing is the assigned driver
    if (errand.assignedTo !== completedBy) {
      throw new Error('Only the assigned driver can complete the errand');
    }

    if (!proofs || proofs.length === 0) {
      throw new Error('Proof of completion is required');
    }

    // Complete the errand
    errand.complete(proofs, completionNotes, completionLocation);

    // Create history entry
    const locationData = completionLocation ? {
      latitude: completionLocation.latitude,
      longitude: completionLocation.longitude,
      address: completionLocation.address,
    } : undefined;

    const history = ErrandHistoryEntity.createCompletedEntry(
      errand.id,
      completedBy,
      proofs.length,
      locationData,
      completionNotes,
    );

    // Save both entities
    const updatedErrand = await this.errandRepository.save(errand);
    const savedHistory = await this.historyRepository.save(history);

    return {
      errand: updatedErrand,
      history: savedHistory,
    };
  }

  async cancelErrand(
    errand: ErrandEntity,
    cancelledBy: string,
    reason: string,
    refundRequested = false,
    notes?: string,
  ): Promise<{
    errand: ErrandEntity;
    history: ErrandHistoryEntity;
  }> {
    // Validate cancellation
    if (!errand.canBeCancelled()) {
      throw new Error(`Errand cannot be cancelled in current status: ${errand.status.value}`);
    }

    if (!cancelledBy || cancelledBy.trim().length === 0) {
      throw new Error('Cancelled by user ID is required');
    }

    if (!reason || reason.trim().length === 0) {
      throw new Error('Cancellation reason is required');
    }

    // Validate that only creator or assigned driver can cancel
    if (errand.createdBy !== cancelledBy && errand.assignedTo !== cancelledBy) {
      throw new Error('Only the errand creator or assigned driver can cancel the errand');
    }

    const previousStatus = errand.status.value;

    // Cancel the errand
    errand.cancel(cancelledBy, reason, refundRequested);

    // Create history entry
    const history = ErrandHistoryEntity.createCancelledEntry(
      errand.id,
      cancelledBy,
      reason,
      refundRequested,
      previousStatus,
      notes,
    );

    // Save both entities
    const updatedErrand = await this.errandRepository.save(errand);
    const savedHistory = await this.historyRepository.save(history);

    return {
      errand: updatedErrand,
      history: savedHistory,
    };
  }

  validateStatusTransition(currentStatus: ErrandStatus, newStatus: ErrandStatus): boolean {
    const validTransitions: Record<ErrandStatus, ErrandStatus[]> = {
      [ErrandStatus.PENDING]: [ErrandStatus.ASSIGNED, ErrandStatus.CANCELLED],
      [ErrandStatus.ASSIGNED]: [ErrandStatus.IN_PROGRESS, ErrandStatus.CANCELLED],
      [ErrandStatus.IN_PROGRESS]: [ErrandStatus.COMPLETED, ErrandStatus.CANCELLED],
      [ErrandStatus.COMPLETED]: [], // Terminal state
      [ErrandStatus.CANCELLED]: [], // Terminal state
    };

    return validTransitions[currentStatus]?.includes(newStatus) || false;
  }

  getNextPossibleStatuses(currentStatus: ErrandStatus): ErrandStatus[] {
    const transitions: Record<ErrandStatus, ErrandStatus[]> = {
      [ErrandStatus.PENDING]: [ErrandStatus.ASSIGNED, ErrandStatus.CANCELLED],
      [ErrandStatus.ASSIGNED]: [ErrandStatus.IN_PROGRESS, ErrandStatus.CANCELLED],
      [ErrandStatus.IN_PROGRESS]: [ErrandStatus.COMPLETED, ErrandStatus.CANCELLED],
      [ErrandStatus.COMPLETED]: [],
      [ErrandStatus.CANCELLED]: [],
    };

    return transitions[currentStatus] || [];
  }

  canModifyErrand(errand: ErrandEntity): boolean {
    return errand.canBeUpdated();
  }

  isErrandOverdue(errand: ErrandEntity): boolean {
    return errand.isOverdue();
  }

  calculateCompletionTime(errand: ErrandEntity): number | null {
    if (!errand.completedAt || !errand.createdAt) {
      return null;
    }

    const diffMs = errand.completedAt.getTime() - errand.createdAt.getTime();
    return Math.round(diffMs / (1000 * 60)); // Convert to minutes
  }

  getLifecycleSummary(errand: ErrandEntity): {
    status: ErrandStatus;
    canBeAssigned: boolean;
    canBeStarted: boolean;
    canBeCompleted: boolean;
    canBeCancelled: boolean;
    canBeUpdated: boolean;
    isOverdue: boolean;
    completionTime?: number;
    nextPossibleStatuses: ErrandStatus[];
  } {
    const completionTime = this.calculateCompletionTime(errand);

    return {
      status: errand.status.value,
      canBeAssigned: errand.canBeAssigned(),
      canBeStarted: errand.canBeStarted(),
      canBeCompleted: errand.canBeCompleted(),
      canBeCancelled: errand.canBeCancelled(),
      canBeUpdated: errand.canBeUpdated(),
      isOverdue: errand.isOverdue(),
      completionTime: completionTime || undefined,
      nextPossibleStatuses: this.getNextPossibleStatuses(errand.status.value),
    };
  }
}