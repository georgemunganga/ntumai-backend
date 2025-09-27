export enum ErrandStatus {
  PENDING = 'pending',
  ASSIGNED = 'assigned',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export class ErrandStatusVO {
  private constructor(private readonly _value: ErrandStatus) {
    this.validate();
  }

  static create(value: string): ErrandStatusVO {
    const status = value.toLowerCase() as ErrandStatus;
    if (!Object.values(ErrandStatus).includes(status)) {
      throw new Error(`Invalid errand status: ${value}`);
    }
    return new ErrandStatusVO(status);
  }

  static fromEnum(status: ErrandStatus): ErrandStatusVO {
    return new ErrandStatusVO(status);
  }

  get value(): ErrandStatus {
    return this._value;
  }

  private validate(): void {
    if (!this._value) {
      throw new Error('Errand status cannot be empty');
    }
  }

  canTransitionTo(newStatus: ErrandStatus): boolean {
    const transitions: Record<ErrandStatus, ErrandStatus[]> = {
      [ErrandStatus.PENDING]: [ErrandStatus.ASSIGNED, ErrandStatus.CANCELLED],
      [ErrandStatus.ASSIGNED]: [ErrandStatus.IN_PROGRESS, ErrandStatus.CANCELLED],
      [ErrandStatus.IN_PROGRESS]: [ErrandStatus.COMPLETED, ErrandStatus.CANCELLED],
      [ErrandStatus.COMPLETED]: [],
      [ErrandStatus.CANCELLED]: [],
    };

    return transitions[this._value].includes(newStatus);
  }

  isCompleted(): boolean {
    return this._value === ErrandStatus.COMPLETED;
  }

  isCancelled(): boolean {
    return this._value === ErrandStatus.CANCELLED;
  }

  isActive(): boolean {
    return ![ErrandStatus.COMPLETED, ErrandStatus.CANCELLED].includes(this._value);
  }

  equals(other: ErrandStatusVO): boolean {
    return this._value === other._value;
  }

  toString(): string {
    return this._value;
  }
}