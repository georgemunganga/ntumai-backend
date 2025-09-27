import {
  IsString,
  IsEmail,
  IsPhoneNumber,
  IsOptional,
  IsDateString,
  IsEnum,
  IsBoolean,
  IsNumber,
  IsArray,
  ValidateNested,
  IsObject,
  Min,
  Max,
  Length,
  Matches,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// Enums
export enum Gender {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
  OTHER = 'OTHER',
}

export enum RiderStatus {
  PENDING = 'PENDING',
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
  BLOCKED = 'BLOCKED',
}

export enum DocumentType {
  DRIVERS_LICENSE = 'DRIVERS_LICENSE',
  VEHICLE_REGISTRATION = 'VEHICLE_REGISTRATION',
  INSURANCE = 'INSURANCE',
  IDENTITY_CARD = 'IDENTITY_CARD',
  BACKGROUND_CHECK = 'BACKGROUND_CHECK',
}

export enum DocumentStatus {
  PENDING = 'PENDING',
  VERIFIED = 'VERIFIED',
  REJECTED = 'REJECTED',
  EXPIRED = 'EXPIRED',
}

// Location DTO
export class LocationDto {
  @ApiProperty({ description: 'Latitude coordinate' })
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude: number;

  @ApiProperty({ description: 'Longitude coordinate' })
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude: number;

  @ApiPropertyOptional({ description: 'Address string' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ description: 'City name' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ description: 'State or province' })
  @IsOptional()
  @IsString()
  state?: string;

  @ApiPropertyOptional({ description: 'Country name' })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiPropertyOptional({ description: 'Postal code' })
  @IsOptional()
  @IsString()
  postalCode?: string;
}

// Document DTO
export class DocumentDto {
  @ApiProperty({ description: 'Document type', enum: DocumentType })
  @IsEnum(DocumentType)
  type: DocumentType;

  @ApiProperty({ description: 'Document number or ID' })
  @IsString()
  @Length(1, 100)
  documentNumber: string;

  @ApiProperty({ description: 'Document URL' })
  @IsString()
  documentUrl: string;

  @ApiProperty({ description: 'Document expiry date' })
  @IsDateString()
  expiryDate: string;

  @ApiProperty({ description: 'Document status', enum: DocumentStatus })
  @IsEnum(DocumentStatus)
  status: DocumentStatus;

  @ApiPropertyOptional({ description: 'Verification notes' })
  @IsOptional()
  @IsString()
  verificationNotes?: string;
}

// Emergency Contact DTO
export class EmergencyContactDto {
  @ApiProperty({ description: 'Contact name' })
  @IsString()
  @Length(1, 100)
  name: string;

  @ApiProperty({ description: 'Contact phone number' })
  @IsPhoneNumber()
  phoneNumber: string;

  @ApiProperty({ description: 'Relationship to rider' })
  @IsString()
  @Length(1, 50)
  relationship: string;

  @ApiPropertyOptional({ description: 'Contact email' })
  @IsOptional()
  @IsEmail()
  email?: string;
}

// Bank Account DTO
export class BankAccountDto {
  @ApiProperty({ description: 'Bank name' })
  @IsString()
  @Length(1, 100)
  bankName: string;

  @ApiProperty({ description: 'Account holder name' })
  @IsString()
  @Length(1, 100)
  accountHolderName: string;

  @ApiProperty({ description: 'Account number' })
  @IsString()
  @Length(1, 50)
  accountNumber: string;

  @ApiProperty({ description: 'Routing number or sort code' })
  @IsString()
  @Length(1, 20)
  routingNumber: string;

  @ApiPropertyOptional({ description: 'SWIFT/BIC code for international transfers' })
  @IsOptional()
  @IsString()
  swiftCode?: string;

  @ApiPropertyOptional({ description: 'Account type' })
  @IsOptional()
  @IsString()
  accountType?: string;
}

// Create Rider Profile DTO
export class CreateRiderProfileDto {
  @ApiProperty({ description: 'User ID from authentication system' })
  @IsString()
  userId: string;

  @ApiProperty({ description: 'First name' })
  @IsString()
  @Length(1, 50)
  firstName: string;

  @ApiProperty({ description: 'Last name' })
  @IsString()
  @Length(1, 50)
  lastName: string;

  @ApiProperty({ description: 'Email address' })
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'Phone number' })
  @IsPhoneNumber()
  phoneNumber: string;

  @ApiProperty({ description: 'Date of birth' })
  @IsDateString()
  dateOfBirth: string;

  @ApiProperty({ description: 'Gender', enum: Gender })
  @IsEnum(Gender)
  gender: Gender;

  @ApiProperty({ description: 'Profile picture URL' })
  @IsString()
  profilePictureUrl: string;

  @ApiProperty({ description: 'Current address', type: LocationDto })
  @ValidateNested()
  @Type(() => LocationDto)
  address: LocationDto;

  @ApiProperty({ description: 'National ID or SSN' })
  @IsString()
  @Length(1, 50)
  nationalId: string;

  @ApiProperty({ description: 'Driver license number' })
  @IsString()
  @Length(1, 50)
  driverLicenseNumber: string;

  @ApiProperty({ description: 'Driver license expiry date' })
  @IsDateString()
  driverLicenseExpiry: string;

  @ApiProperty({ description: 'Emergency contact information', type: EmergencyContactDto })
  @ValidateNested()
  @Type(() => EmergencyContactDto)
  emergencyContact: EmergencyContactDto;

  @ApiProperty({ description: 'Bank account information', type: BankAccountDto })
  @ValidateNested()
  @Type(() => BankAccountDto)
  bankAccount: BankAccountDto;

  @ApiPropertyOptional({ description: 'Preferred language code' })
  @IsOptional()
  @IsString()
  @Length(2, 5)
  preferredLanguage?: string;

  @ApiPropertyOptional({ description: 'Timezone' })
  @IsOptional()
  @IsString()
  timezone?: string;

  @ApiPropertyOptional({ description: 'Additional metadata' })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

