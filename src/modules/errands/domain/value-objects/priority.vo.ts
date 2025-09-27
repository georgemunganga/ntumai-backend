export enum Priority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
}

export class PriorityVO {
  private constructor(private readonly _value: Priority) {
    this.validate();
  }

  static create(value: string): PriorityVO {
    const priority = value.toLowerCase() as Priority;
    if (!Object.values(Priority).includes(priority)) {
      throw new Error(`Invalid priority: ${value}`);
    }
    return new PriorityVO(priority);
  }

  static fromEnum(priority: Priority): PriorityVO {
    return new PriorityVO(priority);
  }

  static default(): PriorityVO {
    return new PriorityVO(Priority.MEDIUM);
  }

  get value(): Priority {
    return this._value;
  }

  private validate(): void {
    if (!this._value) {
      throw new Error('Priority cannot be empty');
    }
  }

  getNumericValue(): number {
    const priorityMap: Record<Priority, number> = {
      [Priority.LOW]: 1,
      [Priority.MEDIUM]: 2,
      [Priority.HIGH]: 3,
    };
    return priorityMap[this._value];
  }

  isHigherThan(other: PriorityVO): boolean {
    return this.getNumericValue() > other.getNumericValue();
  }

  isLowerThan(other: PriorityVO): boolean {
    return this.getNumericValue() < other.getNumericValue();
  }

  equals(other: PriorityVO): boolean {
    return this._value === other._value;
  }

  toString(): string {
    return this._value;
  }
}