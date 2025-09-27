import {
  IsString,
  IsOptional,
  IsDateString,
  IsEnum,
  IsBoolean,
  IsNumber,
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
export enum VehicleType {
  MOTORCYCLE = 'MOTORCYCLE',
  SCOOTER = 'SCOOTER',
  BICYCLE = 'BICYCLE',
  CAR = 'CAR',
  VAN = 'VAN',
  TRUCK = 'TRUCK',
  E_BIKE = 'E_BIKE',
  E_SCOOTER = 'E_SCOOTER',
}

export enum VehicleStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  MAINTENANCE = 'MAINTENANCE',
  SUSPENDED = 'SUSPENDED',
}

export enum FuelType {
  GASOLINE = 'GASOLINE',
  DIESEL = 'DIESEL',
  ELECTRIC = 'ELECTRIC',
  HYBRID = 'HYBRID',
  CNG = 'CNG',
  LPG = 'LPG',
}

export enum TransmissionType {
  MANUAL = 'MANUAL',
  AUTOMATIC = 'AUTOMATIC',
  CVT = 'CVT',
}

export enum VerificationStatus {
  PENDING = 'PENDING',
  VERIFIED = 'VERIFIED',
  REJECTED = 'REJECTED',
  EXPIRED = 'EXPIRED',
}

// Vehicle Specifications DTO
export class VehicleSpecificationsDto {
  @ApiProperty({ description: 'Engine capacity in CC' })
  @IsNumber()
  @Min(0)
  engineCapacity: number;

  @ApiProperty({ description: 'Fuel type', enum: FuelType })
  @IsEnum(FuelType)
  fuelType: FuelType;

  @ApiProperty({ description: 'Transmission type', enum: TransmissionType })
  @IsEnum(TransmissionType)
  transmissionType: TransmissionType;

  @ApiProperty({ description: 'Seating capacity' })
  @IsNumber()
  @Min(1)
  @Max(50)
  seatingCapacity: number;

  @ApiProperty({ description: 'Cargo capacity in liters' })
  @IsNumber()
  @Min(0)
  cargoCapacity: number;

