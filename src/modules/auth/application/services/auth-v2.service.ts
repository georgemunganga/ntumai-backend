import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UserService } from 'src/modules/users/application/services/user.service';
import { UserEntity } from 'src/modules/users/domain/entities/user.entity';
import { JwtToken } from '../../domain/value-objects/jwt-token.vo';
import { OnboardingToken } from '../../domain/value-objects/onboarding-token.vo';
import { OtpServiceV2 } from './otp-v2.service';
import { OtpSessionRepository } from '../../infrastructure/repositories/otp-session.repository';
import { OtpSessionEntity, FlowType } from '../../domain/entities/otp-session.entity';
import { PhoneNormalizer } from '../utils/phone-normalizer';

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
  private readonly onboardingTokenStore = new Map<string, { userId: string; expiresAt: number }>();

  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly otpService: OtpServiceV2,
    private readonly sessionRepository: OtpSessionRepository,
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
    const normalizedPhone = phone ? PhoneNormalizer.normalize(phone) : undefined;
    if (phone && !normalizedPhone) {
      throw new BadRequestException('Invalid phone number format');
    }

    // Determine if user exists (login vs signup)
    let user: UserEntity | null = null;
    let flowType: FlowType = 'signup';

    if (normalizedPhone) {
      user = await this.userService.getUserByPhoneNumber(normalizedPhone);
    } else if (email) {
      user = await this.userService.getUserByEmail(email);
    }

    if (user) {
      flowType = 'login';
    }

    // Create OTP session
    const session = await this.otpService.startOtpFlow(
      email,
      normalizedPhone,
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

    // Get or create user
    let user: UserEntity | null = null;

    if (session.phone) {
      user = await this.userService.getUserByPhoneNumber(session.phone);
    } else if (session.email) {
      user = await this.userService.getUserByEmail(session.email);
    }

    if (!user) {
      // Create new user
      user = await this.userService.createOrUpdateUser(
        session.phone,
        session.email,
      );
    }

    // For now, all users need role selection
    // In a real implementation, you'd check the UserRole model
    const hasRole = false;

    if (session.flowType === 'login' && hasRole) {
      // Existing user with role - issue full tokens
      const tokens = this.generateTokens(user);
      return {
        success: true,
        data: {
          flowType: 'login',
          requiresRoleSelection: false,
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          expiresIn: this.getTokenExpiration(),
          user: {
            id: user.id,
            email: user.email,
            phone: user.phone,
  
          },
        },
      };
    }

    // New user or user without role - issue onboarding token
    const onboardingToken = OnboardingToken.generate(user.id);
    this.storeOnboardingToken(onboardingToken);

    return {
      success: true,
      data: {
        flowType: session.flowType,
        requiresRoleSelection: true,
        onboardingToken: onboardingToken.token,
        user: {
          id: user.id,
          email: user.email,
          phone: user.phone,
        },
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

    // Get user
    const user = await this.userService.getUserById(tokenData.userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Set role
    user.role = role;
    await this.userService.updateUser(user.id, { role });

    // Clean up onboarding token
    this.deleteOnboardingToken(onboardingToken);

    // Issue full tokens
    const tokens = this.generateTokens(user);

    return {
      success: true,
      data: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresIn: this.getTokenExpiration(),
        user: {
          id: user.id,
          email: user.email,
          phone: user.phone,

        },
      },
    };
  }

  /**
   * Get current user from token
   */
  async getCurrentUser(token: string): Promise<UserEntity | null> {
    try {
      const payload = this.jwtService.verify(token);
      return this.userService.getUserById(payload.sub);
    } catch {
      return null;
    }
  }

  // ==================== Private Methods ====================

  private generateTokens(user: UserEntity): JwtToken {
    const payload = {
      sub: user.id,
      email: user.email,
      phone: user.phone,
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

  private storeOnboardingToken(token: OnboardingToken): void {
    this.onboardingTokenStore.set(token.token, {
      userId: token.userId,
      expiresAt: token.expiresAt,
    });
  }

  private getOnboardingToken(token: string): { userId: string; expiresAt: number } | null {
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
