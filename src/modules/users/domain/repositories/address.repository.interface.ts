import { AddressEntity } from '../entities/address.entity';
import { AddressType } from '@prisma/client';

export interface AddressRepositoryInterface {
  // Basic CRUD operations
  findById(id: string): Promise<AddressEntity | null>;
  findByUserId(userId: string): Promise<AddressEntity[]>;
  save(address: AddressEntity): Promise<AddressEntity>;
  update(id: string, address: Partial<AddressEntity>): Promise<AddressEntity>;
  delete(id: string): Promise<void>;
  exists(id: string): Promise<boolean>;

  // Query operations
  findMany(options?: {
    skip?: number;
    take?: number;
    where?: {
      userId?: string;
      type?: AddressType;
      isDefault?: boolean;
      isActive?: boolean;
      city?: string;
      state?: string;
      country?: string;
      postalCode?: string;
      createdAt?: {
        gte?: Date;
        lte?: Date;
      };
    };
    orderBy?: {
      field: 'createdAt' | 'updatedAt' | 'label' | 'city';
      direction: 'asc' | 'desc';
    };
  }): Promise<AddressEntity[]>;

  count(where?: {
    userId?: string;
    type?: AddressType;
    isDefault?: boolean;
    isActive?: boolean;
    city?: string;
    state?: string;
    country?: string;
  }): Promise<number>;

  // User-specific queries
  findUserAddresses(userId: string, options?: {
    type?: AddressType;
    isActive?: boolean;
    includeInactive?: boolean;
  }): Promise<AddressEntity[]>;

  findDefaultAddress(userId: string, type?: AddressType): Promise<AddressEntity | null>;
  
  findActiveAddresses(userId: string, type?: AddressType): Promise<AddressEntity[]>;
  
  findInactiveAddresses(userId: string): Promise<AddressEntity[]>;

  // Type-specific queries
  findByType(type: AddressType, options?: {
    userId?: string;
    isActive?: boolean;
    skip?: number;
    take?: number;
  }): Promise<AddressEntity[]>;

  findHomeAddresses(userId?: string): Promise<AddressEntity[]>;
  findWorkAddresses(userId?: string): Promise<AddressEntity[]>;
  findOtherAddresses(userId?: string): Promise<AddressEntity[]>;

  // Geographic queries
  findByLocation(options: {
    latitude: number;
    longitude: number;
    radius: number; // in kilometers
    type?: AddressType;
    userId?: string;
  }): Promise<AddressEntity[]>;

  findByCity(city: string, options?: {
    state?: string;
    country?: string;
    type?: AddressType;
    isActive?: boolean;
  }): Promise<AddressEntity[]>;

  findByState(state: string, options?: {
    country?: string;
    type?: AddressType;
    isActive?: boolean;
  }): Promise<AddressEntity[]>;

  findByCountry(country: string, options?: {
    type?: AddressType;
    isActive?: boolean;
  }): Promise<AddressEntity[]>;

  findByPostalCode(postalCode: string, options?: {
    type?: AddressType;
    isActive?: boolean;
  }): Promise<AddressEntity[]>;

  // Search operations
  search(query: string, options?: {
    userId?: string;
    type?: AddressType;
    fields?: ('address' | 'city' | 'state' | 'landmark' | 'label')[];
    isActive?: boolean;
    skip?: number;
    take?: number;
  }): Promise<AddressEntity[]>;

  searchNearby(options: {
    latitude: number;
    longitude: number;
    radius: number;
    query?: string;
    type?: AddressType;
    limit?: number;
  }): Promise<AddressEntity[]>;

  // Validation and uniqueness
  findDuplicateAddresses(userId: string, address: {
    address: string;
    city: string;
    state: string;
    postalCode: string;
  }): Promise<AddressEntity[]>;

  findSimilarAddresses(address: {
    latitude?: number;
    longitude?: number;
    address?: string;
    city?: string;
    postalCode?: string;
  }, options?: {
    userId?: string;
    threshold?: number; // similarity threshold
    excludeId?: string;
  }): Promise<AddressEntity[]>;

  // Default address management
  setDefaultAddress(userId: string, addressId: string, type?: AddressType): Promise<void>;
  unsetDefaultAddress(userId: string, type?: AddressType): Promise<void>;
  findUsersWithoutDefaultAddress(type?: AddressType): Promise<string[]>; // Returns user IDs

  // Bulk operations
  saveMany(addresses: AddressEntity[]): Promise<AddressEntity[]>;

  bulkUpdate(ids: string[], updateData: Partial<AddressEntity>): Promise<number>;

  updateMany(where: {
    userId?: string;
    ids?: string[];
    type?: AddressType;
    isActive?: boolean;
  }, data: {
    isActive?: boolean;
    isDefault?: boolean;
    updatedAt?: Date;
  }): Promise<number>; // Returns count of updated records