  @ApiPropertyOptional({ description: 'Maximum weight capacity in kg' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  maxWeightCapacity?: number;

  @ApiPropertyOptional({ description: 'Fuel tank capacity in liters' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  fuelTankCapacity?: number;

  @ApiPropertyOptional({ description: 'Mileage per liter' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  mileagePerLiter?: number;
}

// Vehicle Insurance DTO
export class VehicleInsuranceDto {
  @ApiProperty({ description: 'Insurance provider name' })
  @IsString()
  @Length(1, 100)
  provider: string;

  @ApiProperty({ description: 'Policy number' })
  @IsString()
  @Length(1, 50)
  policyNumber: string;

  @ApiProperty({ description: 'Insurance start date' })
  @IsDateString()
  startDate: string;

  @ApiProperty({ description: 'Insurance expiry date' })
  @IsDateString()
  expiryDate: string;

  @ApiProperty({ description: 'Coverage amount' })
  @IsNumber()
  @Min(0)
  coverageAmount: number;

  @ApiProperty({ description: 'Currency code' })
  @IsString()
  @Length(3, 3)
  currency: string;

  @ApiPropertyOptional({ description: 'Insurance document URL' })
  @IsOptional()
  @IsString()
  documentUrl?: string;

  @ApiPropertyOptional({ description: 'Insurance type' })
  @IsOptional()
  @IsString()
  insuranceType?: string;
}

// Vehicle Maintenance DTO
export class VehicleMaintenanceDto {
  @ApiProperty({ description: 'Maintenance type' })
  @IsString()
  @Length(1, 100)
  type: string;

  @ApiProperty({ description: 'Maintenance date' })
  @IsDateString()
  date: string;

  @ApiProperty({ description: 'Maintenance cost' })
  @IsNumber()
  @Min(0)
  cost: number;

  @ApiProperty({ description: 'Currency code' })
  @IsString()
  @Length(3, 3)
  currency: string;

  @ApiProperty({ description: 'Service provider' })
  @IsString()
  @Length(1, 100)
  serviceProvider: string;

  @ApiPropertyOptional({ description: 'Maintenance description' })
  @IsOptional()
  @IsString()
  @Length(1, 500)
  description?: string;

  @ApiPropertyOptional({ description: 'Next maintenance due date' })
  @IsOptional()
  @IsDateString()
  nextDueDate?: string;

  @ApiPropertyOptional({ description: 'Maintenance receipt URL' })
  @IsOptional()
  @IsString()
  receiptUrl?: string;
}

// Add Vehicle DTO
export class AddVehicleDto {
  @ApiProperty({ description: 'Rider ID who owns the vehicle' })
  @IsString()
  riderId: string;

  @ApiProperty({ description: 'Vehicle type', enum: VehicleType })
  @IsEnum(VehicleType)
  type: VehicleType;

  @ApiProperty({ description: 'Vehicle make/brand' })
  @IsString()
  @Length(1, 50)
  make: string;

  @ApiProperty({ description: 'Vehicle model' })
  @IsString()
  @Length(1, 50)
  model: string;

  @ApiProperty({ description: 'Manufacturing year' })
  @IsNumber()
  @Min(1900)
  @Max(new Date().getFullYear() + 1)
  year: number;

  @ApiProperty({ description: 'Vehicle color' })
  @IsString()
  @Length(1, 30)
  color: string;

  @ApiProperty({ description: 'License plate number' })
  @IsString()
  @Length(1, 20)
  @Matches(/^[A-Z0-9\-\s]+$/i, { message: 'Invalid license plate format' })
  plateNumber: string;

  @ApiProperty({ description: 'Vehicle Identification Number (VIN)' })
  @IsString()
  @Length(17, 17)
  @Matches(/^[A-HJ-NPR-Z0-9]{17}$/i, { message: 'Invalid VIN format' })
  vin: string;

  @ApiProperty({ description: 'Registration number' })
  @IsString()
  @Length(1, 50)
  registrationNumber: string;

  @ApiProperty({ description: 'Registration expiry date' })
  @IsDateString()
  registrationExpiry: string;

  @ApiProperty({ description: 'Vehicle specifications', type: VehicleSpecificationsDto })
  @ValidateNested()
  @Type(() => VehicleSpecificationsDto)
  specifications: VehicleSpecificationsDto;

  @ApiProperty({ description: 'Vehicle insurance information', type: VehicleInsuranceDto })
  @ValidateNested()
  @Type(() => VehicleInsuranceDto)
  insurance: VehicleInsuranceDto;

  @ApiPropertyOptional({ description: 'Vehicle photos URLs' })
  @IsOptional()
  @IsString({ each: true })
  photos?: string[];

  @ApiPropertyOptional({ description: 'Registration document URL' })
  @IsOptional()
  @IsString()
  registrationDocumentUrl?: string;

  @ApiPropertyOptional({ description: 'Additional metadata' })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

// Update Vehicle DTO
export class UpdateVehicleDto {
  @ApiPropertyOptional({ description: 'Vehicle type', enum: VehicleType })
  @IsOptional()
  @IsEnum(VehicleType)
  type?: VehicleType;

  @ApiPropertyOptional({ description: 'Vehicle make/brand' })
  @IsOptional()
  @IsString()
  @Length(1, 50)
  make?: string;

  @ApiPropertyOptional({ description: 'Vehicle model' })
  @IsOptional()
  @IsString()
  @Length(1, 50)
  model?: string;

  @ApiPropertyOptional({ description: 'Manufacturing year' })
  @IsOptional()
  @IsNumber()
  @Min(1900)
  @Max(new Date().getFullYear() + 1)
  year?: number;

  @ApiPropertyOptional({ description: 'Vehicle color' })
  @IsOptional()
  @IsString()
  @Length(1, 30)
  color?: string;

  @ApiPropertyOptional({ description: 'License plate number' })
  @IsOptional()
  @IsString()
  @Length(1, 20)
  @Matches(/^[A-Z0-9\-\s]+$/i, { message: 'Invalid license plate format' })
  plateNumber?: string;

  @ApiPropertyOptional({ description: 'Vehicle Identification Number (VIN)' })
  @IsOptional()
  @IsString()
  @Length(17, 17)
  @Matches(/^[A-HJ-NPR-Z0-9]{17}$/i, { message: 'Invalid VIN format' })
  vin?: string;

  @ApiPropertyOptional({ description: 'Registration number' })
  @IsOptional()
  @IsString()
  @Length(1, 50)
  registrationNumber?: string;

  @ApiPropertyOptional({ description: 'Registration expiry date' })
  @IsOptional()
  @IsDateString()
  registrationExpiry?: string;

  @ApiPropertyOptional({ description: 'Vehicle specifications', type: VehicleSpecificationsDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => VehicleSpecificationsDto)
  specifications?: VehicleSpecificationsDto;

  @ApiPropertyOptional({ description: 'Vehicle insurance information', type: VehicleInsuranceDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => VehicleInsuranceDto)
  insurance?: VehicleInsuranceDto;

  @ApiPropertyOptional({ description: 'Vehicle photos URLs' })
  @IsOptional()
  @IsString({ each: true })
  photos?: string[];

  @ApiPropertyOptional({ description: 'Registration document URL' })
  @IsOptional()
  @IsString()
  registrationDocumentUrl?: string;

  @ApiPropertyOptional({ description: 'Additional metadata' })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

// Vehicle Response DTO
export class VehicleResponseDto {
  @ApiProperty({ description: 'Vehicle ID' })
  id: string;

  @ApiProperty({ description: 'Rider ID who owns the vehicle' })
  riderId: string;

  @ApiProperty({ description: 'Vehicle type', enum: VehicleType })
  type: VehicleType;

  @ApiProperty({ description: 'Vehicle make/brand' })
  make: string;

  @ApiProperty({ description: 'Vehicle model' })
  model: string;

  @ApiProperty({ description: 'Manufacturing year' })
  year: number;

  @ApiProperty({ description: 'Vehicle color' })
  color: string;

  @ApiProperty({ description: 'License plate number' })
  plateNumber: string;

  @ApiProperty({ description: 'Vehicle Identification Number (VIN)' })
  vin: string;

  @ApiProperty({ description: 'Registration number' })
  registrationNumber: string;

  @ApiProperty({ description: 'Registration expiry date' })
  registrationExpiry: string;

  @ApiProperty({ description: 'Vehicle specifications', type: VehicleSpecificationsDto })
  specifications: VehicleSpecificationsDto;

  @ApiProperty({ description: 'Vehicle insurance information', type: VehicleInsuranceDto })
  insurance: VehicleInsuranceDto;

  @ApiProperty({ description: 'Vehicle status', enum: VehicleStatus })
  status: VehicleStatus;

  @ApiProperty({ description: 'Verification status', enum: VerificationStatus })
  verificationStatus: VerificationStatus;

  @ApiProperty({ description: 'Whether vehicle is active' })
  isActive: boolean;

  @ApiProperty({ description: 'Current mileage/odometer reading' })
  currentMileage: number;

  @ApiProperty({ description: 'Vehicle photos URLs' })
  photos: string[];

  @ApiProperty({ description: 'Registration document URL' })
  registrationDocumentUrl: string;

  @ApiProperty({ description: 'Vehicle creation date' })
  createdAt: string;

  @ApiProperty({ description: 'Last vehicle update date' })
  updatedAt: string;

  @ApiPropertyOptional({ description: 'Verification notes' })
  verificationNotes?: string;

  @ApiPropertyOptional({ description: 'Additional metadata' })
  metadata?: Record<string, any>;
}

// Update Vehicle Status DTO
export class UpdateVehicleStatusDto {
  @ApiProperty({ description: 'New vehicle status', enum: VehicleStatus })
  @IsEnum(VehicleStatus)
  status: VehicleStatus;

  @ApiPropertyOptional({ description: 'Reason for status change' })
  @IsOptional()
  @IsString()
  @Length(1, 500)
  reason?: string;
}

// Update Vehicle Verification DTO
export class UpdateVehicleVerificationDto {
  @ApiProperty({ description: 'Verification status', enum: VerificationStatus })
  @IsEnum(VerificationStatus)
  verificationStatus: VerificationStatus;

  @ApiPropertyOptional({ description: 'Verification notes' })
  @IsOptional()
  @IsString()
  @Length(1, 500)
  verificationNotes?: string;
}

// Update Vehicle Mileage DTO
export class UpdateVehicleMileageDto {
  @ApiProperty({ description: 'Current mileage/odometer reading' })
  @IsNumber()
  @Min(0)
  currentMileage: number;

  @ApiPropertyOptional({ description: 'Mileage update notes' })
  @IsOptional()
  @IsString()
  @Length(1, 200)
  notes?: string;
}

// Add Vehicle Maintenance DTO
export class AddVehicleMaintenanceDto {
  @ApiProperty({ description: 'Maintenance information', type: VehicleMaintenanceDto })
  @ValidateNested()
  @Type(() => VehicleMaintenanceDto)
  maintenance: VehicleMaintenanceDto;
}

// Search Vehicles DTO
export class SearchVehiclesDto {
  @ApiPropertyOptional({ description: 'Search query (plate number, make, model, VIN)' })
  @IsOptional()
  @IsString()
  @Length(1, 100)
  query?: string;

  @ApiPropertyOptional({ description: 'Filter by rider ID' })
  @IsOptional()
  @IsString()
  riderId?: string;

  @ApiPropertyOptional({ description: 'Filter by vehicle type', enum: VehicleType })
  @IsOptional()
  @IsEnum(VehicleType)
  type?: VehicleType;

  @ApiPropertyOptional({ description: 'Filter by status', enum: VehicleStatus })
  @IsOptional()
  @IsEnum(VehicleStatus)
  status?: VehicleStatus;

  @ApiPropertyOptional({ description: 'Filter by verification status', enum: VerificationStatus })
  @IsOptional()
  @IsEnum(VerificationStatus)
  verificationStatus?: VerificationStatus;

  @ApiPropertyOptional({ description: 'Filter by active status' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Filter by make' })
  @IsOptional()
  @IsString()
  make?: string;

  @ApiPropertyOptional({ description: 'Filter by model' })
  @IsOptional()
  @IsString()
  model?: string;

  @ApiPropertyOptional({ description: 'Filter by year range - start' })
  @IsOptional()
  @IsNumber()
  @Min(1900)
  yearFrom?: number;

  @ApiPropertyOptional({ description: 'Filter by year range - end' })
  @IsOptional()
  @IsNumber()
  @Max(new Date().getFullYear() + 1)
  yearTo?: number;

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

// Paginated Vehicles Response DTO
export class PaginatedVehiclesResponseDto {
  @ApiProperty({ description: 'List of vehicles', type: [VehicleResponseDto] })
  vehicles: VehicleResponseDto[];

  @ApiProperty({ description: 'Total number of vehicles' })
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

// Vehicle Maintenance History Response DTO
export class VehicleMaintenanceHistoryResponseDto {
  @ApiProperty({ description: 'Vehicle ID' })
  vehicleId: string;

  @ApiProperty({ description: 'List of maintenance records', type: [VehicleMaintenanceDto] })
  maintenanceHistory: VehicleMaintenanceDto[];

  @ApiProperty({ description: 'Total maintenance cost' })
  totalMaintenanceCost: number;

  @ApiProperty({ description: 'Currency code' })
  currency: string;

  @ApiProperty({ description: 'Last maintenance date' })
  lastMaintenanceDate: string;

  @ApiPropertyOptional({ description: 'Next maintenance due date' })
  nextMaintenanceDue?: string;
}