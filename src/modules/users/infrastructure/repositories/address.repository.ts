import { Injectable } from '@nestjs/common';
import { PrismaService } from '@common/prisma/prisma.service';
import { AddressRepositoryInterface } from '../../domain/repositories/address.repository.interface';
import { AddressEntity } from '../../domain/entities/address.entity';
import { AddressType, Prisma } from '@prisma/client';

@Injectable()
export class AddressRepository implements AddressRepositoryInterface {
  constructor(private readonly prisma: PrismaService) {}

  async create(address: AddressEntity): Promise<AddressEntity> {
    const addressData = this.toCreateData(address);
    const createdAddress = await this.prisma.address.create({
      data: addressData,
    });
    return this.toDomainEntity(createdAddress);
  }

  async findById(id: string): Promise<AddressEntity | null> {
    const address = await this.prisma.address.findUnique({
      where: { id },
    });
    return address ? this.toDomainEntity(address) : null;
  }

  async update(id: string, address: AddressEntity): Promise<AddressEntity> {
    const updateData = this.toUpdateData(address);
    const updatedAddress = await this.prisma.address.update({
      where: { id },
      data: updateData,
    });
    return this.toDomainEntity(updatedAddress);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.address.delete({
      where: { id },
    });
  }

  async findMany(options?: {
    limit?: number;
    offset?: number;
    orderBy?: { field: string; direction: 'asc' | 'desc' };
    where?: any;
  }): Promise<AddressEntity[]> {
    const addresses = await this.prisma.address.findMany({
      take: options?.limit,
      skip: options?.offset,
      orderBy: options?.orderBy ? {
        [options.orderBy.field]: options.orderBy.direction,
      } : undefined,
      where: options?.where,
    });
    return addresses.map(address => this.toDomainEntity(address));
  }

  async count(where?: any): Promise<number> {
    return await this.prisma.address.count({ where });
  }

  async findByUserId(userId: string): Promise<AddressEntity[]> {
    const addresses = await this.prisma.address.findMany({
      where: { userId },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });
    return addresses.map(address => this.toDomainEntity(address));
  }

  async findByUserAndType(userId: string, type: AddressType): Promise<AddressEntity[]> {
    const addresses = await this.prisma.address.findMany({
      where: { userId, type },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });
    return addresses.map(address => this.toDomainEntity(address));
  }

  async findDefaultByUser(userId: string): Promise<AddressEntity[]> {
    const addresses = await this.prisma.address.findMany({
      where: { userId, isDefault: true },
    });
    return addresses.map(address => this.toDomainEntity(address));
  }

  async findDefaultByUserAndType(userId: string, type: AddressType): Promise<AddressEntity | null> {
    const address = await this.prisma.address.findFirst({
      where: { userId, type, isDefault: true },
    });
    return address ? this.toDomainEntity(address) : null;
  }

  async findByType(type: AddressType, limit?: number, offset?: number): Promise<AddressEntity[]> {
    const addresses = await this.prisma.address.findMany({
      where: { type },
      take: limit,
      skip: offset,
    });
    return addresses.map(address => this.toDomainEntity(address));
  }

  async findNearby(
    latitude: number,
    longitude: number,
    radiusKm: number,
    type?: AddressType,
    limit?: number
  ): Promise<AddressEntity[]> {
    // This would require PostGIS or similar geographic extensions
    // For now, we'll use a simplified bounding box approach
    const latRange = radiusKm / 111; // Rough conversion: 1 degree ≈ 111 km
    const lonRange = radiusKm / (111 * Math.cos(latitude * Math.PI / 180));

    const whereConditions: any = {
      latitude: {
        gte: latitude - latRange,
        lte: latitude + latRange,
      },
      longitude: {
        gte: longitude - lonRange,
        lte: longitude + lonRange,
      },
    };

    if (type) {
      whereConditions.type = type;
    }

    const addresses = await this.prisma.address.findMany({
      where: whereConditions,
      take: limit,
    });
    return addresses.map(address => this.toDomainEntity(address));
  }

