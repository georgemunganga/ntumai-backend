import { UserRole } from '@prisma/client';
import { UserRoleAssignmentEntity } from '../entities/user-role-assignment.entity';
export interface IUserRoleAssignmentRepository {
    findByUserId(userId: string): Promise<UserRoleAssignmentEntity[]>;
    findByUserIdAndRole(userId: string, role: UserRole): Promise<UserRoleAssignmentEntity | null>;
    create(assignment: UserRoleAssignmentEntity): Promise<UserRoleAssignmentEntity>;
    update(assignment: UserRoleAssignmentEntity): Promise<UserRoleAssignmentEntity>;
    delete(id: string): Promise<void>;
}
