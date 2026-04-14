import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AddressType, Prisma, UserRole } from '@prisma/client';
import { createHash, randomUUID } from 'crypto';
// import { UserService } from 'src/modules/users/application/services/user.service'; // Removed due to missing UsersModule
// import { UserEntity } from 'src/modules/users/domain/entities/user.entity'; // Removed due to missing UsersModule
import { JwtToken } from '../../domain/value-objects/jwt-token.vo';
import { OnboardingToken } from '../../domain/value-objects/onboarding-token.vo';
import { OtpServiceV2 } from './otp-v2.service';
import { OtpSessionRepository } from '../../infrastructure/repositories/otp-session.repository';
import {
  OtpSessionEntity,
  FlowType,
  RequestedAuthRole,
} from '../../domain/entities/otp-session.entity';
import { PhoneNormalizer } from '../utils/phone-normalizer';
import { PrismaService } from '../../../../shared/infrastructure/prisma.service';
import { CommunicationsService } from '../../../communications/communications.service';

type ApiRole = 'customer' | 'tasker' | 'vendor' | 'admin';
type RoleOnboardingStatus = 'complete' | 'pending';
type AuthUserPayload = {
  id: string;
  email?: string;
  phone?: string;
  role: ApiRole;
  activeRole: ApiRole;
  roles: ApiRole[];
  roleStatuses?: Partial<Record<ApiRole, RoleOnboardingStatus>>;
  kycStatuses?: Partial<Record<ApiRole, string>>;
  activationStatuses?: Partial<Record<ApiRole, string>>;
  firstName?: string;
  lastName?: string;
  avatar?: string;
  isVerified?: boolean;
};

export interface AuthStartResponse {
  success: boolean;
  data: {
    sessionId: string;
    expiresIn: number;
    flowType: FlowType;
    channelsSent: string[];
  };
}

export interface AuthVerifyResponse {
  success: boolean;
  data: {
    flowType: FlowType;
    requiresRoleSelection: boolean;
    accessToken?: string;
    refreshToken?: string;
    expiresIn?: number;
    onboardingToken?: string;
    user: {
      id: string;
      email?: string;
      phone?: string;
      role?: ApiRole;
      activeRole?: ApiRole;
      roles?: ApiRole[];
      roleStatuses?: Partial<Record<ApiRole, RoleOnboardingStatus>>;
      kycStatuses?: Partial<Record<ApiRole, string>>;
      activationStatuses?: Partial<Record<ApiRole, string>>;
    };
  };
}

export interface RoleSelectionResponse {
  success: boolean;
  data: {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
    user: {
      id: string;
      email?: string;
      phone?: string;
      role: ApiRole;
      activeRole?: ApiRole;
      roles?: ApiRole[];
      roleStatuses?: Partial<Record<ApiRole, RoleOnboardingStatus>>;
      kycStatuses?: Partial<Record<ApiRole, string>>;
      activationStatuses?: Partial<Record<ApiRole, string>>;
    };
  };
}

type AddressPayload = {
  id: string;
  type: 'home' | 'work' | 'other';
  label?: string;
  street: string;
  city: string;
  state: string;
  zipCode?: string;
  country: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  isDefault: boolean;
};

type VendorOnboardingCompletionInput = {
  businessName: string;
  businessType: string;
  description?: string;
  address: string;
  city: string;
  district?: string;
  payoutMethod: 'mobile_money' | 'bank';
  mobileMoneyProvider?: string;
  mobileMoneyNumber?: string;
  accountName?: string;
  bankName?: string;
  accountNumber?: string;
  locationLatLng?: {
    latitude: number;
    longitude: number;
  };
};

type TaskerOnboardingCompletionInput = {
  fullName: string;
  nrcNumber: string;
  phoneNumber: string;
  vehicleType: string;
  plateNumber: string;
  documents: Array<{
    type: 'drivers_license' | 'national_id' | 'vehicle_registration';
    documentNumber: string;
    status: 'pending' | 'approved' | 'rejected';
    expiryDate?: string;
  }>;
};

type OnboardingRole = 'vendor' | 'tasker';

type OnboardingDraftState = {
  role: OnboardingRole;
  onboardingStatus: 'pending' | 'complete';
  lifecycleStatus: 'not_started' | 'in_progress' | 'completed';
  kycStatus?: string;
  activationStatus?: string;
  currentStepId?: string;
  draftData?: Record<string, unknown> | null;
  updatedAt?: string;
  completedAt?: string;
};

type KycRole = 'vendor' | 'tasker';

type KycDocument = {
  id: string;
  type:
    | 'business_license'
    | 'national_id'
    | 'tax_certificate'
    | 'drivers_license'
    | 'vehicle_registration';
  label: string;
  status: 'pending' | 'approved' | 'rejected';
  fileUrl: string;
  documentNumber?: string;
  expiryDate?: string;
  uploadedAt: string;
  rejectionReason?: string;
};

type KycStatusState = {
  role: KycRole;
  onboardingStatus: 'pending' | 'complete';
  kycStatus:
    | 'not_started'
    | 'pending_submission'
    | 'under_review'
    | 'approved'
    | 'rejected';
  activationStatus: 'inactive' | 'restricted' | 'active' | 'suspended';
  documents: KycDocument[];
  submittedAt?: string;
  reviewedAt?: string;
  rejectionReason?: string;
  reviewNotes?: string;
};

@Injectable()
export class AuthServiceV2 {
  private readonly onboardingTokenStore = new Map<
    string,
    { userId: string; expiresAt: number }
  >();

  constructor(
    // private readonly userService: UserService, // Removed due to missing UsersModulee
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly otpService: OtpServiceV2,
    private readonly sessionRepository: OtpSessionRepository,
    private readonly prisma: PrismaService,
    private readonly communicationsService: CommunicationsService,
  ) {}

