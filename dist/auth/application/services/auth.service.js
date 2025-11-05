"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var AuthService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const uuid_1 = require("uuid");
const client_1 = require("@prisma/client");
const prisma_user_repository_1 = require("../../infrastructure/repositories/prisma-user.repository");
const prisma_otp_challenge_repository_1 = require("../../infrastructure/repositories/prisma-otp-challenge.repository");
const prisma_refresh_token_repository_1 = require("../../infrastructure/repositories/prisma-refresh-token.repository");
const jwt_service_1 = require("../../infrastructure/services/jwt.service");
const otp_service_1 = require("../../infrastructure/services/otp.service");
const user_entity_1 = require("../../domain/entities/user.entity");
const otp_challenge_entity_1 = require("../../domain/entities/otp-challenge.entity");
const refresh_token_entity_1 = require("../../domain/entities/refresh-token.entity");
const email_vo_1 = require("../../domain/value-objects/email.vo");
const phone_vo_1 = require("../../domain/value-objects/phone.vo");
const password_vo_1 = require("../../domain/value-objects/password.vo");
const otp_code_vo_1 = require("../../domain/value-objects/otp-code.vo");
const otp_request_dto_1 = require("../dtos/request/otp-request.dto");
const notifications_service_1 = require("../../../notifications/application/services/notifications.service");
let AuthService = AuthService_1 = class AuthService {
    userRepository;
    otpChallengeRepository;
    refreshTokenRepository;
    jwtService;
    otpService;
    configService;
    notificationsService;
    logger = new common_1.Logger(AuthService_1.name);
    constructor(userRepository, otpChallengeRepository, refreshTokenRepository, jwtService, otpService, configService, notificationsService) {
        this.userRepository = userRepository;
        this.otpChallengeRepository = otpChallengeRepository;
        this.refreshTokenRepository = refreshTokenRepository;
        this.jwtService = jwtService;
        this.otpService = otpService;
        this.configService = configService;
        this.notificationsService = notificationsService;
    }
    async requestOtp(dto, ipAddress, userAgent) {
        const identifier = dto.email ||
            (dto.phone && dto.countryCode
                ? `${dto.countryCode}${dto.phone}`
                : dto.phone);
        if (!identifier) {
            throw new common_1.BadRequestException('Email or phone is required');
        }
        const identifierType = dto.email
            ? client_1.IdentifierType.EMAIL
            : client_1.IdentifierType.PHONE;
        const purpose = dto.purpose === otp_request_dto_1.OtpPurposeDto.LOGIN
            ? client_1.OtpPurpose.LOGIN
            : client_1.OtpPurpose.REGISTER;
        await this.otpChallengeRepository.invalidateByIdentifier(identifier);
        const otp = this.otpService.generateOtp();
        const otpHash = await otp.hash();
        const challenge = new otp_challenge_entity_1.OtpChallengeEntity({
            id: (0, uuid_1.v4)(),
            challengeId: (0, uuid_1.v4)(),
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
        if (identifierType === client_1.IdentifierType.EMAIL) {
            await this.otpService.sendOtpViaEmail(identifier, otp);
        }
        else {
            await this.otpService.sendOtpViaSms(identifier, otp);
        }
        return {
            challengeId: challenge.challengeId,
            expiresAt: challenge.expiresAt,
            resendAvailableAt: challenge.resendAvailableAt,
            attemptsAllowed: challenge.maxAttempts,
        };
    }
    async verifyOtp(dto) {
        const challenge = await this.otpChallengeRepository.findByChallengeId(dto.challengeId);
        if (!challenge) {
            throw new common_1.BadRequestException('Invalid challenge ID');
        }
        const otpCode = otp_code_vo_1.OtpCode.fromPlain(dto.otp);
        const isValid = await challenge.verify(otpCode);
        if (!isValid) {
            await this.otpChallengeRepository.update(challenge);
            throw new common_1.BadRequestException('Invalid OTP');
        }
        await this.otpChallengeRepository.update(challenge);
        const existingUser = await this.userRepository.findByIdentifier(challenge.identifier);
        if (existingUser) {
            const tokens = await this.generateTokenPair(existingUser);
            return {
                user: this.mapUserToResponse(existingUser),
                tokens,
            };
        }
        else {
            const registrationToken = await this.jwtService.generateRegistrationToken({
                identifier: challenge.identifier,
                identifierType: challenge.identifierType === client_1.IdentifierType.EMAIL
                    ? 'email'
                    : 'phone',
            });
            return {
                registrationToken,
                expiresIn: this.jwtService.getRegistrationTokenTtl(),
            };
        }
    }
    async register(dto) {
        let identifier;
        let identifierType;
        let email;
        let phone;
        if (dto.registrationToken) {
            const payload = await this.jwtService.verifyRegistrationToken(dto.registrationToken);
            identifier = payload.identifier;
            identifierType = payload.identifierType;
            if (identifierType === 'email') {
                email = new email_vo_1.Email(identifier);
            }
            else {
                phone = phone_vo_1.Phone.fromE164(identifier);
            }
        }
        else {
            if (dto.email) {
                email = new email_vo_1.Email(dto.email);
                identifier = email.getValue();
                identifierType = 'email';
            }
            else if (dto.phoneNumber) {
                phone = new phone_vo_1.Phone(dto.phoneNumber, dto.countryCode);
                identifier = phone.getValue();
                identifierType = 'phone';
            }
            else {
                throw new common_1.BadRequestException('Email or phone is required');
            }
        }
        const exists = await this.userRepository.exists(email?.getValue(), phone?.getValue());
        if (exists) {
            throw new common_1.ConflictException('User already exists');
        }
        const password = await password_vo_1.Password.create(dto.password);
        const user = new user_entity_1.UserEntity({
            id: (0, uuid_1.v4)(),
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
                type: client_1.NotificationType.SYSTEM,
            });
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            this.logger.error(`Failed to create welcome notification for user ${createdUser.id}: ${errorMessage}`);
        }
        const tokens = await this.generateTokenPair(createdUser);
        return {
            user: this.mapUserToResponse(createdUser),
            tokens,
        };
    }
    async refreshToken(dto) {
        try {
            const payload = await this.jwtService.verifyRefreshToken(dto.refreshToken);
            const tokenHash = await this.jwtService.hashToken(dto.refreshToken);
            const storedToken = await this.refreshTokenRepository.findByTokenHash(tokenHash);
            if (!storedToken || !storedToken.isValid()) {
                throw new common_1.UnauthorizedException('Invalid refresh token');
            }
            storedToken.revoke();
            await this.refreshTokenRepository.update(storedToken);
            const user = await this.userRepository.findById(payload.sub);
            if (!user) {
                throw new common_1.UnauthorizedException('User not found');
            }
            return this.generateTokenPair(user);
        }
        catch {
            throw new common_1.UnauthorizedException('Invalid refresh token');
        }
    }
    async logout(dto) {
        const tokenHash = await this.jwtService.hashToken(dto.refreshToken);
        await this.refreshTokenRepository.revokeByTokenHash(tokenHash);
        return { message: 'Logged out successfully' };
    }
    async logoutAll(userId) {
        await this.refreshTokenRepository.revokeAllByUserId(userId);
        return { message: 'Logged out from all devices successfully' };
    }
    async getProfile(userId) {
        const user = await this.userRepository.findById(userId);
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        return this.mapUserToResponse(user);
    }
    async forgotPassword(dto, ipAddress, userAgent) {
        const identifier = dto.email ||
            (dto.phoneNumber && dto.countryCode
                ? `${dto.countryCode}${dto.phoneNumber}`
                : dto.phoneNumber);
        if (!identifier) {
            throw new common_1.BadRequestException('Email or phone is required');
        }
        const requestId = `pwd_reset_${(0, uuid_1.v4)()}`;
        const user = await this.userRepository.findByIdentifier(identifier);
        if (!user) {
            return {
                message: 'If the email/phone exists, a reset OTP has been sent',
                requestId,
                expiresAt: this.otpService.calculateExpiryDate(),
            };
        }
        const identifierType = dto.email
            ? client_1.IdentifierType.EMAIL
            : client_1.IdentifierType.PHONE;
        await this.otpChallengeRepository.invalidateByIdentifier(identifier);
        const otp = this.otpService.generateOtp();
        const otpHash = await otp.hash();
        const challenge = new otp_challenge_entity_1.OtpChallengeEntity({
            id: (0, uuid_1.v4)(),
            challengeId: requestId,
            identifier,
            identifierType,
            otpCodeHash: otpHash,
            purpose: client_1.OtpPurpose.PASSWORD_RESET,
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
        if (identifierType === client_1.IdentifierType.EMAIL) {
            await this.otpService.sendOtpViaEmail(identifier, otp);
        }
        else {
            await this.otpService.sendOtpViaSms(identifier, otp);
        }
        return {
            message: 'If the email/phone exists, a reset OTP has been sent',
            requestId,
            expiresAt: challenge.expiresAt,
        };
    }
    async resetPassword(dto) {
        const identifier = dto.email ||
            (dto.phoneNumber && dto.countryCode
                ? `${dto.countryCode}${dto.phoneNumber}`
                : dto.phoneNumber);
        if (!identifier) {
            throw new common_1.BadRequestException('Email or phone is required');
        }
        const challenge = await this.otpChallengeRepository.findByChallengeId(dto.requestId);
        if (!challenge || challenge.purpose !== client_1.OtpPurpose.PASSWORD_RESET) {
            throw new common_1.BadRequestException('Invalid request');
        }
        const otpCode = otp_code_vo_1.OtpCode.fromPlain(dto.otp);
        const isValid = await challenge.verify(otpCode);
        if (!isValid) {
            await this.otpChallengeRepository.update(challenge);
            throw new common_1.BadRequestException('Invalid OTP');
        }
        await this.otpChallengeRepository.update(challenge);
        const user = await this.userRepository.findByIdentifier(identifier);
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        const newPassword = await password_vo_1.Password.create(dto.newPassword);
        user.updatePassword(newPassword);
        await this.userRepository.update(user);
        return { message: 'Password has been reset successfully' };
    }
    async generateTokenPair(user) {
        const payload = {
            sub: user.id,
            email: user.email?.getValue(),
            phone: user.phone?.getValue(),
            role: user.role,
        };
        const accessToken = await this.jwtService.generateAccessToken(payload);
        const refreshToken = await this.jwtService.generateRefreshToken(payload);
        const tokenHash = await this.jwtService.hashToken(refreshToken);
        const refreshTokenEntity = new refresh_token_entity_1.RefreshTokenEntity({
            id: (0, uuid_1.v4)(),
            tokenHash,
            userId: user.id,
            expiresAt: new Date(Date.now() + this.jwtService.getRefreshTokenTtl() * 1000),
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
    mapUserToResponse(user) {
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
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = AuthService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_user_repository_1.PrismaUserRepository,
        prisma_otp_challenge_repository_1.PrismaOtpChallengeRepository,
        prisma_refresh_token_repository_1.PrismaRefreshTokenRepository,
        jwt_service_1.JwtTokenService,
        otp_service_1.OtpService,
        config_1.ConfigService,
        notifications_service_1.NotificationsService])
], AuthService);
//# sourceMappingURL=auth.service.js.map