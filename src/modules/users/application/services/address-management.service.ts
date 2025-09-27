import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { AddressEntity } from '../../domain/entities/address.entity';
import { AddressRepositoryInterface } from '../../domain/repositories/address.repository.interface';
import { UserRepositoryInterface } from '../../domain/repositories/user.repository.interface';
import { AddressType } from '@prisma/client';

export interface CreateAddressRequest {
  type: AddressType;
  label?: string;
  addressLine1: string;
  addressLine2?: string;
  landmark?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  latitude?: number;
  longitude?: number;
  contactName?: string;
  contactPhone?: string;
  deliveryInstructions?: string;
  accessCode?: string;
  floorNumber?: string;
  isDefault?: boolean;
}

export interface UpdateAddressRequest {
  type?: AddressType;
  label?: string;
  addressLine1?: string;
  addressLine2?: string;
  landmark?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  contactName?: string;
  contactPhone?: string;
  deliveryInstructions?: string;
  accessCode?: string;
  floorNumber?: string;
  isDefault?: boolean;
  isActive?: boolean;
}

export interface AddressValidationResult {
  isValid: boolean;
  errors: string[];
  suggestions?: {
    formattedAddress?: string;
    coordinates?: { latitude: number; longitude: number };
  };
}

export interface AddressSearchParams {
  query?: string;
  type?: AddressType;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  isDefault?: boolean;
  isActive?: boolean;
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'updatedAt' | 'lastUsedAt' | 'usageCount' | 'label';
  sortOrder?: 'asc' | 'desc';
}

export interface NearbyAddressesQuery {
  latitude: number;
  longitude: number;
  radiusKm: number;
  addressType?: AddressType;
  limit?: number;
}

export interface AddressStatistics {
  totalAddresses: number;
  addressesByType: Record<AddressType, number>;
  addressesByCountry: Array<{ country: string; count: number }>;
  mostUsedCities: Array<{ city: string; count: number }>;
  activeAddresses: number;
  defaultAddresses: number;
  averageUsageCount: number;
}

@Injectable()
export class AddressManagementService {
  constructor(
    private readonly addressRepository: AddressRepositoryInterface,
    private readonly userRepository: UserRepositoryInterface,
  ) {}

  async createAddress(userId: string, addressData: CreateAddressRequest): Promise<AddressEntity> {
    // Verify user exists
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if setting as default and user already has a default address of this type
    if (addressData.isDefault) {
      const existingDefault = await this.addressRepository.findDefaultAddress(userId, addressData.type);
      if (existingDefault) {
        // Unset the existing default
        await this.addressRepository.update(existingDefault.id, { isDefault: false });
      }
    }

    // Create new address entity
    const address = AddressEntity.create({
      userId,
      type: addressData.type,
      label: addressData.label,
      addressLine1: addressData.addressLine1,
      addressLine2: addressData.addressLine2,
      landmark: addressData.landmark,
      city: addressData.city,
      state: addressData.state,
      postalCode: addressData.postalCode,
      country: addressData.country,
      latitude: addressData.latitude,
      longitude: addressData.longitude,
      contactName: addressData.contactName,
      contactPhone: addressData.contactPhone,
      deliveryInstructions: addressData.deliveryInstructions,
      accessCode: addressData.accessCode,
      floorNumber: addressData.floorNumber,
      isDefault: addressData.isDefault || false,
      isActive: true, // Adding the required isActive property
    });

    return await this.addressRepository.create(address);
  }

  async updateAddress(addressId: string, userId: string, updateData: UpdateAddressRequest): Promise<AddressEntity> {
    const address = await this.addressRepository.findById(addressId);
    if (!address) {
      throw new NotFoundException('Address not found');
    }

    if (address.userId !== userId) {
      throw new BadRequestException('Address does not belong to user');
    }

    // Handle default address logic
    if (updateData.isDefault && !address.isDefault) {
      const existingDefault = await this.addressRepository.findDefaultAddress(userId, address.type);
      if (existingDefault && existingDefault.id !== addressId) {
        await this.addressRepository.update(existingDefault.id, { isDefault: false });
      }
    }

    const updatedAddress = address.update(updateData);
    return await this.addressRepository.update(addressId, updatedAddress);
  }

  async deleteAddress(addressId: string, userId: string): Promise<void> {
    const address = await this.addressRepository.findById(addressId);
    if (!address) {
      throw new NotFoundException('Address not found');
    }

    if (address.userId !== userId) {
      throw new BadRequestException('Address does not belong to user');
    }

    // Check if address is being used in any active orders
    const isInUse = await this.addressRepository.isAddressInUse(addressId);
    if (isInUse) {
      throw new BadRequestException('Cannot delete address that is being used in active orders');
    }

    await this.addressRepository.delete(addressId);
  }

  async getUserAddresses(userId: string, type?: AddressType): Promise<AddressEntity[]> {
    if (type) {
      return await this.addressRepository.findByUserAndType(userId, type);
    }
    return await this.addressRepository.findByUserId(userId);
  }

