import { UserRole } from '@prisma/client';

export interface UserRoleAssignmentProps {
  id: string;
  userId: string;
  role: UserRole;
  active: boolean;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export class UserRoleAssignmentEntity {
  private constructor(private readonly props: UserRoleAssignmentProps) {}

  static create(
    userId: string,
    role: UserRole,
    metadata?: Record<string, any>,
  ): UserRoleAssignmentEntity {
    return new UserRoleAssignmentEntity({
      id: crypto.randomUUID(),
      userId,
      role,
      active: true,
      metadata,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  static fromPersistence(
    props: UserRoleAssignmentProps,
  ): UserRoleAssignmentEntity {
    return new UserRoleAssignmentEntity(props);
  }

  get id(): string {
    return this.props.id;
  }

  get userId(): string {
    return this.props.userId;
  }

  get role(): UserRole {
    return this.props.role;
  }

  get active(): boolean {
    return this.props.active;
  }

  get metadata(): Record<string, any> | undefined {
    return this.props.metadata;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  activate(): void {
    this.props.active = true;
    this.props.updatedAt = new Date();
  }

  deactivate(): void {
    this.props.active = false;
    this.props.updatedAt = new Date();
  }

  updateMetadata(metadata: Record<string, any>): void {
    this.props.metadata = metadata;
    this.props.updatedAt = new Date();
  }

  toPersistence(): UserRoleAssignmentProps {
    return { ...this.props };
  }
}