  deleteMany(where: {
    userId?: string;
    ids?: string[];
    type?: AddressType;
    isActive?: boolean;
    createdBefore?: Date;
  }): Promise<number>; // Returns count of deleted records

  deactivateUserAddresses(userId: string, excludeIds?: string[]): Promise<number>;
  activateUserAddresses(userId: string, addressIds: string[]): Promise<number>;

  // Statistics and analytics
  getUsageMetrics(): Promise<{ averageUsageCount: number; totalUsageCount: number }>;

  getAddressStats(options?: {
    userId?: string;
    type?: AddressType;
    dateRange?: {
      start: Date;
      end: Date;
    };
  }): Promise<{
    total: number;
    active: number;
    inactive: number;
    byType: Record<AddressType, number>;
    byCity: Record<string, number>;
    byState: Record<string, number>;
    byCountry: Record<string, number>;
    withCoordinates: number;
    withoutCoordinates: number;
  }>;

  getUserAddressStats(userId: string): Promise<{
    total: number;
    active: number;
    byType: Record<AddressType, number>;
    hasDefault: boolean;
    defaultTypes: AddressType[];
    mostRecentlyUsed?: AddressEntity;
    oldestAddress?: AddressEntity;
  }>;

  // Geographic analytics
  getLocationStats(options?: {
    type?: AddressType;
    groupBy: 'city' | 'state' | 'country' | 'postalCode';
  }): Promise<{
    location: string;
    count: number;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  }[]>;

  findAddressesInRadius(centerPoint: {
    latitude: number;
    longitude: number;
  }, radiusKm: number, options?: {
    type?: AddressType;
    userId?: string;
    isActive?: boolean;
    limit?: number;
  }): Promise<{
    address: AddressEntity;
    distance: number;
  }[]>;

  // Delivery and service area queries
  findAddressesInServiceArea(serviceArea: {
    boundaries: {
      latitude: number;
      longitude: number;
    }[];
  } | {
    center: {
      latitude: number;
      longitude: number;
    };
    radius: number;
  }, options?: {
    type?: AddressType;
    isActive?: boolean;
  }): Promise<AddressEntity[]>;

  findDeliveryAddresses(options?: {
    userId?: string;
    isActive?: boolean;
    hasCoordinates?: boolean;
  }): Promise<AddressEntity[]>;

  // Validation helpers
  validateAddressUniqueness(userId: string, address: {
    address: string;
    city: string;
    state: string;
    postalCode: string;
  }, excludeId?: string): Promise<boolean>;

  validateCoordinates(latitude: number, longitude: number): Promise<boolean>;
  
  findAddressesWithInvalidCoordinates(): Promise<AddressEntity[]>;
  findAddressesWithoutCoordinates(): Promise<AddressEntity[]>;

  // Maintenance and cleanup
  findOrphanedAddresses(): Promise<AddressEntity[]>; // Addresses without valid users
  findIncompleteAddresses(): Promise<AddressEntity[]>; // Missing required fields
  findDuplicateAddressesGlobal(): Promise<{
    signature: string;
    addresses: AddressEntity[];
  }[]>;

  // Contact information queries
  findByContactInfo(options: {
    contactName?: string;
    contactPhone?: string;
    userId?: string;
  }): Promise<AddressEntity[]>;

  findAddressesWithoutContact(userId?: string): Promise<AddressEntity[]>;
  findAddressesWithContact(userId?: string): Promise<AddressEntity[]>;

  // Recent activity
  findRecentlyCreated(days: number, userId?: string): Promise<AddressEntity[]>;
  findRecentlyUpdated(days: number, userId?: string): Promise<AddressEntity[]>;
  findRecentlyUsed(days: number, userId?: string): Promise<AddressEntity[]>;

  // Address completion and quality
  findIncompleteAddressesByUser(userId: string): Promise<AddressEntity[]>;
  findAddressesNeedingGeocoding(): Promise<AddressEntity[]>;
  findAddressesWithPoorQuality(): Promise<AddressEntity[]>;

  // User behavior analytics
  findMostUsedAddresses(userId: string, limit?: number): Promise<AddressEntity[]>;
  findLeastUsedAddresses(userId: string, limit?: number): Promise<AddressEntity[]>;
  findAbandonedAddresses(daysUnused: number, userId?: string): Promise<AddressEntity[]>;

  // Distance calculations
  calculateDistance(addressId1: string, addressId2: string): Promise<number | null>;
  findNearestAddresses(addressId: string, options?: {
    type?: AddressType;
    userId?: string;
    limit?: number;
    maxDistance?: number;
  }): Promise<{
    address: AddressEntity;
    distance: number;
  }[]>;

  // Transaction support
  withTransaction<T>(callback: (repository: AddressRepositoryInterface) => Promise<T>): Promise<T>;
}