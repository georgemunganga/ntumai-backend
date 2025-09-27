import { Injectable } from '@nestjs/common';
import { PrismaService } from '@common/prisma/prisma.service';
import { User } from '../../domain/entities/user.entity';
import { Email } from '../../domain/value-objects';
import {
  UserRepository,
  FindUserOptions,
  UserFilters,
  PaginationOptions,
  PaginatedResult,
} from '../../domain/repositories/user.repository';
import { Prisma } from '@prisma/client';
import { UserQueryBuilder } from './user-query-builder';
import { UserCacheService } from './user-cache.service';

@Injectable()
export class OptimizedPrismaUserRepository extends UserRepository {
  private readonly queryBuilder = new UserQueryBuilder();

  constructor(
    private readonly prisma: PrismaService,
    private readonly cacheService: UserCacheService,
  ) {
    super();
    
    // Set up periodic cache cleanup
    setInterval(() => {
      this.cacheService.cleanupExpired();
    }, 5 * 60 * 1000); // Clean up every 5 minutes
  }

  async save(user: User): Promise<User> {
    const userData = user.toPersistence();
    
    try {
      const savedUser = await this.prisma.user.upsert({
        where: { id: userData.id },
        update: {
          email: userData.email,
          password: userData.password,
          name: `${userData.firstName} ${userData.lastName}`.trim(),
          phone: userData.phone,
          currentRole: userData.role,
          isEmailVerified: userData.isEmailVerified,
          isPhoneVerified: userData.isPhoneVerified,
          lastLoginAt: userData.lastLoginAt,
          updatedAt: userData.updatedAt,
        },
        create: {
          id: userData.id,
          email: userData.email,
          password: userData.password,
          name: `${userData.firstName} ${userData.lastName}`.trim(),
          phone: userData.phone,
          currentRole: userData.role,
          isEmailVerified: userData.isEmailVerified,
          isPhoneVerified: userData.isPhoneVerified,
          lastLoginAt: userData.lastLoginAt,
          createdAt: userData.createdAt,
          updatedAt: userData.updatedAt,
        },
      });

      const domainUser = User.fromPersistence(savedUser);
      
      // Invalidate cache for this user
      this.cacheService.invalidateUser(domainUser);
      
      // Cache the updated user
      this.cacheService.setUserById(domainUser.id, domainUser);
      this.cacheService.setUserByEmail(domainUser.email, domainUser);
      if (domainUser.phone) {
        this.cacheService.setUserByPhone(domainUser.phone.value, domainUser);
      }
      this.cacheService.setUserExists(domainUser.email, true);
      
      return domainUser;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new Error('User with this email already exists');
        }
      }
      throw error;
    }
  }

  async findById(id: string, options: FindUserOptions = {}): Promise<User | null> {
    // Check cache first
    const cachedUser = this.cacheService.getUserById(id);
    if (cachedUser && this.matchesFindOptions(cachedUser, options)) {
      return cachedUser;
    }

    // Build query using query builder
    const query = this.queryBuilder
      .reset()
      .withId(id)
      .withFindOptions(options)
      .buildFindQuery();

    const userData = await this.prisma.user.findFirst(query);
    
    if (userData) {
      const domainUser = User.fromPersistence(userData);
      this.cacheService.setUserById(id, domainUser);
      return domainUser;
    }
    
    return null;
  }

  async findByEmail(email: Email, options: FindUserOptions = {}): Promise<User | null> {
    // Check cache first
    const cachedUser = this.cacheService.getUserByEmail(email);
    if (cachedUser && this.matchesFindOptions(cachedUser, options)) {
      return cachedUser;
    }

    // Build query using query builder
    const query = this.queryBuilder
      .reset()
      .withEmail(email.value)
      .withFindOptions(options)
      .buildFindQuery();

    const userData = await this.prisma.user.findFirst(query);
    
    if (userData) {
      const domainUser = User.fromPersistence(userData);
      this.cacheService.setUserByEmail(email, domainUser);
      this.cacheService.setUserById(domainUser.id, domainUser);
      return domainUser;
    }
    
    return null;
  }

  async findByPhone(phone: string, options: FindUserOptions = {}): Promise<User | null> {
    // Check cache first
    const cachedUser = this.cacheService.getUserByPhone(phone);
    if (cachedUser && this.matchesFindOptions(cachedUser, options)) {
      return cachedUser;
    }

    // Build query using query builder
    const query = this.queryBuilder
      .reset()
      .withPhone(phone)
      .withFindOptions(options)
      .buildFindQuery();

    const userData = await this.prisma.user.findFirst(query);
    
    if (userData) {
      const domainUser = User.fromPersistence(userData);
      this.cacheService.setUserByPhone(phone, domainUser);
      this.cacheService.setUserById(domainUser.id, domainUser);
      return domainUser;
    }
    
    return null;
  }

  async findMany(
    filters: UserFilters,
    pagination: PaginationOptions,
  ): Promise<PaginatedResult<User>> {
    // Build query using query builder
    const skip = (pagination.page - 1) * pagination.limit;
    
    const findManyQuery = this.queryBuilder
      .reset()
      .withFilters(filters)
      .withSorting(pagination.sortBy, pagination.sortOrder)
      .buildFindManyQuery(skip, pagination.limit);
    
    const countQuery = this.queryBuilder
      .reset()
      .withFilters(filters)
      .buildCountQuery();

    const [users, total] = await Promise.all([
      this.prisma.user.findMany(findManyQuery),
      this.prisma.user.count(countQuery),
    ]);

    const domainUsers = users.map(user => {
      const domainUser = User.fromPersistence(user);
      // Cache individual users from the result
      this.cacheService.setUserById(domainUser.id, domainUser);
      this.cacheService.setUserByEmail(domainUser.email, domainUser);
      return domainUser;
    });
    
    const totalPages = Math.ceil(total / pagination.limit);

    return {
      data: domainUsers,
      total,
      page: pagination.page,
      limit: pagination.limit,
      totalPages,
    };
  }

  async exists(email: Email): Promise<boolean> {
    // Check cache first
    const cachedExists = this.cacheService.getUserExists(email);
    if (cachedExists !== null) {
      return cachedExists;
    }

    const count = await this.prisma.user.count({
      where: { email: email.value },
    });
    
    const exists = count > 0;
    this.cacheService.setUserExists(email, exists);
    
    return exists;
  }

  async delete(id: string): Promise<void> {
    // Invalidate cache before deletion
    this.cacheService.invalidateUserById(id);
    
    await this.prisma.user.delete({
      where: { id },
    });
  }

  async count(filters: UserFilters = {}): Promise<number> {
    // Build query using query builder
    const query = this.queryBuilder
      .reset()
      .withFilters(filters)
      .buildCountQuery();

    return this.prisma.user.count(query);
  }

  async findByRefreshToken(token: string): Promise<User | null> {
    // Build query using query builder
    const query = this.queryBuilder
      .reset()
      .withRefreshToken(token)
      .buildFindQuery();

    const userData = await this.prisma.user.findFirst(query);
    
    if (userData) {
      const domainUser = User.fromPersistence(userData);
      // Cache the user
      this.cacheService.setUserById(domainUser.id, domainUser);
      this.cacheService.setUserByEmail(domainUser.email, domainUser);
      return domainUser;
    }
    
    return null;
  }

  async findByResetToken(token: string): Promise<User | null> {
    // Build query using query builder
    const query = this.queryBuilder
      .reset()
      .withValidResetToken(token)
      .buildFindQuery();

    const userData = await this.prisma.user.findFirst(query);
    
    if (userData) {
      const domainUser = User.fromPersistence(userData);
      // Cache the user
      this.cacheService.setUserById(domainUser.id, domainUser);
      this.cacheService.setUserByEmail(domainUser.email, domainUser);
      return domainUser;
    }
    
    return null;
  }

  async createPasswordResetToken(userId: string, token: string, expiresAt: Date): Promise<void> {
    // Delete any existing password reset tokens for this user
    await this.prisma.passwordResetToken.deleteMany({
      where: { userId }
    });

    // Create new password reset token
    await this.prisma.passwordResetToken.create({
      data: {
        userId,
        token,
        expiresAt,
      },
    });
  }

  async deletePasswordResetToken(token: string): Promise<void> {
    await this.prisma.passwordResetToken.deleteMany({
      where: { token }
    });
  }

  async findUsersWithExpiredTokens(): Promise<User[]> {
    // Build query using query builder
    const query = this.queryBuilder
      .reset()
      .withExpiredTokens()
      .buildFindManyQuery();

    const users = await this.prisma.user.findMany(query);
    
    return users.map(user => {
      const domainUser = User.fromPersistence(user);
      // Cache individual users
      this.cacheService.setUserById(domainUser.id, domainUser);
      this.cacheService.setUserByEmail(domainUser.email, domainUser);
      return domainUser;
    });
  }

  async findInactiveUsers(daysSinceLastLogin: number): Promise<User[]> {
    // Build query using query builder
    const query = this.queryBuilder
      .reset()
      .withInactiveUsers(daysSinceLastLogin)
      .buildFindManyQuery();

    const users = await this.prisma.user.findMany(query);
    
    return users.map(user => {
      const domainUser = User.fromPersistence(user);
      // Cache individual users
      this.cacheService.setUserById(domainUser.id, domainUser);
      this.cacheService.setUserByEmail(domainUser.email, domainUser);
      return domainUser;
    });
  }

  /**
   * Check if cached user matches the find options
   */
  private matchesFindOptions(user: User, options: FindUserOptions): boolean {
    const userData = user.toPersistence();
    
    // If we don't want unverified users but this user is unverified, it doesn't match
    if (!options.includeUnverified && !userData.isEmailVerified) {
      return false;
    }
    
    // Note: isActive field doesn't exist in current schema
    // Using isEmailVerified as proxy for active users
    
    return true;
  }

  /**
   * Get cache statistics for monitoring
   */
  getCacheStats() {
    return this.cacheService.getStats();
  }

  /**
   * Clear all caches (useful for testing or manual cache invalidation)
   */
  clearCache(): void {
    this.cacheService.clearAll();
  }
}