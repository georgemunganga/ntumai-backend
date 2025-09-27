import {
  IsString,
  IsOptional,
  IsEnum,
  IsBoolean,
  IsNumber,
  IsArray,
  ValidateNested,
  Length,
  Min,
  Max,
  IsLatitude,
  IsLongitude,
  Matches,
  IsPhoneNumber,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AddressType } from '@prisma/client';

export class CreateAddressDto {
  @ApiProperty({ description: 'Address type', enum: AddressType })
  @IsEnum(AddressType)
  type: AddressType;

  @ApiProperty({ description: 'Address label/name' })
  @IsString()
  @Length(1, 100)
  label: string;

  @ApiProperty({ description: 'Primary address line' })
  @IsString()
  @Length(1, 200)
  addressLine1: string;

  @ApiPropertyOptional({ description: 'Secondary address line' })
  @IsOptional()
  @IsString()
  @Length(0, 200)
  addressLine2?: string;

  @ApiPropertyOptional({ description: 'Nearby landmark' })
  @IsOptional()
  @IsString()
  @Length(0, 100)
  landmark?: string;

  @ApiProperty({ description: 'City name' })
  @IsString()
  @Length(1, 100)
  city: string;

  @ApiProperty({ description: 'State/Province name' })
  @IsString()
  @Length(1, 100)
  state: string;

  @ApiProperty({ description: 'Postal/ZIP code' })
  @IsString()
  @Matches(/^[A-Za-z0-9\s-]{3,10}$/, {
    message: 'Postal code must be 3-10 characters and contain only letters, numbers, spaces, and hyphens',
  })
  postalCode: string;

  @ApiProperty({ description: 'Country name' })
  @IsString()
  @Length(1, 100)
  country: string;

  @ApiPropertyOptional({ description: 'Latitude coordinate' })
  @IsOptional()
  @IsLatitude()
  latitude?: number;

  @ApiPropertyOptional({ description: 'Longitude coordinate' })
  @IsOptional()
  @IsLongitude()
  longitude?: number;

  @ApiPropertyOptional({ description: 'Contact person name' })
  @IsOptional()
  @IsString()
  @Length(0, 100)
  contactName?: string;

  @ApiPropertyOptional({ description: 'Contact phone number' })
  @IsOptional()
  @IsPhoneNumber()
  contactPhone?: string;

  @ApiPropertyOptional({ description: 'Delivery instructions' })
  @IsOptional()
  @IsString()
  @Length(0, 500)
  deliveryInstructions?: string;

  @ApiPropertyOptional({ description: 'Access code for building/gate' })
  @IsOptional()
  @IsString()
  @Length(0, 50)
  accessCode?: string;

  @ApiPropertyOptional({ description: 'Floor number' })
  @IsOptional()
  @IsString()
  @Length(0, 20)
  floorNumber?: string;

  @ApiPropertyOptional({ description: 'Set as default address' })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean = false;

