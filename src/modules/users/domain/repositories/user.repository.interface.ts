import { UserEntity } from '../entities/user.entity';
import { UserRole } from '@prisma/client';

export interface UserRepositoryInterface {
  // Basic CRUD operations
  findById(id: string): Promise<UserEntity | null>;
  findByEmail(email: string): Promise<UserEntity | null>;
  findByPhone(phone: string): Promise<UserEntity | null>;
  save(user: UserEntity): Promise<UserEntity>;
  update(id: string, user: Partial<UserEntity>): Promise<UserEntity>;
  delete(id: string): Promise<void>;
  exists(id: string): Promise<boolean>;

  // Query operations
  findMany(options?: {
    skip?: number;
    take?: number;
    where?: {
      email?: string;
      phone?: string;
      currentRole?: UserRole;
      roles?: UserRole[];
      status?: string;
      isEmailVerified?: boolean;
      isPhoneVerified?: boolean;
      createdAt?: {
        gte?: Date;
        lte?: Date;
      };
      updatedAt?: {
        gte?: Date;
        lte?: Date;
      };
    };
    orderBy?: {
      field: 'createdAt' | 'updatedAt' | 'email' | 'name';
      direction: 'asc' | 'desc';
    };
    include?: {
      addresses?: boolean;
      profile?: boolean;
      settings?: boolean;
      stats?: boolean;
      roleDetails?: boolean;
    };
  }): Promise<UserEntity[]>;

  count(where?: {
    email?: string;
    phone?: string;
    currentRole?: UserRole;
    roles?: UserRole[];
    status?: string;
    isEmailVerified?: boolean;
    isPhoneVerified?: boolean;
    createdAt?: {
      gte?: Date;
      lte?: Date;
    };
  }): Promise<number>;

  // Role-specific queries
  findByRole(role: UserRole, options?: {
    skip?: number;
    take?: number;
    isActive?: boolean;
  }): Promise<UserEntity[]>;

  findByRoles(roles: UserRole[], options?: {
    skip?: number;
    take?: number;
    isActive?: boolean;
  }): Promise<UserEntity[]>;

  // Verification queries
  findUnverifiedUsers(options?: {
    email?: boolean;
    phone?: boolean;
    olderThan?: Date;
  }): Promise<UserEntity[]>;

  findVerifiedUsers(options?: {
    email?: boolean;
    phone?: boolean;
    role?: UserRole;
  }): Promise<UserEntity[]>;

  // Status queries
  findByStatus(status: string, options?: {
    skip?: number;
    take?: number;
    role?: UserRole;
  }): Promise<UserEntity[]>;

  findActiveUsers(role?: UserRole): Promise<UserEntity[]>;
  findInactiveUsers(role?: UserRole): Promise<UserEntity[]>;
  findSuspendedUsers(role?: UserRole): Promise<UserEntity[]>;

  // Search operations
  search(query: string, options?: {
    fields?: ('name' | 'email' | 'phone')[];
    role?: UserRole;
    status?: string;
    skip?: number;
    take?: number;
  }): Promise<UserEntity[]>;

  // Bulk operations
  saveMany(users: UserEntity[]): Promise<UserEntity[]>;
  updateMany(where: {
    ids?: string[];
    role?: UserRole;
    status?: string;
  }, data: {
    status?: string;
    isEmailVerified?: boolean;
    isPhoneVerified?: boolean;
    updatedAt?: Date;
  }): Promise<number>; // Returns count of updated records

  deleteMany(where: {
    ids?: string[];
    role?: UserRole;
    status?: string;
    createdBefore?: Date;
  }): Promise<number>; // Returns count of deleted records

  // Statistics and analytics
  getUserStats(options?: {
    role?: UserRole;
    dateRange?: {
      start: Date;
      end: Date;
    };
  }): Promise<{
    total: number;
    active: number;
    inactive: number;
    suspended: number;
    verified: number;
    unverified: number;
    byRole: Record<UserRole, number>;
    registrationTrend: {
      date: Date;
      count: number;
    }[];
  }>;

  // Role management
  findUsersWithMultipleRoles(): Promise<UserEntity[]>;
  findUsersByRoleCount(count: number): Promise<UserEntity[]>;

  // Profile completeness
  findUsersWithIncompleteProfiles(role?: UserRole): Promise<UserEntity[]>;
  findUsersWithCompleteProfiles(role?: UserRole): Promise<UserEntity[]>;

  // Recent activity
  findRecentlyRegistered(days: number, role?: UserRole): Promise<UserEntity[]>;
  findRecentlyActive(days: number, role?: UserRole): Promise<UserEntity[]>;
  findInactiveUsers(days: number, role?: UserRole): Promise<UserEntity[]>;

  // Verification and security
  findUsersRequiringVerification(): Promise<UserEntity[]>;
  findUsersWithExpiredTokens(): Promise<UserEntity[]>;
  findSuspiciousUsers(criteria?: {
    multipleFailedLogins?: boolean;
    recentPasswordChanges?: boolean;
    unusualActivity?: boolean;
  }): Promise<UserEntity[]>;

  // Geographic queries (for drivers/vendors)
  findUsersByLocation(options: {
    latitude: number;
    longitude: number;
    radius: number; // in kilometers
    role?: UserRole;
    isActive?: boolean;
  }): Promise<UserEntity[]>;

  // Performance and optimization
  findWithRelations(id: string, relations: {
    addresses?: boolean;
    profile?: boolean;
    settings?: boolean;
    stats?: boolean;
    roleDetails?: boolean;
  }): Promise<UserEntity | null>;

  // Custom queries for business logic
  findEligibleForPromotion(criteria: {
    role: UserRole;
    minOrders?: number;
    minSpent?: number;
    memberSince?: Date;
  }): Promise<UserEntity[]>;

  findLoyalCustomers(criteria?: {
    minOrders?: number;
    minSpent?: number;
    loyaltyTier?: string;
  }): Promise<UserEntity[]>;

  findTopPerformers(role: UserRole, options?: {
    metric: 'orders' | 'revenue' | 'rating';
    limit?: number;
    dateRange?: {
      start: Date;
      end: Date;
    };
  }): Promise<UserEntity[]>;

  // Cleanup and maintenance
  findOrphanedUsers(): Promise<UserEntity[]>;
  findDuplicateUsers(): Promise<{
    email?: UserEntity[];
    phone?: UserEntity[];
  }>;

  // Transaction support
  withTransaction<T>(callback: (repository: UserRepositoryInterface) => Promise<T>): Promise<T>;
}