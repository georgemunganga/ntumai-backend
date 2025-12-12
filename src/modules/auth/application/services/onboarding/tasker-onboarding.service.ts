import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/shared/infrastructure/prisma.service';
import {
  TaskerApplyRequestDto,
  TaskerKycUploadRequestDto,
  TaskerTrainingCompleteRequestDto,
  TaskerOnboardingStatusResponseDto,
} from 'src/modules/auth/application/dtos/onboarding/tasker-onboarding.dto';
import { KycStatus } from '@prisma/client';

@Injectable()
export class TaskerOnboardingService {
  constructor(private prisma: PrismaService) {}

  /**
   * Submit tasker application
   */
  async apply(
    userId: string,
    dto: TaskerApplyRequestDto,
  ): Promise<TaskerOnboardingStatusResponseDto> {
    // Check if tasker already exists
    const existingTasker = await this.prisma.tasker.findUnique({
      where: { userId },
    });

    if (existingTasker) {
      throw new BadRequestException('User already has a tasker application');
    }

    // Map vehicle type from DTO to Prisma enum
    const vehicleTypeMap: Record<string, any> = {
      motorcycle: 'MOTORBIKE',
      car: 'CAR',
      bicycle: 'BICYCLE',
      walking: 'WALK',
    };

    // Create new tasker record
    const tasker = await this.prisma.tasker.create({
      data: {
        userId,
        vehicleType: vehicleTypeMap[dto.vehicleType] || 'MOTORBIKE',
        kycStatus: KycStatus.PENDING,
        kycDocuments: {
          firstName: dto.firstName,
          lastName: dto.lastName,
          phone: dto.phone,
          email: dto.email,
          vehicleModel: dto.vehicleModel,
          licensePlate: dto.licensePlate,
          documents: [],
          bankDetails: null,
        },
      },
    });

    return this.mapToResponseDto(tasker);
  }

  /**
   * Upload KYC documents
   */
  async uploadKyc(
    userId: string,
    dto: TaskerKycUploadRequestDto,
  ): Promise<TaskerOnboardingStatusResponseDto> {
    const tasker = await this.getTaskerByUserId(userId);

    // Validate tasker is in correct status
    if (tasker.kycStatus !== KycStatus.PENDING) {
      throw new BadRequestException(
        `Cannot upload documents in status: ${tasker.kycStatus}`,
      );
    }

    // Update KYC documents
    const kycDocuments = tasker.kycDocuments as any || {};
    kycDocuments.documents = [
      {
        type: 'driver_license',
        url: dto.driverLicense,
        status: 'PENDING',
        uploadedAt: new Date().toISOString(),
      },
      {
        type: 'vehicle_registration',
        url: dto.vehicleRegistration,
        status: 'PENDING',
        uploadedAt: new Date().toISOString(),
      },
      {
        type: 'insurance_certificate',
        url: dto.insurance,
        status: 'PENDING',
        uploadedAt: new Date().toISOString(),
      },
    ];

    if (dto.policeClearance) {
      kycDocuments.documents.push({
        type: 'police_clearance',
        url: dto.policeClearance,
        status: 'PENDING',
        uploadedAt: new Date().toISOString(),
      });
    }

    kycDocuments.bankDetails = {
      accountName: dto.bankAccountName,
      bankName: dto.bankName,
      accountNumber: dto.bankAccountNumber,
    };

    // Update tasker with KYC documents
    const updated = await this.prisma.tasker.update({
      where: { id: tasker.id },
      data: {
        kycDocuments,
      },
    });

    return this.mapToResponseDto(updated);
  }

  /**
   * Complete training
   */
  async completeTraining(
    userId: string,
    dto: TaskerTrainingCompleteRequestDto,
  ): Promise<TaskerOnboardingStatusResponseDto> {
    const tasker = await this.getTaskerByUserId(userId);

    // Update KYC documents with training info
    const kycDocuments = tasker.kycDocuments as any || {};
    kycDocuments.training = {
      certificateUrl: dto.trainingCertificateUrl,
      score: dto.trainingScore || 0,
      completedAt: new Date().toISOString(),
    };

    const updated = await this.prisma.tasker.update({
      where: { id: tasker.id },
      data: {
        kycDocuments,
      },
    });

    return this.mapToResponseDto(updated);
  }

  /**
   * Get onboarding status
   */
  async getOnboardingStatus(
    userId: string,
  ): Promise<TaskerOnboardingStatusResponseDto> {
    const tasker = await this.getTaskerByUserId(userId);
    return this.mapToResponseDto(tasker);
  }

  /**
   * Update tasker KYC status (admin only)
   */
  async updateKycStatus(
    taskerId: string,
    status: KycStatus,
  ): Promise<TaskerOnboardingStatusResponseDto> {
    const tasker = await this.prisma.tasker.findUnique({
      where: { id: taskerId },
    });

    if (!tasker) {
      throw new NotFoundException('Tasker not found');
    }

    const updated = await this.prisma.tasker.update({
      where: { id: taskerId },
      data: {
        kycStatus: status,
      },
    });

    return this.mapToResponseDto(updated);
  }

  /**
   * Get tasker by user ID
   */
  private async getTaskerByUserId(userId: string) {
    const tasker = await this.prisma.tasker.findUnique({
      where: { userId },
    });

    if (!tasker) {
      throw new NotFoundException('Tasker not found');
    }

    return tasker;
  }

  /**
   * Map to response DTO
   */
  private async mapToResponseDto(
    tasker: any,
  ): Promise<TaskerOnboardingStatusResponseDto> {
    const kycDocs = (tasker.kycDocuments as any) || {};

    return {
      id: tasker.id,
      userId: tasker.userId,
      status: kycDocs.firstName ? 'APPLIED' : 'PENDING',
      firstName: kycDocs.firstName || '',
      lastName: kycDocs.lastName || '',
      phone: kycDocs.phone || '',
      email: kycDocs.email || '',
      vehicleType: kycDocs.vehicleType || 'motorcycle',
      vehicleModel: kycDocs.vehicleModel || '',
      licensePlate: kycDocs.licensePlate || '',
      documents: (kycDocs.documents || []).map((doc: any) => ({
        type: doc.type,
        status: doc.status,
        uploadedAt: new Date(doc.uploadedAt),
        rejectionReason: doc.rejectionReason,
      })),
      trainingScore: kycDocs.training?.score,
      rejectionReason: kycDocs.rejectionReason,
      canAcceptJobs: tasker.kycStatus === KycStatus.APPROVED,
      isOnboarding: tasker.kycStatus === KycStatus.PENDING,
      nextStep: tasker.kycStatus === KycStatus.PENDING ? 'KYC_APPROVED' : undefined,
      createdAt: tasker.createdAt,
      updatedAt: tasker.updatedAt,
    };
  }
}