  @ApiPropertyOptional({ description: 'Address is active' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean = true;
}

export class UpdateAddressDto {
  @ApiPropertyOptional({ description: 'Address type', enum: AddressType })
  @IsOptional()
  @IsEnum(AddressType)
  type?: AddressType;

  @ApiPropertyOptional({ description: 'Address label/name' })
  @IsOptional()
  @IsString()
  @Length(1, 100)
  label?: string;

  @ApiPropertyOptional({ description: 'Primary address line' })
  @IsOptional()
  @IsString()
  @Length(1, 200)
  addressLine1?: string;

  @ApiPropertyOptional({ description: 'Secondary address line' })
  @IsOptional()
  @IsString()
  @Length(0, 200)
  addressLine2?: string;

  @ApiPropertyOptional({ description: 'Nearby landmark' })
  @IsOptional()
  @IsString()
  @Length(0, 100)
  landmark?: string;

  @ApiPropertyOptional({ description: 'City name' })
  @IsOptional()
  @IsString()
  @Length(1, 100)
  city?: string;

  @ApiPropertyOptional({ description: 'State/Province name' })
  @IsOptional()
  @IsString()
  @Length(1, 100)
  state?: string;

  @ApiPropertyOptional({ description: 'Postal/ZIP code' })
  @IsOptional()
  @IsString()
  @Matches(/^[A-Za-z0-9\s-]{3,10}$/, {
    message: 'Postal code must be 3-10 characters and contain only letters, numbers, spaces, and hyphens',
  })
  postalCode?: string;

  @ApiPropertyOptional({ description: 'Country name' })
  @IsOptional()
  @IsString()
  @Length(1, 100)
  country?: string;

  @ApiPropertyOptional({ description: 'Latitude coordinate' })
  @IsOptional()
  @IsLatitude()
  latitude?: number;

  @ApiPropertyOptional({ description: 'Longitude coordinate' })
  @IsOptional()
  @IsLongitude()
  longitude?: number;

  @ApiPropertyOptional({ description: 'Contact person name' })
  @IsOptional()
  @IsString()
  @Length(0, 100)
  contactName?: string;

  @ApiPropertyOptional({ description: 'Contact phone number' })
  @IsOptional()
  @IsPhoneNumber()
  contactPhone?: string;

  @ApiPropertyOptional({ description: 'Delivery instructions' })
  @IsOptional()
  @IsString()
  @Length(0, 500)
  deliveryInstructions?: string;

  @ApiPropertyOptional({ description: 'Access code for building/gate' })
  @IsOptional()
  @IsString()
  @Length(0, 50)
  accessCode?: string;

  @ApiPropertyOptional({ description: 'Floor number' })
  @IsOptional()
  @IsString()
  @Length(0, 20)
  floorNumber?: string;

  @ApiPropertyOptional({ description: 'Set as default address' })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;

  @ApiPropertyOptional({ description: 'Address is active' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class AddressResponseDto {
  @ApiProperty({ description: 'Address ID' })
  id: string;

  @ApiProperty({ description: 'User ID' })
  userId: string;

  @ApiProperty({ description: 'Address type', enum: AddressType })
  type: AddressType;

  @ApiProperty({ description: 'Address label/name' })
  label: string;

  @ApiProperty({ description: 'Primary address line' })
  addressLine1: string;

  @ApiPropertyOptional({ description: 'Secondary address line' })
  addressLine2?: string;

  @ApiPropertyOptional({ description: 'Nearby landmark' })
  landmark?: string;

  @ApiProperty({ description: 'City name' })
  city: string;

  @ApiProperty({ description: 'State/Province name' })
  state: string;

  @ApiProperty({ description: 'Postal/ZIP code' })
  postalCode: string;

  @ApiProperty({ description: 'Country name' })
  country: string;

  @ApiPropertyOptional({ description: 'Latitude coordinate' })
  latitude?: number;

  @ApiPropertyOptional({ description: 'Longitude coordinate' })
  longitude?: number;

  @ApiPropertyOptional({ description: 'Contact person name' })
  contactName?: string;

  @ApiPropertyOptional({ description: 'Contact phone number' })
  contactPhone?: string;

  @ApiPropertyOptional({ description: 'Delivery instructions' })
  deliveryInstructions?: string;

  @ApiPropertyOptional({ description: 'Access code for building/gate' })
  accessCode?: string;

  @ApiPropertyOptional({ description: 'Floor number' })
  floorNumber?: string;

  @ApiProperty({ description: 'Is default address' })
  isDefault: boolean;

  @ApiProperty({ description: 'Is active address' })
  isActive: boolean;

  @ApiProperty({ description: 'Usage count' })
  usageCount: number;

  @ApiPropertyOptional({ description: 'Last used date' })
  lastUsedAt?: Date;

  @ApiProperty({ description: 'Creation date' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update date' })
  updatedAt: Date;

  @ApiProperty({ description: 'Full formatted address' })
  fullAddress: string;
}

export class AddressSummaryDto {
  @ApiProperty({ description: 'Address ID' })
  id: string;

  @ApiProperty({ description: 'Address type', enum: AddressType })
  type: AddressType;

  @ApiProperty({ description: 'Address label/name' })
  label: string;

  @ApiProperty({ description: 'Full formatted address' })
  fullAddress: string;

  @ApiProperty({ description: 'Is default address' })
  isDefault: boolean;

  @ApiProperty({ description: 'Is active address' })
  isActive: boolean;

  @ApiProperty({ description: 'Usage count' })
  usageCount: number;
}

export class SearchAddressesDto {
  @ApiPropertyOptional({ description: 'Search query' })
  @IsOptional()
  @IsString()
  @Length(1, 100)
  query?: string;

  @ApiPropertyOptional({ description: 'Filter by address type', enum: AddressType })
  @IsOptional()
  @IsEnum(AddressType)
  type?: AddressType;

  @ApiPropertyOptional({ description: 'Filter by city' })
  @IsOptional()
  @IsString()
  @Length(1, 100)
  city?: string;

  @ApiPropertyOptional({ description: 'Filter by state' })
  @IsOptional()
  @IsString()
  @Length(1, 100)
  state?: string;

  @ApiPropertyOptional({ description: 'Filter by country' })
  @IsOptional()
  @IsString()
  @Length(1, 100)
  country?: string;

  @ApiPropertyOptional({ description: 'Filter by postal code' })
  @IsOptional()
  @IsString()
  postalCode?: string;

  @ApiPropertyOptional({ description: 'Filter by default status' })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true')
  isDefault?: boolean;

  @ApiPropertyOptional({ description: 'Filter by active status' })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true')
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Page number', minimum: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Items per page', minimum: 1, maximum: 100, default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @ApiPropertyOptional({ description: 'Sort field' })
  @IsOptional()
  @IsEnum(['createdAt', 'updatedAt', 'lastUsedAt', 'usageCount', 'label'])
  sortBy?: 'createdAt' | 'updatedAt' | 'lastUsedAt' | 'usageCount' | 'label' = 'createdAt';

  @ApiPropertyOptional({ description: 'Sort direction' })
  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'desc';
}

export class NearbyAddressesDto {
  @ApiProperty({ description: 'Latitude coordinate' })
  @IsLatitude()
  latitude: number;

  @ApiProperty({ description: 'Longitude coordinate' })
  @IsLongitude()
  longitude: number;

  @ApiPropertyOptional({ description: 'Search radius in kilometers', minimum: 0.1, maximum: 100, default: 5 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0.1)
  @Max(100)
  radiusKm?: number = 5;

  @ApiPropertyOptional({ description: 'Filter by address type', enum: AddressType })
  @IsOptional()
  @IsEnum(AddressType)
  type?: AddressType;

  @ApiPropertyOptional({ description: 'Maximum results', minimum: 1, maximum: 100, default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}

export class BulkAddressOperationDto {
  @ApiProperty({ description: 'Address IDs to operate on' })
  @IsArray()
  @IsString({ each: true })
  addressIds: string[];

  @ApiPropertyOptional({ description: 'Set active status' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Set default status (only one can be default per type)' })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}

export class SetDefaultAddressDto {
  @ApiProperty({ description: 'Address ID to set as default' })
  @IsString()
  addressId: string;

  @ApiProperty({ description: 'Address type', enum: AddressType })
  @IsEnum(AddressType)
  type: AddressType;
}

export class ValidateAddressDto {
  @ApiProperty({ description: 'Primary address line' })
  @IsString()
  @Length(1, 200)
  addressLine1: string;

  @ApiPropertyOptional({ description: 'Secondary address line' })
  @IsOptional()
  @IsString()
  @Length(0, 200)
  addressLine2?: string;

  @ApiProperty({ description: 'City name' })
  @IsString()
  @Length(1, 100)
  city: string;

  @ApiProperty({ description: 'State/Province name' })
  @IsString()
  @Length(1, 100)
  state: string;

  @ApiProperty({ description: 'Postal/ZIP code' })
  @IsString()
  @Matches(/^[A-Za-z0-9\s-]{3,10}$/, {
    message: 'Postal code must be 3-10 characters and contain only letters, numbers, spaces, and hyphens',
  })
  postalCode: string;

  @ApiProperty({ description: 'Country name' })
  @IsString()
  @Length(1, 100)
  country: string;
}

export class AddressValidationResponseDto {
  @ApiProperty({ description: 'Is address valid' })
  isValid: boolean;

  @ApiProperty({ description: 'Validation messages' })
  messages: string[];

  @ApiPropertyOptional({ description: 'Suggested corrections' })
  suggestions?: {
    addressLine1?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };

  @ApiPropertyOptional({ description: 'Geocoding coordinates' })
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

export class AddressListResponseDto {
  @ApiProperty({ description: 'List of addresses' })
  addresses: AddressResponseDto[];

  @ApiProperty({ description: 'Total count of addresses' })
  total: number;

  @ApiProperty({ description: 'Current page number' })
  page: number;

  @ApiProperty({ description: 'Items per page' })
  limit: number;

  @ApiProperty({ description: 'Total number of pages' })
  totalPages: number;

  @ApiProperty({ description: 'Has next page' })
  hasNext: boolean;

  @ApiProperty({ description: 'Has previous page' })
  hasPrev: boolean;
}

export class AddressStatsDto {
  @ApiProperty({ description: 'Total addresses count' })
  totalAddresses: number;

  @ApiProperty({ description: 'Addresses by type' })
  addressesByType: Record<AddressType, number>;

  @ApiProperty({ description: 'Addresses by country' })
  addressesByCountry: Array<{ country: string; count: number }>;

  @ApiProperty({ description: 'Most used cities' })
  mostUsedCities: Array<{ city: string; count: number }>;

  @ApiProperty({ description: 'Active addresses count' })
  activeAddresses: number;

  @ApiProperty({ description: 'Default addresses count' })
  defaultAddresses: number;

  @ApiProperty({ description: 'Average usage count' })
  averageUsageCount: number;
}