  async getAddressById(addressId: string, userId: string): Promise<AddressEntity> {
    const address = await this.addressRepository.findById(addressId);
    if (!address) {
      throw new NotFoundException('Address not found');
    }

    if (address.userId !== userId) {
      throw new BadRequestException('Address does not belong to user');
    }

    return address;
  }

  async setDefaultAddress(addressId: string, userId: string): Promise<AddressEntity> {
    const address = await this.getAddressById(addressId, userId);
    
    // Unset existing default for this address type
    const existingDefault = await this.addressRepository.findDefaultByUserAndType(userId, address.type);
    if (existingDefault && existingDefault.id !== addressId) {
      await this.addressRepository.update(existingDefault.id, { isDefault: false });
    }

    const updatedAddress = address.setAsDefault();
    return await this.addressRepository.update(addressId, updatedAddress);
  }

  async getDefaultAddress(userId: string, type: AddressType): Promise<AddressEntity | null> {
    return await this.addressRepository.findDefaultByUserAndType(userId, type);
  }

  async validateAddress(addressData: Partial<CreateAddressRequest>): Promise<AddressValidationResult> {
    const errors: string[] = [];
    
    // Basic validation
    if (!addressData.addressLine1?.trim()) {
      errors.push('Address line 1 is required');
    }
    
    if (!addressData.city?.trim()) {
      errors.push('City is required');
    }
    
    if (!addressData.state?.trim()) {
      errors.push('State is required');
    }
    
    if (!addressData.postalCode?.trim()) {
      errors.push('Postal code is required');
    }
    
    if (!addressData.country?.trim()) {
      errors.push('Country is required');
    }

    // Postal code format validation (basic)
    if (addressData.postalCode && !/^\d{5,6}$/.test(addressData.postalCode)) {
      errors.push('Invalid postal code format');
    }

    // Phone number validation if provided
    if (addressData.contactPhone && !/^\+?[1-9]\d{1,14}$/.test(addressData.contactPhone)) {
      errors.push('Invalid contact phone format');
    }

    const isValid = errors.length === 0;
    
    // TODO: Integrate with geocoding service for address validation and suggestions
    const suggestions = isValid ? {
      formattedAddress: `${addressData.addressLine1}, ${addressData.city}, ${addressData.state} ${addressData.postalCode}`,
      coordinates: addressData.latitude && addressData.longitude ? {
        latitude: addressData.latitude,
        longitude: addressData.longitude
      } : undefined
    } : undefined;

    return {
      isValid,
      errors,
      suggestions
    };
  }

  async searchAddresses(userId: string, query: string): Promise<AddressEntity[]> {
    return await this.addressRepository.searchByUser(userId, query);
  }

  async getNearbyAddresses(query: NearbyAddressesQuery): Promise<AddressEntity[]> {
    return await this.addressRepository.findNearby(
      query.latitude,
      query.longitude,
      query.radiusKm,
      query.addressType,
      query.limit
    );
  }

  async getAddressesByCity(city: string, limit?: number): Promise<AddressEntity[]> {
    return await this.addressRepository.findByCity(city, limit);
  }

  async getAddressesByPostalCode(postalCode: string): Promise<AddressEntity[]> {
    return await this.addressRepository.findByPostalCode(postalCode);
  }

  async bulkUpdateAddresses(userId: string, addressIds: string[], updateData: Partial<UpdateAddressRequest>): Promise<number> {
    if (!addressIds || addressIds.length === 0) {
      return 0;
    }

    // TODO: enforce ownership by userId when repository supports scoped updates
    return await this.addressRepository.bulkUpdate(addressIds, updateData);
  }

