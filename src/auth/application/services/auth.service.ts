import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v4 as uuidv4 } from 'uuid';
import { IdentifierType, NotificationType, OtpPurpose } from '@prisma/client';
import { PrismaUserRepository } from '../../infrastructure/repositories/prisma-user.repository';
import { PrismaOtpChallengeRepository } from '../../infrastructure/repositories/prisma-otp-challenge.repository';
import { PrismaRefreshTokenRepository } from '../../infrastructure/repositories/prisma-refresh-token.repository';
import { JwtTokenService } from '../../infrastructure/services/jwt.service';
import { OtpService } from '../../infrastructure/services/otp.service';
import { UserEntity } from '../../domain/entities/user.entity';
import { OtpChallengeEntity } from '../../domain/entities/otp-challenge.entity';
import { RefreshTokenEntity } from '../../domain/entities/refresh-token.entity';
import { Email } from '../../domain/value-objects/email.vo';
import { Phone } from '../../domain/value-objects/phone.vo';
import { Password } from '../../domain/value-objects/password.vo';
import { OtpCode } from '../../domain/value-objects/otp-code.vo';
import { OtpRequestDto, OtpPurposeDto } from '../dtos/request/otp-request.dto';
import { OtpVerifyDto } from '../dtos/request/otp-verify.dto';
import { RegisterDto } from '../dtos/request/register.dto';
import { RefreshTokenDto } from '../dtos/request/refresh-token.dto';
import { LogoutDto } from '../dtos/request/logout.dto';
import {
  ForgotPasswordDto,
  ResetPasswordDto,
} from '../dtos/request/forgot-password.dto';
import {
  OtpRequestResponseDto,
  TokensResponseDto,
  UserResponseDto,
  RegisterResponseDto,
} from '../dtos/response/user-response.dto';
import { NotificationsService } from '../../../notifications/application/services/notifications.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly userRepository: PrismaUserRepository,
    private readonly otpChallengeRepository: PrismaOtpChallengeRepository,
    private readonly refreshTokenRepository: PrismaRefreshTokenRepository,
    private readonly jwtService: JwtTokenService,
    private readonly otpService: OtpService,
    private readonly configService: ConfigService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async requestOtp(
    dto: OtpRequestDto,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<OtpRequestResponseDto> {
    // Determine identifier
    const identifier =
      dto.email ||
      (dto.phone && dto.countryCode
        ? `${dto.countryCode}${dto.phone}`
        : dto.phone);
    if (!identifier) {
      throw new BadRequestException('Email or phone is required');
    }

    const identifierType = dto.email
      ? IdentifierType.EMAIL
      : IdentifierType.PHONE;

    // Map purpose
    const purpose =
      dto.purpose === OtpPurposeDto.LOGIN
        ? OtpPurpose.LOGIN
        : OtpPurpose.REGISTER;

    // Invalidate any existing challenges for this identifier
    await this.otpChallengeRepository.invalidateByIdentifier(identifier);

    // Generate OTP
    const otp = this.otpService.generateOtp();
    const otpHash = await otp.hash();

    // Create challenge
    const challenge = new OtpChallengeEntity({
      id: uuidv4(),
      challengeId: uuidv4(),
      identifier,
      identifierType,
      otpCodeHash: otpHash,
      purpose,
      attempts: 0,
      maxAttempts: this.otpService.getOtpMaxAttempts(),
      expiresAt: this.otpService.calculateExpiryDate(),
      resendAvailableAt: this.otpService.calculateResendDate(),
      isVerified: false,
      ipAddress,
      userAgent,
      createdAt: new Date(),
    });

    await this.otpChallengeRepository.create(challenge);

    // Send OTP
    if (identifierType === IdentifierType.EMAIL) {
      await this.otpService.sendOtpViaEmail(identifier, otp);
    } else {
      await this.otpService.sendOtpViaSms(identifier, otp);
    }

    return {
      challengeId: challenge.challengeId,
      expiresAt: challenge.expiresAt,
      resendAvailableAt: challenge.resendAvailableAt,
      attemptsAllowed: challenge.maxAttempts,
    };
  }

  async verifyOtp(dto: OtpVerifyDto): Promise<any> {
    const challenge = await this.otpChallengeRepository.findByChallengeId(
      dto.challengeId,
    );

    if (!challenge) {
      throw new BadRequestException('Invalid challenge ID');
    }

    const otpCode = OtpCode.fromPlain(dto.otp);
    const isValid = await challenge.verify(otpCode);

    if (!isValid) {
      await this.otpChallengeRepository.update(challenge);
      throw new BadRequestException('Invalid OTP');
    }

    await this.otpChallengeRepository.update(challenge);

    // Check if user exists
    const existingUser = await this.userRepository.findByIdentifier(
      challenge.identifier,
    );

    if (existingUser) {
      // Existing user - return tokens
      const tokens = await this.generateTokenPair(existingUser);
      return {
        user: this.mapUserToResponse(existingUser),
        tokens,
      };
    } else {
      // New user - return registration token
      const registrationToken = await this.jwtService.generateRegistrationToken(
        {
          identifier: challenge.identifier,
          identifierType:
            challenge.identifierType === IdentifierType.EMAIL
              ? 'email'
              : 'phone',
        },
      );

      return {
        registrationToken,
        expiresIn: this.jwtService.getRegistrationTokenTtl(),
      };
    }
  }

  async register(dto: RegisterDto): Promise<RegisterResponseDto> {
    let identifier: string;
    let identifierType: 'email' | 'phone';
    let email: Email | undefined;
    let phone: Phone | undefined;

    if (dto.registrationToken) {
      // OTP-first flow
      const payload = await this.jwtService.verifyRegistrationToken(
        dto.registrationToken,
      );
      identifier = payload.identifier;
      identifierType = payload.identifierType;

      if (identifierType === 'email') {
        email = new Email(identifier);
      } else {
        phone = Phone.fromE164(identifier);
      }
    } else {
      // Traditional flow
      if (dto.email) {
        email = new Email(dto.email);
        identifier = email.getValue();
        identifierType = 'email';
      } else if (dto.phoneNumber) {
        phone = new Phone(dto.phoneNumber, dto.countryCode);
        identifier = phone.getValue();
        identifierType = 'phone';
      } else {
        throw new BadRequestException('Email or phone is required');
      }
    }

    // Check if user already exists
    const exists = await this.userRepository.exists(
      email?.getValue(),
      phone?.getValue(),
    );

    if (exists) {
      throw new ConflictException('User already exists');
    }

    // Create user
    const password = await Password.create(dto.password);
    const user = new UserEntity({
      id: uuidv4(),
      email,
      phone,
      firstName: dto.firstName,
      lastName: dto.lastName,
      password,
      role: dto.role,
      isEmailVerified: identifierType === 'email',
      isPhoneVerified: identifierType === 'phone',

      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const createdUser = await this.userRepository.create(user);

    try {
      await this.notificationsService.createNotification(createdUser.id, {
        title: 'Welcome to Ntumai',
        message: `Welcome${createdUser.firstName ? ` ${createdUser.firstName}` : ''}!`,
        type: NotificationType.SYSTEM,
      });
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(
        `Failed to create welcome notification for user ${createdUser.id}: ${errorMessage}`,
      );
    }

    // Generate tokens
    const tokens = await this.generateTokenPair(createdUser);

    return {
      user: this.mapUserToResponse(createdUser),
      tokens,
    };
  }

  async refreshToken(dto: RefreshTokenDto): Promise<TokensResponseDto> {
    try {
      const payload = await this.jwtService.verifyRefreshToken(
        dto.refreshToken,
      );
      const tokenHash = await this.jwtService.hashToken(dto.refreshToken);

      const storedToken =
        await this.refreshTokenRepository.findByTokenHash(tokenHash);

      if (!storedToken || !storedToken.isValid()) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      // Revoke old token
      storedToken.revoke();
      await this.refreshTokenRepository.update(storedToken);

      // Get user
      const user = await this.userRepository.findById(payload.sub);
      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      // Generate new token pair
      return this.generateTokenPair(user);
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async logout(dto: LogoutDto): Promise<{ message: string }> {
    const tokenHash = await this.jwtService.hashToken(dto.refreshToken);
    await this.refreshTokenRepository.revokeByTokenHash(tokenHash);
    return { message: 'Logged out successfully' };
  }

  async logoutAll(userId: string): Promise<{ message: string }> {
    await this.refreshTokenRepository.revokeAllByUserId(userId);
    return { message: 'Logged out from all devices successfully' };
  }

  async getProfile(userId: string): Promise<UserResponseDto> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return this.mapUserToResponse(user);
  }

  async forgotPassword(
    dto: ForgotPasswordDto,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<any> {
    const identifier =
      dto.email ||
      (dto.phoneNumber && dto.countryCode
        ? `${dto.countryCode}${dto.phoneNumber}`
        : dto.phoneNumber);
    if (!identifier) {
      throw new BadRequestException('Email or phone is required');
    }

    // Always return success to prevent enumeration
    const requestId = `pwd_reset_${uuidv4()}`;

    // Check if user exists (silently)
    const user = await this.userRepository.findByIdentifier(identifier);
    if (!user) {
      return {
        message: 'If the email/phone exists, a reset OTP has been sent',
        requestId,
        expiresAt: this.otpService.calculateExpiryDate(),
      };
    }

    // Generate and send OTP
    const identifierType = dto.email
      ? IdentifierType.EMAIL
      : IdentifierType.PHONE;
    await this.otpChallengeRepository.invalidateByIdentifier(identifier);

    const otp = this.otpService.generateOtp();
    const otpHash = await otp.hash();

    const challenge = new OtpChallengeEntity({
      id: uuidv4(),
      challengeId: requestId,
      identifier,
      identifierType,
      otpCodeHash: otpHash,
      purpose: OtpPurpose.PASSWORD_RESET,
      attempts: 0,
      maxAttempts: this.otpService.getOtpMaxAttempts(),
      expiresAt: this.otpService.calculateExpiryDate(),
      resendAvailableAt: this.otpService.calculateResendDate(),
      isVerified: false,
      ipAddress,
      userAgent,
      createdAt: new Date(),
    });

    await this.otpChallengeRepository.create(challenge);

    if (identifierType === IdentifierType.EMAIL) {
      await this.otpService.sendOtpViaEmail(identifier, otp);
    } else {
      await this.otpService.sendOtpViaSms(identifier, otp);
    }

    return {
      message: 'If the email/phone exists, a reset OTP has been sent',
      requestId,
      expiresAt: challenge.expiresAt,
    };
  }

  async resetPassword(dto: ResetPasswordDto): Promise<{ message: string }> {
    const identifier =
      dto.email ||
      (dto.phoneNumber && dto.countryCode
        ? `${dto.countryCode}${dto.phoneNumber}`
        : dto.phoneNumber);
    if (!identifier) {
      throw new BadRequestException('Email or phone is required');
    }

    const challenge = await this.otpChallengeRepository.findByChallengeId(
      dto.requestId,
    );
    if (!challenge || challenge.purpose !== OtpPurpose.PASSWORD_RESET) {
      throw new BadRequestException('Invalid request');
    }

    const otpCode = OtpCode.fromPlain(dto.otp);
    const isValid = await challenge.verify(otpCode);

    if (!isValid) {
      await this.otpChallengeRepository.update(challenge);
      throw new BadRequestException('Invalid OTP');
    }

    await this.otpChallengeRepository.update(challenge);

    const user = await this.userRepository.findByIdentifier(identifier);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const newPassword = await Password.create(dto.newPassword);
    user.updatePassword(newPassword);
    await this.userRepository.update(user);

    return { message: 'Password has been reset successfully' };
  }

  private async generateTokenPair(
    user: UserEntity,
  ): Promise<TokensResponseDto> {
    const payload = {
      sub: user.id,
      email: user.email?.getValue(),
      phone: user.phone?.getValue(),
      role: user.role,
    };

    const accessToken = await this.jwtService.generateAccessToken(payload);
    const refreshToken = await this.jwtService.generateRefreshToken(payload);

    // Store refresh token
    const tokenHash = await this.jwtService.hashToken(refreshToken);
    const refreshTokenEntity = new RefreshTokenEntity({
      id: uuidv4(),
      tokenHash,
      userId: user.id,
      expiresAt: new Date(
        Date.now() + this.jwtService.getRefreshTokenTtl() * 1000,
      ),
      isRevoked: false,
      createdAt: new Date(),
    });

    await this.refreshTokenRepository.create(refreshTokenEntity);

    return {
      accessToken,
      refreshToken,
      expiresIn: this.jwtService.getAccessTokenTtl(),
      tokenType: 'Bearer',
    };
  }

  private mapUserToResponse(user: UserEntity): UserResponseDto {
    return {
      id: user.id,
      email: user.email?.getValue(),
      phone: user.phone?.getValue(),
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      isEmailVerified: user.isEmailVerified,
      isPhoneVerified: user.isPhoneVerified,

      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