  /**
   * Start OTP flow - determines login vs signup automatically
   */
  async startOtpFlow(
    email?: string,
    phone?: string,
    deviceId?: string,
    requestedRole?: RequestedAuthRole,
  ): Promise<AuthStartResponse> {
    if (!email && !phone) {
      throw new BadRequestException('Email or phone must be provided');
    }

    // Normalize phone if provided
    const normalizedPhone = phone
      ? PhoneNormalizer.normalize(phone)
      : undefined;
    if (phone && !normalizedPhone) {
      throw new BadRequestException('Invalid phone number format');
    }

    const existingUser = await this.findUserByContact(email, normalizedPhone);
    const flowType: FlowType = existingUser ? 'login' : 'signup';

    // Create OTP session
    const session = await this.otpService.startOtpFlow(
      email,
      normalizedPhone || undefined,
      flowType,
      deviceId,
      requestedRole,
    );

    return {
      success: true,
      data: {
        sessionId: session.id,
        expiresIn: session.getTimeRemaining(),
        flowType: session.flowType,
        channelsSent: session.channelsSent,
      },
    };
  }

  /**
   * Verify OTP and issue tokens or onboarding token
   */
  async verifyOtp(
    sessionId: string,
    otp: string,
    deviceId?: string,
  ): Promise<AuthVerifyResponse> {
    // Verify OTP
    const session = await this.otpService.verifyOtp(sessionId, otp, deviceId);

    const user = await this.activateRequestedRoleIfOwned(
      await this.findOrCreateUserForSession(session),
      session.requestedRole,
    );
    const isKnownDevice = await this.isKnownDevice(user.id, deviceId);
    const tokens = this.generateTokens(user);
    const authUser = await this.toAuthUser(user);
    await this.storeRefreshToken(tokens.refreshToken, user.id, deviceId);
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date(), updatedAt: new Date() },
    });

    if (session.flowType === 'login') {
      if (user.email && deviceId && !isKnownDevice) {
        await this.communicationsService
          .sendLoginAlertEmail({
            to: user.email,
            firstName: user.firstName ?? undefined,
            identifier: user.email,
            deviceId,
            occurredAt: new Date().toISOString(),
            ctaUrl: this.configService.get<string>('APP_URL'),
          })
          .catch(() => undefined);
      }

      return {
        success: true,
        data: {
          flowType: 'login',
          requiresRoleSelection: false,
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          expiresIn: this.getTokenExpiration(),
          user: authUser,
        },
      };
    }

    const onboardingToken = OnboardingToken.generate(user.id);
    this.storeOnboardingToken(onboardingToken);

    if (user.email) {
      await this.communicationsService
        .sendWelcomeEmailByRole({
          to: user.email,
          firstName: user.firstName ?? undefined,
          role: 'customer',
          ctaUrl: this.configService.get<string>('APP_URL'),
        })
        .catch(() => undefined);
    }

    return {
      success: true,
      data: {
        flowType: session.flowType,
        requiresRoleSelection: false,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresIn: this.getTokenExpiration(),
        onboardingToken: onboardingToken.token,
        user: authUser,
      },
    };
  }

  /**
   * Select role and issue full tokens
   */
  async selectRole(
    onboardingToken: string,
    role: 'customer' | 'tasker' | 'vendor',
  ): Promise<RoleSelectionResponse> {
    // Validate onboarding token
    const tokenData = this.getOnboardingToken(onboardingToken);
    if (!tokenData) {
      throw new UnauthorizedException('Invalid or expired onboarding token');
    }

    const userRole = this.toPrismaRole(role);
    const user = await this.prisma.user.update({
      where: { id: tokenData.userId },
      data: {
        role: userRole,
        updatedAt: new Date(),
        UserRoleAssignment: {
          upsert: {
            where: {
              userId_role: {
                userId: tokenData.userId,
                role: userRole,
              },
            },
            update: {
              active: true,
              metadata: this.getRoleMetadata(role),
            },
            create: {
              role: userRole,
              active: true,
              metadata: this.getRoleMetadata(role),
            },
          },
        },
      },
    });

    // Clean up onboarding token
    this.deleteOnboardingToken(onboardingToken);

    // Issue full tokens
    const tokens = this.generateTokens(user);
    const authUser = await this.toAuthUser(user);
    await this.storeRefreshToken(tokens.refreshToken, user.id);

    if (user.email) {
      await this.communicationsService
        .sendWelcomeEmailByRole({
          to: user.email,
          firstName: user.firstName ?? undefined,
          role,
          ctaUrl: this.configService.get<string>('APP_URL'),
        })
        .catch(() => undefined);
    }

    return {
      success: true,
      data: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresIn: this.getTokenExpiration(),
        user: authUser,
      },
    };
  }

  async activateRole(
    accessToken: string,
    role: 'customer' | 'tasker' | 'vendor',
  ): Promise<RoleSelectionResponse> {
    const currentUser = await this.getCurrentUserRecord(accessToken);
    if (!currentUser) {
      throw new UnauthorizedException('Invalid token');
    }

    const userRole = this.toPrismaRole(role);
    const user = await this.prisma.user.update({
      where: { id: currentUser.id },
      data: {
        role: userRole,
        updatedAt: new Date(),
        UserRoleAssignment: {
          upsert: {
            where: {
              userId_role: {
                userId: currentUser.id,
                role: userRole,
              },
            },
            update: {
              active: true,
            },
            create: {
              role: userRole,
              active: true,
              metadata: this.getRoleMetadata(role),
            },
          },
        },
      },
    });

    const tokens = this.generateTokens(user);
    await this.storeRefreshToken(tokens.refreshToken, user.id);
    const authUser = await this.toAuthUser(user);

    return {
      success: true,
      data: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresIn: this.getTokenExpiration(),
        user: authUser,
      },
    };
  }

  async completeVendorOnboarding(
    userId: string,
    payload: VendorOnboardingCompletionInput,
  ): Promise<{
    success: boolean;
    data: { user: AuthUserPayload };
  }> {
    const user = await this.upsertRoleAssignment(userId, 'vendor', {
      onboardingStatus: 'complete',
      onboardingLifecycleStatus: 'completed',
      onboardingCompletedAt: new Date().toISOString(),
      onboardingCurrentStepId: null,
      onboardingDraft: null,
      onboardingUpdatedAt: new Date().toISOString(),
      kycStatus: 'pending_submission',
      activationStatus: 'inactive',
      onboardingData: payload,
    });

    return {
      success: true,
      data: {
        user: await this.toAuthUser(user),
      },
    };
  }

  async completeTaskerOnboarding(
    userId: string,
    payload: TaskerOnboardingCompletionInput,
  ): Promise<{
    success: boolean;
    data: { user: AuthUserPayload };
  }> {
    const user = await this.upsertRoleAssignment(userId, 'tasker', {
      onboardingStatus: 'complete',
      onboardingLifecycleStatus: 'completed',
      onboardingCompletedAt: new Date().toISOString(),
      onboardingCurrentStepId: null,
      onboardingDraft: null,
      onboardingUpdatedAt: new Date().toISOString(),
      kycStatus: 'pending_submission',
      activationStatus: 'inactive',
      onboardingData: payload,
    });

    return {
      success: true,
      data: {
        user: await this.toAuthUser(user),
      },
    };
  }

  async getOnboardingDraft(
    userId: string,
    role: OnboardingRole,
  ): Promise<{
    success: boolean;
    data: { onboarding: OnboardingDraftState };
  }> {
    const assignment = await this.prisma.userRoleAssignment.findUnique({
      where: {
        userId_role: {
          userId,
          role: this.toPrismaRole(role),
        },
      },
      select: {
        metadata: true,
      },
    });

    return {
      success: true,
      data: {
        onboarding: this.toOnboardingDraftState(role, assignment?.metadata),
      },
    };
  }

  async saveOnboardingDraft(
    userId: string,
    role: OnboardingRole,
    currentStepId: string,
    draftData: Record<string, unknown>,
  ): Promise<{
    success: boolean;
    data: { onboarding: OnboardingDraftState };
  }> {
    const now = new Date().toISOString();
    const user = await this.upsertRoleAssignment(userId, role, {
      onboardingStatus: 'pending',
      onboardingLifecycleStatus: 'in_progress',
      onboardingCurrentStepId: currentStepId,
      onboardingDraft: draftData,
      onboardingUpdatedAt: now,
      kycStatus: 'not_started',
      activationStatus: 'inactive',
    });

    const assignment = await this.prisma.userRoleAssignment.findUnique({
      where: {
        userId_role: {
          userId: user.id,
          role: this.toPrismaRole(role),
        },
      },
      select: {
        metadata: true,
      },
    });

    return {
      success: true,
      data: {
        onboarding: this.toOnboardingDraftState(role, assignment?.metadata),
      },
    };
  }

  async getKycStatus(
    userId: string,
    role: KycRole,
  ): Promise<{
    success: boolean;
    data: { kyc: KycStatusState };
  }> {
    const assignment = await this.getRoleAssignment(userId, role);

    return {
      success: true,
      data: {
        kyc: this.toKycStatusState(role, assignment?.metadata),
      },
    };
  }

  async upsertKycDocument(
    userId: string,
    role: KycRole,
    input: {
      id?: string;
      type:
        | 'business_license'
        | 'national_id'
        | 'tax_certificate'
        | 'drivers_license'
        | 'vehicle_registration';
      label: string;
      fileUrl: string;
      documentNumber?: string;
      expiryDate?: string;
    },
  ): Promise<{
    success: boolean;
    data: { kyc: KycStatusState };
  }> {
    const existingAssignment = await this.getRoleAssignment(userId, role);
    const currentState = this.toKycStatusState(role, existingAssignment?.metadata);
    const now = new Date().toISOString();
    const nextDocument: KycDocument = {
      id: input.id || randomUUID(),
      type: input.type,
      label: input.label,
      status: 'pending',
      fileUrl: input.fileUrl,
      documentNumber: input.documentNumber,
      expiryDate: input.expiryDate,
      uploadedAt: now,
    };

    const documents = currentState.documents.some((doc) => doc.id === nextDocument.id)
      ? currentState.documents.map((doc) =>
          doc.id === nextDocument.id ? nextDocument : doc,
        )
      : [
          ...currentState.documents.filter((doc) => doc.type !== nextDocument.type),
          nextDocument,
        ];

    const user = await this.upsertRoleAssignment(userId, role, {
      kycDocuments: documents,
      kycStatus:
        currentState.kycStatus === 'approved' ? 'pending_submission' : 'pending_submission',
      activationStatus: 'inactive',
      kycSubmittedAt: null,
      kycReviewedAt: null,
      kycReviewNotes: null,
      kycRejectionReason: null,
    });

    const assignment = await this.getRoleAssignment(user.id, role);

    return {
      success: true,
      data: {
        kyc: this.toKycStatusState(role, assignment?.metadata),
      },
    };
  }

  async deleteKycDocument(
    userId: string,
    role: KycRole,
    documentId: string,
  ): Promise<{
    success: boolean;
    data: { kyc: KycStatusState };
  }> {
    const existingAssignment = await this.getRoleAssignment(userId, role);
    const currentState = this.toKycStatusState(role, existingAssignment?.metadata);
    const documents = currentState.documents.filter((doc) => doc.id !== documentId);

    const user = await this.upsertRoleAssignment(userId, role, {
      kycDocuments: documents,
      kycStatus: documents.length ? 'pending_submission' : 'not_started',
      activationStatus: 'inactive',
      kycSubmittedAt: null,
      kycReviewedAt: null,
      kycReviewNotes: null,
      kycRejectionReason: null,
    });

    const assignment = await this.getRoleAssignment(user.id, role);

    return {
      success: true,
      data: {
        kyc: this.toKycStatusState(role, assignment?.metadata),
      },
    };
  }

  async submitKyc(
    userId: string,
    role: KycRole,
  ): Promise<{
    success: boolean;
    data: { kyc: KycStatusState };
  }> {
    const existingAssignment = await this.getRoleAssignment(userId, role);
    const currentState = this.toKycStatusState(role, existingAssignment?.metadata);

    if (currentState.onboardingStatus !== 'complete') {
      throw new BadRequestException('Complete onboarding before submitting KYC');
    }

    const requiredDocumentTypes =
      role === 'vendor'
        ? ['business_license', 'national_id']
        : ['drivers_license', 'national_id'];

    const missingDocument = requiredDocumentTypes.find(
      (requiredType) =>
        !currentState.documents.some((document) => document.type === requiredType),
    );

    if (missingDocument) {
      throw new BadRequestException(`Missing required document: ${missingDocument}`);
    }

    const now = new Date().toISOString();
    const user = await this.upsertRoleAssignment(userId, role, {
      kycStatus: 'under_review',
      activationStatus: 'restricted',
      kycSubmittedAt: now,
      kycReviewedAt: null,
      kycReviewNotes: null,
      kycRejectionReason: null,
      kycDocuments: currentState.documents.map((document) => ({
        ...document,
        status: 'pending',
        rejectionReason: null,
      })),
    });

    const assignment = await this.getRoleAssignment(user.id, role);

    return {
      success: true,
      data: {
        kyc: this.toKycStatusState(role, assignment?.metadata),
      },
    };
  }

  async listKycSubmissions(
    adminUserId: string,
    filters?: {
      role?: KycRole;
      status?: KycStatusState['kycStatus'];
    },
  ): Promise<{
    success: boolean;
    data: {
      submissions: Array<{
        userId: string;
        role: KycRole;
        firstName?: string;
        lastName?: string;
        email?: string;
        phone?: string;
        kycStatus: KycStatusState['kycStatus'];
        activationStatus: KycStatusState['activationStatus'];
        submittedAt?: string;
      }>;
    };
  }> {
    await this.assertAdmin(adminUserId);

    const assignments = await this.prisma.userRoleAssignment.findMany({
      where: {
        active: true,
        role: filters?.role ? this.toPrismaRole(filters.role) : undefined,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    const submissions = assignments
      .map((assignment) => {
        const role = this.toApiRole(assignment.role) as KycRole;
        const state = this.toKycStatusState(role, assignment.metadata);
        return {
          userId: assignment.user.id,
          role,
          firstName: assignment.user.firstName ?? undefined,
          lastName: assignment.user.lastName ?? undefined,
          email: assignment.user.email ?? undefined,
          phone: assignment.user.phone ?? undefined,
          kycStatus: state.kycStatus,
          activationStatus: state.activationStatus,
          submittedAt: state.submittedAt,
        };
      })
      .filter((submission) =>
        filters?.status ? submission.kycStatus === filters.status : true,
      );

    return {
      success: true,
      data: {
        submissions,
      },
    };
  }

  async reviewKycSubmission(
    adminUserId: string,
    userId: string,
    role: KycRole,
    input: {
      action: 'approved' | 'rejected' | 'request_changes';
      notes?: string;
      rejectionReason?: string;
    },
  ): Promise<{
    success: boolean;
    data: { kyc: KycStatusState };
  }> {
    await this.assertAdmin(adminUserId);

    const existingAssignment = await this.getRoleAssignment(userId, role);
    const currentState = this.toKycStatusState(role, existingAssignment?.metadata);
    const now = new Date().toISOString();

    const nextStatus =
      input.action === 'approved'
        ? 'approved'
        : 'rejected';
    const nextActivationStatus =
      input.action === 'approved' ? 'active' : 'inactive';

    const user = await this.upsertRoleAssignment(userId, role, {
      kycStatus: nextStatus,
      activationStatus: nextActivationStatus,
      kycReviewedAt: now,
      kycReviewedBy: adminUserId,
      kycReviewNotes: input.notes || null,
      kycRejectionReason:
        input.action === 'approved' ? null : input.rejectionReason || null,
      kycDocuments: currentState.documents.map((document) => ({
        ...document,
        status: input.action === 'approved' ? 'approved' : 'rejected',
        rejectionReason:
          input.action === 'approved' ? null : input.rejectionReason || undefined,
      })),
    });

    const assignment = await this.getRoleAssignment(user.id, role);

    return {
      success: true,
      data: {
        kyc: this.toKycStatusState(role, assignment?.metadata),
      },
    };
  }

  /**
   * Get current user from token
   */
  async getCurrentUser(token: string): Promise<any | null> {
    const user = await this.getCurrentUserRecord(token);
    return user ? await this.toAuthUser(user) : null;
  }

  async getAddresses(userId: string): Promise<{
    success: boolean;
    data: { addresses: AddressPayload[] };
  }> {
    const addresses = await this.prisma.address.findMany({
      where: { userId },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
    });

    return {
      success: true,
      data: {
        addresses: addresses.map((address) => this.toAddressPayload(address)),
      },
    };
  }

  async createAddress(
    userId: string,
    input: {
      type: 'home' | 'work' | 'other';
      label?: string;
      street: string;
      city: string;
      state: string;
      zipCode?: string;
      country?: string;
      isDefault?: boolean;
      latitude?: number;
      longitude?: number;
    },
  ): Promise<{
    success: boolean;
    data: { address: AddressPayload; addresses: AddressPayload[] };
  }> {
    const existingCount = await this.prisma.address.count({ where: { userId } });
    const shouldSetDefault = Boolean(input.isDefault) || existingCount === 0;

    if (shouldSetDefault) {
      await this.prisma.address.updateMany({
        where: { userId, isDefault: true },
        data: { isDefault: false },
      });
    }

    const created = await this.prisma.address.create({
      data: {
        userId,
        type: this.toAddressType(input.type),
        label: input.label?.trim() || null,
        address: input.street.trim(),
        city: input.city.trim(),
        state: input.state.trim(),
        country: input.country?.trim() || 'Zambia',
        postalCode: input.zipCode?.trim() || null,
        latitude: input.latitude ?? 0,
        longitude: input.longitude ?? 0,
        isDefault: shouldSetDefault,
      },
    });

    return {
      success: true,
      data: {
        address: this.toAddressPayload(created),
        addresses: (await this.prisma.address.findMany({
          where: { userId },
          orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
        })).map((address) => this.toAddressPayload(address)),
      },
    };
  }

  async updateAddress(
    userId: string,
    addressId: string,
    input: {
      type?: 'home' | 'work' | 'other';
      label?: string;
      street?: string;
      city?: string;
      state?: string;
      zipCode?: string;
      country?: string;
      isDefault?: boolean;
      latitude?: number;
      longitude?: number;
    },
  ): Promise<{
    success: boolean;
    data: { address: AddressPayload; addresses: AddressPayload[] };
  }> {
    const existing = await this.prisma.address.findFirst({
      where: { id: addressId, userId },
    });

    if (!existing) {
      throw new BadRequestException('Address not found');
    }

    if (input.isDefault) {
      await this.prisma.address.updateMany({
        where: { userId, isDefault: true },
        data: { isDefault: false },
      });
    }

    const updated = await this.prisma.address.update({
      where: { id: addressId },
      data: {
        type: input.type ? this.toAddressType(input.type) : undefined,
        label: input.label !== undefined ? input.label.trim() || null : undefined,
        address: input.street !== undefined ? input.street.trim() : undefined,
        city: input.city !== undefined ? input.city.trim() : undefined,
        state: input.state !== undefined ? input.state.trim() : undefined,
        country: input.country !== undefined ? input.country.trim() : undefined,
        postalCode:
          input.zipCode !== undefined ? input.zipCode.trim() || null : undefined,
        latitude: input.latitude,
        longitude: input.longitude,
        isDefault: input.isDefault ?? undefined,
      },
    });

    return {
      success: true,
      data: {
        address: this.toAddressPayload(updated),
        addresses: (await this.prisma.address.findMany({
          where: { userId },
          orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
        })).map((address) => this.toAddressPayload(address)),
      },
    };
  }

  async setDefaultAddress(
    userId: string,
    addressId: string,
  ): Promise<{
    success: boolean;
    data: { addresses: AddressPayload[] };
  }> {
    const existing = await this.prisma.address.findFirst({
      where: { id: addressId, userId },
      select: { id: true },
    });

    if (!existing) {
      throw new BadRequestException('Address not found');
    }

    await this.prisma.$transaction([
      this.prisma.address.updateMany({
        where: { userId, isDefault: true },
        data: { isDefault: false },
      }),
      this.prisma.address.update({
        where: { id: addressId },
        data: { isDefault: true },
      }),
    ]);

    return this.getAddresses(userId);
  }

  async deleteAddress(
    userId: string,
    addressId: string,
  ): Promise<{
    success: boolean;
    data: { addresses: AddressPayload[] };
  }> {
    const existing = await this.prisma.address.findFirst({
      where: { id: addressId, userId },
      select: { id: true, isDefault: true },
    });

    if (!existing) {
      throw new BadRequestException('Address not found');
    }

    await this.prisma.address.delete({
      where: { id: addressId },
    });

    if (existing.isDefault) {
      const fallback = await this.prisma.address.findFirst({
        where: { userId },
        orderBy: { createdAt: 'asc' },
        select: { id: true },
      });

      if (fallback) {
        await this.prisma.address.update({
          where: { id: fallback.id },
          data: { isDefault: true },
        });
      }
    }

    return this.getAddresses(userId);
  }

  private async getCurrentUserRecord(token: string): Promise<any | null> {
    try {
      const payload = this.jwtService.verify(token);
      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
      });
      return user;
    } catch {
      return null;
    }
  }

  async refreshAccessToken(
    refreshToken: string,
    deviceId?: string,
  ): Promise<{
    success: boolean;
    data: { accessToken: string; refreshToken: string; expiresIn: number };
  }> {
    let payload: any;
    try {
      payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get('JWT_REFRESH_SECRET') || 'refresh-secret',
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const tokenHash = this.hashToken(refreshToken);
    const storedToken = await this.prisma.refreshToken.findFirst({
      where: {
        tokenHash,
        userId: payload.sub,
        isRevoked: false,
        expiresAt: { gt: new Date() },
      },
      include: { user: true },
    });

    if (!storedToken) {
      throw new UnauthorizedException('Refresh token expired or revoked');
    }

    await this.prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { isRevoked: true, revokedAt: new Date() },
    });

    const tokens = this.generateTokens(storedToken.user);
    await this.storeRefreshToken(tokens.refreshToken, storedToken.user.id, deviceId);

    return {
      success: true,
      data: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresIn: this.getTokenExpiration(),
      },
    };
  }

  async logout(refreshToken?: string, allDevices = false): Promise<{
    success: boolean;
    message: string;
  }> {
    if (!refreshToken) {
      return { success: true, message: 'Logged out' };
    }

    try {
      const payload: any = this.jwtService.verify(refreshToken, {
        secret: this.configService.get('JWT_REFRESH_SECRET') || 'refresh-secret',
      });

      if (allDevices) {
        await this.prisma.refreshToken.updateMany({
          where: { userId: payload.sub, isRevoked: false },
          data: { isRevoked: true, revokedAt: new Date() },
        });
      } else {
        await this.prisma.refreshToken.updateMany({
          where: { tokenHash: this.hashToken(refreshToken), isRevoked: false },
          data: { isRevoked: true, revokedAt: new Date() },
        });
      }
    } catch {
      // Logout is idempotent for clients.
    }

    return { success: true, message: 'Logged out' };
  }

  // ==================== Private Methods ====================

  private generateTokens(user: {
    id: string;
    email?: string | null;
    phoneNumber?: string;
    phone?: string | null;
  }): JwtToken {
    const payload = {
      sub: user.id,
      email: user.email,
      phone: user.phoneNumber ?? user.phone,
      activeRole: this.toApiRole((user as any).role),
    };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: this.configService.get('JWT_EXPIRATION') || '1h',
    });

    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: this.configService.get('JWT_REFRESH_EXPIRATION') || '7d',
      secret: this.configService.get('JWT_REFRESH_SECRET') || 'refresh-secret',
    });

    const jwtToken = new JwtToken(
      accessToken,
      refreshToken,
      Date.now() + this.getTokenExpiration() * 1000,
    );
    return jwtToken;
  }

  private getTokenExpiration(): number {
    const expirationStr = this.configService.get('JWT_EXPIRATION') || '1h';
    // Parse expiration string (e.g., "1h", "30m")
    const match = expirationStr.match(/^(\d+)([smhd])$/);
    if (!match) return 3600; // default 1 hour

    const value = parseInt(match[1], 10);
    const unit = match[2];

    switch (unit) {
      case 's':
        return value;
      case 'm':
        return value * 60;
      case 'h':
        return value * 3600;
      case 'd':
        return value * 86400;
      default:
        return 3600;
    }
  }

  private getRefreshTokenExpiration(): number {
    const expirationStr =
      this.configService.get('JWT_REFRESH_EXPIRATION') || '7d';
    const match = expirationStr.match(/^(\d+)([smhd])$/);
    if (!match) return 7 * 86400;

    const value = parseInt(match[1], 10);
    const unit = match[2];

    switch (unit) {
      case 's':
        return value;
      case 'm':
        return value * 60;
      case 'h':
        return value * 3600;
      case 'd':
        return value * 86400;
      default:
        return 7 * 86400;
    }
  }

  private async findUserByContact(email?: string, phone?: string | null) {
    if (email) {
      const user = await this.prisma.user.findUnique({
        where: { email: email.toLowerCase() },
      });
      if (user) return user;
    }

    if (phone) {
      const user = await this.prisma.user.findUnique({ where: { phone } });
      if (user) return user;
    }

    return null;
  }

  private async findOrCreateUserForSession(session: OtpSessionEntity) {
    const existing = await this.findUserByContact(session.email, session.phone);
    if (existing) return existing;

    const now = new Date();
    return this.prisma.user.create({
      data: {
        id: randomUUID(),
        email: session.email?.toLowerCase(),
        phone: session.phone,
        password: 'otp-auth',
        firstName: 'User',
        lastName: 'Ntumai',
        role: UserRole.CUSTOMER,
        isEmailVerified: !!session.email,
        isPhoneVerified: !!session.phone,
        updatedAt: now,
        UserRoleAssignment: {
          create: {
            role: UserRole.CUSTOMER,
            active: true,
            metadata: this.getRoleMetadata('customer'),
          },
        },
      },
    });
  }

  private async activateRequestedRoleIfOwned(
    user: any,
    requestedRole?: RequestedAuthRole,
  ) {
    if (
      requestedRole !== 'customer' &&
      requestedRole !== 'tasker' &&
      requestedRole !== 'vendor'
    ) {
      return user;
    }

    const prismaRole = this.toPrismaRole(requestedRole);
    if (user.role === prismaRole) {
      return user;
    }

    const ownsRole = await this.prisma.userRoleAssignment.findUnique({
      where: {
        userId_role: {
          userId: user.id,
          role: prismaRole,
        },
      },
      select: { active: true },
    });

    if (!ownsRole?.active) {
      return user;
    }

    return this.prisma.user.update({
      where: { id: user.id },
      data: {
        role: prismaRole,
        updatedAt: new Date(),
      },
    });
  }

  private async storeRefreshToken(
    refreshToken: string,
    userId: string,
    deviceId?: string,
  ): Promise<void> {
    await this.prisma.refreshToken.create({
      data: {
        tokenHash: this.hashToken(refreshToken),
        userId,
        deviceId,
        expiresAt: new Date(Date.now() + this.getRefreshTokenExpiration() * 1000),
      },
    });
  }

  private async isKnownDevice(
    userId: string,
    deviceId?: string,
  ): Promise<boolean> {
    if (!deviceId) {
      return false;
    }

    const existing = await this.prisma.refreshToken.findFirst({
      where: {
        userId,
        deviceId,
        isRevoked: false,
      },
      select: { id: true },
    });

    return Boolean(existing);
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private toPrismaRole(role: 'customer' | 'tasker' | 'vendor'): UserRole {
    if (role === 'tasker') return UserRole.DRIVER;
    if (role === 'vendor') return UserRole.VENDOR;
    return UserRole.CUSTOMER;
  }

  private toAddressType(type: 'home' | 'work' | 'other'): AddressType {
    if (type === 'work') return AddressType.WORK;
    if (type === 'other') return AddressType.OTHER;
    return AddressType.HOME;
  }

  private toAddressPayload(address: {
    id: string;
    type: AddressType;
    label: string | null;
    address: string;
    city: string;
    state: string;
    postalCode: string | null;
    country: string;
    latitude: number;
    longitude: number;
    isDefault: boolean;
  }): AddressPayload {
    return {
      id: address.id,
      type:
        address.type === AddressType.WORK
          ? 'work'
          : address.type === AddressType.OTHER
            ? 'other'
            : 'home',
      label: address.label ?? undefined,
      street: address.address,
      city: address.city,
      state: address.state,
      zipCode: address.postalCode ?? undefined,
      country: address.country,
      coordinates: {
        latitude: address.latitude,
        longitude: address.longitude,
      },
      isDefault: address.isDefault,
    };
  }

  private toApiRole(role?: UserRole | null): ApiRole {
    if (role === UserRole.DRIVER) return 'tasker';
    if (role === UserRole.VENDOR) return 'vendor';
    if (role === UserRole.ADMIN) return 'admin';
    return 'customer';
  }

  private getRoleMetadata(role: 'customer' | 'tasker' | 'vendor') {
    return {
      onboardingStatus:
        role === 'customer' ? 'complete' : 'pending',
      onboardingLifecycleStatus:
        role === 'customer' ? 'completed' : 'not_started',
      kycStatus:
        role === 'customer' ? 'approved' : 'not_started',
      activationStatus:
        role === 'customer' ? 'active' : 'inactive',
    };
  }

  private mergeRoleMetadata(
    currentMetadata: unknown,
    nextMetadata: Record<string, unknown>,
  ): Prisma.InputJsonValue {
    return ({
      ...(currentMetadata &&
      typeof currentMetadata === 'object' &&
      !Array.isArray(currentMetadata)
        ? currentMetadata
        : {}),
      ...nextMetadata,
    } as Prisma.InputJsonObject);
  }

  private getRoleStatus(metadata: unknown): RoleOnboardingStatus {
    if (
      metadata &&
      typeof metadata === 'object' &&
      'onboardingStatus' in metadata &&
      (metadata as { onboardingStatus?: unknown }).onboardingStatus === 'pending'
    ) {
      return 'pending';
    }

    return 'complete';
  }

  private toOnboardingDraftState(
    role: OnboardingRole,
    metadata: unknown,
  ): OnboardingDraftState {
    const safeMetadata =
      metadata && typeof metadata === 'object' && !Array.isArray(metadata)
        ? (metadata as Record<string, unknown>)
        : {};

    return {
      role,
      onboardingStatus: this.getRoleStatus(safeMetadata),
      lifecycleStatus:
        safeMetadata.onboardingLifecycleStatus === 'in_progress' ||
        safeMetadata.onboardingLifecycleStatus === 'completed'
          ? (safeMetadata.onboardingLifecycleStatus as
              | 'in_progress'
              | 'completed')
          : 'not_started',
      kycStatus:
        typeof safeMetadata.kycStatus === 'string'
          ? safeMetadata.kycStatus
          : undefined,
      activationStatus:
        typeof safeMetadata.activationStatus === 'string'
          ? safeMetadata.activationStatus
          : undefined,
      currentStepId:
        typeof safeMetadata.onboardingCurrentStepId === 'string'
          ? safeMetadata.onboardingCurrentStepId
          : undefined,
      draftData:
        safeMetadata.onboardingDraft &&
        typeof safeMetadata.onboardingDraft === 'object' &&
        !Array.isArray(safeMetadata.onboardingDraft)
          ? (safeMetadata.onboardingDraft as Record<string, unknown>)
          : null,
      updatedAt:
        typeof safeMetadata.onboardingUpdatedAt === 'string'
          ? safeMetadata.onboardingUpdatedAt
          : undefined,
      completedAt:
        typeof safeMetadata.onboardingCompletedAt === 'string'
          ? safeMetadata.onboardingCompletedAt
          : undefined,
    };
  }

  private toKycStatusState(
    role: KycRole,
    metadata: unknown,
  ): KycStatusState {
    const safeMetadata =
      metadata && typeof metadata === 'object' && !Array.isArray(metadata)
        ? (metadata as Record<string, unknown>)
        : {};

    const documents = Array.isArray(safeMetadata.kycDocuments)
      ? (safeMetadata.kycDocuments.filter(
          (document): document is KycDocument =>
            !!document && typeof document === 'object' && !Array.isArray(document),
        ) as KycDocument[])
      : [];

    return {
      role,
      onboardingStatus: this.getRoleStatus(safeMetadata),
      kycStatus:
        safeMetadata.kycStatus === 'pending_submission' ||
        safeMetadata.kycStatus === 'under_review' ||
        safeMetadata.kycStatus === 'approved' ||
        safeMetadata.kycStatus === 'rejected'
          ? (safeMetadata.kycStatus as KycStatusState['kycStatus'])
          : 'not_started',
      activationStatus:
        safeMetadata.activationStatus === 'restricted' ||
        safeMetadata.activationStatus === 'active' ||
        safeMetadata.activationStatus === 'suspended'
          ? (safeMetadata.activationStatus as KycStatusState['activationStatus'])
          : 'inactive',
      documents,
      submittedAt:
        typeof safeMetadata.kycSubmittedAt === 'string'
          ? safeMetadata.kycSubmittedAt
          : undefined,
      reviewedAt:
        typeof safeMetadata.kycReviewedAt === 'string'
          ? safeMetadata.kycReviewedAt
          : undefined,
      rejectionReason:
        typeof safeMetadata.kycRejectionReason === 'string'
          ? safeMetadata.kycRejectionReason
          : undefined,
      reviewNotes:
        typeof safeMetadata.kycReviewNotes === 'string'
          ? safeMetadata.kycReviewNotes
          : undefined,
    };
  }

  private async getRoleAssignment(userId: string, role: KycRole) {
    return this.prisma.userRoleAssignment.findUnique({
      where: {
        userId_role: {
          userId,
          role: this.toPrismaRole(role),
        },
      },
      select: {
        metadata: true,
      },
    });
  }

  private async assertAdmin(userId: string): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (!user || user.role !== UserRole.ADMIN) {
      throw new UnauthorizedException('Admin access required');
    }
  }

  private async toAuthUser(user: {
    id: string;
    email?: string | null;
    phone?: string | null;
    role?: UserRole | null;
    firstName?: string | null;
    lastName?: string | null;
    profileImage?: string | null;
    isEmailVerified?: boolean | null;
    isPhoneVerified?: boolean | null;
  }): Promise<AuthUserPayload> {
    const activeRole = this.toApiRole(user.role);
    const assignments = await this.prisma.userRoleAssignment.findMany({
      where: {
        userId: user.id,
        active: true,
      },
      select: {
        role: true,
        metadata: true,
      },
    });
    const roleStatuses = assignments.reduce<Partial<Record<ApiRole, RoleOnboardingStatus>>>(
      (acc, assignment) => {
        acc[this.toApiRole(assignment.role)] = this.getRoleStatus(
          assignment.metadata,
        );
        return acc;
      },
      {},
    );
    const kycStatuses = assignments.reduce<Partial<Record<ApiRole, string>>>(
      (acc, assignment) => {
        const safeMetadata =
          assignment.metadata &&
          typeof assignment.metadata === 'object' &&
          !Array.isArray(assignment.metadata)
            ? (assignment.metadata as Record<string, unknown>)
            : {};
        const apiRole = this.toApiRole(assignment.role);
        acc[apiRole] =
          typeof safeMetadata.kycStatus === 'string'
            ? safeMetadata.kycStatus
            : apiRole === 'customer'
              ? 'approved'
              : 'not_started';
        return acc;
      },
      {},
    );
    const activationStatuses = assignments.reduce<Partial<Record<ApiRole, string>>>(
      (acc, assignment) => {
        const safeMetadata =
          assignment.metadata &&
          typeof assignment.metadata === 'object' &&
          !Array.isArray(assignment.metadata)
            ? (assignment.metadata as Record<string, unknown>)
            : {};
        const apiRole = this.toApiRole(assignment.role);
        acc[apiRole] =
          typeof safeMetadata.activationStatus === 'string'
            ? safeMetadata.activationStatus
            : apiRole === 'customer'
              ? 'active'
              : 'inactive';
        return acc;
      },
      {},
    );

    if (!roleStatuses[activeRole]) {
      roleStatuses[activeRole] = 'complete';
    }
    if (!kycStatuses[activeRole]) {
      kycStatuses[activeRole] = activeRole === 'customer' ? 'approved' : 'not_started';
    }
    if (!activationStatuses[activeRole]) {
      activationStatuses[activeRole] = activeRole === 'customer' ? 'active' : 'inactive';
    }

    const roles = Object.keys(roleStatuses) as ApiRole[];

    return {
      id: user.id,
      email: user.email ?? undefined,
      phone: user.phone ?? undefined,
      role: activeRole,
      activeRole,
      roles,
      roleStatuses,
      kycStatuses,
      activationStatuses,
      firstName: user.firstName ?? undefined,
      lastName: user.lastName ?? undefined,
      avatar: user.profileImage ?? undefined,
      isVerified: Boolean(user.isEmailVerified || user.isPhoneVerified),
    };
  }

  private storeOnboardingToken(token: OnboardingToken): void {
    this.onboardingTokenStore.set(token.token, {
      userId: token.userId,
      expiresAt: token.expiresAt,
    });
  }

  private getOnboardingToken(
    token: string,
  ): { userId: string; expiresAt: number } | null {
    const data = this.onboardingTokenStore.get(token);
    if (!data) return null;

    if (Date.now() >= data.expiresAt) {
      this.onboardingTokenStore.delete(token);
      return null;
    }

    return data;
  }

  private deleteOnboardingToken(token: string): void {
    this.onboardingTokenStore.delete(token);
  }

  private async upsertRoleAssignment(
    userId: string,
    role: 'customer' | 'tasker' | 'vendor',
    metadataPatch: Record<string, unknown>,
  ) {
    const prismaRole = this.toPrismaRole(role);
    const existingAssignment = await this.prisma.userRoleAssignment.findUnique({
      where: {
        userId_role: {
          userId,
          role: prismaRole,
        },
      },
      select: {
        metadata: true,
      },
    });

    return this.prisma.user.update({
      where: { id: userId },
      data: {
        role: prismaRole,
        updatedAt: new Date(),
        UserRoleAssignment: {
          upsert: {
            where: {
              userId_role: {
                userId,
                role: prismaRole,
              },
            },
            update: {
              active: true,
              metadata: this.mergeRoleMetadata(
                existingAssignment?.metadata,
                metadataPatch,
              ),
            },
            create: {
              role: prismaRole,
              active: true,
              metadata: this.mergeRoleMetadata(
                this.getRoleMetadata(role),
                metadataPatch,
              ),
            },
          },
        },
      },
    });
  }
}
