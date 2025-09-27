import { Priority, PriorityVO, LocationVO } from '../value-objects';

export interface ErrandTemplateProps {
  id: string;
  name: string;
  description: string;
  category: string;
  defaultPickupLocation?: LocationVO;
  defaultDropoffLocation?: LocationVO;
  estimatedPrice?: number;
  estimatedDuration?: number; // in minutes
  defaultPriority: PriorityVO;
  defaultRequirements: string[];
  instructions: string;
  isActive: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  usageCount: number;
  tags: string[];
}

export class ErrandTemplateEntity {
  private constructor(private props: ErrandTemplateProps) {
    this.validate();
  }

  static create(props: Omit<ErrandTemplateProps, 'id' | 'createdAt' | 'updatedAt' | 'usageCount'>): ErrandTemplateEntity {
    const template = new ErrandTemplateEntity({
      ...props,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
      usageCount: 0,
    });
    return template;
  }

  static fromPersistence(props: ErrandTemplateProps): ErrandTemplateEntity {
    return new ErrandTemplateEntity(props);
  }

  // Getters
  get id(): string {
    return this.props.id;
  }

  get name(): string {
    return this.props.name;
  }

  get description(): string {
    return this.props.description;
  }

  get category(): string {
    return this.props.category;
  }

  get defaultPickupLocation(): LocationVO | undefined {
    return this.props.defaultPickupLocation;
  }

  get defaultDropoffLocation(): LocationVO | undefined {
    return this.props.defaultDropoffLocation;
  }

  get estimatedPrice(): number | undefined {
    return this.props.estimatedPrice;
  }

  get estimatedDuration(): number | undefined {
    return this.props.estimatedDuration;
  }

  get defaultPriority(): PriorityVO {
    return this.props.defaultPriority;
  }

  get defaultRequirements(): string[] {
    return [...this.props.defaultRequirements];
  }

  get instructions(): string {
    return this.props.instructions;
  }

  get isActive(): boolean {
    return this.props.isActive;
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

  get usageCount(): number {
    return this.props.usageCount;
  }

  get tags(): string[] {
    return [...this.props.tags];
  }

  // Business methods
  update(updates: {
    name?: string;
    description?: string;
    category?: string;
    defaultPickupLocation?: LocationVO;
    defaultDropoffLocation?: LocationVO;
    estimatedPrice?: number;
    estimatedDuration?: number;
    defaultPriority?: PriorityVO;
    defaultRequirements?: string[];
    instructions?: string;
    tags?: string[];
  }): void {
    if (updates.name !== undefined) {
      this.props.name = updates.name;
    }
    if (updates.description !== undefined) {
      this.props.description = updates.description;
    }
    if (updates.category !== undefined) {
      this.props.category = updates.category;
    }
    if (updates.defaultPickupLocation !== undefined) {
      this.props.defaultPickupLocation = updates.defaultPickupLocation;
    }
    if (updates.defaultDropoffLocation !== undefined) {
      this.props.defaultDropoffLocation = updates.defaultDropoffLocation;
    }
    if (updates.estimatedPrice !== undefined) {
      this.props.estimatedPrice = updates.estimatedPrice;
    }
    if (updates.estimatedDuration !== undefined) {
      this.props.estimatedDuration = updates.estimatedDuration;
    }
    if (updates.defaultPriority !== undefined) {
      this.props.defaultPriority = updates.defaultPriority;
    }
    if (updates.defaultRequirements !== undefined) {
      this.props.defaultRequirements = [...updates.defaultRequirements];
    }
    if (updates.instructions !== undefined) {
      this.props.instructions = updates.instructions;
    }
    if (updates.tags !== undefined) {
      this.props.tags = [...updates.tags];
    }

    this.updateTimestamp();
    this.validate();
  }

  activate(): void {
    this.props.isActive = true;
    this.updateTimestamp();
  }

  deactivate(): void {
    this.props.isActive = false;
    this.updateTimestamp();
  }

  incrementUsage(): void {
    this.props.usageCount += 1;
    this.updateTimestamp();
  }

  addTag(tag: string): void {
    if (!this.props.tags.includes(tag)) {
      this.props.tags.push(tag);
      this.updateTimestamp();
    }
  }

  removeTag(tag: string): void {
    const index = this.props.tags.indexOf(tag);
    if (index > -1) {
      this.props.tags.splice(index, 1);
      this.updateTimestamp();
    }
  }

  addRequirement(requirement: string): void {
    if (!this.props.defaultRequirements.includes(requirement)) {
      this.props.defaultRequirements.push(requirement);
      this.updateTimestamp();
    }
  }

  removeRequirement(requirement: string): void {
    const index = this.props.defaultRequirements.indexOf(requirement);
    if (index > -1) {
      this.props.defaultRequirements.splice(index, 1);
      this.updateTimestamp();
    }
  }

  canBeUsedBy(userId: string): boolean {
    return this.props.isActive && (this.props.createdBy === userId || this.isPublicTemplate());
  }

  isPublicTemplate(): boolean {
    // Templates can be made public by system administrators
    // This is a business rule that can be extended
    return this.props.tags.includes('public');
  }

  hasUserAccess(userId: string): boolean {
    return this.props.createdBy === userId;
  }

  getEstimatedDistance(): number | null {
    if (!this.props.defaultPickupLocation || !this.props.defaultDropoffLocation) {
      return null;
    }
    return this.props.defaultPickupLocation.distanceTo(this.props.defaultDropoffLocation);
  }

  private validate(): void {
    if (!this.props.name || this.props.name.trim().length === 0) {
      throw new Error('Template name is required');
    }

    if (this.props.name.length > 100) {
      throw new Error('Template name cannot exceed 100 characters');
    }

    if (!this.props.description || this.props.description.trim().length === 0) {
      throw new Error('Template description is required');
    }

    if (this.props.description.length > 500) {
      throw new Error('Template description cannot exceed 500 characters');
    }

    if (!this.props.category || this.props.category.trim().length === 0) {
      throw new Error('Template category is required');
    }

    if (this.props.category.length > 50) {
      throw new Error('Template category cannot exceed 50 characters');
    }

    if (this.props.estimatedPrice !== undefined && this.props.estimatedPrice < 0) {
      throw new Error('Estimated price cannot be negative');
    }

    if (this.props.estimatedDuration !== undefined && this.props.estimatedDuration <= 0) {
      throw new Error('Estimated duration must be positive');
    }

    if (this.props.instructions.length > 1000) {
      throw new Error('Instructions cannot exceed 1000 characters');
    }

    if (this.props.tags.length > 10) {
      throw new Error('Cannot have more than 10 tags');
    }

    if (this.props.defaultRequirements.length > 20) {
      throw new Error('Cannot have more than 20 default requirements');
    }

    // Validate tag format
    for (const tag of this.props.tags) {
      if (tag.length > 30) {
        throw new Error('Tag cannot exceed 30 characters');
      }
      if (!/^[a-zA-Z0-9_-]+$/.test(tag)) {
        throw new Error('Tag can only contain letters, numbers, underscores, and hyphens');
      }
    }

    // Validate requirement format
    for (const requirement of this.props.defaultRequirements) {
      if (requirement.length > 200) {
        throw new Error('Requirement cannot exceed 200 characters');
      }
    }
  }

  private updateTimestamp(): void {
    this.props.updatedAt = new Date();
  }

  toJSON(): ErrandTemplateProps {
    return {
      ...this.props,
      defaultRequirements: [...this.props.defaultRequirements],
      tags: [...this.props.tags],
    };
  }
}