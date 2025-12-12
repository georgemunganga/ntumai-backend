import { IsString, IsEnum, IsNotEmpty, IsOptional } from 'class-validator';
import {
  TaskerOnboardingStatus,
  VehicleType,
  DocumentType,
} from 'src/modules/auth/domain/entities/onboarding/tasker-onboarding.entity';

/**
 * Tasker Apply Request DTO
 */
export class TaskerApplyRequestDto {
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @IsString()
  @IsNotEmpty()
  lastName: string;

  @IsString()
  @IsNotEmpty()
  phone: string;

  @IsString()
  @IsNotEmpty()
  email: string;

  @IsEnum(VehicleType)
  @IsNotEmpty()
  vehicleType: VehicleType;

  @IsString()
  @IsNotEmpty()
  vehicleModel: string;

  @IsString()
  @IsNotEmpty()
  licensePlate: string;
}

/**
 * Tasker KYC Upload Request DTO
 */
export class TaskerKycUploadRequestDto {
  @IsString()
  @IsNotEmpty()
  driverLicense: string; // base64 encoded

  @IsString()
  @IsNotEmpty()
  vehicleRegistration: string; // base64 encoded

  @IsString()
  @IsNotEmpty()
  insurance: string; // base64 encoded

  @IsString()
  @IsOptional()
  policeClearance?: string; // base64 encoded

  @IsString()
  @IsNotEmpty()
  bankAccountName: string;

  @IsString()
  @IsNotEmpty()
  bankName: string;

  @IsString()
  @IsNotEmpty()
  bankAccountNumber: string;
}

/**
 * Tasker Training Complete Request DTO
 */
export class TaskerTrainingCompleteRequestDto {
  @IsString()
  @IsNotEmpty()
  trainingCertificateUrl: string;

  @IsOptional()
  trainingScore?: number;
}

/**
 * Tasker Onboarding Status Response DTO
 */
export class TaskerOnboardingStatusResponseDto {
  id: string;
  userId: string;
  status: TaskerOnboardingStatus;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  vehicleType: VehicleType;
  vehicleModel: string;
  licensePlate: string;
  documents: {
    type: DocumentType;
    status: string;
    uploadedAt: Date;
    rejectionReason?: string;
  }[];
  trainingScore?: number;
  rejectionReason?: string;
  canAcceptJobs: boolean;
  isOnboarding: boolean;
  nextStep?: TaskerOnboardingStatus;
  createdAt: Date;
  updatedAt: Date;
}
