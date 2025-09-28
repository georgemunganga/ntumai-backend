import { Injectable } from '@nestjs/common';
import { PrismaService } from '@common/prisma/prisma.service';
import { UserRepositoryInterface } from '../../domain/repositories/user.repository.interface';
import { UserEntity } from '../../domain/entities/user.entity';
import { UserRole, UserStatus, LoyaltyTier, Prisma } from '@prisma/client';

@Injectable()
export class UserRepository implements UserRepositoryInterface {
  constructor(private readonly prisma: PrismaService) {}

  async create(user: UserEntity): Promise<UserEntity> {
    const userData = this.toCreateData(user);
    const createdUser = await this.prisma.user.create({
      data: userData,
      include: this.getIncludeOptions(),
    });
    return this.toDomainEntity(createdUser);
  }

  async findById(id: string): Promise<UserEntity | null> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: this.getIncludeOptions(),
    });
    return user ? this.toDomainEntity(user) : null;
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: this.getIncludeOptions(),
    });
    return user ? this.toDomainEntity(user) : null;
  }

  async findByPhone(phone: string): Promise<UserEntity | null> {
    const user = await this.prisma.user.findFirst({
      where: { phone },
      include: this.getIncludeOptions(),
    });
    return user ? this.toDomainEntity(user) : null;
  }

  async update(id: string, user: UserEntity): Promise<UserEntity> {
    const updateData = this.toUpdateData(user);
    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: updateData,
      include: this.getIncludeOptions(),
    });
    return this.toDomainEntity(updatedUser);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.user.delete({
      where: { id },
    });
  }

  async findMany(options?: {
    limit?: number;
    offset?: number;
    orderBy?: { field: string; direction: 'asc' | 'desc' };
    where?: any;
  }): Promise<UserEntity[]> {
    const users = await this.prisma.user.findMany({
      take: options?.limit,
      skip: options?.offset,
      orderBy: options?.orderBy ? {
        [options.orderBy.field]: options.orderBy.direction,
      } : undefined,
      where: options?.where,
      include: this.getIncludeOptions(),
    });
    return users.map(user => this.toDomainEntity(user));
  }

  async count(where?: any): Promise<number> {
    return await this.prisma.user.count({ where });
  }

  async findByRole(role: UserRole, options?: {
    skip?: number;
    take?: number;
    isActive?: boolean;
  }): Promise<UserEntity[]> {
    const users = await this.prisma.user.findMany({
      where: { 
        currentRole: role,
        ...(options?.isActive !== undefined ? { status: options.isActive ? 'ACTIVE' : 'INACTIVE' } : {})
      },
      take: options?.take,
      skip: options?.skip,
      include: this.getIncludeOptions(),
    });
    return users.map(user => this.toDomainEntity(user));
  }

  async findByStatus(status: string, options?: {
    skip?: number;
    take?: number;
    role?: UserRole;
  }): Promise<UserEntity[]> {
    const users = await this.prisma.user.findMany({
      where: { 
        status: status as UserStatus,
        ...(options?.role ? { currentRole: options.role } : {})
      },
      take: options?.take,
      skip: options?.skip,
      include: this.getIncludeOptions(),
    });
    return users.map(user => this.toDomainEntity(user));
  }

  async findVerifiedUsers(options?: {
    email?: boolean;
    phone?: boolean;
    role?: UserRole;
  }): Promise<UserEntity[]> {
    const users = await this.prisma.user.findMany({
      where: {
        AND: [
          { isEmailVerified: options?.email !== false },
          { isPhoneVerified: options?.phone !== false },
          ...(options?.role ? [{ currentRole: options.role }] : []),
        ],
      },
      include: this.getIncludeOptions(),
    });
    return users.map(user => this.toDomainEntity(user));
  }

  async findUnverifiedUsers(options?: {
    email?: boolean;
    phone?: boolean;
    olderThan?: Date;
  }): Promise<UserEntity[]> {
    const users = await this.prisma.user.findMany({
      where: {
        OR: [
          ...(options?.email !== false ? [{ isEmailVerified: false }] : []),
          ...(options?.phone !== false ? [{ isPhoneVerified: false }] : []),
        ],
        ...(options?.olderThan ? { createdAt: { lt: options.olderThan } } : {}),
      },
      include: this.getIncludeOptions(),
    });
    return users.map(user => this.toDomainEntity(user));
  }

  async search(query: string, filters?: {
    role?: UserRole;
    status?: UserStatus;
    isVerified?: boolean;
  }): Promise<UserEntity[]> {
    const whereConditions: any = {
      OR: [
        { email: { contains: query, mode: 'insensitive' } },
        { firstName: { contains: query, mode: 'insensitive' } },
        { lastName: { contains: query, mode: 'insensitive' } },
        { phone: { contains: query } },
      ],
    };

    if (filters?.role) {
      whereConditions.currentRole = filters.role;
    }

    if (filters?.status) {
      whereConditions.status = filters.status;
    }

    if (filters?.isVerified !== undefined) {
      if (filters.isVerified) {
        whereConditions.AND = [
          { isEmailVerified: true },
          { isPhoneVerified: true },
        ];
      } else {
        whereConditions.OR.push(
          { isEmailVerified: false },
          { isPhoneVerified: false }
        );
      }
    }

    const users = await this.prisma.user.findMany({
      where: whereConditions,
      include: this.getIncludeOptions(),
    });
    return users.map(user => this.toDomainEntity(user));
  }

  async bulkCreate(users: UserEntity[]): Promise<UserEntity[]> {
    const usersData = users.map(user => this.toCreateData(user));
    await this.prisma.user.createMany({
      data: usersData,
    });
    
    // Fetch created users (Prisma createMany doesn't return created records)
    const emails = users.map(user => user.email);
    const createdUsers = await this.prisma.user.findMany({
      where: { email: { in: emails } },
      include: this.getIncludeOptions(),
    });
    return createdUsers.map(user => this.toDomainEntity(user));
  }

  async bulkUpdate(ids: string[], updateData: Partial<UserEntity>): Promise<void> {
    const prismaUpdateData = this.toPartialUpdateData(updateData);
    await this.prisma.user.updateMany({
      where: { id: { in: ids } },
      data: prismaUpdateData,
    });
  }

  async bulkDelete(ids: string[]): Promise<void> {
    await this.prisma.user.deleteMany({
      where: { id: { in: ids } },
    });
  }

  async bulkUpdateStatus(ids: string[], status: UserStatus): Promise<void> {
    await this.prisma.user.updateMany({
      where: { id: { in: ids } },
      data: { status },
    });
  }

  async getStatistics(): Promise<{
    totalUsers: number;
    usersByRole: Record<UserRole, number>;
    usersByStatus: Record<UserStatus, number>;
    verifiedUsers: number;
    newUsersThisMonth: number;
  }> {
    const totalUsers = await this.prisma.user.count();
    
    const usersByRole = {} as Record<UserRole, number>;
    for (const role of Object.values(UserRole)) {
      usersByRole[role] = await this.prisma.user.count({
        where: { currentRole: role },
      });
    }

    const usersByStatus = {} as Record<UserStatus, number>;
    for (const status of Object.values(UserStatus)) {
      usersByStatus[status] = await this.prisma.user.count({
        where: { status },
      });
    }

    const verifiedUsers = await this.prisma.user.count({
      where: {
        AND: [
          { isEmailVerified: true },
          { isPhoneVerified: true },
        ],
      },
    });

    const thisMonth = new Date();
    thisMonth.setDate(1);
    thisMonth.setHours(0, 0, 0, 0);
    
    const newUsersThisMonth = await this.prisma.user.count({
      where: {
        createdAt: {
          gte: thisMonth,
        },
      },
    });

    return {
      totalUsers,
      usersByRole,
      usersByStatus,
      verifiedUsers,
      newUsersThisMonth,
    };
  }

  async findByLoyaltyTier(tier: LoyaltyTier, limit?: number, offset?: number): Promise<UserEntity[]> {
    const users = await this.prisma.user.findMany({
      where: { loyaltyTier: tier },
      take: limit,
      skip: offset,
      include: this.getIncludeOptions(),
    });
    return users.map(user => this.toDomainEntity(user));
  }

  async findWithIncompleteProfiles(): Promise<UserEntity[]> {
    const users = await this.prisma.user.findMany({
      where: {
        OR: [
          { firstName: null },
          { lastName: null },
          { phone: null },
          { dateOfBirth: null },
        ],
      },
      include: this.getIncludeOptions(),
    });
    return users.map(user => this.toDomainEntity(user));
  }

  async findRecentlyActive(limit: number): Promise<UserEntity[]> {
    const users = await this.prisma.user.findMany({
      where: {
        lastLoginAt: {
          not: null,
        },
      },
      orderBy: {
        lastLoginAt: 'desc',
      },
      take: limit,
      include: this.getIncludeOptions(),
    });
    return users.map(user => this.toDomainEntity(user));
  }

  async findByGeolocation(latitude: number, longitude: number, radiusKm: number): Promise<UserEntity[]> {
    // This would require a more complex query with geographic functions
    // For now, return empty array as placeholder
    return [];
  }

  async findWithHighOrderValue(minValue: number): Promise<UserEntity[]> {
    const users = await this.prisma.user.findMany({
      where: {
        totalSpent: {
          gte: minValue,
        },
      },
      include: this.getIncludeOptions(),
    });
    return users.map(user => this.toDomainEntity(user));
  }

  async findInactive(daysSinceLastLogin: number): Promise<UserEntity[]> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysSinceLastLogin);

    const users = await this.prisma.user.findMany({
      where: {
        OR: [
          { lastLoginAt: null },
          { lastLoginAt: { lt: cutoffDate } },
        ],
      },
      include: this.getIncludeOptions(),
    });
    return users.map(user => this.toDomainEntity(user));
  }

  async exists(id: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: { id: true },
    });
    return !!user;
  }

  async existsByEmail(email: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });
    return !!user;
  }

  async existsByPhone(phone: string): Promise<boolean> {
    const user = await this.prisma.user.findFirst({
      where: { phone },
      select: { id: true },
    });
    return !!user;
  }

  private getIncludeOptions() {
    return {
      addresses: true,
      documents: true,
      driverDetails: true,
      vendorDetails: true,
      customerDetails: true,
    };
  }

  private toCreateData(user: UserEntity): Prisma.UserCreateInput {
    return {
      id: user.id,
      email: user.email,
      password: user.password,
      phone: user.phone,
      currentRole: user.currentRole,
      status: user.status,
      isEmailVerified: user.isEmailVerified,
      isPhoneVerified: user.isPhoneVerified,
      firstName: user.profile?.firstName,
      lastName: user.profile?.lastName,
      dateOfBirth: user.profile?.dateOfBirth,
      gender: user.profile?.gender,
      bio: user.profile?.bio,
      website: user.profile?.website,
      socialLinks: user.profile?.socialLinks as unknown as Prisma.JsonValue,
      alternateEmail: user.profile?.alternateEmail,
      alternatePhone: user.profile?.alternatePhone,
      emergencyContact: user.profile?.emergencyContact as unknown as Prisma.JsonValue,
      preferredLanguage: user.profile?.preferences?.language,
      preferredCurrency: user.profile?.preferences?.currency,
      timezone: user.profile?.preferences?.timezone,
      theme: user.settings?.theme,
      emailNotifications: user.settings?.notifications?.email,
      smsNotifications: user.settings?.notifications?.sms,
      pushNotifications: user.settings?.notifications?.push,
      marketingEmails: user.settings?.notifications?.marketing,
      promotionalOffers: user.settings?.notifications?.promotions,
      profileVisibility: user.settings?.privacy?.profileVisibility,
      showOnlineStatus: user.settings?.privacy?.showOnlineStatus,
      twoFactorEnabled: user.settings?.security?.twoFactorEnabled,
      loginNotifications: user.settings?.security?.loginNotifications,
      totalOrders: user.stats?.orders?.total,
      completedOrders: user.stats?.orders?.completed,
      cancelledOrders: user.stats?.orders?.cancelled,
      totalSpent: user.stats?.spending?.total,
      loyaltyPoints: user.stats?.loyalty?.points,
      referralCount: user.stats?.referrals?.count,
      averageRating: user.stats?.ratings?.average,
      totalRatings: user.stats?.ratings?.count,
      loyaltyTier: user.stats?.loyalty?.tier,
      loyaltyTierDate: user.stats?.loyalty?.updatedAt,
      defaultAddressId: user.settings?.defaultAddressId,
      deliveryInstructions: user.settings?.deliveryInstructions,
      lastLoginAt: user.lastLoginAt,
      passwordChangedAt: user.settings?.security?.passwordChangedAt,
    };
  }

  private toUpdateData(user: UserEntity): Prisma.UserUpdateInput {
    return {
      email: user.email,
      password: user.password,
      phone: user.phone,
      currentRole: user.currentRole,
      status: user.status,
      isEmailVerified: user.isEmailVerified,
      isPhoneVerified: user.isPhoneVerified,
      firstName: user.profile?.firstName,
      lastName: user.profile?.lastName,
      dateOfBirth: user.profile?.dateOfBirth,
      gender: user.profile?.gender,
      bio: user.profile?.bio,
      website: user.profile?.website,
      socialLinks: user.profile?.socialLinks as unknown as Prisma.JsonValue,
      alternateEmail: user.profile?.alternateEmail,
      alternatePhone: user.profile?.alternatePhone,
      emergencyContact: user.profile?.emergencyContact as unknown as Prisma.JsonValue,
      preferredLanguage: user.profile?.preferences?.language,
      preferredCurrency: user.profile?.preferences?.currency,
      timezone: user.profile?.preferences?.timezone,
      theme: user.settings?.theme,
      emailNotifications: user.settings?.notifications?.email,
      smsNotifications: user.settings?.notifications?.sms,
      pushNotifications: user.settings?.notifications?.push,
      marketingEmails: user.settings?.notifications?.marketing,
      promotionalOffers: user.settings?.notifications?.promotions,
      profileVisibility: user.settings?.privacy?.profileVisibility,
      showOnlineStatus: user.settings?.privacy?.showOnlineStatus,
      twoFactorEnabled: user.settings?.security?.twoFactorEnabled,
      loginNotifications: user.settings?.security?.loginNotifications,
      totalOrders: user.stats?.orders?.total,
      completedOrders: user.stats?.orders?.completed,
      cancelledOrders: user.stats?.orders?.cancelled,
      totalSpent: user.stats?.spending?.total,
      loyaltyPoints: user.stats?.loyalty?.points,
      referralCount: user.stats?.referrals?.count,
      averageRating: user.stats?.ratings?.average,
      totalRatings: user.stats?.ratings?.count,
      loyaltyTier: user.stats?.loyalty?.tier,
      loyaltyTierDate: user.stats?.loyalty?.updatedAt,
      defaultAddressId: user.settings?.defaultAddressId,
      deliveryInstructions: user.settings?.deliveryInstructions,
      lastLoginAt: user.lastLoginAt,
      passwordChangedAt: user.settings?.security?.passwordChangedAt,
      updatedAt: new Date(),
    };
  }

  private toPartialUpdateData(updateData: Partial<UserEntity>): Prisma.UserUpdateInput {
    const data: Prisma.UserUpdateInput = {};
    
    Object.keys(updateData).forEach(key => {
      const value = updateData[key as keyof UserEntity];
      if (value !== undefined) {
        if (key === 'socialLinks' || key === 'emergencyContact') {
          data[key] = value as Prisma.JsonValue;
        } else {
          data[key] = value;
        }
      }
    });
    
    data.updatedAt = new Date();
    return data;
  }

  private toDomainEntity(prismaUser: any): UserEntity {
    return UserEntity.fromPersistence({
      id: prismaUser.id,
      email: prismaUser.email,
      password: prismaUser.password,
      phone: prismaUser.phone,
      currentRole: prismaUser.currentRole,
      status: prismaUser.status,
      isEmailVerified: prismaUser.isEmailVerified,
      isPhoneVerified: prismaUser.isPhoneVerified,
      firstName: prismaUser.firstName,
      lastName: prismaUser.lastName,
      dateOfBirth: prismaUser.dateOfBirth,
      gender: prismaUser.gender,
      bio: prismaUser.bio,
      website: prismaUser.website,
      socialLinks: prismaUser.socialLinks,
      alternateEmail: prismaUser.alternateEmail,
      alternatePhone: prismaUser.alternatePhone,
      emergencyContact: prismaUser.emergencyContact,
      preferredLanguage: prismaUser.preferredLanguage,
      preferredCurrency: prismaUser.preferredCurrency,
      timezone: prismaUser.timezone,
      theme: prismaUser.theme,
      emailNotifications: prismaUser.emailNotifications,
      smsNotifications: prismaUser.smsNotifications,
      pushNotifications: prismaUser.pushNotifications,
      marketingEmails: prismaUser.marketingEmails,
      orderUpdates: prismaUser.orderUpdates,
      promotionalOffers: prismaUser.promotionalOffers,
      profileVisibility: prismaUser.profileVisibility,
      showOnlineStatus: prismaUser.showOnlineStatus,
      twoFactorEnabled: prismaUser.twoFactorEnabled,
      loginNotifications: prismaUser.loginNotifications,
      totalOrders: prismaUser.totalOrders,
      completedOrders: prismaUser.completedOrders,
      cancelledOrders: prismaUser.cancelledOrders,
      totalSpent: prismaUser.totalSpent,
      loyaltyPoints: prismaUser.loyaltyPoints,
      referralCount: prismaUser.referralCount,
      averageRating: prismaUser.averageRating,
      totalRatings: prismaUser.totalRatings,
      loyaltyTier: prismaUser.loyaltyTier,
      loyaltyTierDate: prismaUser.loyaltyTierDate,
      defaultAddressId: prismaUser.defaultAddressId,
      deliveryInstructions: prismaUser.deliveryInstructions,
      lastLoginAt: prismaUser.lastLoginAt,
      passwordChangedAt: prismaUser.passwordChangedAt,
      createdAt: prismaUser.createdAt,
      updatedAt: prismaUser.updatedAt,
      addresses: prismaUser.addresses,
      documents: prismaUser.documents,
      driverDetails: prismaUser.driverDetails,
      vendorDetails: prismaUser.vendorDetails,
      customerDetails: prismaUser.customerDetails,
    });
  }
}