  async findByCity(city: string, limit?: number): Promise<AddressEntity[]> {
    const addresses = await this.prisma.address.findMany({
      where: {
        city: {
          contains: city,
          mode: 'insensitive',
        },
      },
      take: limit,
    });
    return addresses.map(address => this.toDomainEntity(address));
  }

  async findByState(state: string, limit?: number): Promise<AddressEntity[]> {
    const addresses = await this.prisma.address.findMany({
      where: {
        state: {
          contains: state,
          mode: 'insensitive',
        },
      },
      take: limit,
    });
    return addresses.map(address => this.toDomainEntity(address));
  }

  async findByPostalCode(postalCode: string): Promise<AddressEntity[]> {
    const addresses = await this.prisma.address.findMany({
      where: { postalCode },
    });
    return addresses.map(address => this.toDomainEntity(address));
  }

  async findByCountry(country: string, limit?: number): Promise<AddressEntity[]> {
    const addresses = await this.prisma.address.findMany({
      where: {
        country: {
          contains: country,
          mode: 'insensitive',
        },
      },
      take: limit,
    });
    return addresses.map(address => this.toDomainEntity(address));
  }

  async searchByUser(userId: string, query: string): Promise<AddressEntity[]> {
    const addresses = await this.prisma.address.findMany({
      where: {
        userId,
        OR: [
          { label: { contains: query, mode: 'insensitive' } },
          { addressLine1: { contains: query, mode: 'insensitive' } },
          { addressLine2: { contains: query, mode: 'insensitive' } },
          { landmark: { contains: query, mode: 'insensitive' } },
          { city: { contains: query, mode: 'insensitive' } },
          { state: { contains: query, mode: 'insensitive' } },
          { postalCode: { contains: query } },
        ],
      },
    });
    return addresses.map(address => this.toDomainEntity(address));
  }

  async search(query: string): Promise<AddressEntity[]> {
    const addresses = await this.prisma.address.findMany({
      where: {
        OR: [
          { label: { contains: query, mode: 'insensitive' } },
          { addressLine1: { contains: query, mode: 'insensitive' } },
          { addressLine2: { contains: query, mode: 'insensitive' } },
          { landmark: { contains: query, mode: 'insensitive' } },
          { city: { contains: query, mode: 'insensitive' } },
          { state: { contains: query, mode: 'insensitive' } },
          { postalCode: { contains: query } },
        ],
      },
    });
    return addresses.map(address => this.toDomainEntity(address));
  }

  async validateUniqueness(userId: string, addressData: {
    addressLine1: string;
    city: string;
    state: string;
    postalCode: string;
  }): Promise<boolean> {
    const existingAddress = await this.prisma.address.findFirst({
      where: {
        userId,
        addressLine1: addressData.addressLine1,
        city: addressData.city,
        state: addressData.state,
        postalCode: addressData.postalCode,
      },
    });
    return !existingAddress;
  }

  async isAddressInUse(addressId: string): Promise<boolean> {
    // Check if address is used in any orders
    const orderCount = await this.prisma.order.count({
      where: {
        OR: [
          { deliveryAddressId: addressId },
          { billingAddressId: addressId },
        ],
      },
    });
    return orderCount > 0;
  }

  async bulkCreate(addresses: AddressEntity[]): Promise<AddressEntity[]> {
    const addressesData = addresses.map(address => this.toCreateData(address));
    await this.prisma.address.createMany({
      data: addressesData,
    });
    
    // Fetch created addresses
    const userIds = addresses.map(address => address.userId);
    const createdAddresses = await this.prisma.address.findMany({
      where: { userId: { in: userIds } },
      orderBy: { createdAt: 'desc' },
      take: addresses.length,
    });
    return createdAddresses.map(address => this.toDomainEntity(address));
  }

  async bulkUpdate(ids: string[], updateData: Partial<AddressEntity>): Promise<number> {
    const prismaUpdateData = this.toPartialUpdateData(updateData);
    const result = await this.prisma.address.updateMany({
      where: { id: { in: ids } },
      data: prismaUpdateData,
    });
    return result.count;
  }

  async bulkDelete(ids: string[]): Promise<void> {
    await this.prisma.address.deleteMany({
      where: { id: { in: ids } },
    });
  }

