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
export declare class UserRoleAssignmentEntity {
    private readonly props;
    private constructor();
    static create(userId: string, role: UserRole, metadata?: Record<string, any>): UserRoleAssignmentEntity;
    static fromPersistence(props: UserRoleAssignmentProps): UserRoleAssignmentEntity;
    get id(): string;
    get userId(): string;
    get role(): UserRole;
    get active(): boolean;
    get metadata(): Record<string, any> | undefined;
    get createdAt(): Date;
    get updatedAt(): Date;
    activate(): void;
    deactivate(): void;
    updateMetadata(metadata: Record<string, any>): void;
    toPersistence(): UserRoleAssignmentProps;
}
