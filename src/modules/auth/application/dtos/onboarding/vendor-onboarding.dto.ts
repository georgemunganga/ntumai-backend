import {
  IsString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsNumber,
} from 'class-validator';
import type {
  LocationData,
} from 'src/modules/auth/domain/entities/onboarding/vendor-onboarding.entity';
import {
  VendorOnboardingStatus,
  BusinessType,
  VendorDocumentType,
} from 'src/modules/auth/domain/entities/onboarding/vendor-onboarding.entity';

/**
 * Vendor Create Request DTO
 */
export class VendorCreateRequestDto {
  @IsString()
  @IsNotEmpty()
  businessName: string;

  @IsEnum(BusinessType)
  @IsNotEmpty()
  businessType: BusinessType;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsString()
  @IsNotEmpty()
  phone: string;

  @IsString()
  @IsNotEmpty()
  email: string;

  @IsNotEmpty()
  location: any; // LocationData with address, city, district, latitude, longitude
}

/**
 * Vendor KYC Upload Request DTO
 */
export class VendorKycUploadRequestDto {
  @IsString()
  @IsNotEmpty()
  businessRegistration: string; // base64 encoded

  @IsString()
  @IsNotEmpty()
  taxId: string; // base64 encoded

  @IsString()
  @IsNotEmpty()
  bankProof: string; // base64 encoded

  @IsString()
  @IsNotEmpty()
  governmentId: string; // base64 encoded

  @IsString()
  @IsNotEmpty()
  accountName: string;

  @IsString()
  @IsNotEmpty()
  bankName: string;

  @IsString()
  @IsNotEmpty()
  accountNumber: string;

  @IsString()
  @IsOptional()
  branchCode?: string;
}

/**
 * Vendor Onboarding Status Response DTO
 */
export class VendorOnboardingStatusResponseDto {
  id: string;
  userId: string;
  status: VendorOnboardingStatus;
  businessName: string;
  businessType: BusinessType;
  description: string;
  phone: string;
  email: string;
  location: LocationData;
  documents: {
    type: VendorDocumentType;
    status: string;
    uploadedAt: Date;
    rejectionReason?: string;
  }[];
  rejectionReason?: string;
  canAcceptOrders: boolean;
  isOnboarding: boolean;
  isVerified: boolean;
  nextStep?: VendorOnboardingStatus;
  createdAt: Date;
  updatedAt: Date;
}
