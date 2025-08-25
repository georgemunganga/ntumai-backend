import { Prisma } from '@prisma/client';
import { UserFilters, FindUserOptions } from '../../domain/repositories/user.repository';

/**
 * Query builder for user-related database operations
 * Centralizes query construction logic to reduce duplication
 */
export class UserQueryBuilder {
  private whereClause: Prisma.UserWhereInput = {};
  private orderByClause: Prisma.UserOrderByWithRelationInput = {};
  private includeClause: Prisma.UserInclude = {};

  /**
   * Reset the query builder to initial state
   */
  reset(): UserQueryBuilder {
    this.whereClause = {};
    this.orderByClause = {};
    this.includeClause = {};
    return this;
  }

  /**
   * Add basic user filters
   */
  withFilters(filters: UserFilters): UserQueryBuilder {
    if (filters.role) {
      this.whereClause.currentRole = filters.role as any;
    }

    if (filters.isEmailVerified !== undefined) {
      this.whereClause.isEmailVerified = filters.isEmailVerified;
    }

    if (filters.createdAfter || filters.createdBefore) {
      this.whereClause.createdAt = {};
      if (filters.createdAfter) {
        this.whereClause.createdAt.gte = filters.createdAfter;
      }
      if (filters.createdBefore) {
        this.whereClause.createdAt.lte = filters.createdBefore;
      }
    }

    return this;
  }

  /**
   * Add find options (active/verified users)
   */
  withFindOptions(options: FindUserOptions): UserQueryBuilder {
    if (!options.includeUnverified) {
      this.whereClause.isEmailVerified = true;
    }

    // Note: isActive field doesn't exist in current schema
    // Using isEmailVerified as proxy for active users
    
    return this;
  }

  /**
   * Add email filter
   */
  withEmail(email: string): UserQueryBuilder {
    this.whereClause.email = email;
    return this;
  }

  /**
   * Add phone filter
   */
  withPhone(phone: string): UserQueryBuilder {
    this.whereClause.phone = phone;
    return this;
  }

  /**
   * Add ID filter
   */
  withId(id: string): UserQueryBuilder {
    this.whereClause.id = id;
    return this;
  }

  /**
   * Add refresh token filter
   */
  withRefreshToken(token: string): UserQueryBuilder {
    this.whereClause.refreshTokens = {
      some: {
        token: token,
      },
    };
    return this;
  }

  /**
   * Add password reset token filter
   */
  withValidResetToken(token: string): UserQueryBuilder {
    this.whereClause.passwordResetTokens = {
      some: {
        token: token,
        expiresAt: {
          gt: new Date(),
        },
      },
    };
    return this;
  }

  /**
   * Add expired tokens filter
   */
  withExpiredTokens(): UserQueryBuilder {
    this.whereClause.refreshTokens = {
      some: {
        expiresAt: {
          lt: new Date(),
        },
      },
    };
    return this;
  }

  /**
   * Add inactive users filter
   */
  withInactiveUsers(daysSinceLastLogin: number): UserQueryBuilder {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysSinceLastLogin);

    this.whereClause.OR = [
      {
        lastLoginAt: {
          lt: cutoffDate,
        },
      },
      {
        lastLoginAt: null,
        createdAt: {
          lt: cutoffDate,
        },
      },
    ];
    return this;
  }

  /**
   * Add sorting
   */
  withSorting(sortBy?: string, sortOrder: 'asc' | 'desc' = 'asc'): UserQueryBuilder {
    if (sortBy) {
      this.orderByClause[sortBy as keyof Prisma.UserOrderByWithRelationInput] = sortOrder;
    } else {
      this.orderByClause.createdAt = 'desc';
    }
    return this;
  }

  /**
   * Include related data
   */
  withIncludes(includes: Partial<Prisma.UserInclude>): UserQueryBuilder {
    this.includeClause = { ...this.includeClause, ...includes };
    return this;
  }

  /**
   * Build the final query object
   */
  build(): {
    where: Prisma.UserWhereInput;
    orderBy: Prisma.UserOrderByWithRelationInput;
    include: Prisma.UserInclude;
  } {
    return {
      where: this.whereClause,
      orderBy: this.orderByClause,
      include: this.includeClause,
    };
  }

  /**
   * Build query for findFirst/findUnique operations
   */
  buildFindQuery(): Prisma.UserFindFirstArgs {
    const query = this.build();
    return {
      where: query.where,
      ...(Object.keys(query.orderBy).length > 0 && { orderBy: query.orderBy }),
      ...(Object.keys(query.include).length > 0 && { include: query.include }),
    };
  }

  /**
   * Build query for findMany operations with pagination
   */
  buildFindManyQuery(skip?: number, take?: number): Prisma.UserFindManyArgs {
    const query = this.build();
    return {
      where: query.where,
      ...(Object.keys(query.orderBy).length > 0 && { orderBy: query.orderBy }),
      ...(Object.keys(query.include).length > 0 && { include: query.include }),
      ...(skip !== undefined && { skip }),
      ...(take !== undefined && { take }),
    };
  }

  /**
   * Build query for count operations
   */
  buildCountQuery(): Prisma.UserCountArgs {
    return {
      where: this.whereClause,
    };
  }
}