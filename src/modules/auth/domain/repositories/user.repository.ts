import { User } from '../entities/user.entity';
import { Email } from '../value-objects';

export interface FindUserOptions {
  includeInactive?: boolean;
  includeUnverified?: boolean;
}

export interface UserFilters {
  role?: string;
  isActive?: boolean;
  isEmailVerified?: boolean;
  createdAfter?: Date;
  createdBefore?: Date;
}

export interface PaginationOptions {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export abstract class UserRepository {
  abstract save(user: User): Promise<User>;
  abstract findById(id: string, options?: FindUserOptions): Promise<User | null>;
  abstract findByEmail(email: Email, options?: FindUserOptions): Promise<User | null>;
  abstract findByPhone(phone: string, options?: FindUserOptions): Promise<User | null>;
  abstract findMany(filters: UserFilters, pagination: PaginationOptions): Promise<PaginatedResult<User>>;
  abstract exists(email: Email): Promise<boolean>;
  abstract delete(id: string): Promise<void>;
  abstract count(filters?: UserFilters): Promise<number>;
  abstract findByRefreshToken(token: string): Promise<User | null>;
  abstract findByResetToken(token: string): Promise<User | null>;
  abstract findUsersWithExpiredTokens(): Promise<User[]>;
  abstract findInactiveUsers(daysSinceLastLogin: number): Promise<User[]>;
}