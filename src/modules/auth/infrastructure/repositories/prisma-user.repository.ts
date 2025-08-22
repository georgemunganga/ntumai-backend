import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { User } from '../../domain/entities/user.entity';
import { Email, Phone, UserRole, Password } from '../../domain/value-objects';
import {
  UserRepository,
  FindUserOptions,
  UserFilters,
  PaginationOptions,
  PaginatedResult,
} from '../../domain/repositories/user.repository';
import { Prisma } from '@prisma/client';

@Injectable()
export class PrismaUserRepository extends UserRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
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
          role: userData.role,
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
          role: userData.role,
          isEmailVerified: userData.isEmailVerified,
          isPhoneVerified: userData.isPhoneVerified,
          lastLoginAt: userData.lastLoginAt,
          createdAt: userData.createdAt,
          updatedAt: userData.updatedAt,
        },
      });

      return User.fromPersistence(savedUser);
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
    const whereClause: Prisma.UserWhereInput = { id };
    
    // Note: User model doesn't have isActive field in schema
    // Using isEmailVerified as a proxy for active users
    
    if (!options.includeUnverified) {
      whereClause.isEmailVerified = true;
    }

    const userData = await this.prisma.user.findFirst({
      where: whereClause,
    });

    return userData ? User.fromPersistence(userData) : null;
  }

  async findByEmail(email: Email, options: FindUserOptions = {}): Promise<User | null> {
    const whereClause: Prisma.UserWhereInput = { email: email.value };
    
    // Note: User model doesn't have isActive field in schema
    // Using isEmailVerified as a proxy for active users
    
    if (!options.includeUnverified) {
      whereClause.isEmailVerified = true;
    }

    const userData = await this.prisma.user.findFirst({
      where: whereClause,
    });

    return userData ? User.fromPersistence(userData) : null;
  }

  async findByPhone(phone: string, options: FindUserOptions = {}): Promise<User | null> {
    const whereClause: Prisma.UserWhereInput = { phone };
    
    // Note: User model doesn't have isActive field in schema
    // Using isEmailVerified as a proxy for active users
    
    if (!options.includeUnverified) {
      whereClause.isEmailVerified = true;
    }

    const userData = await this.prisma.user.findFirst({
      where: whereClause,
    });

    return userData ? User.fromPersistence(userData) : null;
  }

  async findMany(
    filters: UserFilters,
    pagination: PaginationOptions,
  ): Promise<PaginatedResult<User>> {
    const whereClause: Prisma.UserWhereInput = {};

    if (filters.role) {
      whereClause.role = filters.role as any;
    }

    // Note: User model doesn't have isActive field in schema
    // Skipping isActive filter as field doesn't exist

    if (filters.isEmailVerified !== undefined) {
      whereClause.isEmailVerified = filters.isEmailVerified;
    }

    if (filters.createdAfter || filters.createdBefore) {
      whereClause.createdAt = {};
      if (filters.createdAfter) {
        whereClause.createdAt.gte = filters.createdAfter;
      }
      if (filters.createdBefore) {
        whereClause.createdAt.lte = filters.createdBefore;
      }
    }

    const orderBy: Prisma.UserOrderByWithRelationInput = {};
    if (pagination.sortBy) {
      orderBy[pagination.sortBy as keyof Prisma.UserOrderByWithRelationInput] = pagination.sortOrder || 'asc';
    } else {
      orderBy.createdAt = 'desc';
    }

    const skip = (pagination.page - 1) * pagination.limit;

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where: whereClause,
        orderBy,
        skip,
        take: pagination.limit,
      }),
      this.prisma.user.count({ where: whereClause }),
    ]);

    const domainUsers = users.map(user => User.fromPersistence(user));
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
    const count = await this.prisma.user.count({
      where: { email: email.value },
    });
    return count > 0;
  }

  async delete(id: string): Promise<void> {
    await this.prisma.user.delete({
      where: { id },
    });
  }

  async count(filters: UserFilters = {}): Promise<number> {
    const whereClause: Prisma.UserWhereInput = {};

    if (filters.role) {
      whereClause.role = filters.role as any;
    }

    // Note: User model doesn't have isActive field in schema
    // Skipping isActive filter as field doesn't exist

    if (filters.isEmailVerified !== undefined) {
      whereClause.isEmailVerified = filters.isEmailVerified;
    }

    return this.prisma.user.count({ where: whereClause });
  }

  async findByRefreshToken(token: string): Promise<User | null> {
    const userData = await this.prisma.user.findFirst({
      where: {
        refreshTokens: {
        some: {
          token: token,
        },
      },
        // isActive field doesn't exist in schema
      },
    });

    return userData ? User.fromPersistence(userData) : null;
  }

  async findByResetToken(token: string): Promise<User | null> {
    const userData = await this.prisma.user.findFirst({
      where: {
        passwordResetTokens: {
          some: {
            token: token,
            expiresAt: {
              gt: new Date(),
            },
          },
        },
      },
    });

    return userData ? User.fromPersistence(userData) : null;
  }

  async findUsersWithExpiredTokens(): Promise<User[]> {
    // This is a simplified implementation
    // In a real scenario, you might store token expiry dates
    const users = await this.prisma.user.findMany({
      where: {
        refreshTokens: {
          some: {
            expiresAt: {
              lt: new Date(),
            },
          },
        },
      },
    });

    return users.map(user => User.fromPersistence(user));
  }

  async findInactiveUsers(daysSinceLastLogin: number): Promise<User[]> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysSinceLastLogin);

    const users = await this.prisma.user.findMany({
      where: {
        OR: [
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
        ],
        // Note: isActive field doesn't exist in schema
      },
    });

    return users.map(user => User.fromPersistence(user));
  }
}