import { User as PrismaUser, UserRole as PrismaUserRole } from '@prisma/client';

export class UserEntity {
  id: string;
  phoneNumber: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  role: PrismaUserRole;
  createdAt: Date;

  constructor(data: Partial<UserEntity>) {
    Object.assign(this, data);
    this.role = data.role || PrismaUserRole.CUSTOMER;
  }

  canSwitchRole(roleType: string): boolean {
    return this.role === roleType;
  }
}