  async getStatistics(): Promise<{
    totalAddresses: number;
    addressesByType: Record<AddressType, number>;
    addressesByCountry: Array<{ country: string; count: number }>;
    mostUsedCities: Array<{ city: string; count: number }>;
  }> {
    const totalAddresses = await this.prisma.address.count();
    
    const addressesByType = {} as Record<AddressType, number>;
    for (const type of Object.values(AddressType)) {
      addressesByType[type] = await this.prisma.address.count({
        where: { type },
      });
    }

    const addressesByCountry = await this.prisma.address.groupBy({
      by: ['country'],
      _count: { country: true },
      orderBy: { _count: { country: 'desc' } },
      take: 10,
    });

    const mostUsedCities = await this.prisma.address.groupBy({
      by: ['city'],
      _count: { city: true },
      orderBy: { _count: { city: 'desc' } },
      take: 10,
    });

    return {
      totalAddresses,
      addressesByType,
      addressesByCountry: addressesByCountry.map(item => ({
        country: item.country,
        count: item._count.country,
      })),
      mostUsedCities: mostUsedCities.map(item => ({
        city: item.city,
        count: item._count.city,
      })),
    };
  }


  async getUsageMetrics(): Promise<{ averageUsageCount: number; totalUsageCount: number }> {
    const aggregate = await this.prisma.address.aggregate({
      _avg: { usageCount: true },
      _sum: { usageCount: true },
    });

    return {
      averageUsageCount: aggregate._avg.usageCount ?? 0,
      totalUsageCount: aggregate._sum.usageCount ?? 0,
    };
  }

  async countByType(type: AddressType): Promise<number> {
    return await this.prisma.address.count({
      where: { type },
    });
  }

  async countByUser(userId: string): Promise<number> {
    return await this.prisma.address.count({
      where: { userId },
    });
  }

  async findMostUsed(limit: number): Promise<AddressEntity[]> {
    const addresses = await this.prisma.address.findMany({
      orderBy: [{ usageCount: 'desc' }, { lastUsedAt: 'desc' }],
      take: limit,
    });
    return addresses.map(address => this.toDomainEntity(address));
  }

  async findRecentlyUsed(limit: number): Promise<AddressEntity[]> {
    const addresses = await this.prisma.address.findMany({
      where: {
        lastUsedAt: {
          not: null,
        },
      },
      orderBy: { lastUsedAt: 'desc' },
      take: limit,
    });
    return addresses.map(address => this.toDomainEntity(address));
  }

  async findRecentlyUsedByUser(userId: string, limit: number): Promise<AddressEntity[]> {
    const addresses = await this.prisma.address.findMany({
      where: {
        userId,
        lastUsedAt: {
          not: null,
        },
      },
      orderBy: { lastUsedAt: 'desc' },
      take: limit,
    });
    return addresses.map(address => this.toDomainEntity(address));
  }

  async getTopCities(limit: number): Promise<Array<{ city: string; count: number }>> {
    const cities = await this.prisma.address.groupBy({
      by: ['city'],
      _count: { city: true },
      orderBy: { _count: { city: 'desc' } },
      take: limit,
    });

    return cities.map(item => ({
      city: item.city,
      count: item._count.city,
    }));
  }

  async findByContactInfo(contactName?: string, contactPhone?: string): Promise<AddressEntity[]> {
    const whereConditions: any = {};
    
    if (contactName) {
      whereConditions.contactName = {
        contains: contactName,
        mode: 'insensitive',
      };
    }
    
    if (contactPhone) {
      whereConditions.contactPhone = contactPhone;
    }

    const addresses = await this.prisma.address.findMany({
      where: whereConditions,
    });
    return addresses.map(address => this.toDomainEntity(address));
  }

  async findIncomplete(): Promise<AddressEntity[]> {
    const addresses = await this.prisma.address.findMany({
      where: {
        OR: [
          { addressLine1: null },
          { city: null },
          { state: null },
          { postalCode: null },
          { country: null },
        ],
      },
    });
    return addresses.map(address => this.toDomainEntity(address));
  }

