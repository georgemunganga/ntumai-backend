import { ConfigService } from '@nestjs/config';
import { PrismaUserRepository } from '../../infrastructure/repositories/prisma-user.repository';
import { PrismaOtpChallengeRepository } from '../../infrastructure/repositories/prisma-otp-challenge.repository';
import { PrismaRefreshTokenRepository } from '../../infrastructure/repositories/prisma-refresh-token.repository';
import { JwtTokenService } from '../../infrastructure/services/jwt.service';
import { OtpService } from '../../infrastructure/services/otp.service';
import { OtpRequestDto } from '../dtos/request/otp-request.dto';
import { OtpVerifyDto } from '../dtos/request/otp-verify.dto';
import { RegisterDto } from '../dtos/request/register.dto';
import { RefreshTokenDto } from '../dtos/request/refresh-token.dto';
import { LogoutDto } from '../dtos/request/logout.dto';
import { ForgotPasswordDto, ResetPasswordDto } from '../dtos/request/forgot-password.dto';
import { OtpRequestResponseDto, TokensResponseDto, UserResponseDto, RegisterResponseDto } from '../dtos/response/user-response.dto';
import { NotificationsService } from '../../../notifications/application/services/notifications.service';
export declare class AuthService {
    private readonly userRepository;
    private readonly otpChallengeRepository;
    private readonly refreshTokenRepository;
    private readonly jwtService;
    private readonly otpService;
    private readonly configService;
    private readonly notificationsService;
    private readonly logger;
    constructor(userRepository: PrismaUserRepository, otpChallengeRepository: PrismaOtpChallengeRepository, refreshTokenRepository: PrismaRefreshTokenRepository, jwtService: JwtTokenService, otpService: OtpService, configService: ConfigService, notificationsService: NotificationsService);
    requestOtp(dto: OtpRequestDto, ipAddress?: string, userAgent?: string): Promise<OtpRequestResponseDto>;
    verifyOtp(dto: OtpVerifyDto): Promise<any>;
    register(dto: RegisterDto): Promise<RegisterResponseDto>;
    refreshToken(dto: RefreshTokenDto): Promise<TokensResponseDto>;
    logout(dto: LogoutDto): Promise<{
        message: string;
    }>;
    logoutAll(userId: string): Promise<{
        message: string;
    }>;
    getProfile(userId: string): Promise<UserResponseDto>;
    forgotPassword(dto: ForgotPasswordDto, ipAddress?: string, userAgent?: string): Promise<any>;
    resetPassword(dto: ResetPasswordDto): Promise<{
        message: string;
    }>;
    private generateTokenPair;
    private mapUserToResponse;
}