  async searchUserAddresses(
    userId: string,
    searchParams: AddressSearchParams
  ): Promise<{ addresses: AddressEntity[]; total: number; page: number; limit: number; totalPages: number; hasNext: boolean; hasPrev: boolean }> {
    const page = searchParams.page ?? 1;
    const limit = searchParams.limit ?? 10;
    const skip = (page - 1) * limit;

    const matchesFilters = (address: AddressEntity): boolean => {
      if (searchParams.type && address.type !== searchParams.type) {
        return false;
      }
      if (typeof searchParams.isDefault === 'boolean' && address.isDefault !== searchParams.isDefault) {
        return false;
      }
      if (typeof searchParams.isActive === 'boolean' && address.isActive !== searchParams.isActive) {
        return false;
      }
      if (searchParams.city && address.city.toLowerCase() !== searchParams.city.toLowerCase()) {
        return false;
      }
      if (searchParams.state && address.state.toLowerCase() !== searchParams.state.toLowerCase()) {
        return false;
      }
      if (searchParams.country && address.country.toLowerCase() !== searchParams.country.toLowerCase()) {
        return false;
      }
      if (searchParams.postalCode && address.postalCode.toLowerCase() !== searchParams.postalCode.toLowerCase()) {
        return false;
      }
      return true;
    };

    let addresses: AddressEntity[] = [];
    let total = 0;

    if (searchParams.query) {
      const queryResults = await this.addressRepository.searchByUser(userId, searchParams.query);
      const filtered = queryResults.filter(matchesFilters);

      const sortField = searchParams.sortBy ?? 'createdAt';
      const sortDirection = searchParams.sortOrder ?? 'desc';

      filtered.sort((a, b) => {
        const sourceA = (a as any)[sortField] ?? (a as any)[sortField.charAt(0).toLowerCase() + sortField.slice(1)];
        const sourceB = (b as any)[sortField] ?? (b as any)[sortField.charAt(0).toLowerCase() + sortField.slice(1)];

        if (sourceA === undefined || sourceB === undefined) {
          return 0;
        }

        if (sourceA instanceof Date && sourceB instanceof Date) {
          return sortDirection === 'asc' ? sourceA.getTime() - sourceB.getTime() : sourceB.getTime() - sourceA.getTime();
        }

        if (typeof sourceA === 'number' && typeof sourceB === 'number') {
          return sortDirection === 'asc' ? sourceA - sourceB : sourceB - sourceA;
        }

        const valueA = String(sourceA).toLowerCase();
        const valueB = String(sourceB).toLowerCase();
        return sortDirection === 'asc' ? valueA.localeCompare(valueB) : valueB.localeCompare(valueA);
      });

      total = filtered.length;
      addresses = filtered.slice(skip, skip + limit);
    } else {
      const where: any = { userId };
      if (searchParams.type) where.type = searchParams.type;
      if (typeof searchParams.isDefault === 'boolean') where.isDefault = searchParams.isDefault;
      if (typeof searchParams.isActive === 'boolean') where.isActive = searchParams.isActive;
      if (searchParams.city) where.city = searchParams.city;
      if (searchParams.state) where.state = searchParams.state;
      if (searchParams.country) where.country = searchParams.country;
      if (searchParams.postalCode) where.postalCode = searchParams.postalCode;

      const orderBy = searchParams.sortBy ? { field: searchParams.sortBy, direction: searchParams.sortOrder ?? 'desc' } : undefined;

      [addresses, total] = await Promise.all([
        this.addressRepository.findMany({
          skip,
          take: limit,
          where,
          orderBy,
        }),
        this.addressRepository.count(where),
      ]);
    }

    const totalPages = Math.max(1, Math.ceil(total / limit));

    return {
      addresses,
      total,
      page,
      limit,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    };
  }

  async getAddressStatistics(): Promise<AddressStatistics> {
    const overview = await this.addressRepository.getStatistics();
    const activeAddresses = await this.addressRepository.count({ isActive: true });
    const defaultAddresses = await this.addressRepository.count({ isDefault: true });
    const usageMetrics = await this.addressRepository.getUsageMetrics();

    return {
      totalAddresses: overview.totalAddresses,
      addressesByType: overview.addressesByType,
      addressesByCountry: overview.addressesByCountry,
      mostUsedCities: overview.mostUsedCities,
      activeAddresses,
      defaultAddresses,
      averageUsageCount: Number((usageMetrics.averageUsageCount ?? 0).toFixed(2)),
    };
  }

  async markAddressAsUsed(addressId: string): Promise<void> {
    const address = await this.addressRepository.findById(addressId);
    if (address) {
      const updatedAddress = address.markAsUsed();
      await this.addressRepository.update(addressId, updatedAddress);
    }
  }

  async getRecentlyUsedAddresses(userId: string, limit: number = 5): Promise<AddressEntity[]> {
    return await this.addressRepository.findRecentlyUsedByUser(userId, limit);
  }

  async deactivateAddress(addressId: string, userId: string): Promise<AddressEntity> {
    const address = await this.getAddressById(addressId, userId);
    const deactivatedAddress = address.deactivate();
    return await this.addressRepository.update(addressId, deactivatedAddress);
  }

  async reactivateAddress(addressId: string, userId: string): Promise<AddressEntity> {
    const address = await this.getAddressById(addressId, userId);
    const reactivatedAddress = address.reactivate();
    return await this.addressRepository.update(addressId, reactivatedAddress);
  }

  async getAddressUsageAnalytics(userId: string): Promise<{
    totalAddresses: number;
    activeAddresses: number;
    mostUsedAddress: AddressEntity | null;
    addressTypeDistribution: Record<AddressType, number>;
  }> {
    const addresses = await this.getUserAddresses(userId);
    const activeAddresses = addresses.filter(addr => addr.isActive);
    
    const mostUsedAddress = addresses.reduce((prev, current) => 
      (prev.usageCount > current.usageCount) ? prev : current
    );

    const addressTypeDistribution = {} as Record<AddressType, number>;
    for (const type of Object.values(AddressType)) {
      addressTypeDistribution[type] = addresses.filter(addr => addr.type === type).length;
    }

    return {
      totalAddresses: addresses.length,
      activeAddresses: activeAddresses.length,
      mostUsedAddress: addresses.length > 0 ? mostUsedAddress : null,
      addressTypeDistribution
    };
  }
}