  async findDuplicates(): Promise<AddressEntity[][]> {
    // This is a complex query that would group addresses by similar fields
    // For now, return empty array as placeholder
    return [];
  }

  async cleanupUnused(daysSinceLastUsed: number): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysSinceLastUsed);

    const result = await this.prisma.address.deleteMany({
      where: {
        AND: [
          {
            OR: [
              { lastUsedAt: null },
              { lastUsedAt: { lt: cutoffDate } },
            ],
          },
          { usageCount: 0 },
          { isDefault: false },
        ],
      },
    });

    return result.count;
  }

  async exists(id: string): Promise<boolean> {
    const address = await this.prisma.address.findUnique({
      where: { id },
      select: { id: true },
    });
    return !!address;
  }

  private toCreateData(address: AddressEntity): Prisma.AddressCreateInput {
    return {
      id: address.id,
      user: { connect: { id: address.userId } },
      type: address.type,
      label: address.label,
      addressLine1: address.addressLine1,
      addressLine2: address.addressLine2,
      landmark: address.landmark,
      city: address.city,
      state: address.state,
      postalCode: address.postalCode,
      country: address.country,
      latitude: address.latitude,
      longitude: address.longitude,
      contactName: address.contactName,
      contactPhone: address.contactPhone,
      deliveryInstructions: address.deliveryInstructions,
      accessCode: address.accessCode,
      floorNumber: address.floorNumber,
      isDefault: address.isDefault,
      isActive: address.isActive,
      usageCount: address.usageCount,
      lastUsedAt: address.lastUsedAt,
    };
  }

  private toUpdateData(address: AddressEntity): Prisma.AddressUpdateInput {
    return {
      type: address.type,
      label: address.label,
      addressLine1: address.addressLine1,
      addressLine2: address.addressLine2,
      landmark: address.landmark,
      city: address.city,
      state: address.state,
      postalCode: address.postalCode,
      country: address.country,
      latitude: address.latitude,
      longitude: address.longitude,
      contactName: address.contactName,
      contactPhone: address.contactPhone,
      deliveryInstructions: address.deliveryInstructions,
      accessCode: address.accessCode,
      floorNumber: address.floorNumber,
      isDefault: address.isDefault,
      isActive: address.isActive,
      usageCount: address.usageCount,
      lastUsedAt: address.lastUsedAt,
      updatedAt: new Date(),
    };
  }

  private toPartialUpdateData(updateData: Partial<AddressEntity>): Prisma.AddressUpdateInput {
    const data: Prisma.AddressUpdateInput = {};
    
    Object.keys(updateData).forEach(key => {
      const value = updateData[key as keyof AddressEntity];
      if (value !== undefined && key !== 'id' && key !== 'userId' && key !== 'createdAt') {
        data[key] = value;
      }
    });
    
    data.updatedAt = new Date();
    return data;
  }

  private toDomainEntity(prismaAddress: any): AddressEntity {
    return AddressEntity.fromPersistence({
      id: prismaAddress.id,
      userId: prismaAddress.userId,
      type: prismaAddress.type,
      label: prismaAddress.label,
      addressLine1: prismaAddress.addressLine1,
      addressLine2: prismaAddress.addressLine2,
      landmark: prismaAddress.landmark,
      city: prismaAddress.city,
      state: prismaAddress.state,
      postalCode: prismaAddress.postalCode,
      country: prismaAddress.country,
      latitude: prismaAddress.latitude,
      longitude: prismaAddress.longitude,
      contactName: prismaAddress.contactName,
      contactPhone: prismaAddress.contactPhone,
      deliveryInstructions: prismaAddress.deliveryInstructions,
      accessCode: prismaAddress.accessCode,
      floorNumber: prismaAddress.floorNumber,
      isDefault: prismaAddress.isDefault,
      isActive: prismaAddress.isActive,
      usageCount: prismaAddress.usageCount,
      lastUsedAt: prismaAddress.lastUsedAt,
      createdAt: prismaAddress.createdAt,
      updatedAt: prismaAddress.updatedAt,
    });
  }
}