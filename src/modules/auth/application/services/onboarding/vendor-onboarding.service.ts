import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/shared/infrastructure/prisma.service';
import {
  VendorCreateRequestDto,
  VendorKycUploadRequestDto,
  VendorOnboardingStatusResponseDto,
} from 'src/modules/auth/application/dtos/onboarding/vendor-onboarding.dto';
import { KycStatus } from '@prisma/client';

@Injectable()
export class VendorOnboardingService {
  constructor(private prisma: PrismaService) {}

  /**
   * Create vendor account
   */
  async create(
    userId: string,
    dto: VendorCreateRequestDto,
  ): Promise<VendorOnboardingStatusResponseDto> {
    // Check if vendor already exists
    const existingVendor = await this.prisma.vendor.findUnique({
      where: { userId },
    });

    if (existingVendor) {
      throw new BadRequestException('User already has a vendor account');
    }

    // Create new vendor record
    const vendor = await this.prisma.vendor.create({
      data: {
        userId,
        businessName: dto.businessName,
        businessType: dto.businessType,
        kycStatus: KycStatus.PENDING,
        kycDocuments: {
          businessName: dto.businessName,
          businessType: dto.businessType,
          description: dto.description,
          phone: dto.phone,
          email: dto.email,
          location: dto.location,
          documents: [],
          bankDetails: null,
        },
      },
    });

    return this.mapToResponseDto(vendor);
  }

  /**
   * Upload KYC documents
   */
  async uploadKyc(
    userId: string,
    dto: VendorKycUploadRequestDto,
  ): Promise<VendorOnboardingStatusResponseDto> {
    const vendor = await this.getVendorByUserId(userId);

    // Validate vendor is in correct status
    if (vendor.kycStatus !== KycStatus.PENDING) {
      throw new BadRequestException(
        `Cannot upload documents in status: ${vendor.kycStatus}`,
      );
    }

    // Update KYC documents
    const kycDocuments = (vendor.kycDocuments as any) || {};
    kycDocuments.documents = [
      {
        type: 'business_registration',
        url: dto.businessRegistration,
        status: 'PENDING',
        uploadedAt: new Date().toISOString(),
      },
      {
        type: 'tax_id',
        url: dto.taxId,
        status: 'PENDING',
        uploadedAt: new Date().toISOString(),
      },
      {
        type: 'bank_proof',
        url: dto.bankProof,
        status: 'PENDING',
        uploadedAt: new Date().toISOString(),
      },
      {
        type: 'government_id',
        url: dto.governmentId,
        status: 'PENDING',
        uploadedAt: new Date().toISOString(),
      },
    ];

    kycDocuments.bankDetails = {
      accountName: dto.accountName,
      bankName: dto.bankName,
      accountNumber: dto.accountNumber,
      branchCode: dto.branchCode,
    };

    // Update vendor with KYC documents
    const updated = await this.prisma.vendor.update({
      where: { id: vendor.id },
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
  ): Promise<VendorOnboardingStatusResponseDto> {
    const vendor = await this.getVendorByUserId(userId);
    return this.mapToResponseDto(vendor);
  }

  /**
   * Update vendor KYC status (admin only)
   */
  async updateKycStatus(
    vendorId: string,
    status: KycStatus,
  ): Promise<VendorOnboardingStatusResponseDto> {
    const vendor = await this.prisma.vendor.findUnique({
      where: { id: vendorId },
    });

    if (!vendor) {
      throw new NotFoundException('Vendor not found');
    }

    const updated = await this.prisma.vendor.update({
      where: { id: vendorId },
      data: {
        kycStatus: status,
        ...(status === KycStatus.APPROVED && { isOpen: true }),
      },
    });

    return this.mapToResponseDto(updated);
  }

  /**
   * Get vendor by user ID
   */
  private async getVendorByUserId(userId: string) {
    const vendor = await this.prisma.vendor.findUnique({
      where: { userId },
    });

    if (!vendor) {
      throw new NotFoundException('Vendor not found');
    }

    return vendor;
  }

  /**
   * Map to response DTO
   */
  private async mapToResponseDto(
    vendor: any,
  ): Promise<VendorOnboardingStatusResponseDto> {
    const kycDocs = (vendor.kycDocuments as any) || {};

    return {
      id: vendor.id,
      userId: vendor.userId,
      status: kycDocs.businessName ? 'PENDING' : 'PENDING',
      businessName: kycDocs.businessName || vendor.businessName || '',
      businessType: kycDocs.businessType || vendor.businessType || '',
      description: kycDocs.description || '',
      phone: kycDocs.phone || '',
      email: kycDocs.email || '',
      location: kycDocs.location || {
        address: '',
        city: '',
        district: '',
        latitude: '0',
        longitude: '0',
      },
      documents: (kycDocs.documents || []).map((doc: any) => ({
        type: doc.type,
        status: doc.status,
        uploadedAt: new Date(doc.uploadedAt),
        rejectionReason: doc.rejectionReason,
      })),
      rejectionReason: kycDocs.rejectionReason,
      canAcceptOrders: vendor.kycStatus === KycStatus.APPROVED,
      isOnboarding: vendor.kycStatus === KycStatus.PENDING,
      isVerified: vendor.kycStatus === KycStatus.APPROVED,
      nextStep: vendor.kycStatus === KycStatus.PENDING ? 'VERIFIED' : undefined,
      createdAt: vendor.createdAt,
      updatedAt: vendor.updatedAt,
    };
  }
}