// Update Rider Profile DTO
export class UpdateRiderProfileDto {
  @ApiPropertyOptional({ description: 'First name' })
  @IsOptional()
  @IsString()
  @Length(1, 50)
  firstName?: string;

  @ApiPropertyOptional({ description: 'Last name' })
  @IsOptional()
  @IsString()
  @Length(1, 50)
  lastName?: string;

  @ApiPropertyOptional({ description: 'Email address' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ description: 'Phone number' })
  @IsOptional()
  @IsPhoneNumber()
  phoneNumber?: string;

  @ApiPropertyOptional({ description: 'Date of birth' })
  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @ApiPropertyOptional({ description: 'Gender', enum: Gender })
  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

  @ApiPropertyOptional({ description: 'Profile picture URL' })
  @IsOptional()
  @IsString()
  profilePictureUrl?: string;

  @ApiPropertyOptional({ description: 'Current address', type: LocationDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => LocationDto)
  address?: LocationDto;

  @ApiPropertyOptional({ description: 'National ID or SSN' })
  @IsOptional()
  @IsString()
  @Length(1, 50)
  nationalId?: string;

  @ApiPropertyOptional({ description: 'Driver license number' })
  @IsOptional()
  @IsString()
  @Length(1, 50)
  driverLicenseNumber?: string;

  @ApiPropertyOptional({ description: 'Driver license expiry date' })
  @IsOptional()
  @IsDateString()
  driverLicenseExpiry?: string;

  @ApiPropertyOptional({ description: 'Emergency contact information', type: EmergencyContactDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => EmergencyContactDto)
  emergencyContact?: EmergencyContactDto;

  @ApiPropertyOptional({ description: 'Bank account information', type: BankAccountDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => BankAccountDto)
  bankAccount?: BankAccountDto;

  @ApiPropertyOptional({ description: 'Preferred language code' })
  @IsOptional()
  @IsString()
  @Length(2, 5)
  preferredLanguage?: string;

  @ApiPropertyOptional({ description: 'Timezone' })
  @IsOptional()
  @IsString()
  timezone?: string;

  @ApiPropertyOptional({ description: 'Additional metadata' })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

// Rider Profile Response DTO
export class RiderProfileResponseDto {
  @ApiProperty({ description: 'Rider ID' })
  id: string;

  @ApiProperty({ description: 'User ID' })
  userId: string;

  @ApiProperty({ description: 'Unique rider code' })
  riderCode: string;

  @ApiProperty({ description: 'First name' })
  firstName: string;

  @ApiProperty({ description: 'Last name' })
  lastName: string;

  @ApiProperty({ description: 'Email address' })
  email: string;

  @ApiProperty({ description: 'Phone number' })
  phoneNumber: string;

  @ApiProperty({ description: 'Date of birth' })
  dateOfBirth: string;

  @ApiProperty({ description: 'Gender', enum: Gender })
  gender: Gender;

  @ApiProperty({ description: 'Profile picture URL' })
  profilePictureUrl: string;

  @ApiProperty({ description: 'Current address', type: LocationDto })
  address: LocationDto;

  @ApiProperty({ description: 'National ID or SSN' })
  nationalId: string;

  @ApiProperty({ description: 'Driver license number' })
  driverLicenseNumber: string;

  @ApiProperty({ description: 'Driver license expiry date' })
  driverLicenseExpiry: string;

  @ApiProperty({ description: 'Emergency contact information', type: EmergencyContactDto })
  emergencyContact: EmergencyContactDto;

  @ApiProperty({ description: 'Bank account information', type: BankAccountDto })
  bankAccount: BankAccountDto;

  @ApiProperty({ description: 'Rider status', enum: RiderStatus })
  status: RiderStatus;

  @ApiProperty({ description: 'Current location', type: LocationDto })
  currentLocation: LocationDto;

  @ApiProperty({ description: 'Whether rider is online' })
  isOnline: boolean;

  @ApiProperty({ description: 'Whether rider is available for orders' })
  isAvailable: boolean;

  @ApiProperty({ description: 'Whether rider is verified' })
  isVerified: boolean;

  @ApiProperty({ description: 'Rating out of 5' })
  rating: number;

  @ApiProperty({ description: 'Total number of ratings' })
  totalRatings: number;

  @ApiProperty({ description: 'Total completed deliveries' })
  totalDeliveries: number;

  @ApiProperty({ description: 'Preferred language code' })
  preferredLanguage: string;

  @ApiProperty({ description: 'Timezone' })
  timezone: string;

  @ApiProperty({ description: 'Profile creation date' })
  createdAt: string;

  @ApiProperty({ description: 'Last profile update date' })
  updatedAt: string;

  @ApiPropertyOptional({ description: 'Additional metadata' })
  metadata?: Record<string, any>;
}

// Update Rider Status DTO
export class UpdateRiderStatusDto {
  @ApiProperty({ description: 'New rider status', enum: RiderStatus })
  @IsEnum(RiderStatus)
  status: RiderStatus;

  @ApiPropertyOptional({ description: 'Reason for status change' })
  @IsOptional()
  @IsString()
  @Length(1, 500)
  reason?: string;
}

// Update Rider Location DTO
export class UpdateRiderLocationDto {
  @ApiProperty({ description: 'Current location', type: LocationDto })
  @ValidateNested()
  @Type(() => LocationDto)
  location: LocationDto;

  @ApiPropertyOptional({ description: 'Heading in degrees (0-360)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(360)
  heading?: number;

  @ApiPropertyOptional({ description: 'Speed in km/h' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  speed?: number;
}

// Update Rider Availability DTO
export class UpdateRiderAvailabilityDto {
  @ApiProperty({ description: 'Whether rider is available for orders' })
  @IsBoolean()
  isAvailable: boolean;

  @ApiPropertyOptional({ description: 'Reason for availability change' })
  @IsOptional()
  @IsString()
  @Length(1, 200)
  reason?: string;
}

// Upload Document DTO
export class UploadDocumentDto {
  @ApiProperty({ description: 'Document type', enum: DocumentType })
  @IsEnum(DocumentType)
  type: DocumentType;

  @ApiProperty({ description: 'Document number or ID' })
  @IsString()
  @Length(1, 100)
  documentNumber: string;

  @ApiProperty({ description: 'Document expiry date' })
  @IsDateString()
  expiryDate: string;

  @ApiPropertyOptional({ description: 'Additional notes' })
  @IsOptional()
  @IsString()
  @Length(1, 500)
  notes?: string;
}

// Verify Document DTO
export class VerifyDocumentDto {
  @ApiProperty({ description: 'Document status', enum: DocumentStatus })
  @IsEnum(DocumentStatus)
  status: DocumentStatus;

  @ApiPropertyOptional({ description: 'Verification notes' })
  @IsOptional()
  @IsString()
  @Length(1, 500)
  verificationNotes?: string;
}

// Search Riders DTO
export class SearchRidersDto {
  @ApiPropertyOptional({ description: 'Search query (name, email, phone, rider code)' })
  @IsOptional()
  @IsString()
  @Length(1, 100)
  query?: string;

  @ApiPropertyOptional({ description: 'Filter by status', enum: RiderStatus })
  @IsOptional()
  @IsEnum(RiderStatus)
  status?: RiderStatus;

  @ApiPropertyOptional({ description: 'Filter by city' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ description: 'Filter by online status' })
  @IsOptional()
  @IsBoolean()
  isOnline?: boolean;

  @ApiPropertyOptional({ description: 'Filter by availability' })
  @IsOptional()
  @IsBoolean()
  isAvailable?: boolean;

  @ApiPropertyOptional({ description: 'Filter by verification status' })
  @IsOptional()
  @IsBoolean()
  isVerified?: boolean;

  @ApiPropertyOptional({ description: 'Minimum rating filter' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(5)
  minRating?: number;

  @ApiPropertyOptional({ description: 'Page number for pagination', default: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Number of items per page', default: 20 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiPropertyOptional({ description: 'Sort field' })
  @IsOptional()
  @IsString()
  sortBy?: string;

  @ApiPropertyOptional({ description: 'Sort order', enum: ['asc', 'desc'] })
  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc';
}

// Paginated Riders Response DTO
export class PaginatedRidersResponseDto {
  @ApiProperty({ description: 'List of riders', type: [RiderProfileResponseDto] })
  riders: RiderProfileResponseDto[];

  @ApiProperty({ description: 'Total number of riders' })
  total: number;

  @ApiProperty({ description: 'Current page number' })
  page: number;

  @ApiProperty({ description: 'Number of items per page' })
  limit: number;

  @ApiProperty({ description: 'Total number of pages' })
  totalPages: number;

  @ApiProperty({ description: 'Whether there is a next page' })
  hasNext: boolean;

  @ApiProperty({ description: 'Whether there is a previous page' })
  hasPrev: boolean;
}