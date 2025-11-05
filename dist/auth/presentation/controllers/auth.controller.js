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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const public_decorator_1 = require("../../../shared/common/decorators/public.decorator");
const jwt_auth_guard_1 = require("../../infrastructure/guards/jwt-auth.guard");
const otp_request_dto_1 = require("../../application/dtos/request/otp-request.dto");
const otp_verify_dto_1 = require("../../application/dtos/request/otp-verify.dto");
const register_dto_1 = require("../../application/dtos/request/register.dto");
const refresh_token_dto_1 = require("../../application/dtos/request/refresh-token.dto");
const logout_dto_1 = require("../../application/dtos/request/logout.dto");
const forgot_password_dto_1 = require("../../application/dtos/request/forgot-password.dto");
const user_response_dto_1 = require("../../application/dtos/response/user-response.dto");
const auth_service_1 = require("../../application/services/auth.service");
let AuthController = class AuthController {
    authService;
    constructor(authService) {
        this.authService = authService;
    }
    async requestOtp(dto, req) {
        return this.authService.requestOtp(dto, req.ip, req.headers['user-agent']);
    }
    async verifyOtp(dto) {
        return this.authService.verifyOtp(dto);
    }
    async register(dto) {
        return this.authService.register(dto);
    }
    async refreshToken(dto) {
        return this.authService.refreshToken(dto);
    }
    async logout(dto) {
        return this.authService.logout(dto);
    }
    async logoutAll(req) {
        return this.authService.logoutAll(req.user.userId);
    }
    async getProfile(req) {
        return this.authService.getProfile(req.user.userId);
    }
    async forgotPassword(dto, req) {
        return this.authService.forgotPassword(dto, req.ip, req.headers['user-agent']);
    }
    async resetPassword(dto) {
        return this.authService.resetPassword(dto);
    }
};
exports.AuthController = AuthController;
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Post)('otp/request'),
    (0, common_1.HttpCode)(common_1.HttpStatus.ACCEPTED),
    (0, swagger_1.ApiOperation)({
        summary: 'Request OTP',
        description: 'Request a neutral OTP challenge (works for both login & registration). Response is identical regardless of whether the identifier exists.',
    }),
    (0, swagger_1.ApiAcceptedResponse)({
        description: 'OTP challenge created',
        type: user_response_dto_1.OtpRequestResponseDto,
    }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Invalid request' }),
    (0, swagger_1.ApiResponse)({ status: 429, description: 'Too many requests' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [otp_request_dto_1.OtpRequestDto, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "requestOtp", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Post)('otp/verify'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({
        summary: 'Verify OTP',
        description: 'Validate the OTP. If the identifier already belongs to a user, return credentials. Otherwise, issue a short-lived registrationToken to complete signup.',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'OTP verified - existing user (login complete)',
        schema: {
            example: {
                success: true,
                data: {
                    user: {
                        id: 'clh7x9k2l0000qh8v4g2m1n3p',
                        email: 'user@example.com',
                        firstName: 'John',
                        lastName: 'Doe',
                        role: 'CUSTOMER',
                        phone: '+260972827372',
                        isEmailVerified: true,
                        isPhoneVerified: true,
                    },
                    tokens: {
                        accessToken: '<jwt>',
                        refreshToken: '<jwt>',
                        expiresIn: 3600,
                    },
                },
            },
        },
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'OTP verified - new user (continue to registration)',
        schema: {
            example: {
                success: true,
                data: {
                    registrationToken: '<short-lived-jwt>',
                    expiresIn: 600,
                },
            },
        },
    }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Invalid/expired challenge or OTP' }),
    (0, swagger_1.ApiResponse)({ status: 429, description: 'Too many attempts' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [otp_verify_dto_1.OtpVerifyDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "verifyOtp", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Post)('register'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, swagger_1.ApiOperation)({
        summary: 'Complete registration',
        description: 'Complete signup after OTP verification using the registrationToken, or perform traditional email/phone signup.',
    }),
    (0, swagger_1.ApiResponse)({
        status: 201,
        description: 'User registered successfully',
        type: user_response_dto_1.RegisterResponseDto,
    }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Invalid request or token expired' }),
    (0, swagger_1.ApiResponse)({ status: 409, description: 'Email/phone already registered' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [register_dto_1.RegisterDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "register", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Post)('refresh'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({
        summary: 'Refresh access token',
        description: 'Exchange a refresh token for a new token pair.',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Tokens refreshed successfully',
        type: user_response_dto_1.TokensResponseDto,
    }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Invalid or expired refresh token' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [refresh_token_dto_1.RefreshTokenDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "refreshToken", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Post)('logout'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({
        summary: 'Logout from device',
        description: 'Invalidate a specific refresh token (optionally scoped by device).',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Logged out successfully',
        schema: {
            example: {
                success: true,
                message: 'Logged out successfully',
            },
        },
    }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [logout_dto_1.LogoutDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "logout", null);
__decorate([
    (0, common_1.Post)('logout-all'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({
        summary: 'Logout from all devices',
        description: 'Invalidate all refresh tokens for the authenticated user.',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Logged out from all devices successfully',
        schema: {
            example: {
                success: true,
                data: {
                    message: 'Logged out from all devices successfully',
                },
            },
        },
    }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "logoutAll", null);
__decorate([
    (0, common_1.Get)('profile'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({
        summary: 'Get user profile',
        description: 'Return the currently authenticated user profile.',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'User profile retrieved successfully',
        type: user_response_dto_1.UserResponseDto,
    }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "getProfile", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Post)('forgot-password'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({
        summary: 'Request password reset',
        description: 'Request a password reset OTP via email or SMS. Always returns 200 to prevent account enumeration.',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Password reset OTP sent (if account exists)',
        schema: {
            example: {
                success: true,
                message: 'If the email/phone exists, a reset OTP has been sent',
                requestId: 'pwd_reset_clh7x9k2l0000qh8v4g2m1n3p',
                expiresAt: '2025-01-15T10:35:00Z',
            },
        },
    }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [forgot_password_dto_1.ForgotPasswordDto, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "forgotPassword", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Post)('reset-password'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({
        summary: 'Reset password',
        description: 'Complete a password reset using the OTP + new password.',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Password reset successfully',
        schema: {
            example: {
                success: true,
                message: 'Password has been reset successfully',
            },
        },
    }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Invalid OTP or request' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [forgot_password_dto_1.ResetPasswordDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "resetPassword", null);
exports.AuthController = AuthController = __decorate([
    (0, swagger_1.ApiTags)('Authentication'),
    (0, common_1.Controller)('auth'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [auth_service_1.AuthService])
], AuthController);
//# sourceMappingURL=auth.controller.js.map