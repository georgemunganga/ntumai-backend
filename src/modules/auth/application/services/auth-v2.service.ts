import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UserRole } from '@prisma/client';
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
} from '../../domain/entities/otp-session.entity';
import { PhoneNormalizer } from '../utils/phone-normalizer';
import { PrismaService } from '../../../../shared/infrastructure/prisma.service';
import { CommunicationsService } from '../../../communications/communications.service';

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
      role?: string;
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
      role: string;
    };
  };
}

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

    const user = await this.findOrCreateUserForSession(session);
    const isKnownDevice = await this.isKnownDevice(user.id, deviceId);
    const tokens = this.generateTokens(user);
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
          user: this.toAuthUser(user),
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
        user: this.toAuthUser(user),
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
            update: { active: true },
            create: { role: userRole, active: true },
          },
        },
      },
    });

    // Clean up onboarding token
    this.deleteOnboardingToken(onboardingToken);

    // Issue full tokens
    const tokens = this.generateTokens(user);
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
        user: this.toAuthUser(user),
      },
    };
  }

  /**
   * Get current user from token
   */
  async getCurrentUser(token: string): Promise<any | null> {
    try {
      const payload = this.jwtService.verify(token);
      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
      });
      return user ? this.toAuthUser(user) : null;
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

  private toApiRole(role?: UserRole | null): string {
    if (role === UserRole.DRIVER) return 'tasker';
    if (role === UserRole.VENDOR) return 'vendor';
    if (role === UserRole.ADMIN) return 'admin';
    return 'customer';
  }

  private toAuthUser(user: {
    id: string;
    email?: string | null;
    phone?: string | null;
    role?: UserRole | null;
    firstName?: string | null;
    lastName?: string | null;
    profileImage?: string | null;
    isEmailVerified?: boolean | null;
    isPhoneVerified?: boolean | null;
  }) {
    return {
      id: user.id,
      email: user.email ?? undefined,
      phone: user.phone ?? undefined,
      role: this.toApiRole(user.role),
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
}
