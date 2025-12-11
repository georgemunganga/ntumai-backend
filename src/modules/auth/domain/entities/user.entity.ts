import { User as PrismaUser, UserRole as PrismaUserRole } from '@prisma/client';

export class UserEntity {
  id: string;
  phoneNumber: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  status: string;
  roles: PrismaUserRole[];
  isActive: boolean;
  createdAt: Date;

  constructor(data: Partial<UserEntity>) {
    Object.assign(this, data);
    this.roles = data.roles || [];
  }

  canSwitchRole(roleType: string): boolean {
    return this.roles.some(r => r.roleType === roleType && r.isActive);
  }
}
